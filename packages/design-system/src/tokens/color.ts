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
  return luminanceOf(hexToRgb(hex));
}

function luminanceOf({ r, g, b }: Rgb): number {
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

/**
 * The CSS named colours (CSS Color 4). They are here because a colour does not
 * always reach the contrast contract as it was written: a CSS minifier rewrites
 * `#ff0000` to `red` and `#808080` to `gray` when the name is shorter, and
 * Token Studio measures what it reads back off the page. test-contrast.ts
 * checks every entry against the minifier the playground's build really uses.
 */
export const NAMED_COLORS: Readonly<Record<string, Hex>> = {
  aliceblue: "#f0f8ff", antiquewhite: "#faebd7", aqua: "#00ffff", aquamarine: "#7fffd4", azure: "#f0ffff",
  beige: "#f5f5dc", bisque: "#ffe4c4", black: "#000000", blanchedalmond: "#ffebcd", blue: "#0000ff",
  blueviolet: "#8a2be2", brown: "#a52a2a", burlywood: "#deb887", cadetblue: "#5f9ea0", chartreuse: "#7fff00",
  chocolate: "#d2691e", coral: "#ff7f50", cornflowerblue: "#6495ed", cornsilk: "#fff8dc", crimson: "#dc143c",
  cyan: "#00ffff", darkblue: "#00008b", darkcyan: "#008b8b", darkgoldenrod: "#b8860b", darkgray: "#a9a9a9",
  darkgreen: "#006400", darkgrey: "#a9a9a9", darkkhaki: "#bdb76b", darkmagenta: "#8b008b", darkolivegreen: "#556b2f",
  darkorange: "#ff8c00", darkorchid: "#9932cc", darkred: "#8b0000", darksalmon: "#e9967a", darkseagreen: "#8fbc8f",
  darkslateblue: "#483d8b", darkslategray: "#2f4f4f", darkslategrey: "#2f4f4f", darkturquoise: "#00ced1", darkviolet: "#9400d3",
  deeppink: "#ff1493", deepskyblue: "#00bfff", dimgray: "#696969", dimgrey: "#696969", dodgerblue: "#1e90ff",
  firebrick: "#b22222", floralwhite: "#fffaf0", forestgreen: "#228b22", fuchsia: "#ff00ff", gainsboro: "#dcdcdc",
  ghostwhite: "#f8f8ff", gold: "#ffd700", goldenrod: "#daa520", gray: "#808080", green: "#008000",
  greenyellow: "#adff2f", grey: "#808080", honeydew: "#f0fff0", hotpink: "#ff69b4", indianred: "#cd5c5c",
  indigo: "#4b0082", ivory: "#fffff0", khaki: "#f0e68c", lavender: "#e6e6fa", lavenderblush: "#fff0f5",
  lawngreen: "#7cfc00", lemonchiffon: "#fffacd", lightblue: "#add8e6", lightcoral: "#f08080", lightcyan: "#e0ffff",
  lightgoldenrodyellow: "#fafad2", lightgray: "#d3d3d3", lightgreen: "#90ee90", lightgrey: "#d3d3d3", lightpink: "#ffb6c1",
  lightsalmon: "#ffa07a", lightseagreen: "#20b2aa", lightskyblue: "#87cefa", lightslategray: "#778899", lightslategrey: "#778899",
  lightsteelblue: "#b0c4de", lightyellow: "#ffffe0", lime: "#00ff00", limegreen: "#32cd32", linen: "#faf0e6",
  magenta: "#ff00ff", maroon: "#800000", mediumaquamarine: "#66cdaa", mediumblue: "#0000cd", mediumorchid: "#ba55d3",
  mediumpurple: "#9370db", mediumseagreen: "#3cb371", mediumslateblue: "#7b68ee", mediumspringgreen: "#00fa9a", mediumturquoise: "#48d1cc",
  mediumvioletred: "#c71585", midnightblue: "#191970", mintcream: "#f5fffa", mistyrose: "#ffe4e1", moccasin: "#ffe4b5",
  navajowhite: "#ffdead", navy: "#000080", oldlace: "#fdf5e6", olive: "#808000", olivedrab: "#6b8e23",
  orange: "#ffa500", orangered: "#ff4500", orchid: "#da70d6", palegoldenrod: "#eee8aa", palegreen: "#98fb98",
  paleturquoise: "#afeeee", palevioletred: "#db7093", papayawhip: "#ffefd5", peachpuff: "#ffdab9", peru: "#cd853f",
  pink: "#ffc0cb", plum: "#dda0dd", powderblue: "#b0e0e6", purple: "#800080", rebeccapurple: "#663399",
  red: "#ff0000", rosybrown: "#bc8f8f", royalblue: "#4169e1", saddlebrown: "#8b4513", salmon: "#fa8072",
  sandybrown: "#f4a460", seagreen: "#2e8b57", seashell: "#fff5ee", sienna: "#a0522d", silver: "#c0c0c0",
  skyblue: "#87ceeb", slateblue: "#6a5acd", slategray: "#708090", slategrey: "#708090", snow: "#fffafa",
  springgreen: "#00ff7f", steelblue: "#4682b4", tan: "#d2b48c", teal: "#008080", thistle: "#d8bfd8",
  tomato: "#ff6347", turquoise: "#40e0d0", violet: "#ee82ee", wheat: "#f5deb3", white: "#ffffff",
  whitesmoke: "#f5f5f5", yellow: "#ffff00", yellowgreen: "#9acd32",
};

/** A colour as the contrast contract reads it: sRGB bytes and an alpha from 0 to 1. */
export interface ParsedColor {
  rgb: Rgb;
  alpha: number;
}

// A number as CSS writes one: digits, digits.digits or .digits — not "0.", which a browser rejects.
const ALPHA = String.raw`(\d+(?:\.\d+)?|\.\d+)(%?)`;
const RGB_MODERN = new RegExp(String.raw`^rgba?\(\s*(\d+)\s+(\d+)\s+(\d+)\s*(?:\/\s*${ALPHA}\s*)?\)$`);
const RGB_LEGACY = new RegExp(String.raw`^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*${ALPHA}\s*)?\)$`);

/**
 * THE reader: one sRGB colour, in any notation it can arrive in. Null for
 * anything else.
 *
 * The presets write `#rrggbb` and withAlpha()'s `rgb(r g b / a)`, and this
 * read only those two until Token Studio met a production build. A minifier
 * rewrites the theme file — `#ffffff` to `#fff`, `rgb(0 0 0 / 0.6)` to `#0009`,
 * `#808080` to `gray` — and Token Studio measures the text it reads back off
 * the page, so every shipped theme showed pairs that "could not be measured"
 * while the build gate passed all of them. The same colour has to measure the
 * same however it is spelled, so the spellings are read here, once, for every
 * surface: 3, 4, 6 and 8-digit hex; rgb()/rgba() with spaces or commas, alpha
 * as a number or a percentage; the named colours; any case, any padding.
 *
 * Still null — and so a pair that could not be measured, which is a failure:
 * a notation outside sRGB bytes (oklch(), hsl(), color-mix(), var()), and a
 * value in the right shape that no colour can have (a channel past 255, an
 * alpha past 1). Compositing one of those used to produce a string hexToRgb
 * throws on, so it reached the contract as a stack trace.
 */
export function parseColor(value: string): ParsedColor | null {
  const text = value.trim().toLowerCase();
  if (text === "transparent") {
    return { rgb: { r: 0, g: 0, b: 0 }, alpha: 0 };
  }
  const hex = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/.exec(Object.hasOwn(NAMED_COLORS, text) ? NAMED_COLORS[text]! : text);
  if (hex?.[1]) {
    const digits = hex[1].length <= 4 ? [...hex[1]].map((digit) => digit + digit).join("") : hex[1];
    const byte = (at: number) => parseInt(digits.slice(at, at + 2), 16);
    return { rgb: { r: byte(0), g: byte(2), b: byte(4) }, alpha: digits.length === 8 ? byte(6) / 255 : 1 };
  }
  const fn = RGB_MODERN.exec(text) ?? RGB_LEGACY.exec(text);
  if (!fn) {
    return null;
  }
  const rgb = { r: Number(fn[1]), g: Number(fn[2]), b: Number(fn[3]) };
  const alpha = fn[4] === undefined ? 1 : Number(fn[4]) / (fn[5] ? 100 : 1);
  // Written as a positive test so NaN fails it too.
  if (Math.max(rgb.r, rgb.g, rgb.b) > 255 || !(alpha >= 0 && alpha <= 1)) {
    return null;
  }
  return { rgb, alpha };
}

const mixOver = (top: ParsedColor, back: Rgb): Rgb => {
  const mix = (fg: number, bg: number) => Math.round(fg * top.alpha + bg * (1 - top.alpha));
  return { r: mix(top.rgb.r, back.r), g: mix(top.rgb.g, back.g), b: mix(top.rgb.b, back.b) };
};

/** Straight-alpha composite of a translucent color over an opaque backdrop. */
export function compositeOver(value: string, backdrop: Hex): Hex {
  const parsed = parseColor(value);
  if (!parsed) {
    return value as Hex;
  }
  return rgbToHex(mixOver(parsed, hexToRgb(backdrop)));
}

const WHITE: Rgb = { r: 255, g: 255, b: 255 };
const BLACK: Rgb = { r: 0, g: 0, b: 0 };
const ratio = (a: number, b: number) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

/**
 * Contrast that a translucent background can actually PROMISE. An opaque pair
 * measures directly. A translucent background (the scrim) is a promise about
 * ANY image under it, so it is composited over pure white and over pure black
 * — the lightest and the darkest it can end up — and the ratio is the worst
 * the text can meet anywhere in that range. That is the worse of the two ends
 * when the text is lighter than both or darker than both; when the text's own
 * luminance lies BETWEEN them, some image under the scrim matches the text
 * exactly and the promise is 1:1. (Taking only the two ends used to pass
 * mid-grey text over a fully transparent scrim at 4.54.) This is what lets
 * translucent tokens into the WCAG contract instead of being silently skipped.
 *
 * Both sides are read by `parseColor`, so a colour measures the same in every
 * notation. Null means unmeasurable: a translucent foreground, or a value on
 * either side that `parseColor` cannot read. That is never a pass — the
 * contract reports the pair as a failure that says it could not be measured
 * (`measureColors` in rules.ts).
 */
export function worstCaseContrast(fg: string, bg: string): number | null {
  const text = parseColor(fg);
  const back = parseColor(bg);
  if (!text || text.alpha !== 1 || !back) {
    return null;
  }
  const own = luminanceOf(text.rgb);
  if (back.alpha === 1) {
    return ratio(own, luminanceOf(back.rgb));
  }
  const overWhite = luminanceOf(mixOver(back, WHITE));
  const overBlack = luminanceOf(mixOver(back, BLACK));
  if (own >= Math.min(overWhite, overBlack) && own <= Math.max(overWhite, overBlack)) {
    return 1;
  }
  return Math.min(ratio(own, overWhite), ratio(own, overBlack));
}
