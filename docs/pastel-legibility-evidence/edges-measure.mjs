// edges-measure.mjs <edges.html> <out.json> — sample real rendered pixels around each element's edge and
// report how far the strongest point of that edge sits from what the element sits on (kit dE, typical + worst simulation).
import { chromium } from "playwright";
import { writeFileSync } from "node:fs";
import { deltaE, CVDS, hexToOklch } from "../colorkit.mjs";
const src = "file://" + process.argv[2];
// [name, selector, what it sits on, where its edge is drawn, how far along the top/bottom edge to sample (clear of neighbours, text and thumbs)]
const TARGETS = [
  ["Card", "#m-card", "page", "out", 0.5], ["Sunken panel", "#m-well", "card", "in", 0.5], ["Raised box", "#m-raised", "well", "out", 0.5], ["Floating menu", "#m-pop", "card", "out", 0.85],
  ["Lilac button", "#m-btns .btn.f-lilac", "card", "out", 0.5], ["Blush button", "#m-btns .btn.f-blush", "card", "out", 0.5], ["Butter button", "#m-btns .btn.f-butter", "card", "out", 0.5], ["Robin button", "#m-btns .btn.f-robin", "card", "out", 0.5],
  ["Quiet button", "#m-quiet", "card", "out", 0.5], ["Butter button", "#m-bare-butter", "page", "out", 0.5], ["Robin button", "#m-bare-robin", "page", "out", 0.5], ["Quiet button", "#m-bare-quiet", "page", "out", 0.5], ["Text field", "#f1", "card", "in", 0.8], ["Checkbox, off", "#m-cb", "card", "in", 0.5], ["Switch, off", "#m-sw", "card", "in", 0.8], ["Status box", "#m-al", "card", "out", 0.5],
];
const MODES = [["Light", "#t-light,d1,full,coc"], ["Dark", "#t-dark,d1,full,coc"], ["Dark, aubergine page", "#t-dark,d1,full,aub"]];
const b = await chromium.launch(); const S = 2;
const out = {};
for (const [mode, hash] of MODES) {
  const p = await b.newPage({ viewport: { width: 1000, height: 900 }, deviceScaleFactor: S });
  await p.goto(src + hash); await p.waitForTimeout(250);
  const tok = await p.evaluate(() => { const cs = getComputedStyle(document.documentElement); const o = {}; for (const k of ["page", "card", "well", "raised"]) o[k] = cs.getPropertyValue("--" + k).trim(); return o; });
  const rows = [];
  for (const [name, sel, on, side, xf] of TARGETS) {
    // Document coordinates + fullPage, so an element taller than the viewport is never clipped short.
    const box = await p.evaluate((sel) => { const r = document.querySelector(sel).getBoundingClientRect(); return { x: r.left + scrollX, y: r.top + scrollY, width: r.width, height: r.height }; }, sel);
    const M = 10;
    const clip = { x: box.x - M, y: box.y - M, width: box.width + 2 * M, height: box.height + 2 * M };
    const png = (await p.screenshot({ fullPage: true, clip })).toString("base64");
    const lines = await p.evaluate(async ({ png, w, h, M, S, xf }) => {
      const img = new Image(); img.src = "data:image/png;base64," + png; await img.decode();
      const c = document.createElement("canvas"); c.width = img.width; c.height = img.height; const g = c.getContext("2d", { willReadFrequently: true }); g.drawImage(img, 0, 0);
      const px = (x, y) => { const d = g.getImageData(Math.round(x), Math.round(y), 1, 1).data; return "#" + [d[0], d[1], d[2]].map((v) => v.toString(16).padStart(2, "0")).join(""); };
      // walk across each edge from M px outside to 6 css px inside, in device pixels; x for top/bottom sits a third along (clear of centred text)
      const W = img.width, H = img.height, m = M * S, xx = m + (w * S) * xf, yy = m + (h * S) * 0.5, res = { top: [], side: [], bottom: [] };
      for (let d = -m; d < 6 * S; d++) { res.top.push([d / S, px(xx, m + d)]); res.side.push([d / S, px(m + d, yy)]); res.bottom.push([d / S, px(xx, H - 1 - m - d)]); }
      return res;
    }, { png, w: box.width, h: box.height, M, S, xf });
    // The fill is read 5 css px in from the top edge. An edge's strength on one side is the biggest step the eye meets
    // crossing it: any pixel in the edge band against what the element sits on, or against the element's own fill,
    // and never less than the plain fill-against-backdrop step. Outside band: 1..8 css px out. Inset band: 0.5..3 px in.
    const back = tok[on]; const fillHex = lines.top.find(([d]) => d >= 5)[1];
    const step = (hex, view) => Math.max(deltaE(hex, back, view), deltaE(hex, fillHex, view));
    const row = { name, on, backdrop: back, fill: fillHex, fillStep: +deltaE(fillHex, back).toFixed(1), sides: {} };
    for (const edge of ["top", "side", "bottom"]) {
      const pts = lines[edge].filter(([d]) => (side === "out" ? d < 0 && d >= -8 : d >= 0 && d <= 3));
      let best = { v: -1 };
      for (const [d, hex] of pts) { const v = step(hex, null); if (v > best.v) best = { v, hex, d }; }
      const typical = Math.max(best.v, deltaE(fillHex, back));
      const worst = Math.min(...CVDS.map((view) => Math.max(step(best.hex, view), deltaE(fillHex, back, view))));
      const width = pts.filter(([d, hex]) => deltaE(hex, back) > 3 && deltaE(hex, fillHex) > 3).length / S;
      row.sides[edge] = { strength: +typical.toFixed(1), worstSim: +worst.toFixed(1), hex: best.hex, chroma: +hexToOklch(best.hex).c.toFixed(3), bandPx: +width.toFixed(1) };
    }
    const weakest = Object.entries(row.sides).sort((a, b) => a[1].strength - b[1].strength)[0];
    row.weakest = { side: weakest[0], ...weakest[1] }; row.strongest = Math.max(...Object.values(row.sides).map((v) => v.strength));
    rows.push(row);
  }
  out[mode] = rows; await p.close();
}
await b.close();
writeFileSync(process.argv[3], JSON.stringify(out, null, 1));
for (const [mode, rows] of Object.entries(out)) { console.log("\n" + mode); for (const r of rows) console.log(" ", r.name.padEnd(15), "on", r.on.padEnd(5), "fill step", String(r.fillStep).padStart(5), "|", ["top", "side", "bottom"].map((e) => `${e} ${String(r.sides[e].strength).padStart(5)} (sim ${String(r.sides[e].worstSim).padStart(5)}, ${r.sides[e].bandPx}px, c${r.sides[e].chroma})`).join(" | "), "| weakest:", r.weakest.side, r.weakest.strength); }
