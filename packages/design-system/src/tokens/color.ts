/**
 * Color math for the token pipeline.
 *
 * Ramps are authored in OKLCH (perceptually uniform lightness/chroma) and
 * converted to sRGB hex at build time. Conversion follows Björn Ottosson's
 * reference OKLab implementation. Out-of-gamut colors are mapped back into
 * sRGB by reducing chroma, which preserves lightness — and lightness is what
 * contrast depends on.
 */

export type Hex = `#${string}`;

export interface Oklch {
  /** 0–1 perceptual lightness */
  l: number;
  /** chroma, 0–~0.37 in sRGB */
  c: number;
  /** hue angle in degrees */
  h: number;
}

interface Rgb {
  r: number;
  g: number;
  b: number;
}

function oklchToLinearSrgb(l: number, c: number, h: number): Rgb {
  const rad = (h * Math.PI) / 180;
  const A = c * Math.cos(rad);
  const B = c * Math.sin(rad);

  const l_ = (l + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m_ = (l - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s_ = (l - 0.0894841775 * A - 1.291485548 * B) ** 3;

  return {
    r: +4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
    g: -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
    b: -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_,
  };
}

function inGamut({ r, g, b }: Rgb): boolean {
  const eps = 1e-5;
  return r >= -eps && r <= 1 + eps && g >= -eps && g <= 1 + eps && b >= -eps && b <= 1 + eps;
}

function linearToSrgbChannel(x: number): number {
  const v = Math.min(1, Math.max(0, x));
  return v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055;
}

/** Convert OKLCH to sRGB hex, reducing chroma (not lightness) to fit the gamut. */
export function oklchToHex({ l, c, h }: Oklch): Hex {
  let chroma = c;
  if (!inGamut(oklchToLinearSrgb(l, chroma, h))) {
    let lo = 0;
    let hi = c;
    for (let i = 0; i < 24; i++) {
      chroma = (lo + hi) / 2;
      if (inGamut(oklchToLinearSrgb(l, chroma, h))) {
        lo = chroma;
      } else {
        hi = chroma;
      }
    }
    chroma = lo;
  }
  const rgb = oklchToLinearSrgb(l, chroma, h);
  const to255 = (x: number) => Math.round(linearToSrgbChannel(x) * 255);
  return rgbToHex({ r: to255(rgb.r), g: to255(rgb.g), b: to255(rgb.b) });
}

export function rgbToHex({ r, g, b }: Rgb): Hex {
  const p = (n: number) => n.toString(16).padStart(2, "0");
  return `#${p(r)}${p(g)}${p(b)}`;
}

export function hexToRgb(hex: string): Rgb {
  const m = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m || !m[1]) {
    throw new Error(`Expected a 6-digit hex color, got "${hex}"`);
  }
  const n = parseInt(m[1], 16);
  return { r: (n >> 16) & 0xff, g: (n >> 8) & 0xff, b: n & 0xff };
}

/** WCAG 2.x relative luminance of an sRGB hex color. */
export function luminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const lin = (ch: number) => {
    const v = ch / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** WCAG 2.x contrast ratio between two hex colors (1–21). */
export function contrast(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/** `#rrggbb` + alpha → `rgb(r g b / a)` for tokens that need translucency. */
export function withAlpha(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgb(${r} ${g} ${b} / ${alpha})`;
}

/** Parses withAlpha's output back. Null for anything else. */
function parseAlphaColor(value: string): { rgb: Rgb; alpha: number } | null {
  const m = /^rgb\((\d+) (\d+) (\d+) \/ ([0-9.]+)\)$/.exec(value.trim());
  if (!m) {
    return null;
  }
  return {
    rgb: { r: Number(m[1]), g: Number(m[2]), b: Number(m[3]) },
    alpha: Number(m[4]),
  };
}

/** Straight-alpha composite of a translucent color over an opaque backdrop. */
export function compositeOver(value: string, backdrop: Hex): Hex {
  const parsed = parseAlphaColor(value);
  if (!parsed) {
    return value as Hex;
  }
  const back = hexToRgb(backdrop);
  const mix = (fg: number, bg: number) => Math.round(fg * parsed.alpha + bg * (1 - parsed.alpha));
  return rgbToHex({ r: mix(parsed.rgb.r, back.r), g: mix(parsed.rgb.g, back.g), b: mix(parsed.rgb.b, back.b) });
}

/**
 * Contrast that a translucent background can actually PROMISE. An opaque pair
 * measures directly; a translucent background (the scrim) is composited over
 * both pure white and pure black — the extremes of whatever image sits under
 * it — and the worst of the two is the ratio. This is what lets translucent
 * tokens into the WCAG contract instead of being silently skipped.
 *
 * Null means unmeasurable (translucent foreground, or an unparseable value) —
 * callers treat that as "no claim", never as a pass.
 */
export function worstCaseContrast(fg: string, bg: string): number | null {
  if (!/^#[0-9a-f]{6}$/i.test(fg)) {
    return null;
  }
  if (/^#[0-9a-f]{6}$/i.test(bg)) {
    return contrast(fg, bg);
  }
  if (parseAlphaColor(bg)) {
    return Math.min(
      contrast(fg, compositeOver(bg, "#ffffff")),
      contrast(fg, compositeOver(bg, "#000000")),
    );
  }
  return null;
}
