/**
 * The edge measurer, run by hand: `pnpm measure:edges [--preset sorbet] [--mode light] [--no-build] [--json <path>]`.
 *
 * It measures, from rendered pixels, how present each edge sheet 2 measured
 * is on the playground's real components, and sets each figure beside sheet
 * 2's (`docs/pastel-legibility-evidence/edges-measure.json`, read as it is,
 * never retyped). The gate's own number for an edge is a heuristic (spec L51);
 * this is the measurement of whether an edge is enough (spec §12, steps 2.4
 * and 2.6).
 *
 * The element is scrolled into view and shot in viewport coordinates, not as
 * part of a full-page capture: a full-page capture resizes the viewport, and
 * an open popover (fixed, placed by script) can move under it.
 *
 * The method is sheet 2's, carried to the whole boundary (L159): the element is
 * shot at twice its size with 10px round it; every line across its boundary,
 * at every device pixel along each of its four sides less the corner radius,
 * runs from 8px outside to 3px inside, and each pixel on it is measured against
 * what the element sits on and against its own fill (the pixel 5px in from the
 * top, halfway along). A line's strength is the strongest of those steps,
 * never less than the plain fill-to-backdrop step, and its figure under colour
 * blindness is that same pixel measured in each simulated view, the worst of
 * the three. The element's figure is its weakest point: the lowest of those
 * worst-view figures anywhere round it, with the side and the place printed.
 * The distances are the legibility measurement's own `separationIn()`
 * (`src/tokens/edges.ts`, over `color.ts`'s instrument): distance in OKLab,
 * times 100, with each colour first simulated for the view.
 *
 * What differs from sheet 2. Sheet 2 sampled one line through the top, one
 * through the left side and one through the bottom; one line can miss the
 * weakest point, and the right side was never sampled (audit finding m4). And
 * sheet 2 sampled 1 to 8px out for an edge drawn outside and 0 to 3px in for an
 * inset one; a library element's edge is often a border, inside its box, so
 * every element is sampled across both bands at once. What an element sits on
 * is read from the page (the nearest opaque background under the element's
 * centre), not from a token; and where the playground has no instance of an
 * element in sheet 2's placement (the filled buttons and the status box on a
 * card, the checkbox and the switch off), a clone of the real component is
 * placed in a real card for the measurement, and the row says "staged". Sheet
 * 2's raised box on the well and its robin's-egg button have no component in
 * the library, and are listed as such.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { styleText } from "node:util";

import { separationIn } from "../packages/design-system/src/tokens/edges.ts";

import { ALL_PRESETS, buildPlayground, describeTree, launch, MODES, openPlayground, ROOT, servePlayground, type Mode, type PresetName } from "./playground-browser.ts";
import { decodePng } from "./png.ts";

import type { Hex } from "../packages/design-system/src/tokens/color.ts";
import type { View } from "../packages/design-system/src/tokens/contracts.ts";
import type { Page } from "playwright";

const argv = process.argv.slice(2);
const option = (name: string) => {
  const at = argv.indexOf(name);
  return at === -1 ? undefined : argv[at + 1];
};
const preset = (option("--preset") ?? "sorbet") as PresetName;
const mode = (option("--mode") ?? "light") as Mode;
if (!ALL_PRESETS.includes(preset) || !MODES.includes(mode)) {
  console.error(`usage: pnpm measure:edges [--preset ${ALL_PRESETS.join("|")}] [--mode light|dark] [--no-build] [--json <path>]`);
  process.exit(2);
}

const VIEWS: View[] = ["protan", "deutan", "tritan"];
const SCALE = 2;
const MARGIN = 10;

/** One element to measure, and where sheet 2's figure for it is filed. */
interface Target {
  label: string;
  sheet2: { name: string; on: string } | null;
  /** How to find it on the page (run in the page; tags the element `data-measure`). */
  find: string;
  staged?: boolean;
  /** Something to do before measuring, in the page (open a popover). */
  open?: (page: Page) => Promise<void>;
}

/** The playground's components, in sheet 2's order. `find` bodies are evaluated in the page and return an element. */
const TARGETS: Target[] = [
  { label: "Card on the page", sheet2: { name: "Card", on: "page" }, find: "cardByText('Monthly revenue')" },
  { label: "Sunken panel on a card", sheet2: { name: "Sunken panel", on: "card" }, find: "[...document.querySelectorAll('.sb-card--sunken')].find((e) => e.textContent.trim() === 'Ramen')" },
  { label: "Raised box on the well", sheet2: { name: "Raised box", on: "well" }, find: "null" },
  {
    label: "Floating menu on the page",
    sheet2: null,
    find: "openPopover('.sb-menu')",
    side: "out",
    open: async(page) => {
      await page.getByRole("button", { name: "Options ▾" }).evaluate((e) => e.scrollIntoView({ block: "start" }));
      await page.getByRole("button", { name: "Options ▾" }).click();
      await page.waitForSelector(".sb-menu:popover-open");
      await page.mouse.move(0, 0);
    },
  },
  {
    label: "Floating panel on a card (combobox)",
    sheet2: { name: "Floating menu", on: "card" },
    find: "openPopover('.sb-combobox__panel')",
    side: "out",
    open: async(page) => {
      // Scrolled first, so nothing scrolls once it is open: the panel closes on scroll.
      await page.getByPlaceholder("Search people…").evaluate((e) => e.scrollIntoView({ block: "start" }));
      await page.getByPlaceholder("Search people…").click();
      await page.keyboard.press("ArrowDown");
      // The pointer stays on the input: moved away, the panel closes.
      await page.waitForSelector(".sb-combobox__panel:popover-open");
    },
  },
  { label: "Lilac (primary) button on a card", sheet2: { name: "Lilac button", on: "card" }, find: "buttonByText('Save changes')" },
  { label: "Lilac (primary) button on a card", sheet2: { name: "Lilac button", on: "card" }, find: "staged('.sb-button:not([class*=\"--\"])', 'Primary')", staged: true },
  { label: "Blush (secondary) button on a card", sheet2: { name: "Blush button", on: "card" }, find: "staged('.sb-button--secondary', 'Secondary')", staged: true },
  { label: "Blush (danger) button on a card", sheet2: { name: "Blush button", on: "card" }, find: "staged('.sb-button--danger', 'Danger')", staged: true },
  { label: "Butter (accent) button on a card", sheet2: { name: "Butter button", on: "card" }, find: "staged('.sb-button--accent', 'Accent')", staged: true },
  { label: "Robin's-egg button on a card", sheet2: { name: "Robin button", on: "card" }, find: "null" },
  { label: "Quiet (outline) button on a card", sheet2: { name: "Quiet button", on: "card" }, find: "buttonByText('See all 12')" },
  { label: "Butter (accent) button on the page", sheet2: { name: "Butter button", on: "page" }, find: "buttonByText('Accent')" },
  { label: "Robin's-egg button on the page", sheet2: { name: "Robin button", on: "page" }, find: "null" },
  { label: "Quiet (outline) button on the page", sheet2: { name: "Quiet button", on: "page" }, find: "buttonByText('Outline')" },
  { label: "Lilac (primary) button on the page", sheet2: null, find: "buttonByText('Primary')" },
  { label: "Blush (secondary) button on the page", sheet2: null, find: "buttonByText('Secondary')" },
  { label: "Blush (danger) button on the page", sheet2: null, find: "buttonByText('Danger')" },
  { label: "Text field on a card", sheet2: { name: "Text field", on: "card" }, find: "document.querySelector('.sb-card .sb-input')" },
  { label: "Checkbox, off, on a card", sheet2: { name: "Checkbox, off", on: "card" }, find: "staged('.sb-checkbox', null, (e) => { e.checked = false; e.indeterminate = false; })", staged: true },
  { label: "Switch, off, on a card", sheet2: { name: "Switch, off", on: "card" }, find: "staged('.sb-switch', null, (e) => { e.checked = false; })", staged: true },
  { label: "Status box on a card", sheet2: { name: "Status box", on: "card" }, find: "staged('.sb-alert--success', null, (e) => { e.style.inlineSize = '100%'; })", staged: true },
  { label: "Status box on the page", sheet2: null, find: "document.querySelector('.sb-alert--success')" },
];

/**
 * Helpers installed in the page. `staged(selector, text, adjust)` clones the
 * first real component that matches into one staging column inside a real
 * card ("Monthly revenue"), each in its own row with room round it, so its
 * halo meets nothing but the card.
 */
const HELPERS = `
window.openPopover = (selector) => [...document.querySelectorAll(selector)].find((e) => e.matches(':popover-open'));
window.cardByText = (text) => [...document.querySelectorAll('.sb-card')].find((e) => e.textContent.trim().startsWith(text));
window.buttonByText = (text) => [...document.querySelectorAll('.sb-button')].find((e) => e.textContent.trim() === text && e.getBoundingClientRect().width > 0);
window.staged = (selector, text, adjust) => {
  let column = document.getElementById('measure-staging');
  if (!column) {
    const card = window.cardByText('Monthly revenue');
    column = document.createElement('div');
    column.id = 'measure-staging';
    column.style.cssText = 'display:flex;flex-direction:column;align-items:flex-start;gap:32px;padding-block:24px;';
    (card.querySelector('.sb-card__body') ?? card).append(column);
  }
  const source = [...document.querySelectorAll(selector)].find((e) => (text === null || e.textContent.trim() === text) && e.getBoundingClientRect().width > 0);
  if (!source) return null;
  const row = document.createElement('div');
  row.style.cssText = 'display:block;inline-size:100%;';
  const clone = source.cloneNode(true);
  clone.removeAttribute('id');
  row.append(clone);
  column.append(row);
  if (adjust) adjust(clone);
  return clone;
};
`;

const hex = (r: number, g: number, b: number) => `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
const sep = (a: string, b: string, view: View = "typical") => separationIn(view, a as Hex, b as Hex);

const EDGES = ["top", "right", "bottom", "left"] as const;
type Edge = (typeof EDGES)[number];

interface Side {
  strength: number;
  worstSim: number;
  hex: string;
  /** Where along the side (css px from its start) the weakest point is. */
  at: number;
}
interface Row {
  label: string;
  staged: boolean;
  sheet2: { name: string; on: string; worstSim: number } | null;
  missing?: string;
  backdrop?: string;
  fill?: string;
  fillStep?: number;
  sides?: Record<Edge, Side>;
  weakest?: number;
  weakestAt?: string;
}

/** Rendered pixels along the three lines across the element's boundary, and the colour it sits on. */
async function sample(page: Page) {
  const el = page.locator("[data-measure]");
  const geometry = await el.evaluate((node) => {
    const r = node.getBoundingClientRect();
    // What the element sits on: the topmost thing under its centre that is not it, then the nearest opaque background from there up.
    const under = document.elementsFromPoint(r.left + r.width / 2, r.top + r.height / 2).find((e) => e !== node && !node.contains(e) && !e.contains(node)) ?? node.parentElement;
    let walk: Element | null = under;
    let backdrop = "";
    while (walk) {
      const bg = getComputedStyle(walk).backgroundColor;
      const alpha = bg.startsWith("rgba") ? Number(bg.split(",")[3]?.replace(")", "")) : 1;
      if (bg !== "transparent" && alpha === 1) {
        backdrop = bg;
        break;
      }
      walk = walk.parentElement;
    }
    const cs = getComputedStyle(node);
    const radius = Math.max(...[cs.borderTopLeftRadius, cs.borderTopRightRadius, cs.borderBottomLeftRadius, cs.borderBottomRightRadius].map((v) => parseFloat(v) || 0));
    const fits = r.top - 10 >= 0 && r.bottom + 10 <= innerHeight && r.left - 10 >= 0 && r.right + 10 <= innerWidth;
    return { x: r.left + (fits ? 0 : scrollX), y: r.top + (fits ? 0 : scrollY), width: r.width, height: r.height, fits, radius: Math.min(radius, r.width / 2, r.height / 2), backdrop: backdrop || getComputedStyle(document.documentElement).backgroundColor };
  });
  // In the viewport where it fits (an open popover is placed in viewport coordinates and moves when the page is
  // captured whole); otherwise from the whole page, in document coordinates.
  const clip = { x: geometry.x - MARGIN, y: geometry.y - MARGIN, width: geometry.width + 2 * MARGIN, height: geometry.height + 2 * MARGIN };
  const img = decodePng(await page.screenshot({ clip, fullPage: !geometry.fits, animations: "disabled", caret: "hide" }));
  const at = (x: number, y: number) => {
    const o = (Math.round(y) * img.width + Math.round(x)) * 4;
    return hex(img.rgba[o]!, img.rgba[o + 1]!, img.rgba[o + 2]!);
  };
  const rgb = geometry.backdrop.match(/\d+(\.\d+)?/g)!.map(Number);
  const backdrop = hex(rgb[0]!, rgb[1]!, rgb[2]!);
  const m = MARGIN * SCALE;
  const [w, h] = [Math.round(geometry.width * SCALE), Math.round(geometry.height * SCALE)];
  // The element's own fill: the pixel 5px in from the top edge, halfway along it (sheet 2's reading).
  const fill = at(m + w / 2, m + 5 * SCALE);
  const cache = new Map<string, number>();
  const sepCached = (a: string, b: string, view?: View) => {
    const key = `${a}${b}${view ?? ""}`;
    let v = cache.get(key);
    if (v === undefined) {
      v = sep(a, b, view);
      cache.set(key, v);
    }
    return v;
  };
  const step = (pixel: string, view?: View) => Math.max(sepCached(pixel, backdrop, view), sepCached(pixel, fill, view));
  const floor = sepCached(fill, backdrop);
  const sides = {} as Record<Edge, Side>;
  // Every line across the boundary along each side's full length, less the corner radius (L159). A line runs from
  // 8px outside to 3px inside, in device pixels; `inward` is the unit step into the element.
  // Only device pixels wholly on the straight run, from the box's own (fractional) size: a pixel that straddles the
  // point where the corner's curve starts is part corner.
  const [start, endW, endH] = [Math.ceil(geometry.radius * SCALE), Math.floor((geometry.width - geometry.radius) * SCALE), Math.floor((geometry.height - geometry.radius) * SCALE)];
  const runs: Record<Edge, { along: number[]; origin: (t: number) => [number, number]; inward: [number, number] }> = {
    top: { along: range(start, endW), origin: (t) => [m + t, m], inward: [0, 1] },
    bottom: { along: range(start, endW), origin: (t) => [m + t, m + h - 1], inward: [0, -1] },
    left: { along: range(start, endH), origin: (t) => [m, m + t], inward: [1, 0] },
    right: { along: range(start, endH), origin: (t) => [m + w - 1, m + t], inward: [-1, 0] },
  };
  for (const edge of EDGES) {
    const run = runs[edge];
    let weakest: Side | undefined;
    for (const t of run.along) {
      const [ox, oy] = run.origin(t);
      const band: string[] = [];
      for (let d = -8 * SCALE; d <= 3 * SCALE; d++) {
        band.push(at(ox + run.inward[0] * d, oy + run.inward[1] * d));
      }
      const best = band.reduce((a, b) => (step(b) > step(a) ? b : a));
      const point: Side = {
        strength: Math.max(step(best), floor),
        worstSim: Math.min(...VIEWS.map((view) => Math.max(step(best, view), sepCached(fill, backdrop, view)))),
        hex: best,
        at: t / SCALE,
      };
      if (weakest === undefined || point.worstSim < weakest.worstSim) {
        weakest = point;
      }
    }
    if (weakest !== undefined) {
      sides[edge] = weakest;
    }
  }
  return { backdrop, fill, sides };
}

const range = (from: number, to: number) => Array.from({ length: Math.max(0, to - from) }, (_, i) => from + i);

const sheet2File = JSON.parse(readFileSync(join(ROOT, "docs", "pastel-legibility-evidence", "edges-measure.json"), "utf8")) as Record<string, { name: string; on: string; weakest: { worstSim: number } }[]>;
const sheet2Rows = sheet2File[mode === "light" ? "Light" : "Dark"] ?? [];

if (!argv.includes("--no-build")) {
  buildPlayground(ROOT);
}
const browser = await launch();
const server = await servePlayground(ROOT);
const rows: Row[] = [];
try {
  const page = await openPlayground(browser, server.url, preset, mode, { width: 1280, height: 900 }, SCALE);
  await page.evaluate(HELPERS);
  // Popovers first, before staging moves anything; staged clones last.
  const ordered = [...TARGETS.filter((t) => !t.staged && !t.open), ...TARGETS.filter((t) => t.open), ...TARGETS.filter((t) => t.staged)];
  for (const target of ordered) {
    const recorded = target.sheet2 && sheet2Rows.find((r) => r.name === target.sheet2!.name && r.on === target.sheet2!.on);
    const row: Row = { label: target.label, staged: Boolean(target.staged), sheet2: recorded ? { ...target.sheet2!, worstSim: recorded.weakest.worstSim } : null };
    rows.push(row);
    if (target.open) {
      await target.open(page);
    }
    await page.evaluate(() => document.querySelectorAll("[data-measure]").forEach((e) => e.removeAttribute("data-measure")));
    const found = await page.evaluate(`(() => { const e = ${target.find}; if (e) { e.setAttribute("data-measure", ""); } return Boolean(e); })()`);
    if (!found) {
      row.missing = target.find === "null" ? "no component in the library" : "not found on the page";
      continue;
    }
    if (!target.open) {
      await page.locator("[data-measure]").scrollIntoViewIfNeeded();
    }
    const measured = await sample(page);
    if (target.open) {
      await page.keyboard.press("Escape");
      await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    }
    const worst = Object.entries(measured.sides) as [Edge, Side][];
    const weakest = worst.reduce((a, b) => (b[1].worstSim < a[1].worstSim ? b : a));
    Object.assign(row, {
      backdrop: measured.backdrop,
      fill: measured.fill,
      fillStep: sep(measured.fill, measured.backdrop),
      sides: measured.sides,
      weakest: weakest[1].worstSim,
      weakestAt: `${weakest[0]} ${weakest[1].at.toFixed(0)}px`,
    });
  }
  await page.context().close();
} finally {
  await server.close();
  await browser.close();
}

const f1 = (n: number | undefined) => (n === undefined || Number.isNaN(n) ? "—" : n.toFixed(1));
console.log(`\nEdges of ${preset} ${mode}, rendered (${describeTree(ROOT)}). Worst view of protan, deutan, tritan; sheet 2's figure is weakest.worstSim.`);
console.log(`${"Element".padEnd(42)} ${"weakest".padStart(8)} ${"where".padStart(13)} ${"sheet 2".padStart(8)} ${"less 1.0".padStart(9)}  fill step  backdrop  fill`);
let below = 0;
for (const row of rows) {
  const name = `${row.label}${row.staged ? " (staged)" : ""}`.padEnd(42);
  if (row.missing) {
    console.log(`${name} ${styleText("dim", row.missing)}${row.sheet2 ? styleText("dim", ` (sheet 2: ${row.sheet2.worstSim})`) : ""}`);
    continue;
  }
  const bar = row.sheet2 ? row.sheet2.worstSim - 1 : undefined;
  const ok = bar === undefined || row.weakest! >= bar;
  below += ok ? 0 : 1;
  const mark = bar === undefined ? " " : ok ? styleText("green", "✓") : styleText("red", "✗");
  console.log(`${name} ${f1(row.weakest).padStart(8)} ${(row.weakestAt ?? "").padStart(13)} ${f1(row.sheet2?.worstSim).padStart(8)} ${f1(bar).padStart(8)} ${mark}  ${f1(row.fillStep).padStart(9)}  ${row.backdrop}  ${row.fill}`);
}
console.log(below === 0 ? "\nNo measured element is below sheet 2's figure less 1.0." : `\n${below} element(s) below sheet 2's figure less 1.0.`);
const json = option("--json");
if (json) {
  writeFileSync(json, `${JSON.stringify({ preset, mode, tree: describeTree(ROOT), rows }, null, 1)}\n`);
  console.log(`Written: ${json}`);
}
