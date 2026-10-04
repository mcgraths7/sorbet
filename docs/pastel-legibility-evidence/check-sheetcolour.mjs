import { readFileSync } from "node:fs";
import { oklchToHex, apca, wcag, simulate, hexToOklch, CVDS } from "./colorkit.mjs";
const S = new Function(readFileSync(new URL("./sheetcolour.js", import.meta.url), "utf8") + "; return SheetColour;")();
let bad = 0, n = 0;
for (let l = 0.2; l <= 0.98; l += 0.03) for (let c = 0; c <= 0.16; c += 0.02) for (let h = 0; h < 360; h += 15) {
  n++; const a = oklchToHex({ l, c, h }), b = S.oklchToHex(l, c, h);
  if (a !== b) { bad++; if (bad < 5) console.log("hex mismatch", l, c, h, a, b); }
  for (const d of CVDS) if (simulate(a, d) !== S.simulate(a, d)) { bad++; if (bad < 5) console.log("simulate mismatch", a, d); }
  if (Math.abs(hexToOklch(a).c - S.chroma(a)) > 1e-9) { bad++; if (bad < 5) console.log("chroma mismatch", a); }
  for (const bg of ["#fbf5e6", "#bfe9ea", "#2a2533"]) { if (Math.abs(apca(a, bg) - S.apca(a, bg)) > 1e-9 || Math.abs(wcag(a, bg) - S.wcag(a, bg)) > 1e-9) { bad++; if (bad < 5) console.log("contrast mismatch", a, bg); } }
}
console.log(bad === 0 ? `ok: page maths == kit over ${n} colours x 3 backgrounds` : `FAIL: ${bad} mismatches`); process.exit(bad ? 1 : 0);
