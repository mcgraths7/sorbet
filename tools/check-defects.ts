/**
 * The defects check, run by hand: `pnpm check:defects [--no-build]`, and E3's
 * `pnpm check:defects --signatures [--no-build]`. The statements are those of
 * docs/existing-defects/spec.md (revision 3); every check's line starts with
 * its statement id, and its expected values are the spec's.
 *
 * Without `--signatures`, the rendered checks of group 1:
 *
 *   - E8: on the test page, a labelled strong divider's `::before` and
 *     `::after` compute the `border-top-color` of an
 *     `<hr class="sb-divider sb-divider--strong">`; a labelled divider without
 *     `--strong` paints `border`. Red on main: the labelled strong lines paint
 *     `border`.
 *   - E9: on the test page, for all eight variants, the `::after` of a
 *     loading button computes a `border-top-color` equal to the `color` of its
 *     twin without `data-loading`. Red on main for soft, outline, ghost and
 *     link everywhere, except sorbet light soft.
 *   - E11: on the live menus (the built playground's "Options ▾", React, and
 *     the demo's `#demo-menu`, vanilla, after `init()`), the accessibility
 *     tree, closed and then opened by Enter on the Tab-focused trigger: a
 *     `button` with `hasPopup` `menu` and `expanded` false, then true; a
 *     `menu` named by the trigger's text; `menuitem`s named by their text.
 *     Red on main: the roles and the name (`expanded` is green on main, via
 *     `popovertarget`). And the vanilla menu's attributes after construction
 *     (role, `aria-labelledby` = the trigger's id, `${panel.id}-trigger` for a
 *     trigger with none, `aria-expanded="false"`): red on main.
 *   - E12: on the same live menus, Tab to the trigger, Enter, then End: the
 *     focused plain and danger items draw the ring (solid, the focus-ring
 *     width and colour, offset -2px) on a transparent background, hovered or
 *     not; an item hovered while another has focus has no outline and the
 *     hover fill. Red on main: the outline. The ring against the menu's
 *     surface is measured and quoted, not asserted (under 3:1 is for the
 *     owner).
 *   - E13: on the test page, a server-rendered `<DateRange disabled />` with
 *     no value has a control that computes the `background-color`, `color` and
 *     `cursor` of a disabled `<MultiCombobox>`'s field, and its inputs the
 *     control's `color`; an enabled date range computes as on main (its
 *     signature, as E3 writes one, with main's library stylesheet). Red on
 *     main.
 *
 * Each statement is run in all five presets and both modes. "The test page"
 * (E4) is built here: the built library stylesheet
 * (packages/design-system/dist/css/sorbet.css), one theme file, `data-theme`
 * set to the mode, and the markup each statement names (React components
 * server-rendered with react-dom/server from the built library).
 *
 * With `--signatures`, E3 instead: the playground and the demo, main's library
 * stylesheet (`git archive main`, or origin/main where this checkout has no
 * local main, compiled as `build:css` does) against this tree's, five presets
 * × two modes, 1280 × 900, reduced motion, settled animations, a fixed clock,
 * UTC, en-US. The playground is built twice with the shots tool's
 * library-css-swap (`SORBET_LIBRARY_CSS`, tools/shots.ts); the demo loads
 * `packages/design-system/dist/css/sorbet.css` itself, so that URL is
 * intercepted with each stylesheet. The signature is every element and its
 * `::before` and `::after`, keyed by its `tag:nth-child(n)` path from `html`,
 * over the standard longhands (custom properties, `transform` and
 * `animation-*` excluded). Expected: 0 differences.
 *
 * Prerequisites: Playwright's Chromium (`pnpm browsers:install`, or
 * PLAYWRIGHT_BROWSERS_PATH), and `git` with main (or origin/main) fetched. It
 * runs `pnpm build` and the playground's build first, unless `--no-build`
 * (then the packages and apps/playground/dist must already be built). Not in
 * CI, which has no Chromium, as tools/check-status-layout.ts. It prints one
 * line per check, a summary by statement, and sets a non-zero exit code if any
 * check fails.
 */

import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { createServer, type Server } from "node:http";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { extname, join, normalize } from "node:path";
import { pathToFileURL } from "node:url";
import { styleText } from "node:util";

import { compile } from "sass";

import { ALL_PRESETS, buildPlayground, FIXED_TIME, launch, MODES, openPlayground, ROOT, servePlayground, type Mode, type PresetName } from "./playground-browser.ts";

import type { Browser, CDPSession, Page } from "playwright";
import type * as ReactModule from "react";
import type * as ReactDomServer from "react-dom/server";

const argv = process.argv.slice(2);
const SIGNATURES = argv.includes("--signatures");
const VIEWPORT = { width: 1280, height: 900 };
const DS = join(ROOT, "packages", "design-system");
const LIB = join(ROOT, "packages", "component-library");
const PAIRS = ALL_PRESETS.flatMap((preset) => MODES.map((mode) => ({ preset, mode })));

// ── reporting ──────────────────────────────────────────────────────────────────────────────────────────────────────

const tally = new Map<string, { pass: number; fail: number }>();
const notes: string[] = [];
function report(statement: string, ok: boolean, line: string, detail = "") {
  const row = tally.get(statement) ?? { pass: 0, fail: 0 };
  row[ok ? "pass" : "fail"]++;
  tally.set(statement, row);
  console.log(`  ${ok ? styleText("green", "✓") : styleText("red", "✗")} ${statement} ${line}${ok || detail === "" ? "" : `\n      ${detail.split("\n").join("\n      ")}`}`);
}

// ── the stylesheets ────────────────────────────────────────────────────────────────────────────────────────────────

/** The ref E3 calls main: `main`, or `origin/main` in a checkout that has no local branch of that name. */
function mainRef(): { ref: string; sha: string } {
  for (const ref of ["main", "origin/main"]) {
    try {
      const sha = execFileSync("git", ["rev-parse", "--verify", "--quiet", `${ref}^{commit}`], { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
      if (sha !== "") {
        return { ref, sha: sha.slice(0, 7) };
      }
    } catch {
      // try the next
    }
  }
  throw new Error("neither main nor origin/main names a commit in this checkout: fetch main first");
}

/**
 * A library stylesheet compiled as `build:css` compiles it (this repo's sass, expanded): `<ref>`'s, from `git archive`
 * as tools/shots.ts's stylesheetAt does, or this tree's when `ref` is null. Written into `dir`; its path is returned.
 */
function stylesheetAt(ref: string | null, dir: string): string {
  let styles = join(DS, "src", "styles");
  if (ref !== null) {
    const archive = execFileSync("git", ["archive", "--format=tar", ref, "packages/design-system/src/styles"], { cwd: ROOT, maxBuffer: 1 << 30 });
    execFileSync("tar", ["-x", "-C", dir], { input: archive });
    styles = join(dir, "packages", "design-system", "src", "styles");
  }
  const file = join(dir, ref === null ? "library-this-tree.css" : "library-main.css");
  writeFileSync(file, `${compile(join(styles, "index.scss"), { loadPaths: [styles], style: "expanded" }).css}\n`);
  return file;
}

/** tools/shots.ts's buildWithStylesheet: this tree's playground with `stylesheet` as `@sorbet/design-system/css`, into `<site>/apps/playground/dist`. */
function buildWithStylesheet(stylesheet: string, site: string): void {
  execFileSync("pnpm", ["--filter", "playground", "exec", "vite", "build", "--outDir", join(site, "apps", "playground", "dist"), "--emptyOutDir"], {
    cwd: ROOT,
    env: { ...process.env, SORBET_LIBRARY_CSS: stylesheet },
    stdio: ["ignore", "inherit", "inherit"],
  });
}

// ── pages ──────────────────────────────────────────────────────────────────────────────────────────────────────────

const MIME: Record<string, string> = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json", ".svg": "image/svg+xml", ".woff2": "font/woff2" };

/** The repository root over loopback, so `demo/index.html` loads `../packages/…` as it does from the repo root. */
async function serveRoot(): Promise<{ url: string; close: () => Promise<void> }> {
  const server: Server = createServer((req, res) => {
    const path = normalize(decodeURIComponent((req.url ?? "/").split("?")[0]!)).replace(/^(\.\.[/\\])+/, "");
    const file = join(ROOT, path);
    if (!file.startsWith(ROOT) || !existsSync(file) || statSync(file).isDirectory()) {
      res.writeHead(404).end();
      return;
    }
    res.writeHead(200, { "content-type": MIME[extname(file)] ?? "application/octet-stream", "cache-control": "no-store" });
    res.end(readFileSync(file));
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (address === null || typeof address === "string") {
    throw new Error("the repo-root server has no port");
  }
  return { url: `http://127.0.0.1:${address.port}/`, close: () => new Promise<void>((resolve) => server.close(() => resolve())) };
}

const contextOptions = (mode: Mode) => ({ viewport: VIEWPORT, deviceScaleFactor: 1, colorScheme: mode, reducedMotion: "reduce" as const, timezoneId: "UTC", locale: "en-US" });

/**
 * The demo under `preset` and `mode`, set as the shots tool sets the playground's (localStorage before the first
 * script: the demo's `demo-preset`, and `sb-theme`). With `libraryCss`, its library stylesheet URL is intercepted.
 */
async function openDemo(browser: Browser, root: string, preset: PresetName, mode: Mode, libraryCss?: string): Promise<Page> {
  const context = await browser.newContext(contextOptions(mode));
  const page = await context.newPage();
  await page.clock.setFixedTime(FIXED_TIME);
  await page.addInitScript(({ preset, mode }) => {
    localStorage.setItem("demo-preset", preset);
    localStorage.setItem("sb-theme", mode);
  }, { preset, mode });
  if (libraryCss !== undefined) {
    await page.route("**/packages/design-system/dist/css/sorbet.css", (route) => route.fulfill({ contentType: "text/css; charset=utf-8", body: libraryCss }));
  }
  await page.goto(`${root}demo/index.html`, { waitUntil: "networkidle" });
  await page.waitForFunction(({ preset, mode }) => {
    const link = document.getElementById("theme-css") as HTMLLinkElement | null;
    return Boolean(link?.sheet) && link!.href.endsWith(`/themes/${preset}.css`) && document.documentElement.dataset.theme === mode;
  }, { preset, mode });
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  await page.waitForLoadState("networkidle");
  return page;
}

const TEST_ORIGIN = "http://check-defects.test/";
/** E4's test page: the library stylesheet (`css`), one theme file, `data-theme` set to the mode, and `body`. */
async function openTestPage(browser: Browser, preset: PresetName, mode: Mode, css: string, body: string): Promise<Page> {
  const context = await browser.newContext(contextOptions(mode));
  const page = await context.newPage();
  await page.clock.setFixedTime(FIXED_TIME);
  const theme = readFileSync(join(DS, "dist", "themes", `${preset}.css`), "utf8");
  await page.route(`${TEST_ORIGIN}**`, (route) => route.fulfill({ contentType: "text/html; charset=utf-8", body: `<!doctype html><html lang="en" data-theme="${mode}"><head><meta charset="utf-8"><style>${theme}</style><style>${css}</style></head><body>${body}</body></html>` }));
  await page.goto(TEST_ORIGIN, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  return page;
}

/**
 * E3's settling: every animation and transition `document.getAnimations()` reports ends finished or cancelled. A
 * finite one is waited for (up to 3s) and then finished; an infinite one (a spinner, a marquee) can never finish, so it
 * is cancelled. Both sides of a comparison are settled the same way.
 */
const settle = (page: Page) => page.evaluate(async() => {
  const deadline = performance.now() + 3000;
  for (let round = 0; round < 50; round++) {
    const live = document.getAnimations().filter((animation) => animation.playState !== "finished" && animation.playState !== "idle");
    if (live.length === 0) {
      return;
    }
    const finite = live.filter((animation) => Number.isFinite(Number(animation.effect?.getComputedTiming().endTime ?? Infinity)));
    for (const animation of live) {
      if (!finite.includes(animation)) {
        animation.cancel();
      }
    }
    if (performance.now() > deadline) {
      for (const animation of finite) {
        animation.finish();
      }
    }
    await Promise.race([Promise.all(finite.map((animation) => animation.finished.catch(() => undefined))), new Promise((resolve) => setTimeout(resolve, 100))]);
    await new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)));
  }
});

// ── colours, read in the page ──────────────────────────────────────────────────────────────────────────────────────

/** Installs `window.__sbDefects` helpers: a custom property resolved as a computed colour, and a colour as sRGB bytes. */
const installHelpers = (page: Page) => page.evaluate(() => {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  (window as unknown as { __sbDefects: unknown }).__sbDefects = {
    color: (name: string) => {
      const probe = document.createElement("span");
      probe.style.color = `var(${name})`;
      document.body.append(probe);
      const value = getComputedStyle(probe).color;
      probe.remove();
      return value;
    },
    bytes: (value: string) => {
      ctx.clearRect(0, 0, 1, 1);
      ctx.fillStyle = "#000";
      ctx.fillStyle = value;
      ctx.fillRect(0, 0, 1, 1);
      return [...ctx.getImageData(0, 0, 1, 1).data];
    },
  };
});
type Helpers = { color: (name: string) => string; bytes: (value: string) => number[] };

const hex = (bytes: number[]) => `#${bytes.slice(0, 3).map((c) => c.toString(16).padStart(2, "0")).join("")}`;
const luminance = (bytes: number[]) => {
  const [r, g, b] = bytes.slice(0, 3).map((c) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
};
const ratio = (a: number[], b: number[]) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
};

// ── the markup of the test page ────────────────────────────────────────────────────────────────────────────────────

const req = createRequire(join(LIB, "package.json"));
const React = req("react") as typeof ReactModule;
const { renderToStaticMarkup } = req("react-dom/server") as typeof ReactDomServer;

/** E9's eight variants: the base (primary), the three other filled ones, and the four quiet ones. */
const VARIANTS = ["primary", "secondary", "accent", "danger", "soft", "outline", "ghost", "link"] as const;

async function testPageMarkup(): Promise<string> {
  const barrel = (await import(pathToFileURL(join(LIB, "dist", "index.js")).href)) as Record<string, ReactModule.ComponentType<Record<string, unknown>>>;
  const e8 = [
    "<div class=\"sb-divider sb-divider--strong\" role=\"separator\" id=\"e8-labelled-strong\">or</div>",
    "<div class=\"sb-divider\" role=\"separator\" id=\"e8-labelled\">or</div>",
    "<hr class=\"sb-divider sb-divider--strong\" id=\"e8-hr-strong\">",
  ].join("\n");
  const e9 = VARIANTS.map((variant) => `<p><button type="button" class="sb-button sb-button--${variant}" data-loading id="e9-${variant}-loading">Save</button> <button type="button" class="sb-button sb-button--${variant}" id="e9-${variant}">Save</button></p>`).join("\n");
  // One render, so the components' useId ids are unique on the page.
  const e13 = renderToStaticMarkup(React.createElement(React.Fragment, null,
    React.createElement("div", { id: "e13-disabled" }, React.createElement(barrel.DateRange!, { disabled: true })),
    React.createElement("div", { id: "e13-multi" }, React.createElement(barrel.MultiCombobox!, { disabled: true, options: [] })),
    React.createElement("div", { id: "e13-enabled" }, React.createElement(barrel.DateRange!, {})),
  ));
  return `<main style="padding:24px">\n${e8}\n${e9}\n${e13}\n</main>`;
}

// ── E3's signature ─────────────────────────────────────────────────────────────────────────────────────────────────

/**
 * Every element (under `scope`, or the whole document) and its ::before and ::after, keyed by the `tag:nth-child(n)`
 * chain from `html`, each with a hash of its standard longhands (no custom property, no `transform`, no `animation-*`).
 * With `keys`, the values themselves for those keys instead.
 */
const signatureOf = (page: Page, options: { scope?: string; keys?: string[] } = {}) => page.evaluate(({ scope, keys }) => {
  const props = [...getComputedStyle(document.documentElement)].filter((name) => !name.startsWith("-") && name !== "transform" && !name.startsWith("animation-")).sort();
  const pathOf = (el: Element): string => {
    const parts: string[] = [];
    for (let n: Element | null = el; n !== null && n !== document.documentElement; n = n.parentElement) {
      parts.unshift(`${n.tagName.toLowerCase()}:nth-child(${[...n.parentElement!.children].indexOf(n) + 1})`);
    }
    return ["html", ...parts].join(" > ");
  };
  const hash = (text: string) => {
    let h1 = 0xdeadbeef;
    let h2 = 0x41c6ce57;
    for (let i = 0; i < text.length; i++) {
      const ch = text.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
  };
  const root = scope === undefined ? document.documentElement : document.querySelector(scope)!;
  const all = [root, ...root.querySelectorAll("*")];
  const wanted = keys === undefined ? null : new Set(keys);
  const entries: [string, string][] = [];
  const values: Record<string, Record<string, string>> = {};
  for (const el of all) {
    const path = pathOf(el);
    for (const pseudo of ["", "::before", "::after"]) {
      const key = `${path}${pseudo}`;
      if (wanted !== null && !wanted.has(key)) {
        continue;
      }
      const style = getComputedStyle(el, pseudo === "" ? null : pseudo);
      const list = props.map((name) => style.getPropertyValue(name));
      if (wanted === null) {
        entries.push([key, hash(list.join("\u0001"))]);
      } else {
        values[key] = Object.fromEntries(props.map((name, i) => [name, list[i]!]));
      }
    }
  }
  return { props, entries, values };
}, options);

/** The differences between two pages' signatures: keys on one side only, and each differing longhand. */
async function differences(base: Page, mine: Page, scope?: string): Promise<{ count: number; keys: number; lines: string[] }> {
  const [a, b] = await Promise.all([signatureOf(base, { scope }), signatureOf(mine, { scope })]);
  const lines: string[] = [];
  if (a.props.join() !== b.props.join()) {
    lines.push("the two pages enumerate different longhands");
  }
  const [mapA, mapB] = [new Map(a.entries), new Map(b.entries)];
  const only = [...mapA.keys()].filter((key) => !mapB.has(key)).map((key) => `${key}: main's page only`).concat([...mapB.keys()].filter((key) => !mapA.has(key)).map((key) => `${key}: this tree's page only`));
  lines.push(...only);
  const changed = [...mapA.keys()].filter((key) => mapB.has(key) && mapA.get(key) !== mapB.get(key));
  if (changed.length > 0) {
    const shown = changed.slice(0, 20);
    const [va, vb] = await Promise.all([signatureOf(base, { scope, keys: shown }), signatureOf(mine, { scope, keys: shown })]);
    for (const key of shown) {
      const props = Object.keys(va.values[key] ?? {}).filter((name) => va.values[key]![name] !== vb.values[key]?.[name]);
      lines.push(...props.map((name) => `${key} ${name}: ${va.values[key]![name]} → ${vb.values[key]?.[name]}`));
    }
    if (changed.length > shown.length) {
      lines.push(`… and ${changed.length - shown.length} more element(s)`);
    }
  }
  return { count: only.length + changed.length, keys: mapA.size, lines };
}

// ── the live menus ─────────────────────────────────────────────────────────────────────────────────────────────────

interface AxNode {
  ignored?: boolean;
  role?: { value?: string };
  name?: { value?: string };
  properties?: { name: string; value: { value?: unknown } }[];
}
/** Chromium's accessibility node for `window.__sbAx[slot]` (or its `index`th item). */
async function axOf(cdp: CDPSession, expression: string): Promise<AxNode> {
  const { result } = await cdp.send("Runtime.evaluate", { expression });
  if (result.objectId === undefined) {
    throw new Error(`${expression} is not an element`);
  }
  const { nodes } = await cdp.send("Accessibility.getPartialAXTree", { objectId: result.objectId, fetchRelatives: false });
  return (nodes[0] ?? {}) as AxNode;
}
const property = (node: AxNode, name: string) => node.properties?.find((entry) => entry.name === name)?.value.value;
const describeAx = (node: AxNode) => `role ${node.role?.value ?? "none"}, name ${JSON.stringify(node.name?.value ?? "")}${node.properties?.length ? `, ${node.properties.map((entry) => `${entry.name} ${JSON.stringify(entry.value.value)}`).join(", ")}` : ""}`;

/** E11's names, "as Chromium computes it ("Rename ⌘R" for a shortcut item)": the three items of both live menus. */
const ITEM_NAMES = ["Rename ⌘R", "Duplicate ⌘D", "Delete project"];

interface ItemStyle {
  focusVisible: boolean;
  hovered: boolean;
  outlineStyle: string;
  outlineWidth: string;
  outlineColor: string;
  outlineOffset: string;
  backgroundColor: string;
}
const itemStyle = (page: Page, index: number) => page.evaluate((index) => {
  const item = (window as unknown as { __sbAx: { items: HTMLElement[] } }).__sbAx.items[index]!;
  const style = getComputedStyle(item);
  return { focusVisible: item.matches(":focus-visible"), hovered: item.matches(":hover"), outlineStyle: style.outlineStyle, outlineWidth: style.outlineWidth, outlineColor: style.outlineColor, outlineOffset: style.outlineOffset, backgroundColor: style.backgroundColor };
}, index);
const isTransparent = (value: string) => value === "transparent" || /^rgba\(\s*\d+,\s*\d+,\s*\d+,\s*0\s*\)$/.test(value);

/** E11 and E12 on one live menu, in one preset and mode. `find` names the trigger: a selector, and its text when given. */
async function liveMenu(page: Page, where: string, find: { selector: string; text?: string }, vanilla: boolean): Promise<void> {
  await installHelpers(page);
  await settle(page);
  const found = await page.evaluate(({ selector, text }) => {
    const trigger = [...document.querySelectorAll<HTMLButtonElement>(selector)].find((el) => text === undefined || el.textContent!.trim() === text) ?? null;
    const panel = (trigger?.popoverTargetElement ?? null) as HTMLElement | null;
    if (trigger === null || panel === null) {
      return false;
    }
    const items = [...panel.querySelectorAll<HTMLElement>(".sb-menu__item")];
    (window as unknown as { __sbAx: unknown }).__sbAx = { trigger, panel, items };
    trigger.scrollIntoView({ block: "center" });
    return true;
  }, find);
  if (!found) {
    report("E11", false, `${where}: the menu's trigger and panel are on the page`, `not found: ${JSON.stringify(find)}`);
    return;
  }
  await settle(page);

  if (vanilla) {
    const attrs = await page.evaluate(() => {
      const { trigger, panel, items } = (window as unknown as { __sbAx: { trigger: HTMLElement; panel: HTMLElement; items: HTMLElement[] } }).__sbAx;
      return { triggerId: trigger.id, expanded: trigger.getAttribute("aria-expanded"), role: panel.getAttribute("role"), labelledby: panel.getAttribute("aria-labelledby"), panelId: panel.id, itemRoles: items.map((item) => item.getAttribute("role")) };
    });
    const ok = attrs.role === "menu" && attrs.triggerId === `${attrs.panelId}-trigger` && attrs.labelledby === attrs.triggerId && attrs.expanded === "false" && attrs.itemRoles.length === 3 && attrs.itemRoles.every((role) => role === "menuitem");
    report("E11", ok, `${where} (vanilla, after init()): the panel role="menu" and aria-labelledby the trigger's id, "${attrs.panelId}-trigger" for a trigger that had none; every item role="menuitem"; the trigger aria-expanded="false"`, JSON.stringify(attrs));
  }

  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Accessibility.enable");

  // Tab to the trigger: from the element before it in the tab order, so the trigger is reached by a real Tab.
  await page.evaluate(() => (window as unknown as { __sbAx: { trigger: HTMLElement } }).__sbAx.trigger.focus());
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Tab");
  const onTrigger = await page.evaluate(() => document.activeElement === (window as unknown as { __sbAx: { trigger: HTMLElement } }).__sbAx.trigger);
  if (!onTrigger) {
    report("E11", false, `${where}: Tab reaches the trigger`, "focus is elsewhere after Shift+Tab, Tab");
    await cdp.detach();
    return;
  }
  const triggerText = await page.evaluate(() => (window as unknown as { __sbAx: { trigger: HTMLElement } }).__sbAx.trigger.textContent!.replace(/\s+/g, " ").trim());
  const closed = await axOf(cdp, "window.__sbAx.trigger");
  report("E11", closed.role?.value === "button" && property(closed, "hasPopup") === "menu" && property(closed, "expanded") === false, `${where} (tree, closed): the trigger is a button with hasPopup menu and expanded false`, describeAx(closed));

  await page.keyboard.press("Enter");
  await page.waitForFunction(() => {
    const { panel } = (window as unknown as { __sbAx: { panel: HTMLElement } }).__sbAx;
    return panel.matches(":popover-open") && panel.contains(document.activeElement);
  }, undefined, { timeout: 5000 }).catch(() => undefined);
  await settle(page);
  const open = await axOf(cdp, "window.__sbAx.trigger");
  report("E11", open.role?.value === "button" && property(open, "hasPopup") === "menu" && property(open, "expanded") === true, `${where} (tree, opened by Enter): the trigger is a button with hasPopup menu and expanded true`, describeAx(open));
  const menu = await axOf(cdp, "window.__sbAx.panel");
  report("E11", menu.role?.value === "menu" && menu.name?.value === triggerText, `${where} (tree): the panel is a menu named by the trigger's text, ${JSON.stringify(triggerText)}`, describeAx(menu));
  const items: AxNode[] = [];
  for (let i = 0; i < 3; i++) {
    items.push(await axOf(cdp, `window.__sbAx.items[${i}]`));
  }
  report("E11", items.every((node) => node.role?.value === "menuitem") && JSON.stringify(items.map((node) => node.name?.value)) === JSON.stringify(ITEM_NAMES), `${where} (tree): the items are menuitems named ${ITEM_NAMES.map((name) => JSON.stringify(name)).join(", ")}`, items.map(describeAx).join("\n"));
  await cdp.detach();

  // E12: focus landed on the first item by Enter; End takes it to the last, the danger item.
  const tokens = await page.evaluate(() => {
    const helpers = (window as unknown as { __sbDefects: Helpers }).__sbDefects;
    const { panel } = (window as unknown as { __sbAx: { panel: HTMLElement } }).__sbAx;
    return {
      width: getComputedStyle(document.documentElement).getPropertyValue("--sb-focus-ring-width").trim(),
      ring: helpers.color("--sb-focus-ring"),
      fill: helpers.color("--sb-bg-subtle"),
      dangerFill: helpers.color("--sb-danger-subtle"),
      ringBytes: helpers.bytes(helpers.color("--sb-focus-ring")),
      surface: helpers.bytes(getComputedStyle(panel).backgroundColor),
      page: helpers.bytes(getComputedStyle(document.body).backgroundColor),
    };
  });
  const ringed = (style: ItemStyle) => style.outlineStyle === "solid" && style.outlineWidth === tokens.width && style.outlineColor === tokens.ring && style.outlineOffset === "-2px" && isTransparent(style.backgroundColor);
  const shown = (style: ItemStyle) => `:focus-visible ${style.focusVisible}, :hover ${style.hovered}; outline ${style.outlineStyle} ${style.outlineWidth} ${style.outlineColor} offset ${style.outlineOffset}; background ${style.backgroundColor} (want the ring ${tokens.width} ${tokens.ring}, offset -2px, on transparent)`;
  const hover = async(index: number) => {
    const box = await page.evaluate((index) => {
      const r = (window as unknown as { __sbAx: { items: HTMLElement[] } }).__sbAx.items[index]!.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    }, index);
    await page.mouse.move(box.x, box.y);
    await settle(page);
  };
  const plain = 0;
  const danger = 2;

  await page.mouse.move(1, 1);
  await settle(page);
  let style = await itemStyle(page, plain);
  report("E12", style.focusVisible && ringed(style), `${where}: the plain item, focused by Enter (:focus-visible), draws the ring on a transparent background`, shown(style));
  await hover(plain);
  style = await itemStyle(page, plain);
  report("E12", style.focusVisible && style.hovered && ringed(style), `${where}: the plain item, hovered and focused, draws the ring on a transparent background`, shown(style));
  await page.keyboard.press("End");
  await settle(page);
  style = await itemStyle(page, plain);
  report("E12", !style.focusVisible && style.hovered && style.outlineStyle === "none" && style.backgroundColor === tokens.fill, `${where}: the plain item, hovered while the danger item has focus, has no outline and the hover fill (bg-subtle, ${tokens.fill})`, `${shown(style)}`);
  style = await itemStyle(page, danger);
  report("E12", style.focusVisible && ringed(style), `${where}: the danger item, focused by End (:focus-visible), draws the ring on a transparent background`, shown(style));
  await hover(danger);
  style = await itemStyle(page, danger);
  report("E12", style.focusVisible && style.hovered && ringed(style), `${where}: the danger item, hovered and focused, draws the ring on a transparent background`, shown(style));
  await page.keyboard.press("Home");
  await settle(page);
  style = await itemStyle(page, danger);
  report("E12", !style.focusVisible && style.hovered && style.outlineStyle === "none" && style.backgroundColor === tokens.dangerFill, `${where}: the danger item, hovered while the plain item has focus, has no outline and the hover fill (danger-subtle, ${tokens.dangerFill})`, `${shown(style)}`);

  // Measured, not asserted: the ring against the menu's own surface (a translucent surface over the page).
  const alpha = (tokens.surface[3] ?? 255) / 255;
  const surface = tokens.surface.slice(0, 3).map((c, i) => Math.round(c * alpha + tokens.page[i]! * (1 - alpha)));
  const measured = ratio(tokens.ringBytes, surface);
  const line = `${where}: the ring ${hex(tokens.ringBytes)} on the menu's surface ${hex(surface)} = ${measured.toFixed(2)}${measured < 3 ? " — under 3:1, for the owner (E12)" : ""}`;
  notes.push(line);
  console.log(`  ${styleText("dim", "·")} E12 (measured) ${line}`);
}

// ── the run ────────────────────────────────────────────────────────────────────────────────────────────────────────

if (!argv.includes("--no-build")) {
  buildPlayground(ROOT);
}
const temp = mkdtempSync(join(tmpdir(), "sorbet-defects-"));
const browser = await launch();
const main = mainRef();
try {
  if (SIGNATURES) {
    console.log(styleText("bold", `E3: main's library stylesheet (${main.ref}, ${main.sha}) against this tree's, swapped into the same page builds; five presets × two modes, 1280 × 900`));
    const mainCss = stylesheetAt(main.ref, temp);
    const thisCss = stylesheetAt(null, temp);
    const [siteMain, siteThis] = [join(temp, "site-main"), join(temp, "site-this")];
    buildWithStylesheet(mainCss, siteMain);
    buildWithStylesheet(thisCss, siteThis);
    const [pgMain, pgThis, root] = [await servePlayground(siteMain), await servePlayground(siteThis), await serveRoot()];
    const [mainText, thisText] = [readFileSync(mainCss, "utf8"), readFileSync(thisCss, "utf8")];
    try {
      for (const { preset, mode } of PAIRS) {
        const playground = await Promise.all([openPlayground(browser, pgMain.url, preset, mode, VIEWPORT), openPlayground(browser, pgThis.url, preset, mode, VIEWPORT)]);
        await Promise.all(playground.map(settle));
        const pg = await differences(playground[0], playground[1]);
        await Promise.all(playground.map((page) => page.context().close()));
        report("E3", pg.count === 0, `playground ${preset} ${mode}: ${pg.keys} elements and pseudo-elements, ${pg.count} differences`, pg.lines.join("\n"));
        const demo = await Promise.all([openDemo(browser, root.url, preset, mode, mainText), openDemo(browser, root.url, preset, mode, thisText)]);
        await Promise.all(demo.map(settle));
        const dm = await differences(demo[0], demo[1]);
        await Promise.all(demo.map((page) => page.context().close()));
        report("E3", dm.count === 0, `demo ${preset} ${mode}: ${dm.keys} elements and pseudo-elements, ${dm.count} differences`, dm.lines.join("\n"));
      }
    } finally {
      await Promise.all([pgMain.close(), pgThis.close(), root.close()]);
    }
  } else {
    const library = readFileSync(join(DS, "dist", "css", "sorbet.css"), "utf8");
    const mainLibrary = readFileSync(stylesheetAt(main.ref, temp), "utf8");
    const body = await testPageMarkup();

    console.log(styleText("bold", "E8, E9, E13 on the test page (the built library stylesheet, one theme file, the markup each statement names)"));
    for (const { preset, mode } of PAIRS) {
      const page = await openTestPage(browser, preset, mode, library, body);
      await installHelpers(page);
      await settle(page);
      const read = await page.evaluate((variants) => {
        const helpers = (window as unknown as { __sbDefects: Helpers }).__sbDefects;
        const get = (selector: string) => document.querySelector(selector)!;
        const top = (selector: string, pseudo: string | null = null) => getComputedStyle(get(selector), pseudo).borderTopColor;
        const triple = (selector: string) => {
          const style = getComputedStyle(get(selector));
          return { background: style.backgroundColor, color: style.color, cursor: style.cursor };
        };
        return {
          e8: { hr: top("#e8-hr-strong"), strongBefore: top("#e8-labelled-strong", "::before"), strongAfter: top("#e8-labelled-strong", "::after"), plainBefore: top("#e8-labelled", "::before"), plainAfter: top("#e8-labelled", "::after"), border: helpers.color("--sb-border") },
          e9: variants.map((variant) => ({ variant, spinner: top(`#e9-${variant}-loading`, "::after"), label: getComputedStyle(get(`#e9-${variant}`)).color })),
          e13: {
            control: triple("#e13-disabled .sb-date-range__control"),
            field: triple("#e13-multi .sb-combobox__field"),
            fieldDisabled: get("#e13-multi .sb-combobox__field").hasAttribute("data-disabled"),
            inputs: [...document.querySelectorAll("#e13-disabled .sb-date-range__input")].map((input) => ({ color: getComputedStyle(input).color, disabled: (input as HTMLInputElement).disabled })),
          },
        };
      }, [...VARIANTS]);
      await page.context().close();
      const where = `${preset} ${mode}`;

      const { e8 } = read;
      report("E8", e8.strongBefore === e8.hr && e8.strongAfter === e8.hr, `${where}: a labelled strong divider's ::before and ::after paint the strong <hr>'s border-top-color (${e8.hr})`, `::before ${e8.strongBefore}, ::after ${e8.strongAfter}; border is ${e8.border}`);
      report("E8", e8.plainBefore === e8.border && e8.plainAfter === e8.border, `${where}: a labelled divider without --strong paints border (${e8.border})`, `::before ${e8.plainBefore}, ::after ${e8.plainAfter}`);

      for (const { variant, spinner, label } of read.e9) {
        report("E9", spinner === label, `${where} ${variant}: the loading button's spinner (::after border-top-color) is its twin's label colour (${label})`, `spinner ${spinner}, label ${label}`);
      }

      const { e13 } = read;
      const same = (a: typeof e13.control, b: typeof e13.control) => a.background === b.background && a.color === b.color && a.cursor === b.cursor;
      report("E13", e13.fieldDisabled && same(e13.control, e13.field), `${where}: a disabled date range's control computes a disabled multi-combobox field's background-color, color and cursor (${e13.field.background}, ${e13.field.color}, ${e13.field.cursor})`, `control ${e13.control.background}, ${e13.control.color}, ${e13.control.cursor}; field ${e13.field.background}, ${e13.field.color}, ${e13.field.cursor}${e13.fieldDisabled ? "" : "; the field has no data-disabled"}`);
      report("E13", e13.inputs.length === 2 && e13.inputs.every((input) => input.disabled && input.color === e13.control.color), `${where}: its two inputs' color is the control's (${e13.control.color})`, e13.inputs.map((input) => `${input.color}${input.disabled ? "" : " (not disabled)"}`).join(", "));

      const [onMain, onThis] = await Promise.all([openTestPage(browser, preset, mode, mainLibrary, body), openTestPage(browser, preset, mode, library, body)]);
      await Promise.all([onMain, onThis].map(settle));
      const enabled = await differences(onMain, onThis, "#e13-enabled");
      await Promise.all([onMain, onThis].map((page) => page.context().close()));
      report("E13", enabled.count === 0 && enabled.keys > 3, `${where}: an enabled date range computes as on main (${main.ref}'s library stylesheet): ${enabled.keys} elements and pseudo-elements, ${enabled.count} differences`, enabled.lines.join("\n"));
    }

    console.log(styleText("bold", "E11, E12 on the live menus: the built playground's \"Options ▾\" (React) and the demo's #demo-menu (vanilla)"));
    const playground = await servePlayground(ROOT);
    const root = await serveRoot();
    try {
      for (const { preset, mode } of PAIRS) {
        const pg = await openPlayground(browser, playground.url, preset, mode, VIEWPORT);
        await liveMenu(pg, `playground ${preset} ${mode}`, { selector: "button[aria-haspopup=\"menu\"]", text: "Options ▾" }, false);
        await pg.context().close();
        const demo = await openDemo(browser, root.url, preset, mode);
        await liveMenu(demo, `demo ${preset} ${mode}`, { selector: "[popovertarget=\"demo-menu\"]" }, true);
        await demo.context().close();
      }
    } finally {
      await Promise.all([playground.close(), root.close()]);
    }
  }
} finally {
  await browser.close();
  rmSync(temp, { recursive: true, force: true });
}

console.log(styleText("bold", "\nSummary, by statement:"));
let failed = 0;
for (const [statement, { pass, fail }] of tally) {
  failed += fail;
  console.log(`  ${fail === 0 ? styleText("green", "✓") : styleText("red", "✗")} ${statement}: ${pass} passed, ${fail} failed`);
}
if (notes.some((line) => line.includes("under 3:1"))) {
  console.log(styleText("yellow", `  E12 (measured): the ring is under 3:1 on the menu's surface in ${notes.filter((line) => line.includes("under 3:1")).length} of ${notes.length} page-pairs: reported to the owner, not asserted`));
}
if (tally.size === 0) {
  console.error(styleText("red", "✗ no check ran"));
  process.exitCode = 1;
} else if (failed > 0) {
  console.error(styleText("red", `\n✗ ${failed} defects check(s) failed`));
  process.exitCode = 1;
} else {
  console.log(styleText("green", SIGNATURES ? "\n✓ E3: 0 differences between main's library stylesheet and this tree's, on both pages, in every preset and mode" : "\n✓ every defects check holds"));
}
