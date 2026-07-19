/**
 * Pure color math for the ColorInput popover — hex parsing (3/6/8-digit, with
 * alpha), hex formatting, and RGB↔HSV conversion. No React, no DOM. The picker
 * keeps its working state in HSV (not RGB) so dragging to pure black or white
 * doesn't throw away the hue; these helpers are the bridge to the hex the rest
 * of the app speaks.
 */

export interface Rgb {
  /** 0–255 */ r: number;
  /** 0–255 */ g: number;
  /** 0–255 */ b: number;
}

export interface Hsv {
  /** hue, 0–360 */ h: number;
  /** saturation, 0–100 */ s: number;
  /** value/brightness, 0–100 */ v: number;
}

export const clamp = (n: number, min: number, max: number): number => Math.min(Math.max(n, min), max);

/** Parse #rgb / #rrggbb / #rgba / #rrggbbaa (# optional); null if not a color. */
export function parseHex(input: string): { r: number; g: number; b: number; a: number } | null {
  let s = input.trim().replace(/^#/, "");
  if (/^[0-9a-f]{3,4}$/i.test(s)) {
    s = s
      .split("")
      .map((c) => c + c)
      .join("");
  }
  if (/^[0-9a-f]{6}$/i.test(s)) {
    const n = parseInt(s, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255, a: 1 };
  }
  if (/^[0-9a-f]{8}$/i.test(s)) {
    return {
      r: parseInt(s.slice(0, 2), 16),
      g: parseInt(s.slice(2, 4), 16),
      b: parseInt(s.slice(4, 6), 16),
      a: parseInt(s.slice(6, 8), 16) / 255,
    };
  }
  return null;
}

const hex2 = (n: number): string => Math.round(clamp(n, 0, 255)).toString(16).padStart(2, "0");

/**
 * Format rgb + alpha to a hex string. When alpha is enabled and the color is
 * translucent it returns 8 digits (#rrggbbaa); otherwise 6 (#rrggbb), so opaque
 * colors keep the shorter form every existing consumer already expects.
 */
export function formatHex({ r, g, b }: Rgb, a: number, withAlpha: boolean): string {
  const base = `#${hex2(r)}${hex2(g)}${hex2(b)}`;
  return withAlpha && a < 1 ? `${base}${hex2(a * 255)}` : base;
}

export function rgbToHsv({ r, g, b }: Rgb): Hsv {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === rn) {
      h = ((gn - bn) / d) % 6;
    } else if (max === gn) {
      h = (bn - rn) / d + 2;
    } else {
      h = (rn - gn) / d + 4;
    }
    h *= 60;
    if (h < 0) {
      h += 360;
    }
  }
  return { h, s: max === 0 ? 0 : (d / max) * 100, v: max * 100 };
}

export function hsvToRgb({ h, s, v }: Hsv): Rgb {
  const sn = s / 100;
  const vn = v / 100;
  const c = vn * sn;
  const hh = (((h % 360) + 360) % 360) / 60;
  const x = c * (1 - Math.abs((hh % 2) - 1));
  const m = vn - c;
  let r = 0;
  let g = 0;
  let b = 0;
  if (hh < 1) {
    [r, g, b] = [c, x, 0];
  } else if (hh < 2) {
    [r, g, b] = [x, c, 0];
  } else if (hh < 3) {
    [r, g, b] = [0, c, x];
  } else if (hh < 4) {
    [r, g, b] = [0, x, c];
  } else if (hh < 5) {
    [r, g, b] = [x, 0, c];
  } else {
    [r, g, b] = [c, 0, x];
  }
  return { r: Math.round((r + m) * 255), g: Math.round((g + m) * 255), b: Math.round((b + m) * 255) };
}

/** Convenience: hex string straight to HSV (falls back to black on garbage). */
export function hexToHsv(hex: string): { hsv: Hsv; a: number } {
  const parsed = parseHex(hex) ?? { r: 0, g: 0, b: 0, a: 1 };
  return { hsv: rgbToHsv(parsed), a: parsed.a };
}
