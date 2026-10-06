/**
 * A PNG decoder and encoder small enough to read Chromium's screenshots
 * (8-bit, non-interlaced, RGB or RGBA) and to write a diff image, so the
 * screenshot comparer can compare thousands of shots without a browser or a
 * dependency. Anything else is an Error, never a guess.
 */

import { deflateSync, inflateSync } from "node:zlib";

export interface Image {
  width: number;
  height: number;
  rgba: Uint8Array;
}

export function decodePng(buf: Buffer): Image {
  let off = 8;
  let [width, height, depth, type] = [0, 0, 0, 0];
  const idat: Buffer[] = [];
  while (off < buf.length) {
    const len = buf.readUInt32BE(off);
    const kind = buf.toString("ascii", off + 4, off + 8);
    const data = buf.subarray(off + 8, off + 8 + len);
    if (kind === "IHDR") {
      [width, height, depth, type] = [data.readUInt32BE(0), data.readUInt32BE(4), data[8]!, data[9]!];
      if (data[12] !== 0) {
        throw new Error("decodePng: interlaced PNG");
      }
    } else if (kind === "IDAT") {
      idat.push(data);
    } else if (kind === "IEND") {
      break;
    }
    off += 12 + len;
  }
  const channels = type === 6 ? 4 : type === 2 ? 3 : -1;
  if (depth !== 8 || channels < 0) {
    throw new Error(`decodePng: bit depth ${depth}, colour type ${type} is not one Chromium writes`);
  }
  const raw = inflateSync(Buffer.concat(idat));
  const stride = width * channels;
  const out = new Uint8Array(width * height * 4);
  let prev = new Uint8Array(stride);
  let p = 0;
  for (let y = 0; y < height; y++) {
    const filter = raw[p++]!;
    const cur = new Uint8Array(stride);
    for (let x = 0; x < stride; x++) {
      const r = raw[p++]!;
      const a = x >= channels ? cur[x - channels]! : 0;
      const b = prev[x]!;
      const c = x >= channels ? prev[x - channels]! : 0;
      let v: number;
      if (filter === 0) {
        v = r;
      } else if (filter === 1) {
        v = r + a;
      } else if (filter === 2) {
        v = r + b;
      } else if (filter === 3) {
        v = r + ((a + b) >> 1);
      } else if (filter === 4) {
        const pp = a + b - c;
        const [pa, pb, pc] = [Math.abs(pp - a), Math.abs(pp - b), Math.abs(pp - c)];
        v = r + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c);
      } else {
        throw new Error(`decodePng: filter ${filter}`);
      }
      cur[x] = v & 255;
    }
    for (let x = 0; x < width; x++) {
      const o = (y * width + x) * 4;
      const i = x * channels;
      out[o] = cur[i]!;
      out[o + 1] = cur[i + 1]!;
      out[o + 2] = cur[i + 2]!;
      out[o + 3] = channels === 4 ? cur[i + 3]! : 255;
    }
    prev = cur;
  }
  return { width, height, rgba: out };
}

const CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    t[n] = c >>> 0;
  }
  return t;
})();
const crc = (b: Buffer) => {
  let c = 0xffffffff;
  for (const x of b) {
    c = CRC[(c ^ x) & 255]! ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (kind: string, data: Buffer) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(kind, "ascii"), data]);
  const sum = Buffer.alloc(4);
  sum.writeUInt32BE(crc(body));
  return Buffer.concat([len, body, sum]);
};

export function encodePng(img: Image): Buffer {
  const head = Buffer.alloc(13);
  head.writeUInt32BE(img.width, 0);
  head.writeUInt32BE(img.height, 4);
  head[8] = 8;
  head[9] = 6;
  const row = img.width * 4 + 1;
  const raw = Buffer.alloc(row * img.height);
  for (let y = 0; y < img.height; y++) {
    Buffer.from(img.rgba.buffer, img.rgba.byteOffset + y * img.width * 4, img.width * 4).copy(raw, y * row + 1);
  }
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", head), chunk("IDAT", deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}

export interface PixelDiff {
  same: boolean;
  sameSize: boolean;
  differing: number;
  maxDelta: number;
  box: { x: number; y: number; width: number; height: number } | null;
  image: Image | null;
}

/** Every pixel of two PNGs compared exactly; the diff image fades what matches and paints what differs red. */
export function pixelDiff(a: Buffer, b: Buffer): PixelDiff {
  if (a.equals(b)) {
    return { same: true, sameSize: true, differing: 0, maxDelta: 0, box: null, image: null };
  }
  const [x, y] = [decodePng(a), decodePng(b)];
  const [w, h] = [Math.max(x.width, y.width), Math.max(x.height, y.height)];
  const out = new Uint8Array(w * h * 4);
  let [n, maxDelta, x0, y0, x1, y1] = [0, 0, Infinity, Infinity, -1, -1];
  for (let r = 0; r < h; r++) {
    for (let c = 0; c < w; c++) {
      const [i, j, o] = [(r * x.width + c) * 4, (r * y.width + c) * 4, (r * w + c) * 4];
      const both = c < x.width && r < x.height && c < y.width && r < y.height;
      let d = 255;
      if (both) {
        d = Math.max(...[0, 1, 2, 3].map((k) => Math.abs(x.rgba[i + k]! - y.rgba[j + k]!)));
      }
      if (d === 0) {
        for (let k = 0; k < 3; k++) {
          out[o + k] = 255 - (255 - x.rgba[i + k]!) * 0.25;
        }
      } else {
        n++;
        maxDelta = Math.max(maxDelta, d);
        [x0, y0, x1, y1] = [Math.min(x0, c), Math.min(y0, r), Math.max(x1, c), Math.max(y1, r)];
        out[o] = 230;
      }
      out[o + 3] = 255;
    }
  }
  const sameSize = x.width === y.width && x.height === y.height;
  return {
    same: n === 0 && sameSize,
    sameSize,
    differing: n,
    maxDelta,
    box: n > 0 ? { x: x0, y: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 } : null,
    image: n > 0 || !sameSize ? { width: w, height: h, rgba: out } : null,
  };
}

/**
 * A screenshot taken until two in a row are byte-identical (at most `tries`
 * takes, `settle` between them), so a state the browser has not finished
 * painting is never the one kept. Measured on the staged slider (audit of
 * 7a683fd, frozen lens F6 note; repair): a forced `:active` shot taken on the
 * first frame differed from one taken a frame later in 2 of 6 fresh pages, by
 * up to 49 levels, and the comparer could only report those shots unstable,
 * which blocks the frozen verdict; taken until stable, 6 of 6 agreed, after
 * one extra take at most. A shot that never settles returns the last take,
 * and the comparer's same-commit control is still what reports it.
 */
export async function untilStable(take: () => Promise<Buffer>, settle: () => Promise<void>, tries = 8): Promise<Buffer> {
  let shot = await take();
  for (let i = 1; i < tries; i++) {
    await settle();
    const next = await take();
    if (next.equals(shot)) {
      return next;
    }
    shot = next;
  }
  return shot;
}
