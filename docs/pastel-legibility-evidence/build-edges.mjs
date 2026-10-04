// build-edges.mjs <out-dir> — sample sheet 2: the halo edge across real states, and dark mode.
// Every colour is derived here with colorkit.mjs from four inputs: the palette, the picked ink,
// the caramel edge colour and the dark rim colour. The CSS below uses ONLY the custom properties
// set in the two theme blocks, so those blocks are the draft of sorbet's future tokens.
import { writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { oklchToHex, hexToOklch, apca } from "./colorkit.mjs";

const outDir = process.argv[2]; const builtAt = process.argv[3] ?? ""; mkdirSync(outDir, { recursive: true });
const P = { cream: "#fef4dc", milk: "#fffbf1", lilac: "#dac5fc", blush: "#f9c3c6", butter: "#f5e3a2", robin: "#a6edee" };
const INK = { hue: 60, chroma: 0.10, L: 0.395 };   // cocoa #693800, the owner's pick 2026-10-03 (colourfulness clips to the screen's limit, 0.092)
const ink = (L) => oklchToHex({ l: L, c: INK.chroma, h: INK.hue });
const FILLS = ["lilac", "blush", "butter", "robin"];
const rgb = (hex) => { const n = parseInt(hex.slice(1), 16); return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`; };
const shade = (hex, d = 0.14) => { const o = hexToOklch(hex); return oklchToHex({ l: o.l - d, c: o.c * 1.25, h: o.h }); };
const deep = (hex) => oklchToHex({ l: 0.55, c: 0.12, h: hexToOklch(hex).h });
const halo = (hex) => oklchToHex({ l: +(process.env.HL_L ?? 0.70), c: +(process.env.HL_C ?? 0.14), h: hexToOklch(hex).h });
const soften = (hex) => { const o = hexToOklch(hex); return oklchToHex({ l: o.l - 0.04, c: o.c, h: o.h }); };
const dk = (l, c, h = 308) => oklchToHex({ l, c, h });
const COCOA_DARK = { page: dk(0.206, 0.03, 60), card: dk(0.276, 0.033, 60), raised: dk(0.34, 0.036, 60), well: dk(0.155, 0.025, 60) };
const T = {
  light: { page: P.cream, card: P.milk, raised: P.milk, well: "#f7ecd1", ink: ink(INK.L), strong: ink(0.30), muted: ink(INK.L + 0.08), subtle: ink(INK.L + 0.14) },
  dark: { page: dk(0.206, 0.035), card: dk(0.276, 0.04), raised: dk(0.34, 0.045), well: dk(0.155, 0.03), ink: "#f3e7ce", strong: "#f3e7ce", muted: "#d7c9ae", subtle: "#b3a58d" },
};
const ONFILL = ink(0.30), RING = shade(P.lilac), FOCUS = "#8e6ac7", DANGER = "#d77784";
const fillVars = (soft) => FILLS.map((k) => { const f = soft ? soften(P[k]) : P[k]; return `--${k}:${f};--${k}-rgb:${rgb(f)};--${k}-sh:${shade(P[k])};--${k}-dp:${rgb(deep(P[k]))};--${k}-hl:${rgb(halo(P[k]))}`; }).join(";");
const lc = (t, b) => Math.abs(apca(t, b)).toFixed(0);

const ICON = { ok: `<span class="ic ic-ok" aria-hidden="true">✓</span>`, warn: `<span class="ic ic-warn" aria-hidden="true">!</span>`, bad: `<span class="ic ic-bad" aria-hidden="true">✕</span>`, info: `<span class="ic ic-info" aria-hidden="true">i</span>` };
const btnRow = (fill, name) => `<div class="states"><span class="btn f-${fill}">${name}</span><span class="btn f-${fill} is-hover">Hover</span><span class="btn f-${fill} is-press">Pressed</span><span class="btn f-${fill} is-focus">Focus</span><span class="btn f-${fill} is-off">Disabled</span></div>`;

const measPath = join(outDir, "edges-measure.json");
const MEAS = existsSync(measPath) ? JSON.parse(readFileSync(measPath, "utf8")) : null;
const MK = ["Light", "Dark", "Dark, aubergine page"];
const cell = (r) => `<td class="n">${r.weakest.strength.toFixed(0)} <small>(${r.weakest.worstSim.toFixed(0)})</small></td>`;
const measTable = MEAS ? `<table class="meas"><tr><th>Element</th><th class="n">Light</th><th class="n">Dark</th><th class="n">Dark, aubergine page</th></tr>${MEAS.Light.map((r, i) => `<tr><td>${r.name} <small>on ${r.on}</small></td>${MK.map((k) => cell(MEAS[k][i])).join("")}</tr>`).join("")}</table>` : "<p class=\"note\">Not measured yet.</p>";
const softLab = FILLS.map((k) => `${k} ${lc(ONFILL, P[k])} to ${lc(ONFILL, soften(P[k]))}`).join(", ");
const html = `<!doctype html>
<html lang="en" class="t-light d1 pg-coc"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Sorbet pastel — edges and dark mode (2026-10-03)</title>
<style>
/* ===== draft tokens: light ===== */
.t-light{color-scheme:light;--page:${T.light.page};--card:${T.light.card};--raised:${T.light.raised};--well:${T.light.well};
--ink:${T.light.ink};--ink-strong:${T.light.strong};--ink-muted:${T.light.muted};--ink-subtle:${T.light.subtle};--on-fill:${ONFILL};
--e:161 110 50;--ring:${RING};--focus:${FOCUS};--danger-rim:${DANGER};--divider:#e3d2b0;--wash:50%;--thumb:${P.milk};
--edge-card:0 0 6px 1px rgb(var(--e) / ${process.env.CARD_A ?? ".38"}),0 2px 4px rgb(var(--e) / .18),0 10px 28px -8px rgb(var(--e) / .26);
--edge-float:0 0 10px 2px rgb(var(--e) / .44),0 4px 8px rgb(var(--e) / .20),0 18px 44px -10px rgb(var(--e) / .36);
--edge-field:inset 0 0 0 1px rgb(129 91 31 / .24),inset 0 2px 3px rgb(129 91 31 / .14),0 1px 0 rgb(255 255 255 / .9);
--edge-well:inset 0 1px 3px rgb(var(--e) / .30),inset 0 0 0 1px rgb(var(--e) / .12);--field:var(--card);
${fillVars(false)}}
/* ===== draft tokens: dark. A shadow cannot show on a dark page, so the edge is LIGHT: a rim or a glow. ===== */
.t-dark{color-scheme:dark;--page:${T.dark.page};--card:${T.dark.card};--raised:${T.dark.raised};--well:${T.dark.well};
--ink:${T.dark.ink};--ink-strong:${T.dark.strong};--ink-muted:${T.dark.muted};--ink-subtle:${T.dark.subtle};--on-fill:${ONFILL};
--rim:239 230 255;--ring:${RING};--focus:${FOCUS};--danger-rim:${DANGER};--divider:rgb(var(--rim) / .14);--wash:20%;--thumb:${P.milk};
--edge-field:inset 0 1px 3px rgb(5 2 10 / .7),inset 0 0 0 1px rgb(var(--rim) / .34),0 1px 0 rgb(var(--rim) / .12);
--edge-well:inset 0 1px 3px rgb(5 2 10 / .7),inset 0 0 0 1px rgb(var(--rim) / .14);--field:var(--well);
${fillVars(false)}}
.t-dark.soft{${fillVars(true)}}
.t-dark.pg-coc{--page:${COCOA_DARK.page};--card:${COCOA_DARK.card};--raised:${COCOA_DARK.raised};--well:${COCOA_DARK.well};--rim:254 244 220}
.t-dark.d1{--edge-card:inset 0 1px 0 rgb(var(--rim) / .22),0 0 0 1px rgb(var(--rim) / .18),0 10px 28px -6px rgb(5 2 10 / .7);
--edge-float:inset 0 1px 0 rgb(var(--rim) / .28),0 0 0 1px rgb(var(--rim) / .28),0 18px 44px -10px rgb(5 2 10 / .8)}
.t-dark.d2{--edge-card:inset 0 1px 0 rgb(var(--rim) / .22),0 0 7px 1px rgb(var(--rim) / .22),0 10px 28px -6px rgb(5 2 10 / .7);
--edge-float:inset 0 1px 0 rgb(var(--rim) / .28),0 0 12px 2px rgb(var(--rim) / .30),0 18px 44px -10px rgb(5 2 10 / .8)}
/* ===== page ===== */
*{box-sizing:border-box}
button,input,label{touch-action:manipulation}
html{background:var(--page);-webkit-text-size-adjust:100%;text-size-adjust:100%;--font:ui-rounded,"SF Pro Rounded","Nunito","Comfortaa",system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;--mono:ui-monospace,"SF Mono",Menlo,Consolas,monospace}
body{margin:0 auto;max-width:60rem;padding:0 16px 80px;background:var(--page);color:var(--ink);font:16px/1.5 var(--font)}
h1{font-size:1.6rem;line-height:1.2;margin:1rem 0 .2rem;color:var(--ink-strong)}
h2{font-size:1.25rem;margin:2.6rem 0 .3rem;color:var(--ink-strong)}
p,li{max-width:44rem} ul{padding-left:1.2rem;margin:.3rem 0}
.note{color:var(--ink-muted);font-size:.875rem;margin:.2rem 0 .8rem}
code,td.n{font-family:var(--mono);font-size:.8rem}
#bar{position:sticky;top:0;z-index:9;margin:0 -16px;padding:8px 16px;background:var(--page);box-shadow:0 6px 10px -8px rgb(0 0 0 / .35);display:flex;flex-wrap:wrap;gap:6px 14px;align-items:center}
#bar .grp{display:flex;gap:6px;align-items:center;font-size:.8rem;font-weight:600}
#bar button{font:600 .82rem var(--font);min-height:40px;padding:0 14px;border:0;border-radius:99px;background:var(--card);color:var(--ink);box-shadow:var(--edge-field);cursor:pointer;-webkit-appearance:none;appearance:none}
#bar button[aria-pressed="true"]{box-shadow:inset 0 0 0 2px var(--ink)}
#bar button[aria-pressed="true"]::before{content:"✓ "}
.t-light #bar .darkonly{display:none}
/* ===== containers ===== */
.card{background:var(--card);border-radius:22px;padding:18px;box-shadow:var(--edge-card);border:1px solid transparent}
.card + .card{margin-top:22px}
.well{background:var(--well);border-radius:16px;padding:14px;box-shadow:var(--edge-well);margin:.8rem 0}
.raised{background:var(--raised);border-radius:16px;padding:14px;box-shadow:var(--edge-card)}
.pop{background:var(--raised);border-radius:16px;padding:8px;box-shadow:var(--edge-float);width:min(15rem,80%);margin:-14px 0 0 28px;position:relative}
.pop div{padding:9px 12px;border-radius:10px}
.h{font-size:1.15rem;font-weight:600;color:var(--ink-strong);margin:0 0 .3rem}
.row{display:flex;flex-wrap:wrap;gap:14px;align-items:center;margin:.8rem 0}
.states{display:flex;flex-wrap:wrap;gap:14px;margin:1rem 0}
/* ===== fills: the halo is the fill's own colour, deeper ===== */
${FILLS.map((k) => `.f-${k}{--f:var(--${k});--f-rgb:var(--${k}-rgb);--sh:var(--${k}-sh);--dp:var(--${k}-dp);--hl:var(--${k}-hl)}`).join("")}
.btn,.chip{display:inline-flex;align-items:center;gap:6px;min-height:44px;padding:0 18px;border-radius:999px;font-weight:600;background:var(--f);color:var(--on-fill);border:1px solid transparent;
--state:0 0 0 0 transparent;box-shadow:var(--state),var(--rest);transition:box-shadow .12s,translate .12s}
.chip{min-height:30px;padding:0 12px;font-size:.875rem}
.t-light .btn,.t-light .chip{--rest:0 0 4px 1px rgb(var(--hl) / ${process.env.HL_A ?? ".70"}),0 1px 2px rgb(var(--hl) / ${process.env.HL_B ?? ".60"}),0 4px 10px -2px rgb(var(--dp) / .26)}
.t-light .btn.is-hover{--rest:0 0 6px 2px rgb(var(--hl) / .75),0 2px 4px rgb(var(--hl) / .60),0 9px 18px -3px rgb(var(--dp) / .32);translate:0 -1px}
.t-light .btn.is-press{--rest:0 0 2px 1px rgb(var(--hl) / .80),inset 0 1px 3px rgb(var(--dp) / .38)}
.t-dark.d1 .btn,.t-dark.d1 .chip{--rest:inset 0 1px 0 rgb(255 255 255 / .5),0 0 0 1px rgb(var(--f-rgb) / .35),0 0 14px -2px rgb(var(--f-rgb) / .35)}
.t-dark.d2 .btn,.t-dark.d2 .chip{--rest:inset 0 1px 0 rgb(255 255 255 / .5),0 0 10px 0 rgb(var(--f-rgb) / .42)}
.t-dark .btn.is-hover{--rest:inset 0 1px 0 rgb(255 255 255 / .5),0 0 0 1px rgb(var(--f-rgb) / .45),0 0 20px -1px rgb(var(--f-rgb) / .5);translate:0 -1px}
.t-dark .btn.is-press{--rest:inset 0 2px 4px rgb(var(--dp) / .55),0 0 6px -2px rgb(var(--f-rgb) / .3)}
.btn.is-focus,.btn:focus-visible,.fld:focus-visible,.fld.is-focus,.tab:focus-visible{outline:3px solid var(--focus);outline-offset:2px}
.btn.is-off{background:color-mix(in srgb,var(--f) 45%,var(--card));color:var(--ink-subtle);--rest:inset 0 0 0 1px rgb(var(--dp) / .22)}
.t-dark .btn.is-off{color:var(--ink-muted)}
.btn.quiet{background:var(--card);color:var(--ink-strong);--dp:var(--e,var(--rim));--hl:var(--e,var(--rim))}
.t-light .btn.quiet{--rest:0 0 4px 1px rgb(var(--e) / .42),0 1px 2px rgb(var(--e) / .30),0 4px 10px -2px rgb(var(--e) / .24)}
.t-dark .btn.quiet{background:var(--raised);--rest:inset 0 1px 0 rgb(var(--rim) / .22),0 0 0 1px rgb(var(--rim) / .22)}
.t-dark.d2 .btn.quiet{--rest:inset 0 1px 0 rgb(var(--rim) / .22),0 0 8px 0 rgb(var(--rim) / .26)}
.btn.danger{--state:inset 0 0 0 2px var(--danger-rim)}
/* ===== fields: the edge and the state are separate layers, so a state ADDS to the edge ===== */
.lab{display:block;font-weight:600;font-size:.875rem;margin:.7rem 0 .3rem;color:var(--ink-strong)}
.fld{display:block;width:100%;max-width:24rem;min-height:44px;border:1px solid transparent;border-radius:14px;padding:0 14px;font:inherit;font-size:1rem;color:var(--ink);background:var(--field);
-webkit-appearance:none;appearance:none;--state:0 0 0 0 transparent;box-shadow:var(--state),var(--edge-field)}
.fld::placeholder{color:var(--ink-subtle);opacity:1}
.fld.bad{--state:inset 0 0 0 2px var(--danger-rim)}
.fld:disabled{color:var(--ink-subtle);background:color-mix(in srgb,var(--field) 55%,var(--well));cursor:not-allowed}
.msg{display:flex;align-items:center;gap:6px;font-size:.875rem;margin:.35rem 0 0;color:var(--ink-strong);font-weight:500}
/* ===== unlabelled controls: one firm lilac ring means "you can operate this" ===== */
.ctl{display:flex;flex-wrap:wrap;gap:12px 22px;align-items:center;margin:.9rem 0}.pr{display:inline-flex;align-items:center;gap:9px;white-space:nowrap}.pr.wide{flex:1 1 100%}.pr.wide>span:first-child{flex:0 1 18rem}
.cb,.rd{display:inline-grid;place-items:center;width:24px;height:24px;border-radius:8px;background:var(--field);box-shadow:inset 0 0 0 1.5px var(--ring);font-weight:800;font-size:.95rem;line-height:1;color:var(--on-fill)}
.rd{border-radius:50%}.cb.on,.rd.on{background:var(--lilac)}.rd.on::after{content:"";width:10px;height:10px;border-radius:50%;background:var(--on-fill)}
.sw{display:inline-block;width:46px;height:26px;border-radius:99px;background:var(--well);box-shadow:inset 0 0 0 1.5px var(--ring);position:relative}
.sw i{position:absolute;top:3px;left:3px;width:20px;height:20px;border-radius:50%;background:var(--thumb);box-shadow:0 0 0 1px var(--ring),0 1px 3px rgb(var(--lilac-dp) / .5)}
.sw.on{background:var(--ring)}.sw.on i{left:23px}
.sl{position:relative;height:28px;display:block}.sl b{position:absolute;left:0;right:0;top:10px;height:8px;border-radius:99px;background:var(--well);box-shadow:inset 0 0 0 1px var(--ring)}
.sl u{position:absolute;left:0;top:10px;height:8px;width:58%;border-radius:99px;background:var(--ring)}
.sl i{position:absolute;left:calc(58% - 11px);top:3px;width:22px;height:22px;border-radius:50%;background:var(--thumb);box-shadow:0 0 0 1.5px var(--ring),0 1px 3px rgb(var(--lilac-dp) / .5)}
.pg{display:block;height:10px;border-radius:99px;background:var(--well);box-shadow:var(--edge-well);overflow:hidden}.pg u{display:block;height:100%;width:40%;background:var(--ring);border-radius:99px}
/* ===== selected: a lilac wash, a bar and a heavier weight, never colour alone ===== */
.tabs{display:flex;gap:4px;border-bottom:1px solid var(--divider);margin:.6rem 0}
.tab{padding:10px 14px;border-radius:12px 12px 0 0;color:var(--ink-muted)}
.tab.on{color:var(--ink-strong);font-weight:600;background:color-mix(in srgb,var(--lilac) var(--wash),var(--card));box-shadow:inset 0 -3px 0 var(--ring)}
.list>div{display:flex;justify-content:space-between;gap:12px;padding:10px 12px;border-top:1px solid var(--divider)}
.list>div:first-child{border-top:0}
.list .on{font-weight:600;color:var(--ink-strong);background:color-mix(in srgb,var(--lilac) var(--wash),var(--card));box-shadow:inset 3px 0 0 var(--ring);border-radius:10px}
.list small{color:var(--ink-muted);font-size:.875rem;font-weight:400}
/* ===== statuses: icon shape + the word carry the meaning, the pastel is decoration ===== */
.al{display:flex;gap:10px;align-items:flex-start;padding:12px 14px;border-radius:16px;margin:.7rem 0;background:color-mix(in srgb,var(--f) var(--wash),var(--card));color:var(--ink);border:1px solid transparent;--state:0 0 0 0 transparent}
.t-light .al{box-shadow:var(--state),0 0 5px 1px rgb(var(--hl) / .60),0 1px 2px rgb(var(--hl) / .50)}
.t-dark.d1 .al{box-shadow:var(--state),0 0 0 1px rgb(var(--f-rgb) / .34)}
.t-dark.d2 .al{box-shadow:var(--state),0 0 8px 0 rgb(var(--f-rgb) / .34)}
.al b{color:var(--ink-strong)}.al.danger{--state:inset 0 0 0 2px var(--danger-rim)}
.ic{flex:none;display:inline-grid;place-items:center;width:22px;height:22px;font:800 .8rem/1 var(--font);background:var(--on-fill);color:#fffbf1;margin-top:1px}
.t-dark .al .ic,.t-dark .msg .ic{background:var(--ink);color:var(--page)}
.ic-ok{border-radius:50%}.ic-info{border-radius:6px}
.ic-warn{clip-path:polygon(50% 0,100% 100%,0 100%);align-items:end;padding-bottom:2px;width:24px;height:22px}
.ic-bad{clip-path:polygon(30% 0,70% 0,100% 30%,100% 70%,70% 100%,30% 100%,0 70%,0 30%)}
table{border-collapse:collapse;width:100%;margin:.4rem 0}
th,td{text-align:left;padding:9px 10px 9px 0;border-bottom:1px solid var(--divider)}th{font-size:.8rem;color:var(--ink-muted);font-weight:600}
td.n,th.n{text-align:right;padding-right:0}
table.meas small{color:var(--ink-muted);font-size:.78rem}table.meas td.n{white-space:nowrap}
</style></head>
<body>
<h1>Sorbet pastel: edges and dark mode</h1>
<p class="note">2026-10-03${builtAt ? " " + builtAt : ""} · sample sheet 2 (sheet 1, the text colour, is <a href="./" style="color:inherit">here</a>). Drawn in your ink <code>${T.light.ink}</code> and the halo edge (E2). Nothing in sorbet has changed yet.</p>
<ul>
<li><b>Light mode</b> is in your cocoa. Is there anything whose edge you lose, or anything that still looks like a hard outline?</li>
<li><b>Dark mode</b> opens on what you chose: the cocoa page (<code>${COCOA_DARK.page}</code>), the <b>rim</b> edge (a faint 1px light line plus a lit top edge) and full-strength pastels. Dark text is a cream, <code>${T.dark.ink}</code>. The other options (aubergine page, glow edge, softened pastels) are still on the bar if you want to compare.</li>
</ul>
<div id="bar" role="group" aria-label="Display options">
  <div class="grp">Mode <button type="button" data-set="mode:t-light" aria-pressed="true">Light</button><button type="button" data-set="mode:t-dark" aria-pressed="false">Dark</button></div>
  <div class="grp darkonly">Edge <button type="button" data-set="edge:d1" aria-pressed="true">Rim</button><button type="button" data-set="edge:d2" aria-pressed="false">Glow</button></div>
  <div class="grp darkonly">Pastels <button type="button" data-set="fill:full" aria-pressed="true">Full</button><button type="button" data-set="fill:soft" aria-pressed="false">Softened</button></div>
  <div class="grp darkonly">Dark page <button type="button" data-set="page:coc" aria-pressed="true">Cocoa</button><button type="button" data-set="page:aub" aria-pressed="false">Aubergine</button></div>
</div>

<h2>1 · Boxes inside boxes</h2>
<p class="note">A card on the page, a sunken panel inside it, a raised box inside that, and a menu floating over the lot. The imagefeed admin nests four deep, which is where dark mode fell apart before.</p>
<div class="card" id="m-card"><p class="h">Card on the page</p><p>Paragraph text sits on the card. <span style="color:var(--ink-muted)">Secondary text is this shade,</span> <span style="color:var(--ink-subtle)">and the faintest text is this one.</span></p>
  <div class="well" id="m-well"><p class="h">Sunken panel</p><p>Grouped controls and code blocks sit lower than the card.</p>
    <div class="raised" id="m-raised"><p class="h">Raised box</p><p>Something lifted back up inside the panel.</p></div>
  </div>
  <div class="row"><span class="btn f-lilac">Open menu</span></div>
  <div class="pop" id="m-pop"><div>Rename</div><div style="background:color-mix(in srgb,var(--lilac) var(--wash),var(--raised));font-weight:600;color:var(--ink-strong);box-shadow:inset 3px 0 0 var(--ring)">Move to… (highlighted)</div><div>Duplicate</div></div>
</div>

<h2>2 · Buttons, and what a state does to them</h2>
<p class="note">Hover lifts the button and grows its halo. Pressed drops it and pulls the halo in. The fill never darkens, because every step darker costs the label contrast. Focus is the one deliberately firm edge: a 3px ring that only appears when you tab to something.</p>
<div class="card" id="m-btns">
${btnRow("lilac", "Primary")}${btnRow("blush", "Secondary")}${btnRow("butter", "Accent")}${btnRow("robin", "Success")}
<div class="states"><span class="btn quiet" id="m-quiet">Quiet</span><span class="btn quiet is-hover">Hover</span><span class="btn quiet is-press">Pressed</span><span class="btn quiet is-focus">Focus</span><span class="btn f-blush danger" id="m-danger">${ICON.bad} Delete</span></div>
<p class="note">Quiet replaces today's outlined button. Delete is the secondary pastel plus an octagon icon, the word and a rose rim: it will look gentler than today's solid red, which is the direct cost of a truly pastel palette.</p>
<div class="row"><span class="chip f-lilac">Chip</span><span class="chip f-blush">Chip</span><span class="chip f-butter">Chip</span><span class="chip f-robin">${"✓"} In stock</span></div>
</div>

<p class="note">The same buttons straight on the page, with no card behind them. Butter and robin's egg are the two pastels closest to the cream, so this is their hardest case.</p>
<div class="states" id="m-bare"><span class="btn f-lilac">Primary</span><span class="btn f-blush">Secondary</span><span class="btn f-butter" id="m-bare-butter">Accent</span><span class="btn f-robin" id="m-bare-robin">Success</span><span class="btn quiet" id="m-bare-quiet">Quiet</span></div>

<h2>3 · Fields</h2>
<p class="note">A field has the same fill as the card it sits on, so its edge does all the work. An invalid field adds a rose rim on top of the normal edge, with an icon and words; it never relies on the colour.</p>
<div class="card" id="m-fields">
<label class="lab" for="f1">At rest</label><input class="fld" id="f1" placeholder="chicken, rice, lemon…" autocomplete="off">
<label class="lab" for="f2">With text</label><input class="fld" id="f2" value="Lemon chicken with rice" autocomplete="off">
<label class="lab" for="f3">Focused</label><input class="fld is-focus" id="f3" value="Tab into any field to see this for real" autocomplete="off">
<label class="lab" for="f4">Invalid</label><input class="fld bad" id="f4" value="12 cups" autocomplete="off" aria-invalid="true" aria-describedby="f4m"><p class="msg" id="f4m">${ICON.bad} That is more rice than the pantry holds.</p>
<label class="lab" for="f5">Disabled</label><input class="fld" id="f5" value="Locked while cooking" disabled>
</div>

<h2>4 · Controls with no label of their own</h2>
<p class="note">A checkbox or a switch has no text inside it, so it keeps one firm lilac ring in both modes. On and off differ by the tick or the thumb position and by lightness, never by hue.</p>
<div class="card" id="m-ctl">
<div class="ctl"><span class="pr"><span class="cb on" aria-hidden="true">✓</span>Done</span><span class="pr"><span class="cb" id="m-cb" aria-hidden="true"></span>Not yet</span><span class="pr"><span class="rd on" aria-hidden="true"></span>This one</span><span class="pr"><span class="rd" aria-hidden="true"></span>That one</span></div>
<div class="ctl"><span class="pr"><span class="sw on" aria-hidden="true"><i></i></span>On</span><span class="pr"><span class="sw" id="m-sw" aria-hidden="true"><i></i></span>Off</span></div>
<div class="ctl"><span class="pr wide"><span class="sl" aria-hidden="true"><b></b><u></u><i></i></span>Slider</span></div>
<div class="ctl"><span class="pr wide"><span class="pg" aria-hidden="true"><u></u></span>Progress, 40%</span></div>
</div>

<h2>5 · Selected and current</h2>
<p class="note">The selected tab or row gets a lilac wash, a solid bar and a heavier weight.</p>
<div class="card" id="m-sel">
<div class="tabs"><span class="tab on">This week</span><span class="tab">Pantry</span><span class="tab">Shopping</span></div>
<div class="list"><div><span>Monday <small>· lemon chicken</small></span><small>45 min</small></div><div class="on"><span>Tuesday <small>· selected</small></span><small>30 min</small></div><div><span>Wednesday <small>· leftovers</small></span><small>10 min</small></div></div>
</div>

<h2>6 · Statuses</h2>
<p class="note">The four statuses reuse the four pastels, thinned to a pale wash so a paragraph stays readable on them. Under a red-green simulation the pastels cannot be told apart reliably, so each status carries its own icon shape and its word: a tick in a circle, an exclamation mark in a triangle, a cross in an octagon, an i in a square.</p>
<div class="card" id="m-status">
<div class="al f-robin" id="m-al">${ICON.ok}<div><b>Saved.</b> The plan is stored and the list is updated.</div></div>
<div class="al f-butter">${ICON.warn}<div><b>Running low.</b> Two items will run out before Thursday.</div></div>
<div class="al f-blush danger">${ICON.bad}<div><b>Could not save.</b> The pantry file is locked by another edit.</div></div>
<div class="al f-lilac">${ICON.info}<div><b>Note.</b> Thursday's shop covers the rest of the week.</div></div>
</div>

<h2>7 · A table</h2>
<div class="card" id="m-table">
<table><tr><th>Item</th><th>Where</th><th class="n">Left</th></tr><tr><td>Jasmine rice</td><td>Pantry</td><td class="n">2 cups</td></tr><tr><td>Chicken thighs</td><td>Freezer</td><td class="n">900 g</td></tr><tr><td>Lemons</td><td>Fridge</td><td class="n">3</td></tr></table>
</div>

<h2 id="measured">8 · What the edges measure</h2>
<p class="note">Read off the rendered pixels of this page, not calculated. Light mode, then dark mode with the rim edge on the cocoa page you chose, then on the aubergine page for comparison. Each number is the biggest step the eye meets crossing that element's edge <b>at its weakest side</b>, on the same scale as before: under 5 is hard to see, 10 or more is clear. The number in brackets is the same edge under the worst of the three colour-blindness simulations. A thin line needs a bigger step than a broad patch to be noticed, which is why the checkbox ring is kept so much firmer than the card halo.</p>
${measTable}
<p class="note">Softening the pastels in dark costs the button labels contrast (Lc, the lightness-contrast score from sheet 1, where 60 is the floor for a label): ${softLab}.</p>

<h2>9 · What this sheet does not show</h2>
<ul>
<li><b>How it is built, which decides whether it survives a whole component library.</b> Each element's edge and its state are separate layers of one shadow, so an invalid or focused field adds to its edge instead of replacing it. Focus is an outline, which never competes with the shadow. Every card and control keeps a 1px transparent border, because Windows high-contrast mode strips shadows and draws borders. A box that clips its contents (a carousel, a scrolling tab strip) needs padding the width of the halo or the halo is cut off.</li>
<li><b>Not drawn yet:</b> chart colours, text over a photo, tooltips, two fields joined edge to edge, text selection, and the pale hover wash on list rows. They follow once the recipe here is settled.</li>
</ul>

<script>
(function(){
  var root=document.documentElement,st={mode:'t-light',edge:'d1',fill:'full',page:'coc'};
  function apply(){root.className=st.mode+' '+st.edge+' pg-'+st.page+(st.fill==='soft'?' soft':'');
    document.querySelectorAll('#bar [data-set]').forEach(function(b){var p=b.dataset.set.split(':');b.setAttribute('aria-pressed',String(st[p[0]]===p[1]));});
    try{history.replaceState(null,'','#'+st.mode+','+st.edge+','+st.fill+','+st.page);}catch(e){}}
  document.querySelectorAll('#bar [data-set]').forEach(function(b){b.addEventListener('click',function(){var p=b.dataset.set.split(':');st[p[0]]=p[1];apply();});});
  var h=location.hash.slice(1).split(',');if(h.length>=3&&/^t-(light|dark)$/.test(h[0])&&/^d[12]$/.test(h[1])){st.mode=h[0];st.edge=h[1];st.fill=h[2]==='soft'?'soft':'full';st.page=h[3]==='aub'?'aub':'coc';}
  apply();
})();
</script>
</body></html>`;
writeFileSync(join(outDir, "edges.html"), html);
const info = { tokens: T, onFill: ONFILL, ring: RING, focus: FOCUS, dangerRim: DANGER, shade: Object.fromEntries(FILLS.map((k) => [k, shade(P[k])])), deep: Object.fromEntries(FILLS.map((k) => [k, deep(P[k])])), softened: Object.fromEntries(FILLS.map((k) => [k, soften(P[k])])),
  lc: { "light ink on card": lc(T.light.ink, T.light.card), "light muted on card": lc(T.light.muted, T.light.card), "light subtle on card": lc(T.light.subtle, T.light.card), "light ink on well": lc(T.light.ink, T.light.well),
    "dark ink on page": lc(T.dark.ink, T.dark.page), "dark ink on card": lc(T.dark.ink, T.dark.card), "dark ink on raised": lc(T.dark.ink, T.dark.raised), "dark muted on card": lc(T.dark.muted, T.dark.card), "dark muted on raised": lc(T.dark.muted, T.dark.raised), "dark subtle on card": lc(T.dark.subtle, T.dark.card),
    ...Object.fromEntries(FILLS.flatMap((k) => [[`label on ${k}`, lc(ONFILL, P[k])], [`label on softened ${k}`, lc(ONFILL, soften(P[k]))]])) } };
writeFileSync(join(outDir, "edges-values.json"), JSON.stringify(info, null, 1));
console.log("wrote", join(outDir, "edges.html")); console.log(JSON.stringify(info.lc));
