/**
 * The screenshot comparer, run by hand: `pnpm shots baseline|compare [options]`.
 *
 * It renders the whole playground under the four frozen presets (ocean, forest,
 * noir, midnight) in light and in dark, and compares every pixel against a
 * baseline. A stylesheet change that is meant to leave those presets alone
 * (every seam, every edge with today's declaration as its fallback) must come
 * back identical; any difference is a failure to fix, never one to accept.
 * Sorbet is captured too, and its difference is reported, never failed: it is
 * the preset the change is for. Beside each full page, a few crops show the
 * states a full page cannot (a hover, a press, a focus: `STATES`), since those
 * are where a shadow is written by a state selector.
 *
 *   pnpm shots baseline              build this tree and store its shots as the baseline
 *   pnpm shots baseline --at <ref>   the same, for a commit: its files are exported
 *                                    (`git archive`) into a temporary directory, installed
 *                                    offline and built there; this checkout is not touched
 *   pnpm shots compare               build this tree and compare against the baseline
 *
 * Options: `--no-build` (use the playground already built), `--only <preset>`,
 * `--width <px>` (default 1280).
 *
 * Where the baseline lives: `node_modules/.cache/sorbet-shots/` in this
 * checkout, or `SORBET_SHOTS_DIR`. It is outside git on purpose — about forty
 * megabytes of PNG that is reproducible from a commit (`--at`), and that is only
 * valid for the Chromium build that took it — and inside `node_modules/` because
 * that is already ignored and belongs to one checkout, so two worktrees never
 * share one. `baseline.json` beside the images records the commit, the
 * Chromium version and the viewport; a compare refuses a baseline taken at a
 * different viewport or by a different Chromium, since then a difference would
 * say nothing about the stylesheet.
 *
 * Exit code: 0 when the four frozen presets are pixel-identical in both modes,
 * 1 when any is not (or a shot is missing), 2 on a usage error.
 */

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { styleText } from "node:util";

import {
  ALL_PRESETS,
  buildPlayground,
  describeTree,
  FROZEN_PRESETS,
  launch,
  MODES,
  openPlayground,
  ROOT,
  servePlayground,
  type Mode,
  type PresetName,
} from "./playground-browser.ts";

import type { Browser, Locator, Page } from "playwright";

const argv = process.argv.slice(2);
const command = argv[0];
const flag = (name: string) => argv.includes(name);
const option = (name: string) => {
  const at = argv.indexOf(name);
  return at === -1 ? undefined : argv[at + 1];
};

if (command !== "baseline" && command !== "compare") {
  console.error("usage: pnpm shots baseline [--at <ref>] | compare   [--no-build] [--only <preset>] [--width <px>]");
  process.exit(2);
}

const STORE = process.env.SORBET_SHOTS_DIR ?? join(ROOT, "node_modules", ".cache", "sorbet-shots");
const BASELINE = join(STORE, "baseline");
const LATEST = join(STORE, "latest");
const DIFFS = join(STORE, "diffs");
const width = Number(option("--width") ?? 1280);
const viewport = { width, height: 900 };
const only = option("--only");
if (only !== undefined && !(ALL_PRESETS as readonly string[]).includes(only)) {
  console.error(`--only: ${only} is not a preset (${ALL_PRESETS.join(", ")})`);
  process.exit(2);
}
const presets = ALL_PRESETS.filter((p) => only === undefined || p === only);

interface Manifest {
  tree: string;
  chromium: string;
  viewport: { width: number; height: number };
  takenAt: string;
  shots: string[];
}

const shotName = (preset: PresetName, mode: Mode, state?: string) => `${preset}-${mode}${state ? `--${state}` : ""}.png`;

/**
 * States a full-page shot cannot show, each shot as a crop round the element
 * it acts on: a hover, a press and a keyboard-style focus are where a shadow
 * is written by a state selector, which is exactly what an edge refactor
 * moves. `find` is a locator on the page; the crop has 24px round it so a
 * halo or a glow is inside.
 */
const STATES: { name: string; find: (page: Page) => Locator; act: (page: Page, target: Locator) => Promise<void> }[] = [
  { name: "hover-primary", find: (p) => p.locator(".sb-button", { hasText: /^Primary$/ }), act: async(_, t) => t.hover() },
  {
    name: "press-secondary",
    find: (p) => p.locator(".sb-button", { hasText: /^Secondary$/ }),
    act: async(p, t) => {
      await t.hover();
      await p.mouse.down();
    },
  },
  { name: "hover-danger", find: (p) => p.locator(".sb-button", { hasText: /^Danger$/ }).first(), act: async(_, t) => t.hover() },
  { name: "hover-outline", find: (p) => p.locator(".sb-button", { hasText: /^Outline$/ }), act: async(_, t) => t.hover() },
  { name: "focus-input", find: (p) => p.locator(".sb-card .sb-input").first(), act: async(_, t) => t.focus() },
  { name: "focus-combobox", find: (p) => p.getByPlaceholder("Search people…"), act: async(_, t) => t.focus() },
];

/** Shoot every preset in both modes into `dir`, from a built playground at `root`. */
async function shoot(browser: Browser, root: string, dir: string): Promise<string[]> {
  mkdirSync(dir, { recursive: true });
  const server = await servePlayground(root);
  const names: string[] = [];
  try {
    for (const preset of presets) {
      for (const mode of MODES) {
        const page = await openPlayground(browser, server.url, preset, mode, viewport);
        const png = await page.screenshot({ fullPage: true, animations: "disabled", caret: "hide" });
        writeFileSync(join(dir, shotName(preset, mode)), png);
        names.push(shotName(preset, mode));
        for (const state of STATES) {
          const target = state.find(page);
          // Scrolled instantly to a whole pixel, and the crop snapped to whole pixels: a
          // smooth scroll still moving, or a fractional offset, moves the crop under the
          // element between two runs of the same tree.
          await target.evaluate(async(e) => {
            const r = e.getBoundingClientRect();
            window.scrollTo({ top: Math.round(scrollY + r.top - innerHeight / 2), behavior: "instant" });
            await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
          });
          await state.act(page, target);
          // A state's transition runs from the moment it is entered; the shot waits for
          // every transition on the page to finish, so it never catches one half way.
          await page.waitForFunction(() => document.getAnimations().every((a) => a.playState !== "running"));
          await page.evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))));
          const box = (await target.boundingBox())!;
          const [x, y] = [Math.max(0, Math.floor(box.x) - 24), Math.max(0, Math.floor(box.y) - 24)];
          const clip = { x, y, width: Math.ceil(box.x + box.width) + 24 - x, height: Math.ceil(box.y + box.height) + 24 - y };
          writeFileSync(join(dir, shotName(preset, mode, state.name)), await page.screenshot({ clip, animations: "disabled", caret: "hide" }));
          names.push(shotName(preset, mode, state.name));
          await page.mouse.up();
          await page.mouse.move(0, 0);
          await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
        }
        await page.context().close();
        console.log(`  ${shotName(preset, mode)} and ${STATES.length} states`);
      }
    }
  } finally {
    await server.close();
  }
  return names;
}

/** Export `ref`'s files into a temporary directory and install and build them there, leaving this checkout alone. */
function exportTree(ref: string): string {
  const dir = mkdtempSync(join(tmpdir(), "sorbet-shots-"));
  const archive = execFileSync("git", ["archive", "--format=tar", ref], { cwd: ROOT, maxBuffer: 1 << 30 });
  execFileSync("tar", ["-x", "-C", dir], { input: archive });
  execFileSync("pnpm", ["install", "--offline", "--frozen-lockfile"], { cwd: dir, stdio: ["ignore", "inherit", "inherit"] });
  return dir;
}

interface PixelDiff {
  sameSize: boolean;
  differing: number;
  total: number;
  box: { x: number; y: number; width: number; height: number } | null;
  diffPng: string | null;
}

/**
 * Count the pixels that differ between two PNGs, decoded by the browser
 * (a canvas reads them back exactly: the screenshot has no colour profile to
 * convert), and draw a diff image: the baseline faded, differing pixels red.
 */
async function pixelDiff(browser: Browser, a: Buffer, b: Buffer): Promise<PixelDiff> {
  const context = await browser.newContext();
  const page = await context.newPage();
  try {
    return await page.evaluate(async({ a, b }) => {
      const load = async(data: string) => {
        const img = new Image();
        img.src = `data:image/png;base64,${data}`;
        await img.decode();
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
        ctx.drawImage(img, 0, 0);
        return { width: img.width, height: img.height, data: ctx.getImageData(0, 0, img.width, img.height).data };
      };
      const [x, y] = [await load(a), await load(b)];
      const width = Math.max(x.width, y.width);
      const height = Math.max(x.height, y.height);
      const out = new ImageData(width, height);
      let differing = 0;
      let [minX, minY, maxX, maxY] = [Infinity, Infinity, -1, -1];
      for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
          const o = (row * width + col) * 4;
          const inX = col < x.width && row < x.height;
          const inY = col < y.width && row < y.height;
          const i = (row * x.width + col) * 4;
          const j = (row * y.width + col) * 4;
          const same = inX && inY && x.data[i] === y.data[j] && x.data[i + 1] === y.data[j + 1] && x.data[i + 2] === y.data[j + 2] && x.data[i + 3] === y.data[j + 3];
          if (same) {
            out.data[o] = 255 - (255 - x.data[i]!) * 0.25;
            out.data[o + 1] = 255 - (255 - x.data[i + 1]!) * 0.25;
            out.data[o + 2] = 255 - (255 - x.data[i + 2]!) * 0.25;
          } else {
            differing++;
            [minX, minY, maxX, maxY] = [Math.min(minX, col), Math.min(minY, row), Math.max(maxX, col), Math.max(maxY, row)];
            out.data[o] = 230;
            out.data[o + 1] = 0;
            out.data[o + 2] = 0;
          }
          out.data[o + 3] = 255;
        }
      }
      let diffPng: string | null = null;
      if (differing > 0) {
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d")!.putImageData(out, 0, 0);
        diffPng = canvas.toDataURL("image/png").split(",")[1]!;
      }
      return {
        sameSize: x.width === y.width && x.height === y.height,
        differing,
        total: width * height,
        box: differing > 0 ? { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 } : null,
        diffPng,
      };
    }, { a: a.toString("base64"), b: b.toString("base64") });
  } finally {
    await context.close();
  }
}

const browser = await launch();
try {
  const chromiumVersion = browser.version();
  if (command === "baseline") {
    const ref = option("--at");
    const root = ref === undefined ? ROOT : exportTree(ref);
    try {
      if (!flag("--no-build") || ref !== undefined) {
        buildPlayground(root);
      }
      rmSync(BASELINE, { recursive: true, force: true });
      console.log(`Baseline of ${ref ?? describeTree(ROOT)} into ${BASELINE}`);
      const shots = await shoot(browser, root, BASELINE);
      const manifest: Manifest = {
        tree: ref === undefined ? describeTree(ROOT) : execFileSync("git", ["rev-parse", "--short", ref], { cwd: ROOT, encoding: "utf8" }).trim(),
        chromium: chromiumVersion,
        viewport,
        takenAt: new Date().toISOString(),
        shots,
      };
      writeFileSync(join(BASELINE, "baseline.json"), `${JSON.stringify(manifest, null, 2)}\n`);
      console.log(styleText("green", `✓ ${shots.length} shots, taken at ${manifest.tree} by Chromium ${chromiumVersion}`));
    } finally {
      if (ref !== undefined) {
        rmSync(root, { recursive: true, force: true });
      }
    }
  } else {
    const manifestPath = join(BASELINE, "baseline.json");
    if (!existsSync(manifestPath)) {
      console.error(`No baseline at ${BASELINE}: run \`pnpm shots baseline\` (or \`--at <ref>\`) first.`);
      process.exit(1);
    }
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as Manifest;
    if (manifest.chromium !== chromiumVersion || manifest.viewport.width !== viewport.width || manifest.viewport.height !== viewport.height) {
      console.error(`The baseline was taken by Chromium ${manifest.chromium} at ${manifest.viewport.width}x${manifest.viewport.height}; this run is Chromium ${chromiumVersion} at ${viewport.width}x${viewport.height}. Retake it: \`pnpm shots baseline --at ${manifest.tree.replace("+dirty", "")}\`.`);
      process.exit(1);
    }
    if (!flag("--no-build")) {
      buildPlayground(ROOT);
    }
    rmSync(LATEST, { recursive: true, force: true });
    rmSync(DIFFS, { recursive: true, force: true });
    console.log(`Shooting ${describeTree(ROOT)} into ${LATEST}`);
    const taken = await shoot(browser, ROOT, LATEST);
    console.log(`\nAgainst the baseline taken at ${manifest.tree} (${manifest.takenAt}):`);
    let failed = 0;
    for (const preset of presets) {
      const frozen = (FROZEN_PRESETS as readonly string[]).includes(preset);
      for (const name of taken.filter((n) => MODES.some((mode) => n.startsWith(`${preset}-${mode}`)))) {
        const label = name.replace(/\.png$/, "").replace(/-(light|dark)/, " $1").padEnd(34);
        if (!existsSync(join(BASELINE, name))) {
          console.log(`  ${styleText("red", "✗")} ${label} no baseline shot`);
          failed += frozen ? 1 : 0;
          continue;
        }
        const [before, after] = [readFileSync(join(BASELINE, name)), readFileSync(join(LATEST, name))];
        if (before.equals(after)) {
          console.log(`  ${styleText("green", "✓")} ${label} pixel-identical (byte-identical PNG)`);
          continue;
        }
        const diff = await pixelDiff(browser, before, after);
        if (diff.differing === 0 && diff.sameSize) {
          console.log(`  ${styleText("green", "✓")} ${label} pixel-identical`);
          continue;
        }
        mkdirSync(DIFFS, { recursive: true });
        writeFileSync(join(DIFFS, name), Buffer.from(diff.diffPng!, "base64"));
        const where = diff.box ? ` in ${diff.box.width}x${diff.box.height} at (${diff.box.x}, ${diff.box.y})` : "";
        const size = diff.sameSize ? "" : ", and the page height changed";
        const line = `${label} ${diff.differing} of ${diff.total} pixels differ${where}${size}; diff: ${join(DIFFS, name)}`;
        if (frozen) {
          failed++;
          console.log(`  ${styleText("red", "✗")} ${line}`);
        } else {
          console.log(`  ${styleText("yellow", "·")} ${line} (not frozen: reported, not failed)`);
        }
      }
    }
    if (failed > 0) {
      console.log(styleText("red", `\n✗ ${failed} frozen shot(s) differ from the baseline. A frozen preset must be pixel-identical: fix the change, never the baseline.`));
      process.exit(1);
    }
    console.log(styleText("green", "\n✓ The frozen presets are pixel-identical in both modes."));
  }
} finally {
  await browser.close();
}
