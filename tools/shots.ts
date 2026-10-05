/**
 * The screenshot comparer, run by hand: `pnpm shots baseline|compare [options]`.
 *
 * It holds the promise "the four frozen presets are pixel-identical"
 * (legibility-spec.md L4, L148, L155). For each preset, in light and dark, in
 * three runs — left-to-right, right-to-left, and a coarse pointer (a touch
 * screen: `(pointer: coarse)`, `(hover: none)`) — it walks the playground the
 * way the audit of steps 2.3 and 2.4 did (`audit234/tools/run.mts`):
 *
 *   - the full page;
 *   - a keyboard Tab walk over every focus stop;
 *   - every roving and tabindex=-1 item, focused after a key press;
 *   - a hover on every interactive element, and a press on every button;
 *   - every overlay open (menu, popover, drawer, modal, confirm, toast, command
 *     palette, combobox, date range, date picker, colour panel), with a hover on
 *     its items and key navigation inside;
 *   - every field invalid, and invalid and focused;
 *   - every control disabled, then disabled and hovered, then disabled and
 *     focused (forced through the DevTools protocol, since a disabled control
 *     cannot take focus);
 *
 * and then STAGED FIXTURES for what the playground lacks
 * (`audit234/tools/staged.mts`): the slider (resting, disabled, invalid), the
 * switch (off, on, disabled), the interactive, raised, flat and sunken cards,
 * pills tabs, the five toned progress bars, a static toast, small, large and
 * variant buttons, `aria-disabled`, fields and choices — each at rest, hovered,
 * pressed, hovered and pressed, and focused (forced), so a disabled one is also
 * shot disabled and focused.
 *
 * A state shot is cropped to the element with 24px round it (a halo, a ring
 * or a glow is inside); an overlay shot to the open overlay. That keeps a run
 * to about a thousand small files; it would not see a state of one element
 * that paints somewhere far from it, which nothing in the library does.
 *
 * A crop is never quietly something else (audit finding F13, guards lens).
 * An element whose crop does not fit in the viewport is scrolled to the
 * middle of it first. The margin may stop only where nothing lies beyond:
 * the document's edge, or the viewport's for an element in a fixed layer (a
 * drawer, a toast). A missing element, one with no size, or one whose crop
 * still does not fit though the element would, is an `-error`, which fails
 * the run; an element larger than the viewport is shot as the part in view,
 * and its description says so. Before, a fixture staged below the 900px fold
 * was shot as whatever the viewport held, one ending at the fold lost its
 * margin, and a selector that matched nothing was shot as the viewport, all
 * without a word. The whole fixture grid, taller than the viewport, is a
 * full-page shot (`staged-all`), and an overlay recipe after which no
 * overlay is open says so in its description ("no overlay open: the
 * viewport"). A description that differs between the baseline and the run
 * is a misaligned shot, never a compared one.
 *
 * Every shot is taken in a fresh document (see `Session`): a first pass only
 * lists what to shoot, as CSS paths, and each shot then reloads, sets its
 * state up from nothing and shoots. Long sessions drift by a level or two at
 * antialiased edges and are not comparable with each other.
 *
 *   pnpm shots baseline [--at <ref>]   shoot THIS tree's playground and keep it as the baseline.
 *                                      With `--at`, the playground is built with <ref>'s LIBRARY
 *                                      STYLESHEET in place of this tree's (see below); this
 *                                      checkout's own build is untouched
 *   pnpm shots compare                 shoot this tree TWICE: the first run is the control. A shot
 *                                      that differs between the two is UNSTABLE and is reported, and
 *                                      blocks the success line. Then every shot is compared with the
 *                                      baseline
 *
 * What `--at <ref>` swaps, and why only that (audit finding F6, frozen lens).
 * The promise is about the library stylesheet: the frozen presets' theme
 * files are byte-identical to e24df74's (the golden gate, check-golden.ts),
 * and the playground is a demo, not the library. But the playground's own
 * text counts the checks the design system's tokens make ("700 checks" at
 * e24df74, "823" after step 2.1), so a baseline of <ref>'s whole playground
 * differs from this one in every frozen full-page shot, and the verdict L4
 * asks for, identical to e24df74, could never be given. So `--at` compiles
 * <ref>'s `packages/design-system/src/styles/index.scss` (from `git archive`,
 * with this repo's sass, expanded, as `build:css` does) and builds THIS
 * tree's playground with Vite resolving `@sorbet/design-system/css` to it
 * (`SORBET_LIBRARY_CSS`, apps/playground/vite.config.ts), into a temporary
 * directory. The two runs then differ in the library stylesheet and nothing
 * else: the theme files are this tree's in both, which for the frozen four
 * are e24df74's bytes.
 *
 * Where a baseline came from, and when a compare refuses it (F14, guards
 * lens; `tools/shots-provenance.ts`). `baseline.json` records the commit the
 * library stylesheet came from (`libraryCss`), a digest of the playground
 * that was shot (`playground`: every built file but the library stylesheet),
 * the tree, the Chromium and the shot count. A compare refuses, with exit 1,
 * a baseline that does not record them; one whose stylesheet came from a
 * working tree with uncommitted changes; one whose stylesheet is this
 * checkout's own HEAD (the tree compared with itself, which printed the
 * success line before); one taken by another Chromium; and one shot on a
 * different playground. The success line names the baseline's commit, so a
 * quoted summary shows what the frozen presets were compared with.
 *
 * The status icons are masked (L167). From step 2.5 a status component leads
 * with its icon in every preset, the frozen four included, and both sides of a
 * compare render this tree's markup, so the icons are on both sides. Every
 * shot, baseline and compare, is taken with `MASK` written after `FREEZE`, which
 * removes each `.sb-status` slot (the glyph, the hidden word and the room they
 * take), and with it the frozen presets must be pixel-identical. `baseline.json`
 * records the mask, a compare refuses a baseline whose mask is missing or not
 * its own, and the success line says the icons were masked.
 *
 * Options: `--no-build`, `--only <preset>`, `--variant ltr|rtl|coarse`,
 * `--workers <n>` (default 8), `--with-sorbet`. `--no-build` uses this
 * tree's packages and playground as they are built; `--at` still builds its
 * own copy of the playground with the other stylesheet (seconds, not minutes).
 *
 * When it may say "identical" (L155): only when every frozen preset was
 * compared, in both modes and all three runs, with no difference, no missing
 * shot, no misaligned walk and no unstable shot. A run that compares no frozen
 * shot (`--only sorbet`) ends with "no frozen preset compared"; one that leaves
 * any frozen preset, mode or run out ends with "not every frozen preset
 * compared"; both exit non-zero. Sorbet is shot only on request
 * (`--with-sorbet`, `--only sorbet`), and its difference is reported, never
 * failed: it is the preset the change is for.
 *
 * Where the shots live: `node_modules/.cache/sorbet-shots/` in this checkout,
 * or `SORBET_SHOTS_DIR`. It is outside git on purpose — reproducible from a
 * commit (`--at`), and only valid for the Chromium build that took it — and
 * inside `node_modules/` because that is ignored and belongs to one checkout.
 * `baseline.json` records where the baseline came from (above).
 *
 * Exit code: 0 only on the success line; 1 otherwise; 2 on a usage error.
 */

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { styleText } from "node:util";

import { compile } from "sass";

import { ALL_PRESETS, buildPlayground, describeTree, FROZEN_PRESETS, launch, MODES, openPlayground, ROOT, servePlayground, type Mode, type PresetName } from "./playground-browser.ts";
import { encodePng, pixelDiff, untilStable } from "./png.ts";
import { baselineRefusal, digestPlayground, type Manifest } from "./shots-provenance.ts";

import type { Browser, CDPSession, Page } from "playwright";

const VARIANTS = ["ltr", "rtl", "coarse"] as const;
type Variant = (typeof VARIANTS)[number];

const argv = process.argv.slice(2);
const command = argv[0];
const flag = (name: string) => argv.includes(name);
const option = (name: string) => {
  const at = argv.indexOf(name);
  return at === -1 ? undefined : argv[at + 1];
};
if (command !== "baseline" && command !== "compare") {
  console.error("usage: pnpm shots baseline [--at <ref>] | compare   [--no-build] [--only <preset>] [--variant ltr|rtl|coarse] [--workers <n>]");
  process.exit(2);
}
const only = option("--only");
const variantOnly = option("--variant");
if ((only !== undefined && !(ALL_PRESETS as readonly string[]).includes(only)) || (variantOnly !== undefined && !(VARIANTS as readonly string[]).includes(variantOnly))) {
  console.error(`--only takes a preset (${ALL_PRESETS.join(", ")}); --variant takes ${VARIANTS.join(", ")}`);
  process.exit(2);
}
const WORKERS = Number(option("--workers") ?? 8);
const STORE = process.env.SORBET_SHOTS_DIR ?? join(ROOT, "node_modules", ".cache", "sorbet-shots");
const VIEWPORT = { width: 1280, height: 900 };
// The frozen four by default: they are what the verdict is about. Sorbet, the preset a change is for, is shot
// only when asked (`--only sorbet`, or `--with-sorbet`), and its differences are reported, never failed.
const presets = ALL_PRESETS.filter((p) => (only === undefined ? (FROZEN_PRESETS as readonly string[]).includes(p) || flag("--with-sorbet") : p === only));
const variants = VARIANTS.filter((v) => variantOnly === undefined || v === variantOnly);
interface Job {
  preset: PresetName;
  mode: Mode;
  variant: Variant;
}
const jobs: Job[] = presets.flatMap((preset) => MODES.flatMap((mode) => variants.map((variant) => ({ preset, mode, variant }))));
const jobName = (job: Job) => `${job.preset}-${job.mode}-${job.variant}`;

// ---------------------------------------------------------------------------------------------------------------
// Shooting one job

/** The fixtures the playground lacks (L155; audit234/tools/staged.mts), each with an id. */
const FIXTURES = `<div id="shots-fixtures" style="padding:32px;display:grid;gap:28px;grid-template-columns:repeat(3,minmax(0,1fr));background:var(--sb-bg)">
<input type="range" class="sb-slider" id="fx-s1" value="40">
<input type="range" class="sb-slider" id="fx-s2" value="40" disabled>
<input type="range" class="sb-slider" id="fx-s3" value="70" aria-invalid="true">
<div class="sb-card sb-card--interactive" id="fx-c1" tabindex="0"><div class="sb-card__body">Interactive card</div></div>
<div class="sb-card sb-card--raised" id="fx-c2"><div class="sb-card__body">Raised</div></div>
<div class="sb-card sb-card--flat" id="fx-c3"><div class="sb-card__body">Flat</div></div>
<div class="sb-card sb-card--sunken" id="fx-c4"><div class="sb-card__body">Sunken</div></div>
<div class="sb-card" id="fx-c5"><div class="sb-card__body">Card</div></div>
<div class="sb-tabs sb-tabs--pills" id="fx-t1"><div class="sb-tabs__list" role="tablist"><button class="sb-tabs__tab" role="tab" aria-selected="true" id="fx-t1a">One</button><button class="sb-tabs__tab" role="tab" aria-selected="false" id="fx-t1b">Two</button></div></div>
${["success", "warning", "danger", "secondary", "accent"].map((t) => `<div class="sb-progress sb-progress--${t}" id="fx-p-${t}"><div class="sb-progress__bar" style="inline-size:60%"></div></div>`).join("")}
<div class="sb-toast" id="fx-toast" style="position:static">A static toast</div>
<label class="sb-choice"><input type="checkbox" class="sb-switch" role="switch" id="fx-sw1"> off</label>
<label class="sb-choice"><input type="checkbox" class="sb-switch" role="switch" id="fx-sw2" checked> on</label>
<label class="sb-choice"><input type="checkbox" class="sb-switch" role="switch" id="fx-sw3" disabled> disabled</label>
<label class="sb-choice"><input type="checkbox" class="sb-switch" role="switch" id="fx-sw4" disabled checked> disabled on</label>
<label class="sb-choice"><input type="checkbox" class="sb-checkbox" id="fx-cb1" aria-invalid="true"> invalid</label>
<label class="sb-choice"><input type="radio" class="sb-radio" id="fx-rd1" name="fx-rr"> radio</label>
<input class="sb-input" id="fx-in1" value="x"><input class="sb-input" id="fx-in2" aria-invalid="true" value="bad"><input class="sb-input" id="fx-in3" disabled value="off">
<textarea class="sb-textarea" id="fx-ta1" aria-invalid="true">bad</textarea>
<button class="sb-button sb-button--sm" id="fx-b1">Small label</button><button class="sb-button sb-button--lg" id="fx-b2">Large</button><button class="sb-button sb-button--outline sb-button--sm" id="fx-b3">Outline sm</button>
<button class="sb-button sb-button--secondary" id="fx-b4">Secondary</button><button class="sb-button sb-button--accent" id="fx-b5">Accent</button><button class="sb-button sb-button--danger" id="fx-b6">Danger</button>
<button class="sb-button sb-button--soft" id="fx-b7">Soft</button><button class="sb-button sb-button--ghost" id="fx-b8">Ghost</button><button class="sb-button sb-button--link" id="fx-b9">Link</button>
<a class="sb-button" href="#x" id="fx-b10">Anchor</a><button class="sb-button" aria-disabled="true" id="fx-b11">Aria-disabled</button><button class="sb-button sb-button--outline" disabled id="fx-b12">Disabled outline</button>
<h2 id="fx-h2">Heading</h2><label class="sb-label" id="fx-lb">Label</label><span class="sb-text sb-text--subtle" id="fx-tx">subtle text</span>
</div>`;
const FORCED: string[][] = [[], ["hover"], ["active"], ["hover", "active"], ["focus", "focus-visible", "focus-within"]];
const FREEZE = "*,*::before,*::after{transition:none!important;animation:none!important;caret-color:transparent!important}";
/**
 * The status icons, masked on both sides of every compare (legibility-spec.md L167). From step 2.5 a status component
 * leads with its icon and a hidden word in every preset, the frozen four included: content both sides render, since
 * both render this tree's markup. Every icon and word sits in one `.sb-status` slot, so this removes the glyph, the
 * word and the slot's room together, and with it the frozen presets must be pixel-identical. The icons themselves are
 * looked at, unmasked, on a sheet; the markup is held by packages/component-library/tools/test-status.ts.
 */
const MASK = ".sb-status{display:none!important}";

interface Shot {
  name: string;
  what: string;
}

/**
 * Every shot is taken in a FRESH document: the page is navigated again, the
 * state is set up from nothing, then the one shot is taken. A long session
 * that walks hundreds of states accumulates rasterisation history, and two
 * such sessions disagree in a few percent of shots by one to a few colour
 * levels at antialiased corners and glyph edges, while the same shots taken in
 * fresh pages are byte-identical across sessions and across the two trees
 * (audit finding m6; checked on this tool's first, long-session version, whose
 * every "stable" frozen difference vanished when reproduced in a fresh page).
 * A first pass, in one page, only discovers what there is to shoot: the focus
 * stops and the elements of each kind, each recorded as a CSS path, so the
 * fresh pages can find them again.
 */
class Session {
  readonly page: Page;
  readonly job: Job;
  readonly url: string;
  cdp?: CDPSession;
  constructor(page: Page, job: Job, url: string) {
    this.page = page;
    this.job = job;
    this.url = url;
  }

  /** A fresh document under the job's preset, mode and direction, with motion frozen, and optionally the fixtures. */
  async fresh(fixtures = false) {
    const { page, job } = this;
    await page.goto(this.url, { waitUntil: "load" });
    await page.waitForFunction(({ preset, mode }) => {
      const link = document.getElementById("preset-css") as HTMLLinkElement | null;
      return Boolean(link?.sheet) && link!.href.includes(preset) && document.documentElement.dataset.theme === mode;
    }, { preset: job.preset, mode: job.mode });
    await page.evaluate(({ rtl, fixtures, html, freeze, mask }) => {
      if (fixtures) {
        document.body.insertAdjacentHTML("afterbegin", html);
      }
      if (rtl) {
        document.documentElement.dir = "rtl";
      }
      const style = document.createElement("style");
      style.textContent = freeze + mask;
      document.head.append(style);
      window.scrollTo(0, 0);
    }, { rtl: job.variant === "rtl", fixtures, html: FIXTURES, freeze: FREEZE, mask: MASK });
  }

  async settle() {
    await this.page.evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))));
  }

  /**
   * The crop round an element: 24px of margin, whole pixels, and a note for the shot's description when the crop is
   * not the whole of that ("" when it is). Where the margin may stop: the document's edge, or the viewport's for an
   * element in a fixed layer (a drawer, a toast, a popover), since nothing exists beyond either. An element whose
   * crop does not fit in the viewport is scrolled to the middle of it first. Then (F13), never a silent stand-in:
   * an element that is missing or has no size, or whose crop still does not fit though the element would, throws,
   * and the recipe becomes an `-error` that fails the run; an element larger than the viewport is shot as the part
   * of it in view, and the note says so. An element that fits is shot where it is, as before. `"viewport"` shoots
   * the viewport as it is.
   */
  async shoot(file: string, crop: string): Promise<string> {
    await this.settle();
    type Measured = { box: { x: number; y: number; width: number; height: number }; note: string } | { error: string } | { scroll: true };
    const measure = (scroll: boolean) => this.page.evaluate(({ selector, scroll }): Measured => {
      const element = document.querySelector(selector);
      if (!element) {
        return { error: `no element matches ${selector}` };
      }
      if (scroll) {
        element.scrollIntoView({ block: "center", inline: "nearest", behavior: "instant" });
      }
      const r = element.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) {
        return { error: `${selector} has no size` };
      }
      let fixed = false;
      for (let e: Element | null = element; e && !fixed; e = e.parentElement) {
        fixed = getComputedStyle(e).position === "fixed";
      }
      const page = document.scrollingElement ?? document.documentElement;
      // The edges nothing lies beyond, in viewport coordinates: the margin may stop there, and nowhere else.
      const [left, top, right, bottom] = fixed ? [0, 0, innerWidth, innerHeight] : [-scrollX, -scrollY, page.scrollWidth - scrollX, page.scrollHeight - scrollY];
      const [x0, y0] = [Math.max(left, Math.floor(r.left) - 24), Math.max(top, Math.floor(r.top) - 24)];
      const [x1, y1] = [Math.min(right, Math.ceil(r.right) + 24), Math.min(bottom, Math.ceil(r.bottom) + 24)];
      if (x0 >= 0 && y0 >= 0 && x1 <= innerWidth && y1 <= innerHeight) {
        return { box: { x: x0, y: y0, width: x1 - x0, height: y1 - y0 }, note: "" };
      }
      const larger = x1 - x0 > innerWidth || y1 - y0 > innerHeight;
      if (larger && scroll) {
        const [cx0, cy0, cx1, cy1] = [Math.max(0, x0), Math.max(0, y0), Math.min(innerWidth, x1), Math.min(innerHeight, y1)];
        return { box: { x: cx0, y: cy0, width: cx1 - cx0, height: cy1 - cy0 }, note: `larger than the viewport (${x1 - x0}x${y1 - y0}): the part in view` };
      }
      return scroll ? { error: `${selector} with its 24px does not fit in the viewport (${x0}, ${y0} to ${x1}, ${y1} in ${innerWidth}x${innerHeight})` } : { scroll: true };
    }, { selector: crop, scroll });
    let box: { x: number; y: number; width: number; height: number } | null = null;
    let note = "";
    if (crop !== "viewport") {
      let measured = await measure(false);
      if ("scroll" in measured) {
        measured = await measure(true);
        await this.settle();
      }
      if ("error" in measured) {
        throw new Error(measured.error);
      }
      if ("box" in measured) {
        ({ box, note } = measured);
      }
    }
    // Taken until two in a row agree: a forced state is not always painted on the first frame (untilStable, png.ts).
    const png = await untilStable(() => (box === null ? this.page.screenshot({ animations: "disabled", caret: "hide" }) : this.page.screenshot({ clip: box, animations: "disabled", caret: "hide" })), () => this.settle());
    writeFileSync(file, png);
    return note;
  }

  async force(selector: string, states: string[]) {
    this.cdp ??= await this.page.context().newCDPSession(this.page);
    await this.cdp.send("DOM.enable");
    await this.cdp.send("CSS.enable");
    const { root } = await this.cdp!.send("DOM.getDocument", { depth: -1 });
    const { nodeId } = await this.cdp!.send("DOM.querySelector", { nodeId: root.nodeId, selector });
    await this.cdp!.send("CSS.forcePseudoState", { nodeId, forcedPseudoClasses: states });
  }

  /** Scroll an element to the middle of the viewport and return its centre. */
  center(selector: string) {
    return this.page.evaluate((selector) => {
      const e = document.querySelector(selector)!;
      e.scrollIntoView({ block: "center", behavior: "instant" });
      const r = e.getBoundingClientRect();
      return [r.x + r.width / 2, r.y + r.height / 2] as const;
    }, selector);
  }

  /** Keyboard modality, then focus: what :focus-visible needs, without walking the Tab order to get there. */
  async keyboardFocus(selector: string) {
    await this.page.keyboard.press("Shift");
    await this.page.evaluate((selector) => {
      const e = document.querySelector(selector) as HTMLElement;
      e.scrollIntoView({ block: "center", behavior: "instant" });
      e.focus({ preventScroll: true });
    }, selector);
  }
}

/** A CSS path to an element, from <html>, by child index: the same element in a fresh render of the same page. */
const PATH_OF = "(e) => { const parts = []; for (let n = e; n && n.nodeType === 1 && n !== document.documentElement; n = n.parentElement) { parts.unshift(n.tagName.toLowerCase() + \":nth-child(\" + ([...n.parentElement.children].indexOf(n) + 1) + \")\"); } return \"html > \" + parts.join(\" > \"); }";
const DESCRIBE = "(e) => e ? [e.tagName, typeof e.className === \"string\" ? e.className : \"\", (e.textContent || \"\").trim().slice(0, 30), e.getAttribute(\"aria-label\") || \"\"].join(\" \") : \"none\"";

/** The laid-out elements matching `selector`, as paths and descriptions. */
const listOf = (page: Page, selector: string, limit = 1000) => page.evaluate(`(() => {
  const pathOf = ${PATH_OF}; const describe = ${DESCRIBE};
  return [...document.querySelectorAll(${JSON.stringify(selector)})].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== "hidden" && !e.closest("[popover]:not(:popover-open), dialog:not([open])"); }).slice(0, ${limit}).map((e) => ({ path: pathOf(e), what: describe(e) }));
})()`) as Promise<{ path: string; what: string }[]>;

const SETUP = {
  invalid: () => {
    document.querySelectorAll("input, textarea, select").forEach((e) => e.setAttribute("aria-invalid", "true"));
    document.querySelectorAll(".sb-combobox__field, .sb-date-range__control, .sb-field").forEach((e) => e.setAttribute("data-invalid", ""));
  },
  disabled: () => {
    document.querySelectorAll("button, input, select, textarea").forEach((e) => e.setAttribute("disabled", ""));
    document.querySelectorAll("a, [role=tab], [role=menuitem]").forEach((e) => e.setAttribute("aria-disabled", "true"));
  },
};

/** The overlays of L155: how to open each, and the keys pressed inside it. */
const OVERLAYS: { label: string; open: (s: Session) => Promise<void>; keys: string[] }[] = (() => {
  const button = (name: string | RegExp) => async(s: Session) => {
    const b = s.page.getByRole("button", { name }).first();
    await b.scrollIntoViewIfNeeded();
    await b.click();
  };
  const first = (selector: string) => async(s: Session) => {
    const t = s.page.locator(selector).first();
    await t.scrollIntoViewIfNeeded();
    await t.click();
  };
  return [
    { label: "menu", open: button("Options ▾"), keys: ["ArrowDown", "ArrowDown", "ArrowDown", "ArrowDown"] },
    { label: "popover", open: button("Popover ▾"), keys: ["Tab", "Tab", "Tab", "Tab"] },
    { label: "drawer", open: button("Open drawer"), keys: ["Tab", "Tab", "Tab", "Tab", "Tab", "Tab"] },
    { label: "modal", open: async(s) => {
      await button("Options ▾")(s);
      await s.page.locator(".sb-menu__item", { hasText: "Delete project" }).click();
    }, keys: ["Tab", "Tab", "Tab"] },
    { label: "confirm", open: button(/Delete account/), keys: ["Tab", "Tab"] },
    { label: "toast", open: async(s) => {
      await button("Sticky toast")(s);
      await s.page.waitForSelector(".sb-toast");
    }, keys: ["Tab"] },
    { label: "command", open: first(".sb-command-trigger"), keys: ["ArrowDown", "ArrowDown", "ArrowDown"] },
    { label: "combobox", open: async(s) => {
      const t = s.page.getByPlaceholder("Search people…");
      await t.scrollIntoViewIfNeeded();
      await t.click();
      await s.page.keyboard.press("ArrowDown");
    }, keys: ["ArrowDown", "ArrowDown", "ArrowDown"] },
    { label: "daterange", open: first(".sb-date-range button"), keys: ["Tab", "Tab"] },
    { label: "datepicker", open: first(".sb-date-picker button"), keys: ["Tab"] },
    { label: "color", open: first(".sb-color-input__swatch"), keys: ["Tab", "Tab", "Tab"] },
  ];
})();
const OVERLAY_ITEMS = "[role=menuitem], [role=option], .sb-menu__item, .sb-combobox__option, .sb-command__option, [popover]:popover-open button, [popover]:popover-open a[href], .sb-toast button, dialog[open] button";
const OPEN = "[popover]:popover-open, dialog[open], .sb-toast";

/** What an overlay recipe crops to when no overlay is open after it: the viewport, said in the shot's description. */
const NO_OVERLAY = "no overlay open";
/** Mark the last open overlay for the crop; NO_OVERLAY when none is open. */
const markOverlay = (page: Page) => page.evaluate(({ open, none }) => {
  document.querySelectorAll("[data-shots-ov]").forEach((e) => e.removeAttribute("data-shots-ov"));
  const all = [...document.querySelectorAll(open)].filter((e) => e.getBoundingClientRect().width > 0);
  all.at(-1)?.setAttribute("data-shots-ov", "");
  return all.length > 0 ? "[data-shots-ov]" : none;
}, { open: OPEN, none: NO_OVERLAY });

/** What one job shoots: each shot a recipe run in a fresh document. */
interface Recipe {
  name: string;
  what: string;
  fixtures?: boolean;
  run: (s: Session) => Promise<string | null>;
}

/** The first pass: one page, nothing shot, every recipe listed. */
async function discover(s: Session): Promise<Recipe[]> {
  const { page } = s;
  const pad = (i: number, n = 3) => String(i).padStart(n, "0");
  const recipes: Recipe[] = [{ name: "full", what: "the full page", run: async() => "full" }];
  await s.fresh();

  // The focus stops, in Tab order, until focus leaves the page or comes back round.
  const stops: { path: string; what: string }[] = [];
  for (let i = 0; i < 800; i++) {
    await page.keyboard.press("Tab");
    const stop = await page.evaluate(`(() => { const e = document.activeElement; if (!e || e === document.body) { return null; } if (e.hasAttribute("data-shots-tab")) { return null; } e.setAttribute("data-shots-tab", ""); return { path: (${PATH_OF})(e), what: (${DESCRIBE})(e) }; })()`) as { path: string; what: string } | null;
    if (stop === null) {
      break;
    }
    stops.push(stop);
  }
  stops.forEach((stop, i) => recipes.push({ name: `tab-${pad(i)}`, what: stop.what, run: async(x) => {
    await x.keyboardFocus(stop.path);
    return stop.path;
  } }));
  await s.fresh();
  const each = async(prefix: string, selector: string, limit: number, act: (x: Session, path: string) => Promise<string | null>, setup?: keyof typeof SETUP) => {
    if (setup) {
      await page.evaluate(SETUP[setup]);
    }
    const found = await listOf(page, selector, limit);
    found.forEach((el, i) => recipes.push({ name: `${prefix}-${pad(i)}`, what: el.what, run: async(x) => {
      if (setup) {
        await x.page.evaluate(SETUP[setup]);
      }
      return act(x, el.path);
    } }));
  };
  const focus = async(x: Session, path: string) => {
    await x.keyboardFocus(path);
    return path;
  };
  const hover = async(x: Session, path: string) => {
    const [cx, cy] = await x.center(path);
    await x.page.mouse.move(cx, cy);
    return path;
  };
  await each("roving", '[role=tab], [role=radio], [role=gridcell], .sb-calendar__day, [tabindex="-1"], input[type=radio], input[type=range], .sb-rating input, .sb-pagination button, .sb-pagination a', 150, focus);
  await each("hover", ".sb-card, [role=menuitem], [role=option], button, a[href], [role=tab], tr, .sb-switch, .sb-checkbox, .sb-radio, input, select, textarea, .sb-chip, label, .sb-sidebar__item, .sb-calendar__day", 1000, hover);
  await each("press", ".sb-button, .sb-pagination button, [role=tab], .sb-segmented button, .sb-chip", 1000, async(x, path) => {
    await hover(x, path);
    await x.page.mouse.down();
    return path;
  });

  // Overlays: open, each item hovered, then the keys inside, each a recipe from a fresh document.
  for (const overlay of OVERLAYS) {
    await s.fresh();
    let items: { path: string; what: string }[];
    try {
      await overlay.open(s);
      await page.waitForTimeout(150);
      items = await listOf(page, OVERLAY_ITEMS, 12);
    } catch(error) {
      recipes.push({ name: `overlay-${overlay.label}-error`, what: String(error).split("\n")[0]!, run: async() => null });
      continue;
    }
    const opened = async(x: Session) => {
      await overlay.open(x);
      await x.page.waitForTimeout(150);
    };
    recipes.push({ name: `overlay-${overlay.label}`, what: `${overlay.label} open`, run: async(x) => {
      await opened(x);
      return markOverlay(x.page);
    } });
    items.forEach((item, i) => recipes.push({ name: `overlay-${overlay.label}-hover-${pad(i, 2)}`, what: item.what, run: async(x) => {
      await opened(x);
      const box = await x.page.evaluate((path) => {
        const r = document.querySelector(path)?.getBoundingClientRect();
        return r ? [r.x + r.width / 2, r.y + r.height / 2] : null;
      }, item.path);
      if (box) {
        await x.page.mouse.move(box[0]!, box[1]!);
      }
      return markOverlay(x.page);
    } }));
    overlay.keys.forEach((_, k) => recipes.push({ name: `overlay-${overlay.label}-key-${k}`, what: `${overlay.label} after ${k + 1} key(s)`, run: async(x) => {
      await opened(x);
      await x.page.mouse.move(VIEWPORT.width - 1, VIEWPORT.height - 1);
      for (const key of overlay.keys.slice(0, k + 1)) {
        await x.page.keyboard.press(key);
      }
      return markOverlay(x.page);
    } }));
  }

  // Every field invalid, and each invalid field focused.
  await s.fresh();
  recipes.push({ name: "invalid-full", what: "every field invalid", run: async(x) => {
    await x.page.evaluate(SETUP.invalid);
    return "full";
  } });
  await each("invalid-focus", "input, textarea, select", 1000, focus, "invalid");

  // Every control disabled; then each hovered, and each focused (forced: a disabled control takes no focus).
  await s.fresh();
  recipes.push({ name: "disabled-full", what: "every control disabled", run: async(x) => {
    await x.page.evaluate(SETUP.disabled);
    return "full";
  } });
  const disabled = ".sb-button, .sb-switch, .sb-checkbox, .sb-radio, .sb-input, .sb-textarea, .sb-select select, .sb-slider";
  await each("disabled-hover", disabled, 80, hover, "disabled");
  await s.fresh();
  await each("disabled-focus", disabled, 80, async(x, path) => {
    await x.center(path);
    await x.force(path, ["focus", "focus-visible"]);
    return path;
  }, "disabled");

  // The staged fixtures, each under each forced state.
  await s.fresh(true);
  // The whole grid is taller than the viewport, so it is a full-page shot, not a crop the viewport would cut (F13).
  recipes.push({ name: "staged-all", what: "every fixture at rest", fixtures: true, run: async() => "full" });
  const ids = await page.evaluate(() => [...document.querySelectorAll("#shots-fixtures [id]")].map((e) => e.id));
  for (const id of ids) {
    for (const states of FORCED) {
      recipes.push({ name: `staged-${id}-${states[0] === "focus" ? "focus" : states.join("+") || "rest"}`, what: `#${id}`, fixtures: true, run: async(x) => {
        if (states.length > 0) {
          await x.force(`#${id}`, states);
        }
        return `#${id}`;
      } });
    }
  }
  return recipes;
}

/** One job: discover, then run every recipe in a fresh document. */
async function shootJob(browser: Browser, url: string, job: Job, dir: string): Promise<Shot[]> {
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const page = await openPlayground(browser, url, job.preset, job.mode, VIEWPORT, 1, { coarse: job.variant === "coarse" });
  const s = new Session(page, job, url);
  const recipes = await discover(s);
  const shots: Shot[] = [];
  for (const recipe of recipes) {
    await page.mouse.up().catch(() => undefined);
    await s.fresh(recipe.fixtures ?? false);
    await page.mouse.move(VIEWPORT.width - 1, VIEWPORT.height - 1);
    if (recipe.name.endsWith("-error")) {
      shots.push({ name: recipe.name, what: recipe.what });
      continue;
    }
    const file = join(dir, `${recipe.name}.png`);
    let what = recipe.what;
    try {
      const crop = await recipe.run(s);
      if (crop === null) {
        throw new Error("the recipe named nothing to shoot");
      }
      if (crop === "full") {
        await s.settle();
        writeFileSync(file, await untilStable(() => page.screenshot({ fullPage: true, animations: "disabled", caret: "hide" }), () => s.settle()));
      } else if (crop === NO_OVERLAY) {
        what = `${what} (${NO_OVERLAY}: the viewport)`;
        await s.settle();
        await s.shoot(file, "viewport");
      } else {
        const note = await s.shoot(file, crop);
        what = note === "" ? what : `${what} (${note})`;
      }
    } catch(error) {
      // A failed setup or a crop that cannot be taken (F13) fails the run; it is never shot as something else.
      shots.push({ name: `${recipe.name}-error`, what: String(error).split("\n")[0]! });
      continue;
    }
    shots.push({ name: recipe.name, what });
  }
  await page.context().close();
  writeFileSync(join(dir, "shots.json"), `${JSON.stringify(shots, null, 1)}\n`);
  return shots;
}

/** Shoot every job into `<into>/<job>/`, `WORKERS` at a time, from a built playground at `root`. */
async function shootAll(browser: Browser, root: string, into: string): Promise<number> {
  const server = await servePlayground(root);
  let total = 0;
  try {
    const queue = [...jobs];
    await Promise.all(Array.from({ length: Math.min(WORKERS, queue.length) }, async() => {
      for (let job = queue.shift(); job; job = queue.shift()) {
        const shots = await shootJob(browser, server.url, job, join(into, jobName(job)));
        total += shots.length;
        console.log(`  ${jobName(job).padEnd(24)} ${shots.length} shots`);
      }
    }));
  } finally {
    await server.close();
  }
  return total;
}

/**
 * `<ref>`'s library stylesheet, compiled as `build:css` compiles it (this repo's sass, expanded), into a file in a
 * temporary directory. Only `packages/design-system/src/styles` is exported; `_generated.scss` is tracked there.
 */
function stylesheetAt(ref: string, dir: string): string {
  const archive = execFileSync("git", ["archive", "--format=tar", ref, "packages/design-system/src/styles"], { cwd: ROOT, maxBuffer: 1 << 30 });
  execFileSync("tar", ["-x", "-C", dir], { input: archive });
  const styles = join(dir, "packages", "design-system", "src", "styles");
  const file = join(dir, "library.css");
  writeFileSync(file, compile(join(styles, "index.scss"), { loadPaths: [styles], style: "expanded" }).css);
  return file;
}

/**
 * This tree's playground, built with `stylesheet` as `@sorbet/design-system/css` (F6), into `<site>/apps/playground/
 * dist`, the layout `servePlayground` serves. This tree's packages must be built already: their dist/ is what the
 * playground's JavaScript and theme files come from.
 */
function buildWithStylesheet(stylesheet: string, site: string): void {
  execFileSync("pnpm", ["--filter", "playground", "exec", "vite", "build", "--outDir", join(site, "apps", "playground", "dist"), "--emptyOutDir"], {
    cwd: ROOT,
    env: { ...process.env, SORBET_LIBRARY_CSS: stylesheet },
    stdio: ["ignore", "inherit", "inherit"],
  });
}

/** A ref as a full sha in this checkout, or undefined when it names no commit. */
const resolveCommit = (ref: string) => {
  try {
    return execFileSync("git", ["rev-parse", "--verify", "--quiet", `${ref}^{commit}`], { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim() || undefined;
  } catch {
    return undefined;
  }
};

// ---------------------------------------------------------------------------------------------------------------
// Comparing

const readShots = (dir: string): Shot[] => (existsSync(join(dir, "shots.json")) ? JSON.parse(readFileSync(join(dir, "shots.json"), "utf8")) : []);

interface JobResult {
  job: Job;
  compared: number;
  differ: string[];
  missing: string[];
  misaligned: string[];
  unstable: string[];
}

function compareJob(job: Job, base: string, latest: string, control: string, diffs: string): JobResult {
  const [b, l, c] = [readShots(join(base, jobName(job))), readShots(join(latest, jobName(job))), readShots(join(control, jobName(job)))];
  const result: JobResult = { job, compared: 0, differ: [], missing: [], misaligned: [], unstable: [] };
  const byName = (shots: Shot[]) => new Map(shots.map((shot) => [shot.name, shot]));
  const [bm, lm, cm] = [byName(b), byName(l), byName(c)];
  for (const name of new Set([...bm.keys(), ...lm.keys()])) {
    const [was, now, ctl] = [bm.get(name), lm.get(name), cm.get(name)];
    if (!was || !now || name.endsWith("-error")) {
      result.missing.push(`${name}${!was ? " (not in the baseline)" : !now ? " (not shot now)" : `: ${now.what}`}`);
      continue;
    }
    if (was.what !== now.what) {
      result.misaligned.push(`${name}: was ${was.what}, now ${now.what}`);
      continue;
    }
    const file = `${name}.png`;
    const nowPng = readFileSync(join(latest, jobName(job), file));
    if (!ctl || !existsSync(join(control, jobName(job), file)) || !readFileSync(join(control, jobName(job), file)).equals(nowPng)) {
      result.unstable.push(name);
    }
    result.compared++;
    const d = pixelDiff(readFileSync(join(base, jobName(job), file)), nowPng);
    if (!d.same) {
      mkdirSync(join(diffs, jobName(job)), { recursive: true });
      if (d.image) {
        writeFileSync(join(diffs, jobName(job), file), encodePng(d.image));
      }
      const where = d.box ? ` in ${d.box.width}x${d.box.height} at (${d.box.x}, ${d.box.y})` : "";
      result.differ.push(`${name}: ${d.differing} px, up to ${d.maxDelta} levels${where}${d.sameSize ? "" : ", size changed"} (${now.what})`);
    }
  }
  return result;
}

// ---------------------------------------------------------------------------------------------------------------

const BASELINE = join(STORE, "baseline");

/** `baseline.json`, with the mask its shots were taken under (L167); absent from a baseline taken before the mask. */
type MaskedManifest = Manifest & { mask?: string };

/**
 * Why a compare must not use this baseline's shots under this run's mask, or null when it may (L167, L192 (a)): a
 * baseline with no mask, or another, was shot with the status icons showing, or hiding something else, so it would
 * differ from this run wherever a status component is. Asked after `baselineRefusal` has accepted the baseline.
 */
function maskRefusal(manifest: MaskedManifest): string | null {
  if (manifest.mask === MASK) {
    return null;
  }
  const had = manifest.mask === undefined ? "records no mask (it was shot with the status icons showing)" : `was shot under the mask ${JSON.stringify(manifest.mask)}`;
  return `The baseline ${had}; this run masks ${JSON.stringify(MASK)}. Retake it: \`pnpm shots baseline --at ${manifest.libraryCss ?? "e24df74"}\`.`;
}
const browser = await launch();
try {
  const chromium = browser.version();
  if (command === "baseline") {
    const ref = option("--at");
    if (ref !== undefined && resolveCommit(ref) === undefined) {
      console.error(`--at ${ref} names no commit in this checkout.`);
      process.exit(2);
    }
    const temp = mkdtempSync(join(tmpdir(), "sorbet-shots-"));
    try {
      if (!flag("--no-build")) {
        buildPlayground(ROOT);
      }
      // With --at, this tree's playground with <ref>'s library stylesheet (F6); without, this tree as built.
      const site = ref === undefined ? ROOT : temp;
      if (ref !== undefined) {
        buildWithStylesheet(stylesheetAt(ref, temp), temp);
      }
      const libraryCss = ref === undefined ? describeTree(ROOT) : execFileSync("git", ["rev-parse", "--short", ref], { cwd: ROOT, encoding: "utf8" }).trim();
      rmSync(BASELINE, { recursive: true, force: true });
      mkdirSync(BASELINE, { recursive: true });
      console.log(`Baseline: ${describeTree(ROOT)}'s playground with ${libraryCss}'s library stylesheet, into ${BASELINE}`);
      const total = await shootAll(browser, site, BASELINE);
      const manifest: MaskedManifest = {
        libraryCss,
        playground: digestPlayground(join(site, "apps", "playground", "dist")),
        mechanism: ref === undefined ? "this-tree" : "library-css-swap",
        tree: describeTree(ROOT),
        chromium,
        takenAt: new Date().toISOString(),
        shots: total,
        mask: MASK,
      };
      writeFileSync(join(BASELINE, "baseline.json"), `${JSON.stringify(manifest, null, 2)}\n`);
      console.log(styleText("green", `✓ ${total} shots in ${jobs.length} runs, of ${libraryCss}'s library stylesheet in ${manifest.tree}'s playground, by Chromium ${chromium}`));
    } finally {
      rmSync(temp, { recursive: true, force: true });
    }
  } else {
    const manifestPath = join(BASELINE, "baseline.json");
    if (!existsSync(manifestPath)) {
      console.error(`No baseline at ${BASELINE}: run \`pnpm shots baseline --at <ref>\` first.`);
      process.exit(1);
    }
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as MaskedManifest;
    // Where the baseline came from (F14): refused before the build where that can be told, and again after it, when
    // this tree's playground can be compared with the one the baseline was shot on (F6). Then the mask (L167, L192
    // (a)): a baseline shot without this run's mask differs from it wherever a status icon is, so it is refused too.
    const refuse = (playground?: string) => {
      const why = baselineRefusal(manifest, { resolve: resolveCommit, chromium, playground }) ?? maskRefusal(manifest);
      if (why !== null) {
        console.error(styleText("red", `✗ ${why}`));
        process.exit(1);
      }
    };
    refuse();
    if (!flag("--no-build")) {
      buildPlayground(ROOT);
    }
    refuse(digestPlayground(join(ROOT, "apps", "playground", "dist")));
    const [control, latest, diffs] = [join(STORE, "control"), join(STORE, "latest"), join(STORE, "diffs")];
    for (const dir of [control, latest, diffs]) {
      rmSync(dir, { recursive: true, force: true });
      mkdirSync(dir, { recursive: true });
    }
    console.log(`Control run of ${describeTree(ROOT)} (same commit, shot twice; a shot that differs between the two is unstable):`);
    await shootAll(browser, ROOT, control);
    console.log(`Shooting ${describeTree(ROOT)}:`);
    const total = await shootAll(browser, ROOT, latest);
    console.log(`\nAgainst the baseline of ${manifest.libraryCss}'s library stylesheet (${manifest.mechanism}, taken ${manifest.takenAt}), ${total} shots:`);
    const results = jobs.map((job) => compareJob(job, BASELINE, latest, control, diffs));
    let frozenBad = 0;
    for (const r of results) {
      const frozen = (FROZEN_PRESETS as readonly string[]).includes(r.job.preset);
      const bad = r.differ.length + r.missing.length + r.misaligned.length + r.unstable.length;
      const label = jobName(r.job).padEnd(24);
      if (bad === 0) {
        console.log(`  ${styleText("green", "✓")} ${label} ${r.compared} shots pixel-identical`);
        continue;
      }
      frozenBad += frozen ? 1 : 0;
      const mark = frozen ? styleText("red", "✗") : styleText("yellow", "·");
      console.log(`  ${mark} ${label} ${r.compared} compared: ${r.differ.length} differ, ${r.missing.length} missing, ${r.misaligned.length} misaligned, ${r.unstable.length} unstable${frozen ? "" : " (not frozen: reported, not failed)"}`);
      if (frozen) {
        for (const line of [...r.differ.map((x) => `differs: ${x}`), ...r.missing.map((x) => `missing: ${x}`), ...r.misaligned.map((x) => `misaligned: ${x}`), ...r.unstable.map((x) => `unstable: ${x}`)].slice(0, 25)) {
          console.log(`      ${line}`);
        }
      }
    }
    console.log(`Diff images: ${diffs}`);
    const frozenJobs = results.filter((r) => (FROZEN_PRESETS as readonly string[]).includes(r.job.preset));
    const full = FROZEN_PRESETS.every((preset) => MODES.every((mode) => VARIANTS.every((variant) => frozenJobs.some((r) => r.job.preset === preset && r.job.mode === mode && r.job.variant === variant && r.compared > 0))));
    if (frozenJobs.every((r) => r.compared === 0)) {
      console.log(styleText("red", "\n✗ no frozen preset compared: this run says nothing about the frozen presets."));
      process.exit(1);
    }
    if (frozenBad > 0) {
      console.log(styleText("red", `\n✗ ${frozenBad} frozen run(s) differ, miss shots, went another way or are unstable. A frozen preset must be pixel-identical: fix the change, never the baseline.`));
      process.exit(1);
    }
    if (!full) {
      console.log(styleText("yellow", "\n✗ not every frozen preset compared in both modes and all three runs: no verdict on the frozen presets."));
      process.exit(1);
    }
    console.log(styleText("green", `\n✓ The frozen presets are pixel-identical to ${manifest.libraryCss}'s library stylesheet in both modes, in ${VARIANTS.join(", ")}, with the status icons masked (${frozenJobs.reduce((n, r) => n + r.compared, 0)} shots, control stable).`));
  }
} finally {
  await browser.close();
}
