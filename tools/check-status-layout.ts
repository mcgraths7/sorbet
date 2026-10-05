/**
 * The status layout check, run by hand: `pnpm check:status-layout [--no-build]`.
 *
 * The frozen screenshot compare masks every status slot (`.sb-status`, L167),
 * so it cannot see what the slot does to the layout round it. The audit of
 * step 2.5 found exactly that (legibility-spec.md L194 (a)): an inline-flex
 * slot with no text baseline lifted every status badge and danger button
 * 3.4px off the text beside it, and grew lines and table rows, in every
 * theme, and the masked compare called it pixel-identical. Nothing the
 * server-side tests read can see layout, so this renders the built library in
 * Chromium and checks, in each of the five presets and both modes:
 *
 *   - L194 (a): the icon takes inline room and nothing else. Status badges of
 *     the four tones (soft and solid) in a paragraph, a heading and a table
 *     cell, danger buttons in three sizes in a paragraph, a field's error and
 *     a danger menu item are rendered twice, masked and unmasked. Outside the
 *     slots, every element's top and height, and every line of text's, must
 *     be equal to 0.01px, at 1280px, at 390px and with the text at 200%.
 *     Widths may differ.
 *   - L186: a status badge in an overflowing `.sb-table-wrap` at 390px leaves
 *     `document.documentElement.scrollWidth` equal to `innerWidth`.
 *   - L194 (e): a danger menu item written by hand, with no slot, keeps its
 *     glyph, and its label stays in the column a plain item's label is in.
 *   - L194 (l): the vanilla sortable table sorts cells of status badges by
 *     what they show, in 9b83e50's order.
 *   - L194 (b): the vanilla `toast()` with a tone leads with the slot, whose
 *     markup is the React toast's.
 *
 * It prints one line per check and exits 1 if any fails. It needs Playwright's
 * Chromium (`pnpm browsers:install`). It builds first unless `--no-build`.
 */

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { styleText } from "node:util";

import { ALL_PRESETS, launch, MODES, ROOT, type Mode, type PresetName } from "./playground-browser.ts";

import type { Browser, Page } from "playwright";
import type * as ReactModule from "react";
import type * as ReactDomServer from "react-dom/server";

if (!process.argv.includes("--no-build")) {
  execFileSync("pnpm", ["build"], { cwd: ROOT, stdio: ["ignore", "inherit", "inherit"] });
}

/** L167's mask, as `tools/shots.ts` declares it. */
const MASK = ".sb-status{display:none!important}";
const FREEZE = "*,*::before,*::after{transition:none!important;animation:none!important;caret-color:transparent!important}";
const ORIGIN = "http://status-layout.test/";

const DS = join(ROOT, "packages", "design-system");
const LIB = join(ROOT, "packages", "component-library");
const libraryCss = readFileSync(join(DS, "dist", "css", "sorbet.css"), "utf8");
const themeCss = (preset: PresetName) => readFileSync(join(DS, "dist", "themes", `${preset}.css`), "utf8");

// The markup is the built library's, rendered on the server as a consumer's would be.
const req = createRequire(join(LIB, "package.json"));
const React = req("react") as typeof ReactModule;
const { renderToStaticMarkup } = req("react-dom/server") as typeof ReactDomServer;
const barrel = (await import(pathToFileURL(join(LIB, "dist", "index.js")).href)) as Record<string, ReactModule.ComponentType<Record<string, unknown>>>;
const toastModule = (await import(pathToFileURL(join(LIB, "dist", "molecules", "toast.js")).href)) as Record<string, ReactModule.ComponentType<Record<string, unknown>>>;
const html = (name: string, props: Record<string, unknown>, ...children: ReactModule.ReactNode[]) => renderToStaticMarkup(React.createElement(barrel[name]!, props, ...children));

const TONES = ["success", "warning", "danger", "info"] as const;
const badges = (solid: boolean) => TONES.map((tone) => html("Badge", { tone, solid }, solid ? "7" : "Due")).join(" ");
const RICE = React.createElement("input", { className: "sb-input" });
/** L194 (a)'s inline statuses, each line short enough to stay one line at 390px. */
const INLINE = `
<p class="probe">A ${badges(false)} b</p>
<p class="probe">C ${badges(true)} d</p>
<h3 class="probe">Plan ${html("Badge", { tone: "danger" }, "Late")}</h3>
<div class="sb-table-wrap probe"><table class="sb-table"><tbody>
  <tr><td>Rice</td><td>${html("Badge", { tone: "warning" }, "Low")}</td><td>${html("Badge", { tone: "info", solid: true }, "3")}</td></tr>
  <tr><td>Oats</td><td>${html("Badge", { tone: "success" }, "Ok")}</td><td>${html("Badge", { tone: "danger", solid: true }, "0")}</td></tr>
</tbody></table></div>
<p class="probe">E ${html("Button", { variant: "danger", size: "sm" }, "Del")} ${html("Button", { variant: "danger" }, "Del")} ${html("Button", { variant: "danger", size: "lg" }, "Del")} f</p>
<div class="probe">${renderToStaticMarkup(React.createElement(barrel.Field!, { label: "Rice", error: "Too much rice.", invalid: true }, RICE))}</div>
<div class="sb-menu probe" popover="manual" id="menu">${html("MenuItem", {}, "Rename")}${html("MenuItem", { danger: true, shortcut: "Del" }, "Delete")}</div>`;

/** L186's probe: six cells and a danger badge, in a scrolling table wrapper. */
const OVERFLOW = `<div class="sb-table-wrap"><table class="sb-table"><tbody><tr>${Array.from({ length: 6 }, (_, n) => `<td>Customer name ${n} here</td>`).join("")}<td>${html("Badge", { tone: "danger" }, "Overdue")}</td></tr></tbody></table></div>`;

/** L194 (e): a danger item written by hand, with no slot, beside a plain one; each with its own glyph. */
const GLYPH = "<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M4 4h16v16H4z\"></path></svg>";
const HAND_MENU = `<div class="sb-menu" popover="manual" id="menu"><button type="button" class="sb-menu__item">${GLYPH}Rename</button><button type="button" class="sb-menu__item" data-danger>${GLYPH}Delete project</button></div>`;

/** L194 (l): a sortable table of status badges; its rows in 9b83e50's ascending order, by what each cell shows. */
const SORT_CELLS: [tone: string, text: string][] = [["warning", "Packing"], ["danger", "12"], ["success", "Delivered"], ["danger", "9"], ["info", "Out for delivery"], ["danger", "Failed"]];
const SORTED = ["9", "12", "Delivered", "Failed", "Out for delivery", "Packing"];
const SORT_TABLE = `<table class="sb-table" data-sb="sortable"><thead><tr><th><button type="button" class="sb-table__sort">Status</button></th></tr></thead><tbody>${SORT_CELLS.map(([tone, text]) => `<tr><td>${html("Badge", { tone }, text)}</td></tr>`).join("")}</tbody></table>`;

let failures = 0;
function report(ok: boolean, line: string, detail = "") {
  if (!ok) {
    failures++;
  }
  console.log(`  ${ok ? styleText("green", "✓") : styleText("red", "✗")} ${line}${ok || detail === "" ? "" : `\n      ${detail.split("\n").join("\n      ")}`}`);
}

interface Context {
  name: string;
  width: number;
  css?: string;
}
const CONTEXTS: Context[] = [{ name: "1280px", width: 1280 }, { name: "390px", width: 390 }, { name: "text 200%", width: 1280, css: "html{font-size:200%!important}" }];

/** A fresh page of the library stylesheet and one preset's theme, in a mode, holding `body`. */
async function stage(browser: Browser, preset: PresetName, mode: Mode, width: number, body: string, css = ""): Promise<Page> {
  const context = await browser.newContext({ viewport: { width, height: 700 }, colorScheme: mode, reducedMotion: "reduce", locale: "en-US" });
  const page = await context.newPage();
  await page.route(`${ORIGIN}**`, (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/") {
      return route.fulfill({ contentType: "text/html", body: `<!doctype html><html data-theme="${mode}"><head><meta charset="utf-8"><style>${themeCss(preset)}</style><style>${libraryCss}</style><style>${FREEZE}${css}</style></head><body>${body}</body></html>` });
    }
    return route.fulfill({ path: join(DS, "dist", path), contentType: "text/javascript" });
  });
  await page.goto(ORIGIN, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  return page;
}

/** Every element's and every text line's top and height outside the slots, keyed by a path that skips them. */
async function geometry(page: Page): Promise<Map<string, [number, number]>> {
  await page.evaluate(() => (document.getElementById("menu") as HTMLElement | null)?.showPopover());
  const entries = await page.evaluate(() => {
    const out: [string, number, number][] = [];
    const inSlot = (node: Node) => Boolean((node.nodeType === 1 ? (node as Element) : node.parentElement)?.closest(".sb-status"));
    const walk = (el: Element, path: string) => {
      let index = 0;
      for (const child of el.childNodes) {
        if (inSlot(child)) {
          continue;
        }
        const key = `${path}/${index++}`;
        if (child.nodeType === 1) {
          const r = (child as Element).getBoundingClientRect();
          out.push([`${key}<${(child as Element).tagName.toLowerCase()}>`, r.top, r.height]);
          walk(child as Element, key);
        } else if (child.nodeType === 3 && child.textContent!.trim() !== "") {
          const range = document.createRange();
          range.selectNodeContents(child);
          [...range.getClientRects()].forEach((r, line) => out.push([`${key}#text:${line}`, r.top, r.height]));
        }
      }
    };
    document.querySelectorAll(".probe").forEach((probe, n) => walk(probe, `probe${n}`));
    return out;
  });
  return new Map(entries.map(([key, top, height]) => [key, [top, height]]));
}

const browser = await launch();
try {
  console.log(styleText("bold", "L194 (a): the status icon takes inline room and nothing else (masked against unmasked, outside the slots)"));
  for (const preset of ALL_PRESETS) {
    for (const mode of MODES) {
      for (const context of CONTEXTS) {
        const [unmasked, masked] = await Promise.all([context.css ?? "", `${context.css ?? ""}${MASK}`].map(async(css) => {
          const page = await stage(browser, preset, mode, context.width, INLINE, css);
          const geo = await geometry(page);
          await page.context().close();
          return geo;
        }));
        const moved = [...masked].flatMap(([key, [top, height]]) => {
          const other = unmasked.get(key);
          return other === undefined ? [`${key}: missing unmasked`] : Math.abs(other[0] - top) > 0.01 || Math.abs(other[1] - height) > 0.01 ? [`${key}: top ${top.toFixed(2)} → ${other[0].toFixed(2)}, height ${height.toFixed(2)} → ${other[1].toFixed(2)}`] : [];
        });
        report(moved.length === 0 && masked.size > 40, `${preset} ${mode} ${context.name}: ${masked.size} boxes and lines, ${moved.length} moved by the icon`, moved.slice(0, 8).join("\n"));
      }
    }
  }

  console.log(styleText("bold", "L186: a status badge in an overflowing .sb-table-wrap at 390px leaves the page 390px wide"));
  for (const preset of ALL_PRESETS) {
    for (const mode of MODES) {
      const page = await stage(browser, preset, mode, 390, OVERFLOW);
      const [scroll, inner] = await page.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
      await page.context().close();
      report(scroll === inner, `${preset} ${mode}: scrollWidth ${scroll}, innerWidth ${inner}`);
    }
  }

  console.log(styleText("bold", "L194 (e): a danger menu item written by hand, with no slot, keeps its glyph in the column"));
  for (const preset of ALL_PRESETS) {
    for (const mode of MODES) {
      const page = await stage(browser, preset, mode, 1280, HAND_MENU);
      await page.evaluate(() => (document.getElementById("menu") as HTMLElement).showPopover());
      const [plain, danger] = await page.evaluate(() => [...document.querySelectorAll(".sb-menu__item")].map((item) => {
        const range = document.createRange();
        range.selectNodeContents([...item.childNodes].find((node) => node.nodeType === 3)!);
        return { glyph: getComputedStyle(item.querySelector("svg")!).display, label: range.getBoundingClientRect().left };
      }));
      await page.context().close();
      report(danger!.glyph !== "none" && Math.abs(danger!.label - plain!.label) < 0.01, `${preset} ${mode}: the glyph's display is ${danger!.glyph}; the label at ${danger!.label.toFixed(2)}, a plain item's at ${plain!.label.toFixed(2)}`);
    }
  }

  console.log(styleText("bold", "L194 (l): the vanilla sortable table sorts status badges by what they show"));
  {
    const page = await stage(browser, "ocean", "light", 1280, SORT_TABLE);
    const order = await page.evaluate(async() => {
      const { SortableTable } = (await import(`${location.origin}/behaviors/table-sort.js`)) as { SortableTable: new (table: HTMLTableElement) => { sort(column: number): void } };
      new SortableTable(document.querySelector("table")!).sort(0);
      return [...document.querySelectorAll("tbody td")].map((cell) => {
        const clone = cell.cloneNode(true) as Element;
        clone.querySelectorAll(".sb-status").forEach((slot) => slot.remove());
        return clone.textContent!.trim();
      });
    });
    await page.context().close();
    report(JSON.stringify(order) === JSON.stringify(SORTED), `ascending: ${order.join(", ")}`, `9b83e50's order: ${SORTED.join(", ")}`);
  }

  console.log(styleText("bold", "L194 (b): the vanilla toast() leads with the React toast's slot"));
  for (const tone of TONES) {
    const page = await stage(browser, "ocean", "light", 1280, "");
    const first = await page.evaluate(async(tone) => {
      const { toast } = (await import(`${location.origin}/behaviors/toast.js`)) as { toast: (message: string, options: Record<string, unknown>) => void };
      toast("Deploy failed.", { tone, title: "Deploy", duration: 0 });
      return document.querySelector(".sb-toast")!.firstElementChild!.outerHTML;
    }, tone);
    await page.context().close();
    const react = renderToStaticMarkup(React.createElement(toastModule.ToastItem!, { tone, title: "Deploy", message: "Deploy failed.", onDismiss: () => {} }));
    const slot = /^<div[^>]*>(<span class="sb-status[\s\S]*?<\/span><\/span>)/.exec(react)?.[1] ?? "(the React toast has no slot)";
    report(first === slot, `${tone}: the toast's first child is the React toast's slot`, `vanilla: ${first}\nReact:   ${slot}`);
  }
} finally {
  await browser.close();
}

if (failures > 0) {
  console.error(styleText("red", `\n✗ ${failures} status layout check(s) failed`));
  process.exitCode = 1;
} else {
  console.log(styleText("green", "\n✓ the status slot takes inline room and nothing else, keeps its word inside its scroller, and leaves the vanilla behaviors as they were"));
}
