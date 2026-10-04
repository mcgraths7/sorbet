// build-sheet.mjs <out-dir> [HH:MM] — sample sheet 1 (revised after independent review): where can the text colour land?
// Every number on the page is computed here from colorkit.mjs. The page's live maths (sheetcolour.js) is checked
// against the kit by check-sheetcolour.mjs. Nothing measured is typed in by hand.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { oklchToHex, hexToOklch, apca, wcag, deltaE, simulate, CVDS } from "./colorkit.mjs";

const outDir = process.argv[2]; const builtAt = process.argv[3] ?? "";
mkdirSync(outDir, { recursive: true });
const DATE = "2026-10-03";
const P = { cream: "#fef4dc", surface: "#fffbf1", lilac: "#dac5fc", blush: "#f9c3c6", butter: "#f5e3a2", robin: "#a6edee" };
const NAMES = { lilac: "Lilac", blush: "Blush", butter: "Butter", robin: "Robin's egg" };
const SHORT = { lilac: "Lilac", blush: "Blush", butter: "Butter", robin: "Robin" };
const FILLS = ["lilac", "blush", "butter", "robin"];
const TODAY = { text: "#38342f", page: "#f8f7f5", primary: "#adedf3", onPrimary: "#26231f" };
const LINK = "#654199", FOCUS = "#8e6ac7", EDGE = "161 110 50", DIVIDER = "#e3d2b0", WELL = "#f7ecd1";
const PICK = { family: "C", L: 0.395 };          // #693800, found by the owner with the slider at 18:57: hue 60, as colourful as a screen can show at this lightness            // the owner's pick 2026-10-03: first aubergine A L0.400 C0.100, then "Switch to cocoa"
const LABEL_L = 0.30, MUTED_DL = 0.08, SUBTLE_DL = 0.14;
const LADDER = [0.30, 0.35, 0.40, 0.45, 0.50, 0.55, 0.60];
const FAM = [
  { id: "A", name: "Aubergine", short: "aubergine", hue: 310, chroma: 0.10, ladder: true },
  { id: "C", name: "Cocoa", short: "cocoa", hue: 60, chroma: 0.10, ladder: true },
  { id: "B", name: "Ink blue", short: "ink blue", hue: 265, chroma: 0.08, ladder: false },
  { id: "P", name: "Plum", short: "plum", hue: 335, chroma: 0.075, ladder: false },
];
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const f0 = (v) => v.toFixed(0), f1 = (v) => v.toFixed(1), f3 = (v) => v.toFixed(3);
const lchOf = (hex) => { const o = hexToOklch(hex); return `lightness ${o.l.toFixed(2)} · colourfulness ${f3(o.c)} · hue ${f0(o.h)}°`; };
const C = (hex) => hexToOklch(hex).c;
const inkAt = (f, L) => oklchToHex({ l: L, c: f.chroma, h: f.hue });
const grayAt = (hex) => oklchToHex({ l: hexToOklch(hex).l, c: 0, h: 0 });
const views = (fn) => [fn(null), ...CVDS.map((d) => fn(d))];
// The authors' published minimums, compared on the UNROUNDED score so a tag never claims a line the number has not reached.
const BANDS = [[90, "paragraphs, 14px and up"], [75, "paragraphs at 18px, or 16px medium"], [60, "headings and bold labels, 16px and up"], [45, "big headings only"], [30, "placeholder or disabled text only"], [-1, "too faint"]];
const band = (lc) => BANDS.find(([min]) => lc >= min)[1];
const shade = (hex) => { const o = hexToOklch(hex); return oklchToHex({ l: o.l - 0.14, c: o.c * 1.25, h: o.h }); };
const deep = (hex) => oklchToHex({ l: 0.55, c: 0.12, h: hexToOklch(hex).h });
const halo = (hex) => oklchToHex({ l: 0.70, c: 0.14, h: hexToOklch(hex).h });
const HL = Object.fromEntries(FILLS.map((k) => [k, halo(P[k])]));
const SH = Object.fromEntries(FILLS.map((k) => [k, shade(P[k])])), DP = Object.fromEntries(FILLS.map((k) => [k, deep(P[k])]));
const lcWorst = (t, b) => Math.min(apca(t, b), ...CVDS.map((d) => apca(simulate(t, d), simulate(b, d))));

const fam = Object.fromEntries(FAM.map((f) => [f.id, f]));
const pickFam = fam[PICK.family], pickHex = inkAt(pickFam, PICK.L), labelHex = inkAt(pickFam, LABEL_L);
const steps = (f) => LADDER.map((L, i) => { const hex = inkAt(f, L); const lc = apca(hex, P.cream); return { id: `${f.id}${i + 1}`, L, hex, lc, onMilk: apca(hex, P.surface), ratio: wcag(hex, P.cream), kept: C(hex), band: band(lc), worst: lcWorst(hex, P.cream) }; });
const ladders = FAM.filter((f) => f.ladder).sort((a, b) => (b.id === PICK.family) - (a.id === PICK.family)).map((f) => ({ ...f, steps: steps(f) }));
const lastPass = (f) => { const s = steps(f).filter((x) => x.ratio >= 4.5); return s[s.length - 1]; };

// ---- measured facts the prose quotes ----
const sepRow = (a, b) => views((d) => deltaE(a, b, d));
const sepTable = [
  ["Milk on cream", sepRow(P.surface, P.cream)],
  ...FILLS.map((k) => [`${SHORT[k]} on cream`, sepRow(P[k], P.cream)]),
  ...FILLS.flatMap((a, i) => FILLS.slice(i + 1).map((b) => [`${SHORT[a]} / ${SHORT[b]}`, sepRow(P[a], P[b])])),
];
const keptRow = (hex) => CVDS.map((d) => C(simulate(hex, d)));
const strip = [...FAM.map((f) => ({ label: f.id, name: f.name, hex: inkAt(f, PICK.L) })), { label: "G", name: "Plain gray", hex: oklchToHex({ l: PICK.L, c: 0, h: 0 }) }, { label: "T", name: "Sorbet's text today", hex: TODAY.text }];
const fromGray = (hex) => views((d) => deltaE(hex, grayAt(hex), d));
const inkPair = (a, b) => views((d) => deltaE(inkAt(fam[a], PICK.L), inkAt(fam[b], PICK.L), d));
const todayLc = apca(TODAY.text, TODAY.page), todayOnCream = apca(TODAY.text, P.cream);
const blackOn = Object.fromEntries(FILLS.map((k) => [k, apca("#000000", P[k])]));

const cap = (s) => `<span class="cap"><b>${s.id}</b> · ${s.hex} · lightness ${s.L.toFixed(2)}${Math.abs(s.kept - fam[s.id[0]].chroma) > 0.005 ? ` · colourfulness ${f3(s.kept)} (the most a screen can show this dark)` : ""} · Lc&nbsp;${f1(s.lc)} on cream, ${f1(s.onMilk)} on a card · old&nbsp;rule&nbsp;${s.ratio.toFixed(2)}:1 (${s.ratio >= 4.5 ? "passes" : "fails"}) <i>${s.band}</i></span>`;
const SAMPLE = `<span class="h">Lemon chicken with rice</span><span class="p">Sear the thighs skin-side down until deep golden, about 8 minutes, then nestle them into the rice and bake until the stock is absorbed.</span><span class="s">Serves 4 · 45 min · updated 2 days ago</span>`;
const specimen = (s, f) => `<button type="button" class="spec" style="--c:${s.hex}" data-fam="${f.id}" data-l="${s.L}">${cap(s)}${SAMPLE}</button>`;

const mock = (cls = "", idp = "m", full = true) => `
<div class="mock ${cls}">
  <div class="m-card">
    <div class="m-h">Weeknight plan <span class="m-badge f-butter">NEW</span></div>
    <p class="m-p">Three dinners are planned and the pantry covers two of them. The shop on Thursday picks up the rest: ${full ? `<a class="m-a" href="#try">see the list</a>` : `<span class="m-a">see the list</span>`}.</p>
    <p class="m-meta">Updated 5 minutes ago · 14 items · 2 running low</p>
    <div class="m-row">
      <span class="m-btn f-lilac">Start cooking</span>
      <span class="m-btn f-blush">Swap a dish</span>
      <span class="m-btn f-butter">Add to list</span>
      <span class="m-btn f-lilac m-off">Disabled</span>
      <span class="m-chip f-robin">✓ In stock</span>
    </div>
    <label class="m-lab" for="${idp}-in">Search recipes</label>
    <input class="m-in" id="${idp}-in" placeholder="chicken, rice, lemon…" autocomplete="off">
    <p class="m-hint">Searches titles and ingredients. This line is the smallest text sorbet uses, 12px.</p>
    <div class="m-row m-ctl">
      <span class="m-pr"><span class="m-check on" aria-hidden="true">✓</span>Done</span>
      <span class="m-pr"><span class="m-check" aria-hidden="true"></span>Not yet</span>
      <span class="m-pr"><span class="m-switch on" aria-hidden="true"><i></i></span>On</span>
      <span class="m-pr"><span class="m-switch" aria-hidden="true"><i></i></span>Off</span>
    </div>
    ${full ? `<div class="m-alert f-robin"><span class="m-ic" aria-hidden="true">✓</span><div><b>Saved.</b> The plan is stored and the shopping list is updated. A paragraph inside a status box sits on a pale wash of the pastel, not the full pastel.</div></div>` : ""}
    <div class="m-list"><div><span>Jasmine rice</span><span class="m-meta">2 cups</span></div><div><span>Chicken thighs</span><span class="m-meta">900 g</span></div><div><span>Lemons</span><span class="m-meta">3</span></div></div>
  </div>
</div>`;
const PASSAGE = `Rinse the rice until the water runs nearly clear, then leave it to drain while the oven heats. Pat the chicken dry and season it well on both sides. Sear the thighs skin-side down in a wide, heavy pan until the skin is deep golden and comes away without sticking, about 8 minutes, then turn them for a minute and lift them out. Soften the onion in the same pan, stir in the garlic and the rice, and let the grains toast until they smell nutty. Pour in the stock, add the lemon zest, and bring it to a simmer. Nestle the chicken back in, skin up, and bake uncovered for 25 minutes, until the stock is absorbed and the rice is tender. Rest it for five minutes, squeeze over the lemon, and scatter with parsley.`;

const mix = (v, a) => `color-mix(in srgb,var(--${v}) ${a}%,transparent)`;
const FIELD = "inset 0 0 0 1px rgb(129 91 31 / .24),inset 0 2px 3px rgb(129 91 31 / .14)";
const EDGES = [
  { id: "E1", name: "Hairline", desc: "A faint 1px line in the element's own deeper colour, plus a tight shadow. The quietest of the three.", card: `0 0 0 1px rgb(${EDGE} / .26),0 1px 2px rgb(${EDGE} / .18)`, fill: `0 0 0 1px ${mix("hl", 55)},0 1px 2px ${mix("hl", 45)}`, field: FIELD },
  { id: "E2", name: "Halo, no line (your pick)", desc: "No line on the card or the buttons: a soft glow in the element's own deeper colour. The text field keeps a faint 1px inner line, because its fill is the same as the card's and it would otherwise vanish. Used on the card in section 2.", card: `0 0 6px 1px rgb(${EDGE} / .38),0 2px 4px rgb(${EDGE} / .18),0 10px 28px -8px rgb(${EDGE} / .26)`, fill: `0 0 4px 1px ${mix("hl", 70)},0 1px 2px ${mix("hl", 60)},0 4px 10px -2px ${mix("dp", 26)}`, field: FIELD + ",0 1px 0 rgb(255 255 255 / .9)" },
  { id: "E3", name: "Shade ring", desc: "A crisp 1px ring in a darker shade of the element's own colour. The firmest of the three, but it reads as an outline.", card: `0 0 0 1px rgb(${EDGE} / .45),0 2px 6px -2px rgb(${EDGE} / .26)`, fill: `0 0 0 1px ${mix("tn", 85)}`, field: "inset 0 0 0 1px rgb(129 91 31 / .45)" },
];
// A custom property that contains var(--dp) is resolved where it is DECLARED, so the recipes are real rules on the elements.
const edgeCss = EDGES.map((e) => { const c = "." + e.id.toLowerCase(); return `${c} .m-card{box-shadow:${e.card}}\n${c} .m-btn,${c} .m-chip,${c} .m-badge{box-shadow:${e.fill}}\n${c} .m-in{box-shadow:${e.field}}\n${c} .m-alert{box-shadow:${e.fill}}`; }).join("\n");

const td = (v) => `<td>${f1(v)}</td>`;
const A = fam.A, Cc = fam.C;
const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Sorbet pastel — text colour (${DATE})</title>
<style>
:root{--cream:${P.cream};--surface:${P.surface};--robin:${P.robin};--blush:${P.blush};--lilac:${P.lilac};--butter:${P.butter};--well:${WELL};
${FILLS.map((k) => `--s-${k}:${SH[k]};--d-${k}:${DP[k]};--h-${k}:${HL[k]}`).join(";")};
--edge:${EDGE};--link:${LINK};
--ink:${pickHex};--ink-strong:${labelHex};--ink-muted:${inkAt(pickFam, PICK.L + MUTED_DL)};--ink-subtle:${inkAt(pickFam, PICK.L + SUBTLE_DL)};
--body-size:1rem;--body-weight:400;--btn-size:1rem;--btn-weight:600;
--font:ui-rounded,"SF Pro Rounded","Nunito","Comfortaa",system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;
--mono:ui-monospace,"SF Mono",Menlo,Consolas,monospace}
*{box-sizing:border-box}
button,input,label,a{touch-action:manipulation}
html{background:var(--cream);-webkit-text-size-adjust:100%;text-size-adjust:100%;scroll-padding-bottom:260px}
/* The page's own notes are set in the ink being tried (its darker label shade), so the sheet never favours one family. */
body{margin:0 auto;max-width:60rem;padding:16px max(16px,env(safe-area-inset-right)) 300px max(16px,env(safe-area-inset-left));background:var(--cream);color:var(--ink-strong);font:16px/1.5 var(--font)}
h1{font-size:1.6rem;line-height:1.2;margin:.4rem 0 .2rem}
h2{font-size:1.25rem;margin:2.4rem 0 .4rem;padding-top:.8rem;border-top:2px dotted rgb(var(--edge) / .45)}
h3{font-size:1.05rem;margin:1.4rem 0 .2rem}
p,li{max-width:44rem} ul,ol{padding-left:1.3rem;margin:.3rem 0} li{margin:.25rem 0}
code,.cap,.ro,td,th{font-family:var(--mono);font-size:.78rem}
a{color:inherit}
.sw{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin:.6rem 0}
@media (min-width:40em){.sw{grid-template-columns:repeat(3,1fr)}}
.sw>div{border-radius:18px;padding:14px;min-height:118px;box-shadow:0 0 5px 1px rgb(var(--edge) / .26),0 2px 4px rgb(var(--edge) / .18);color:var(--ink-strong)}
.sw b{display:block;font-size:1rem}.sw span{display:block;font-family:var(--mono);font-size:.74rem}
.spec{-webkit-appearance:none;appearance:none;background:none;border:0;margin:0;text-align:left;color:inherit;display:block;width:100%;cursor:pointer;padding:12px 0 14px;border-bottom:1px solid rgb(var(--edge) / .22);font:inherit;border-radius:0}
.spec[aria-pressed="true"]{box-shadow:inset 4px 0 0 var(--s-lilac);padding-left:12px}
.spec:focus-visible{outline:3px solid ${FOCUS};outline-offset:2px;border-radius:8px}
.cap{display:block;margin-bottom:4px;color:var(--ink-strong)}
.cap i{font-style:normal;margin-left:.3rem;padding:1px 7px;border-radius:99px;box-shadow:0 0 0 1px currentColor;display:inline-block}
.spec .h,.spec .p,.spec .s{display:block;color:var(--c)}
.spec .h{font-size:1.25rem;font-weight:600;line-height:1.25}
.spec .p{font-size:var(--body-size);font-weight:var(--body-weight);max-width:40rem}
.spec .s{font-size:.75rem}
.strip{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin:.6rem 0}
.strip>div{background:var(--surface);border-radius:16px;padding:12px;box-shadow:0 0 5px 1px rgb(var(--edge) / .26),0 2px 4px rgb(var(--edge) / .18)}
.strip i{display:block;height:44px;border-radius:10px;background:var(--c);margin-bottom:8px}
.strip b{display:block;font-size:1.05rem;color:var(--c)}.strip span{display:block;color:var(--c);font-size:1rem}.strip code{display:block;margin-top:6px}
.tw{overflow-x:auto;max-width:100%}
table{border-collapse:collapse;margin:.5rem 0}
td,th{text-align:right;padding:4px 0 4px 9px;white-space:nowrap;border-bottom:1px solid rgb(var(--edge) / .22);font-size:.72rem}
td:first-child,th:first-child{text-align:left;padding-left:0}
.fillgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px}
.fillgrid>div{border-radius:16px;padding:12px;box-shadow:0 0 4px 1px ${mix("hl", 70)},0 1px 2px ${mix("hl", 60)}}
.fillgrid b{display:block;font-size:var(--btn-size);font-weight:var(--btn-weight);color:var(--ink-strong)}.fillgrid span{display:block;font-size:var(--body-size);font-weight:var(--body-weight);color:var(--ink)}.fillgrid code{display:block;margin-top:6px;white-space:normal;color:var(--ink-strong)}
.opts{display:flex;flex-wrap:wrap;gap:8px;margin:.5rem 0 1rem;align-items:center}
.opts span{font-weight:600;font-size:.85rem;flex:0 0 100%}
.opts button,#pick button{-webkit-appearance:none;appearance:none;font:600 .82rem var(--font);min-height:40px;padding:0 14px;border:0;border-radius:99px;background:var(--surface);color:var(--ink-strong);box-shadow:inset 0 0 0 1px rgb(var(--edge) / .35);cursor:pointer}
.opts button[aria-pressed="true"],#pick button[aria-pressed="true"]{box-shadow:inset 0 0 0 2px currentColor}
.opts button[aria-pressed="true"]::before,#pick button[aria-pressed="true"]::before{content:"✓ "}
.read{color:var(--ink);font-size:var(--body-size);font-weight:var(--body-weight);max-width:40rem}
.read.card{background:var(--surface);border-radius:22px;padding:18px;box-shadow:${EDGES[1].card}}
/* ---- the sample card: a slice of interface at sorbet's real type sizes, drawn in the picked ink ---- */
.mock{color:var(--ink);margin:.8rem 0}
.m-card{background:var(--surface);border-radius:22px;padding:18px}
.m-h{font-size:1.25rem;font-weight:700;line-height:1.2;display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.m-p{margin:.4rem 0;font-size:var(--body-size);font-weight:var(--body-weight)}.m-meta{color:var(--ink-muted);font-size:.875rem;margin:.2rem 0}
.m-hint{color:var(--ink-muted);font-size:.75rem;margin:.3rem 0 0}
.m-a{color:var(--link);text-decoration:underline;text-decoration-thickness:2px;text-underline-offset:3px}
.m-row{display:flex;flex-wrap:wrap;gap:12px;align-items:center;margin:.9rem 0}
.m-btn,.m-chip,.m-badge{display:inline-flex;align-items:center;min-height:40px;padding:0 16px;border-radius:999px;font-size:var(--btn-size);font-weight:var(--btn-weight);background:var(--f);color:var(--ink-strong)}
.m-chip{min-height:32px;padding:0 12px;font-size:.875rem;font-weight:500}
.m-badge{min-height:22px;padding:0 9px;font-size:.75rem;font-weight:600}
.m-btn.m-off{background:color-mix(in srgb,var(--f) 45%,var(--surface));color:var(--ink-subtle);box-shadow:inset 0 0 0 1px ${mix("dp", 22)} !important}
${FILLS.map((k) => `.f-${k}{--f:var(--${k});--tn:var(--s-${k});--dp:var(--d-${k});--hl:var(--h-${k})}`).join("")}
.m-lab{display:block;font-weight:500;font-size:.875rem;margin:.6rem 0 .3rem;color:var(--ink-strong)}
.m-in{-webkit-appearance:none;appearance:none;display:block;width:100%;max-width:26rem;min-height:44px;border:0;border-radius:14px;padding:0 14px;font:inherit;font-size:1rem;color:var(--ink);background:var(--surface)}
.m-in::placeholder{color:var(--ink-subtle);opacity:1}
.m-in:focus-visible{outline:3px solid ${FOCUS};outline-offset:2px}
.m-ctl{gap:12px 20px}.m-pr{display:inline-flex;align-items:center;gap:8px;white-space:nowrap}
.m-check{display:inline-grid;place-items:center;width:24px;height:24px;border-radius:8px;background:var(--surface);box-shadow:inset 0 0 0 1.5px var(--s-lilac);font-weight:800;font-size:.95rem;line-height:1;color:var(--ink-strong)}
.m-check.on{background:var(--lilac)}
.m-switch{display:inline-block;width:46px;height:26px;border-radius:99px;background:var(--well);box-shadow:inset 0 0 0 1.5px var(--s-lilac);position:relative}
.m-switch i{position:absolute;top:3px;left:3px;width:20px;height:20px;border-radius:50%;background:var(--surface);box-shadow:0 0 0 1px var(--s-lilac),0 1px 3px var(--d-lilac)}
.m-switch.on{background:var(--s-lilac)}.m-switch.on i{left:23px}
.m-alert{display:flex;gap:10px;align-items:flex-start;padding:12px 14px;border-radius:16px;margin:.9rem 0;background:color-mix(in srgb,var(--f) 50%,var(--surface))}
.m-alert b{color:var(--ink-strong)}.m-ic{flex:none;display:inline-grid;place-items:center;width:22px;height:22px;border-radius:50%;font:800 .8rem/1 var(--font);background:var(--ink-strong);color:var(--surface);margin-top:1px}
.m-list{margin-top:.8rem}.m-list>div{display:flex;justify-content:space-between;gap:12px;padding:9px 0;border-top:1px solid ${DIVIDER}}
${edgeCss}
.edgehead{margin:1.4rem 0 0}.edgehead b{font-size:1rem}
/* ---- picker, pinned to the bottom of the screen ---- */
#pick{position:fixed;left:0;right:0;bottom:0;background:var(--surface);color:var(--ink-strong);box-shadow:0 -1px 0 rgb(var(--edge) / .3),0 -6px 18px -6px rgb(var(--edge) / .4);padding:8px max(14px,env(safe-area-inset-right)) calc(8px + env(safe-area-inset-bottom)) max(14px,env(safe-area-inset-left));z-index:5}
#pick .in{max-width:60rem;margin:0 auto;display:grid;gap:4px}
#pick .fb{display:flex;flex-wrap:wrap;gap:6px;align-items:center}
#pick button{min-height:36px;padding:0 11px;background:var(--cream);color:var(--ink-strong)}
#pick .fb a{margin-left:auto;font-size:.8rem;font-weight:600;padding:8px 4px}
#pick .rowl{display:grid;grid-template-columns:5.8rem 36px 1fr 36px 2.9rem;gap:6px;align-items:center;font-size:.8rem}
#pick .rowl button{min-height:36px;padding:0;font-size:1.1rem}
#pick input[type=range]{width:100%;accent-color:var(--ink-strong);min-height:36px;margin:0}
#pick #mini{position:absolute;right:max(14px,env(safe-area-inset-right));top:-34px;min-height:34px;border-radius:12px 12px 0 0;background:var(--surface);box-shadow:0 -1px 0 rgb(var(--edge) / .3)}
#pick.min .fb,#pick.min .rowl,#pick.min #ro{display:none}
#pick .ro{line-height:1.35}
#pick .code{display:flex;gap:8px;align-items:center;flex-wrap:wrap;font-family:var(--mono);font-size:.84rem;font-weight:700}
</style></head>
<body>
<h1>Sorbet pastel: where can the text colour land?</h1>
<p>${DATE} · sample sheet 1${builtAt ? `, revised ${builtAt} after an independent review` : ""}. Nothing in sorbet has changed yet. Sheet 2, edges and dark mode, is <a href="edges.html">here</a>.</p>

<h2>Where this stands</h2>
<ul>
<li><b>Your ink: ${pickFam.name.toLowerCase()}</b> <code>${pickHex}</code>, which you found with the slider: lightness ${hexToOklch(pickHex).l.toFixed(3)}, hue ${pickFam.hue}, colourfulness ${f3(C(pickHex))}, which is as colourful as a screen can show at that lightness. It scores Lc ${f0(apca(pickHex, P.cream))} on the cream page and ${f0(apca(pickHex, P.surface))} on a card (Lc is explained below; 90 is the mark for paragraphs at sorbet's normal size), and sits ${f1(fromGray(pickHex)[0])} from a gray of the same lightness, where today's text sits ${f1(fromGray(TODAY.text)[0])}. You first leaned to aubergine <code>${inkAt(fam.A, 0.40)}</code>, then switched. The slider opens on your cocoa.</li>
<li><b>Why cocoa suits your eyes.</b> You said A and B look similar, and that P is close to plain gray as text. That is the pattern the deutan simulation predicts (deutan is one of the two red-green kinds of colour blindness): there A and B sit only ${f1(inkPair("A", "B")[2])} apart and P sits ${f1(fromGray(inkAt(fam.P, PICK.L))[2])} from gray, where under 5 is hard to tell apart. You can still tell the swatches apart, so yours is probably a partial form. Cocoa sits ${f1(fromGray(pickHex)[2])} from gray in that simulation and never drops below ${f1(Math.min(...fromGray(pickHex)))} in any of them, so it should stay visibly brown rather than gray for you.</li>
<li><b>How light paragraphs can go, by the measurements:</b> about lightness 0.40 to 0.42 at today's 16px regular type on a card; about 0.50 only if paragraphs move to 18px or to a medium weight; lighter than that is for headings.</li>
<li><b>The old rule never required dark gray text.</b> Sorbet's text today measures ${wcag(TODAY.text, TODAY.page).toFixed(1)}:1 against a rule that asks for 4.5:1, and your cocoa measures ${wcag(pickHex, P.cream).toFixed(1)}:1. Sorbet simply picks the darkest neutral. What the old rule did force is the deep button, outline and checkbox colours, which is the pastel half of this work.</li>
</ul>

<h2>What I still need</h2>
<p>Nothing more from this sheet. If you change your mind about the ink, drag the sliders in the bar pinned to the bottom of the screen and send me the bold line in that bar (the copy button beside it copies it; − and + move one notch). If 16px regular paragraphs are not comfortable in this ink, try 16px medium and 18px regular with the buttons above the sample card and tell me which.</p>

<h3>The numbers on every sample</h3>
<ul>
<li><b>Ink</b> is the text colour. A <b>family</b> is one hue of ink at several lightnesses.</li>
<li><b>Lc</b> is "lightness contrast", the score from APCA (the Accessible Perceptual Contrast Algorithm, the contrast measure drafted for the next version of the web accessibility guidelines). It says how strongly text stands off its background by brightness alone, and brightness is the part of contrast that colour blindness leaves largely alone: under the simulations these scores move by 1 to 5 points. Black on white is about 106; under about 15 is effectively invisible.</li>
<li>What the measure's authors publish as minimums: <b>90</b> for paragraphs from 14px regular up (they call 90 "preferred"); <b>75</b> for paragraphs only if the type is at least 18px regular or 16px medium (medium is one step heavier than regular); <b>60</b> for text that is not a paragraph, such as headings and labels, and only when it is at least 16px bold, 18px semi-bold or 24px regular; <b>45</b> for big headings, meaning 24px bold or 36px regular; <b>30</b> is their floor for placeholder and disabled text. These are their minimums for a general audience and the method is still a draft. None of it is a measurement of your eyes or your screens, so your eye wins.</li>
<li><b>Old rule</b> is the contrast ratio from WCAG (the current web accessibility guidelines) that sorbet enforces today: at least 4.5:1 for text, on a scale from 1:1 (no contrast) to 21:1 (black on white).</li>
<li><b>Lightness, colourfulness, hue</b> are the three dials of OKLCH, the colour model the palette is built in. Lightness runs from 0, black, to 1, white. Colourfulness is how far from gray: 0 is gray, these pastels are 0.06 to 0.09, and a vivid colour is 0.15 or more. Hue is an angle round the colour wheel: about 30 is red, 90 yellow, 150 green, 200 a green-blue, 260 blue, 310 purple.</li>
<li><b>Distance</b> between two colours (the tables below) is measured in a colour space called OKLab, times 100: under 5 is hard to tell apart, 10 or more is clearly different.</li>
<li>A <b>simulation</b> is a calculation of how a colour looks with one kind of colour blindness: protan and deutan are the two red-green kinds, tritan is the rare blue-yellow kind. These use the complete form of each kind, which is the worst case. Most colourblind people have a partial form, so what you see is probably better than these columns say.</li>
<li><b>For comparison, sorbet's text today</b> is <code>${TODAY.text}</code>: ${lchOf(TODAY.text)}, a dark gray, Lc ${f0(todayLc)} on today's page. Sorbet's "muted" text today is Lc ${f0(apca("#5f5a52", TODAY.page))} and its "subtle" text Lc ${f0(apca("#777168", TODAY.page))}, which you already read every day as secondary text in the lab apps.</li>
</ul>

<h2>1 · The palette</h2>
<p>Three independent proposals and three judges landed on the same jobs for the colours. Today's page, <code>${TODAY.page}</code>, measures colourfulness ${f3(C(TODAY.page))}: a neutral off-white, not cream. This cream is ${f3(C(P.cream))}.</p>
<div class="sw">
${[["cream", "Cream", "the page"], ["surface", "Milk", "cards and fields"], ["lilac", "Lilac", "primary: the main button"], ["blush", "Blush", "secondary"], ["butter", "Butter", "accent"], ["robin", "Robin's egg", "success, plus decoration"]].map(([k, n, j]) => `<div style="background:${P[k]}"><b>${n}</b><span>${P[k]}</span><span>${lchOf(P[k]).replace(/ · /g, "</span><span>")}</span><span>${j}</span></div>`).join("\n")}
</div>
<h3>Decided so far. Say if you disagree.</h3>
<ul>
<li><b>Lilac leads (you confirmed this on ${DATE}).</b> It replaces robin's egg as sorbet's lead colour: today robin's egg (<code>${TODAY.primary}</code>) is the primary and lilac is not in the theme at all. The review moved lilac to the front because it stands furthest off the cream page for typical vision and in both red-green simulations (${f0(deltaE(P.lilac, P.cream))}, against ${f0(Math.max(...["blush", "butter", "robin"].map((k) => deltaE(P[k], P.cream))))} or less for the others), and because robin's egg nearly disappears against cream under the protan simulation (${f0(deltaE(P.robin, P.cream, "protan"))}) and is hard to tell from blush under deutan (${f0(deltaE(P.robin, P.blush, "deutan"))}). Under the rare tritan simulation it is the other way round: robin's egg (${f0(deltaE(P.robin, P.cream, "tritan"))}) and blush (${f0(deltaE(P.blush, P.cream, "tritan"))}) stand off the page slightly more than lilac (${f0(deltaE(P.lilac, P.cream, "tritan"))}). Robin's egg stays in the palette as the success colour and as decoration.</li>
<li><b>No colour means something by itself.</b> Blush and robin's egg lose most of their colour in the red-green simulations: colourfulness drops from ${f3(C(P.blush))} and ${f3(C(P.robin))} to ${keptRow(P.blush).slice(0, 1).map(f3)} and ${keptRow(P.robin).slice(0, 1).map(f3)} under protan (gray), and to ${f3(keptRow(P.blush)[1])} and ${f3(keptRow(P.robin)[1])} under deutan (a faint tint). Lilac and butter keep theirs (${f3(keptRow(P.lilac)[0])} and ${f3(keptRow(P.butter)[0])} under protan). So a status or a selected state always carries an icon, a word or a position as well.</li>
<li><b>Danger will look gentle.</b> With only pastels, a delete button is blush with an icon and the word, not today's solid red. Sheet 2 shows it.</li>
<li><b>Button labels are 16px semi-bold</b> (you chose this; sorbet's are 14px today). A pastel button caps how much contrast its label can have, so the bigger type is the lever.</li>
<li><b>Edges are the halo with no line</b> (E2), and <b>dark mode uses the rim edge with full-strength pastels</b>. Both are on <a href="edges.html">sheet 2</a>.</li>
<li><b>One ink is the anchor.</b> The darker label shade, the lighter secondary shade and the placeholder shade are all worked out from the ink you pick, so changing your mind later is one value.</li>
</ul>
<h3>How far apart the colours sit</h3>
<p>Two things to notice. A milk card is only about ${f0(deltaE(P.surface, P.cream))} from the cream page, so a card needs an edge to be seen at all, which is what sheet 2 is about. And butter is only ${f0(Math.min(...sepRow(P.butter, P.cream)))} to ${f0(Math.max(...sepRow(P.butter, P.cream)))} from the page for everyone, so it is used small.</p>
<div class="tw"><table><tr><th>pair</th><th>typical</th><th>protan</th><th>deutan</th><th>tritan</th></tr>${sepTable.map(([n, r]) => `<tr><td>${n}</td>${r.map(td).join("")}</tr>`).join("")}</table></div>
<p>None of this affects reading: text contrast comes from brightness. It means a button's colour will not tell you which button it is, so the label, an icon and the position carry that.</p>

<h2 id="try">2 · Try an ink on a sample card</h2>
<p>This card is drawn in the ink the slider is set to, plus three shades worked out from it: a darker one for headings and button labels (fixed at lightness ${LABEL_L.toFixed(2)}, because a pastel button is darker than the page and its label needs the help), a lighter one for the "updated" and hint lines, and a lighter one still for the placeholder in the search box. The type sizes are sorbet's real ones. The card is a shade lighter than the page, so text on it measures about 4 Lc higher than the same ink on the bare page; the bar at the bottom prints both.</p>
<div class="opts" role="group" aria-label="Paragraph type"><span>Paragraph type. A lighter ink stays readable for longer if the type is a little bigger or heavier.</span>
<button type="button" data-ty="1rem,400" aria-pressed="true">16px regular (sorbet today)</button>
<button type="button" data-ty="1rem,500" aria-pressed="false">16px medium</button>
<button type="button" data-ty="1.125rem,400" aria-pressed="false">18px regular</button></div>
<div class="opts" role="group" aria-label="Button label type"><span>Button labels. A pastel button caps how much contrast its label can have: even pure black only reaches Lc ${f0(blackOn.lilac)} on this lilac and ${f0(blackOn.blush)} on this blush. By the guidance a 14px semi-bold label wants about 75 and a 16px bold one 60, so a bigger or bolder label is the lever.</span>
<button type="button" data-bt="1rem,600" aria-pressed="true">16px semi-bold (your choice)</button>
<button type="button" data-bt=".875rem,600" aria-pressed="false">14px semi-bold (sorbet today)</button>
<button type="button" data-bt=".875rem,700" aria-pressed="false">14px bold</button></div>
${mock("e2", "live")}

<h3>A longer passage, on the bare page</h3>
<p class="read">${PASSAGE}</p>
<h3>The same passage on a card</h3>
<p class="read card">${PASSAGE}</p>

<h2>3 · Do these look different to you?</h2>
<p>Six inks at the same lightness (${PICK.L.toFixed(3)}): the four candidates, a plain gray, and sorbet's text today. To typical vision A is a purple, B a blue, P a pinker purple and C a warm brown. The simulations predict that with red-green colour blindness A, B and P look like nearly the same dark blue and only C stands apart; with the blue-yellow kind A, C and P merge instead and B stands apart. <b>Your answer (${DATE}):</b> A and B look similar but you can tell them apart; P and G are very close; as swatches all six differ, as text those two pairs could be swapped without you noticing. That matches the deutan column of the table below.</p>
<div class="strip">
${strip.map((s) => `<div style="--c:${s.hex}"><i></i><b>${s.label} · ${esc(s.name)}</b><span>Sear the thighs until deep golden.</span><code>${s.hex}</code></div>`).join("\n")}
</div>
<div class="tw"><table><tr><th>distance between</th><th>typical</th><th>protan</th><th>deutan</th><th>tritan</th></tr>
${[["A", "B"], ["A", "P"], ["A", "C"], ["B", "C"]].map(([a, b]) => `<tr><td>${a} and ${b}</td>${inkPair(a, b).map(td).join("")}</tr>`).join("")}
${strip.slice(0, 4).map((s) => `<tr><td>${s.label} and gray</td>${fromGray(s.hex).map(td).join("")}</tr>`).join("")}
<tr><td>T and gray</td>${fromGray(TODAY.text).map(td).join("")}</tr></table></div>
<p>"Gray" in the last five rows is a gray of the same lightness, so read them as "how far from gray": cocoa, your ink, is ${f1(fromGray(pickHex)[0])} from gray for typical vision and ${f1(fromGray(pickHex)[1])}, ${f1(fromGray(pickHex)[2])} and ${f1(fromGray(pickHex)[3])} under the three simulations, the only one of the four that stays above 5 in every column. Aubergine drops to ${f1(fromGray(inkAt(fam.A, PICK.L))[3])} under tritan and plum to ${f1(fromGray(inkAt(fam.P, PICK.L))[2])} under deutan. Today's text is ${f1(fromGray(TODAY.text)[0])}: a gray.</p>

<h3>The ladders</h3>
<p>Aubergine and cocoa, each from dark to light on the cream page. Tap a sample to load it into the slider. The first row is sorbet's text today, for scale. The tag at the end of each caption says what that step is strong enough for by the guidance above, on the cream page. A difference of 1 or 2 in Lc between the two families means nothing; compare steps.</p>
<div class="spec" style="--c:${TODAY.text};cursor:default"><span class="cap"><b>Today</b> · ${TODAY.text} · lightness ${hexToOklch(TODAY.text).l.toFixed(2)} · colourfulness ${f3(C(TODAY.text))} (a dark gray) · Lc&nbsp;${f1(todayOnCream)} on this cream · old&nbsp;rule&nbsp;${wcag(TODAY.text, P.cream).toFixed(2)}:1 (passes) <i>${band(todayOnCream)}</i></span>${SAMPLE}</div>
${ladders.map((f) => `<div class="fam"><h3>${f.id} · ${esc(f.name)} <code>hue ${f.hue}° · colourfulness ${f.chroma.toFixed(2)}</code></h3><p>${f.id === "A" ? `Close to the lilac's own hue (${f.hue} against ${f0(hexToOklch(P.lilac).h)}) taken dark, so a label on the lilac button is a dark shade of the button's own colour. Under the red-green simulations it reads as a dark blue (${simulate(inkAt(f, PICK.L), "protan")} and ${simulate(inkAt(f, PICK.L), "deutan")}, colourfulness ${f3(keptRow(inkAt(f, PICK.L))[0])} and ${f3(keptRow(inkAt(f, PICK.L))[1])}). Under the rare tritan kind it goes nearly gray (${f3(keptRow(inkAt(f, PICK.L))[2])}).` : `The one ink on the orange-brown side of the wheel (hue ${f.hue}, against the cream's ${f0(hexToOklch(P.cream).h)}). It keeps most of its colourfulness in all three simulations: ${f3(C(inkAt(f, PICK.L)))} becomes ${keptRow(inkAt(f, PICK.L)).map(f3).join(" / ")}. A violet link stands ${f0(deltaE(LINK, inkAt(f, PICK.L)))} away from cocoa text but only ${f0(deltaE(LINK, inkAt(fam.A, PICK.L)))} from aubergine, where the underline would have to do the work.`} Every step passes the old 4.5:1 rule down to ${lastPass(f).id}.</p>${f.steps.map((s) => specimen(s, f)).join("")}</div>`).join("\n")}

<h2>4 · The same ink on each pastel</h2>
<p>A pastel is darker than the cream page, so text on it has less contrast. The first line of each tile is the button-label shade at the label size you chose above; the second is the paragraph ink, which is not meant to sit on a full-strength pastel (paragraphs inside a status box sit on a pale wash instead, as in the card above).</p>
<div class="fillgrid">
${FILLS.map((k) => `<div class="f-${k}" style="background:${P[k]}"><b>${esc(NAMES[k])} button label</b><span>Paragraph ink on the same fill</span><code data-lc="${k}"></code></div>`).join("\n")}
</div>

<h2>5 · Edges, the three treatments</h2>
<p>You chose E2. <a href="edges.html">Sheet 2</a> shows it across real states and in dark mode, so this section is only the record of the three. None uses a gray or black line. The edge colour round cards and fields is a caramel, <code>#a16e32</code>: the cream taken darker and a little toward orange (hue ${f0(hexToOklch("#a16e32").h)} against the cream's ${f0(hexToOklch(P.cream).h)}). The edge of a button is its own colour taken darker, for example <code>${DP.lilac}</code> under the lilac button. Checkboxes and switches keep a firm ring in a darker lilac, <code>${SH.lilac}</code>, in all three, because a box or a switch has no text inside it and its outline is the only thing showing where it is. Only the card and the buttons change between the three treatments; the field changes only in E3; checkboxes, switches and the divider lines are the same in all three.</p>
${EDGES.map((e) => `<p class="edgehead"><b>${e.id} · ${esc(e.name)}</b><br>${esc(e.desc)}</p>${mock(e.id.toLowerCase(), e.id.toLowerCase(), false)}`).join("\n")}

<h2>What happens next</h2>
<ul>
<li>The anchor ink is fixed: <code>${pickHex}</code>.</li>
<li>Sheet 2 (<a href="edges.html">edges and dark mode</a>) settles the edge recipe in both modes. The dark page takes the ink's own hue.</li>
<li>Then the refactor itself, on a branch. The sorbet theme moves to a legibility rule: text must reach the Lc you settle on here instead of the 4.5:1 ratio, and the rules that forced deep buttons and outlines go. The other four themes stay exactly as they are (buylist, which your friend reads, runs on the ocean theme).</li>
<li>Behind this page, in the same folder: <a href="values.json">values.json</a> has every number printed here; <a href="workflow-result.json">workflow-result.json</a> has the full findings of the first twelve agents.</li>
</ul>

<div id="pick" role="group" aria-label="Ink picker"><button type="button" id="mini" aria-expanded="true">hide</button><div class="in">
  <div class="fb">${FAM.filter((f) => f.id !== "P").map((f) => `<button type="button" data-f="${f.id}" aria-pressed="${f.id === PICK.family}">${f.id} ${esc(f.short)}</button>`).join("")}<a href="#try">↑ card</a></div>
  <div class="rowl"><label for="sl">Lightness</label><button type="button" data-nudge="sl,-0.005" aria-label="Lightness down one notch">−</button><input type="range" id="sl" min="0.28" max="0.66" step="0.005" value="${PICK.L}"><button type="button" data-nudge="sl,0.005" aria-label="Lightness up one notch">+</button><span id="vl"></span></div>
  <div class="rowl"><label for="sc">Colourfulness</label><button type="button" data-nudge="sc,-0.005" aria-label="Colourfulness down one notch">−</button><input type="range" id="sc" min="0" max="0.14" step="0.005" value="${pickFam.chroma}"><button type="button" data-nudge="sc,0.005" aria-label="Colourfulness up one notch">+</button><span id="vc"></span></div>
  <div class="ro"><div class="code"><span id="code"></span><button type="button" id="copy">copy</button></div><div id="ro"></div></div>
</div></div>
<script>
${readFileSync(new URL("./sheetcolour.js", import.meta.url), "utf8")}
(function(){
  var FAM=${JSON.stringify(Object.fromEntries(FAM.map((f) => [f.id, { hue: f.hue, chroma: f.chroma }])))};
  var BG=${JSON.stringify({ cream: P.cream, card: P.surface, ...Object.fromEntries(FILLS.map((k) => [k, P[k]])) })};
  var FILLS=${JSON.stringify(FILLS)},NAMES=${JSON.stringify(SHORT)},BANDS=${JSON.stringify(BANDS)},LABEL_L=${LABEL_L},MUTED=${MUTED_DL},SUBTLE=${SUBTLE_DL};
  var st={f:${JSON.stringify(PICK.family)},L:${PICK.L},C:${pickFam.chroma}};
  var root=document.documentElement,sl=document.getElementById('sl'),sc=document.getElementById('sc'),ro=document.getElementById('ro'),codeEl=document.getElementById('code'),code='';
  function bandOf(lc){for(var i=0;i<BANDS.length;i++){if(lc>=BANDS[i][0])return BANDS[i][1];}}
  function hexAt(L){return SheetColour.oklchToHex(L,st.C,FAM[st.f].hue);}
  function worst(t,b){var w=SheetColour.apca(t,b);SheetColour.KINDS.forEach(function(k){w=Math.min(w,SheetColour.apca(SheetColour.simulate(t,k),SheetColour.simulate(b,k)));});return w;}
  function apply(){
    var hex=hexAt(st.L),strong=hexAt(Math.min(st.L,LABEL_L)),shown=SheetColour.chroma(hex),clipped=st.C-shown>0.006;
    root.style.setProperty('--ink',hex);root.style.setProperty('--ink-strong',strong);
    root.style.setProperty('--ink-muted',hexAt(st.L+MUTED));root.style.setProperty('--ink-subtle',hexAt(st.L+SUBTLE));
    var lc=SheetColour.apca(hex,BG.cream),lcCard=SheetColour.apca(hex,BG.card),low=1e9,lowK='',lowW=1e9,lowWK='';
    FILLS.forEach(function(k){var lab=SheetColour.apca(strong,BG[k]),w=worst(strong,BG[k]),body=SheetColour.apca(hex,BG[k]);var el=document.querySelector('[data-lc="'+k+'"]');if(el)el.textContent='label Lc '+lab.toFixed(0)+' (worst simulation '+w.toFixed(0)+') · paragraph ink Lc '+body.toFixed(0);if(lab<low){low=lab;lowK=k;}if(w<lowW){lowW=w;lowWK=k;}});
    document.getElementById('vl').textContent=st.L.toFixed(3);document.getElementById('vc').textContent=shown.toFixed(3);
    code=hex+' '+st.f+' L'+st.L.toFixed(3)+' C'+shown.toFixed(3)+' hue'+FAM[st.f].hue;codeEl.textContent=code;
    ro.innerHTML='cream page Lc '+lc.toFixed(0)+' · card Lc '+lcCard.toFixed(0)+' · old rule '+(Math.floor(SheetColour.wcag(hex,BG.cream)*10)/10).toFixed(1)+':1<br>'+bandOf(lc)+(clipped?' · colour at the screen limit':'')+'<br>weakest label Lc '+low.toFixed(0)+' ('+NAMES[lowK]+'), '+lowW.toFixed(0)+' in the worst simulation ('+NAMES[lowWK]+')';
    document.querySelectorAll('#pick [data-f]').forEach(function(b){b.setAttribute('aria-pressed',String(b.dataset.f===st.f));});
  }
  sl.addEventListener('input',function(){st.L=+sl.value;mark(null);apply();});
  sc.addEventListener('input',function(){st.C=+sc.value;apply();});
  document.querySelectorAll('#pick [data-f]').forEach(function(b){b.addEventListener('click',function(){st.f=b.dataset.f;mark(null);apply();});});
  function mark(el){document.querySelectorAll('button.spec').forEach(function(o){o.setAttribute('aria-pressed',String(o===el));});}
  document.querySelectorAll('button.spec').forEach(function(b){b.addEventListener('click',function(){st.f=b.dataset.fam;st.L=+b.dataset.l;st.C=FAM[st.f].chroma;sl.value=st.L;sc.value=st.C;mark(b);apply();});});
  document.querySelectorAll('[data-nudge]').forEach(function(b){b.addEventListener('click',function(){var t=b.dataset.nudge.split(','),el=document.getElementById(t[0]);el.value=(+el.value+ +t[1]).toFixed(3);el.dispatchEvent(new Event('input'));});});
  document.getElementById('mini').addEventListener('click',function(){var p=document.getElementById('pick'),m=p.classList.toggle('min');this.textContent=m?'show sliders':'hide';this.setAttribute('aria-expanded',String(!m));});
  (function(){function w(wt){var s=document.createElement('span');s.style.cssText='position:absolute;visibility:hidden;white-space:nowrap;font:'+wt+' 16px var(--font)';s.textContent='Sear the thighs skin-side down until deep golden';document.body.appendChild(s);var x=s.getBoundingClientRect().width;s.remove();return x;}
    if(Math.abs(w(500)-w(400))<0.5){var b=document.querySelector('[data-ty="1rem,500"]');if(b)b.textContent='16px medium (this device has no medium weight, so it looks the same)';}})();
  function group(attr,vars){document.querySelectorAll('['+attr+']').forEach(function(b){b.addEventListener('click',function(){var t=b.getAttribute(attr).split(',');root.style.setProperty(vars[0],t[0]);root.style.setProperty(vars[1],t[1]);document.querySelectorAll('['+attr+']').forEach(function(o){o.setAttribute('aria-pressed',String(o===b));});});});}
  group('data-ty',['--body-size','--body-weight']);group('data-bt',['--btn-size','--btn-weight']);
  document.getElementById('copy').addEventListener('click',function(){var btn=this;function done(){btn.textContent='copied';setTimeout(function(){btn.textContent='copy';},1200);}
    if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(code).then(done,function(){window.prompt('Copy this:',code);});}else{window.prompt('Copy this:',code);}});
  apply();
})();
</script>
</body></html>`;
writeFileSync(join(outDir, "index.html"), html);
const r1 = (v) => +v.toFixed(1), r3 = (v) => +v.toFixed(3);
writeFileSync(join(outDir, "values.json"), JSON.stringify({
  palette: P, today: TODAY, link: LINK, focus: FOCUS, edgeColour: "#a16e32", shade: SH, deep: DP,
  pick: { family: PICK.family, L: PICK.L, chroma: pickFam.chroma, hue: pickFam.hue, hex: pickHex, labelInk: labelHex, muted: inkAt(pickFam, PICK.L + MUTED_DL), subtle: inkAt(pickFam, PICK.L + SUBTLE_DL), lcOnCream: r1(apca(pickHex, P.cream)), lcOnCard: r1(apca(pickHex, P.surface)), wcagOnCream: +wcag(pickHex, P.cream).toFixed(2), labelLcOnFills: Object.fromEntries(FILLS.map((k) => [k, { typical: r1(apca(labelHex, P[k])), worstSimulation: r1(lcWorst(labelHex, P[k])) }])) },
  swatches: Object.fromEntries(Object.entries(P).map(([k, hex]) => { const o = hexToOklch(hex); return [k, { hex, L: +o.l.toFixed(3), C: r3(o.c), hue: r1(o.h), keptUnder: Object.fromEntries(CVDS.map((d, i) => [d, r3(keptRow(hex)[i])])) }]; })),
  distances: { columns: ["typical", ...CVDS], rows: Object.fromEntries(sepTable.map(([n, r]) => [n, r.map(r1)])) },
  strip: strip.map((s) => ({ ...s, fromGray: fromGray(s.hex).map(r1), keptUnder: keptRow(s.hex).map(r3) })),
  inkPairs: Object.fromEntries([["A", "B"], ["A", "P"], ["A", "C"], ["B", "C"]].map(([a, b]) => [`${a}-${b}`, inkPair(a, b).map(r1)])),
  bands: BANDS, blackOnFills: Object.fromEntries(Object.entries(blackOn).map(([k, v]) => [k, r1(v)])),
  ladders: ladders.map((f) => ({ id: f.id, name: f.name, hue: f.hue, chroma: f.chroma, steps: f.steps.map((s) => ({ id: s.id, L: s.L, hex: s.hex, chromaShown: r3(s.kept), lcOnCream: r1(s.lc), lcOnCreamWorstSimulation: r1(s.worst), lcOnCard: r1(s.onMilk), wcagOnCream: +s.ratio.toFixed(2), band: s.band })) })),
}, null, 1));
console.log("wrote", join(outDir, "index.html"), "| pick", pickHex, "label", labelHex);
