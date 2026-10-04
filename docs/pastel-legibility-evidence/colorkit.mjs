// colorkit.mjs — the ONE measuring instrument for the sorbet pastel work.
// Everything that quotes a number about a colour should get it from here.
//
//   node colorkit.mjs hex <L> <C> <h>            OKLCH -> sRGB hex (chroma reduced to fit gamut)
//   node colorkit.mjs info <hex>                 hex -> OKLCH L C h, WCAG luminance
//   node colorkit.mjs pair <textHex> <bgHex>     WCAG ratio + APCA Lc, normal vision and 3 simulated CVDs
//   node colorkit.mjs sep <hexA> <hexB>          how far apart two colours look (OKLab dE x100), normal + 3 CVDs
//   node colorkit.mjs ladder <h> <C> <bgHex> [L1,L2,...]   a text-colour ladder at one hue against one background
//   node colorkit.mjs sim <hex>                  what a hex becomes under protan / deutan / tritan simulation
//   node colorkit.mjs selftest                   check APCA + OKLCH against published reference values
//
// Sources: OKLCH->sRGB and WCAG 2.x ratio are IMPORTED from sorbet's own color.ts (one definition).
// APCA: apca-w3 0.1.9 (0.0.98G-4g constants). CVD: Machado, Oliveira & Fernandes 2009, severity 1.0,
// applied in linear RGB (protan/deutan matrices identical to sorbet's tools/check-cvd.ts; tritan added).

import { oklchToHex, contrast as wcag, luminance, hexToRgb, rgbToHex } from "/Users/homelab/code/sorbet/packages/design-system/src/tokens/color.ts";

export { oklchToHex, wcag, luminance };

const lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const unlin = (x) => { const v = Math.min(1, Math.max(0, x)); return v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055; };
const linRgb = (hex) => { const { r, g, b } = hexToRgb(hex); return [lin(r / 255), lin(g / 255), lin(b / 255)]; };

export function oklab([r, g, b]) {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
}
export function hexToOklch(hex) {
  const [L, a, b] = oklab(linRgb(hex));
  let h = (Math.atan2(b, a) * 180) / Math.PI; if (h < 0) h += 360;
  return { l: L, c: Math.hypot(a, b), h };
}

// --- APCA (apca-w3 0.1.9). Lc > 0: dark text on light bg. |Lc|: 0 invisible .. ~106 black on white.
export function apca(textHex, bgHex) {
  const Y = (hex) => { const { r, g, b } = hexToRgb(hex); let y = 0.2126729 * (r / 255) ** 2.4 + 0.7151522 * (g / 255) ** 2.4 + 0.072175 * (b / 255) ** 2.4; return y > 0.022 ? y : y + (0.022 - y) ** 1.414; };
  const yt = Y(textHex), yb = Y(bgHex);
  if (Math.abs(yb - yt) < 0.0005) return 0;
  if (yb > yt) { const s = (yb ** 0.56 - yt ** 0.57) * 1.14; return s < 0.1 ? 0 : (s - 0.027) * 100; }
  const s = (yb ** 0.65 - yt ** 0.62) * 1.14; return s > -0.1 ? 0 : (s + 0.027) * 100;
}

// --- CVD simulation (Machado 2009, severity 1.0, linear RGB)
export const MACHADO = {
  protan: [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
  deutan: [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.01182, 0.04294, 0.968881]],
  tritan: [[1.255528, -0.076749, -0.178779], [-0.078411, 0.930809, 0.147602], [0.004733, 0.691367, 0.3039]],
};
export const CVDS = ["protan", "deutan", "tritan"];
const simLin = (rgb, d) => MACHADO[d].map((row) => Math.min(1, Math.max(0, row[0] * rgb[0] + row[1] * rgb[1] + row[2] * rgb[2])));
export function simulate(hex, d) { const [r, g, b] = simLin(linRgb(hex), d).map((x) => Math.round(unlin(x) * 255)); return rgbToHex({ r, g, b }); }
export function deltaE(hexA, hexB, d = null) {
  const A = oklab(d ? simLin(linRgb(hexA), d) : linRgb(hexA)), B = oklab(d ? simLin(linRgb(hexB), d) : linRgb(hexB));
  return Math.hypot(A[0] - B[0], A[1] - B[1], A[2] - B[2]) * 100;
}

export function pairReport(text, bg) {
  const row = (label, t, b) => ({ view: label, text: t, bg: b, wcag: +wcag(t, b).toFixed(2), apcaLc: +apca(t, b).toFixed(1) });
  return [row("normal", text, bg), ...CVDS.map((d) => row(d, simulate(text, d), simulate(bg, d)))];
}
export function sepReport(a, b) { return { normal: +deltaE(a, b).toFixed(1), ...Object.fromEntries(CVDS.map((d) => [d, +deltaE(a, b, d).toFixed(1)])) }; }

const fmt = (o) => `L ${o.l.toFixed(3)}  C ${o.c.toFixed(3)}  h ${o.h.toFixed(1)}`;
if (process.argv[1] === new URL(import.meta.url).pathname) {
  const [cmd, ...a] = process.argv.slice(2);
  if (cmd === "hex") console.log(oklchToHex({ l: +a[0], c: +a[1], h: +a[2] }));
  else if (cmd === "info") console.log(a[0], fmt(hexToOklch(a[0])), ` WCAG-luminance ${luminance(a[0]).toFixed(4)}`);
  else if (cmd === "pair") console.table(pairReport(a[0], a[1]));
  else if (cmd === "sep") console.log(a[0], a[1], sepReport(a[0], a[1]), "(OKLab dE x100; under ~5 is hard to tell apart, 10+ is clearly different)");
  else if (cmd === "sim") console.log(a[0], Object.fromEntries(CVDS.map((d) => [d, simulate(a[0], d)])));
  else if (cmd === "ladder") {
    const Ls = (a[3] ?? "0.30,0.34,0.38,0.42,0.46,0.50,0.54,0.58,0.62").split(",").map(Number);
    console.table(Ls.map((l) => { const hex = oklchToHex({ l, c: +a[1], h: +a[0] }); const got = hexToOklch(hex); return { L: l, hex, "C kept": +got.c.toFixed(3), wcag: +wcag(hex, a[2]).toFixed(2), apcaLc: +apca(hex, a[2]).toFixed(1) }; }));
  } else if (cmd === "selftest") {
    const ref = [["#888888", "#ffffff", 63.056469930209424], ["#ffffff", "#888888", -68.54146436644962], ["#000000", "#aaaaaa", 58.146262578561334], ["#aaaaaa", "#000000", -56.24113336839742], ["#112233", "#ddeeff", 91.66830811481631], ["#ddeeff", "#112233", -93.06770049484275], ["#112233", "#444444", 8.32326136957393], ["#444444", "#112233", -7.526878460278154]];
    let ok = true;
    for (const [t, b, want] of ref) { const got = apca(t, b); const pass = Math.abs(got - want) < 0.01; ok &&= pass; console.log(pass ? "ok  " : "FAIL", "apca", t, "on", b, got.toFixed(4), "want", want.toFixed(4)); }
    const rt = hexToOklch(oklchToHex({ l: 0.7, c: 0.1, h: 200 })); const pass = Math.abs(rt.l - 0.7) < 0.005 && Math.abs(rt.h - 200) < 1.5; ok &&= pass; console.log(pass ? "ok  " : "FAIL", "oklch round trip", fmt(rt));
    const w = wcag("#000000", "#ffffff"); console.log(Math.abs(w - 21) < 1e-9 ? "ok  " : "FAIL", "wcag black/white", w); ok &&= Math.abs(w - 21) < 1e-9;
    process.exit(ok ? 0 : 1);
  } else { console.log("usage: hex|info|pair|sep|ladder|sim|selftest — see header"); }
}
