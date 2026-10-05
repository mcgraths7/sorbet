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
 * Every shot is taken in a fresh document (see `Session`): a first pass only
 * lists what to shoot, as CSS paths, and each shot then reloads, sets its
 * state up from nothing and shoots. Long sessions drift by a level or two at
 * antialiased edges and are not comparable with each other.
 *
 *   pnpm shots baseline [--at <ref>]   shoot a tree and keep it as the baseline. `--at` exports
 *                                      the commit (`git archive`) into a temporary directory,
 *                                      installs offline and builds there; this checkout is untouched
 *   pnpm shots compare                 shoot this tree TWICE: the first run is the control. A shot
 *                                      that differs between the two is UNSTABLE and is reported, and
 *                                      blocks the success line. Then every shot is compared with the
 *                                      baseline
 *
 * Options: `--no-build`, `--only <preset>`, `--variant ltr|rtl|coarse`,
 * `--workers <n>` (default 8), `--with-sorbet`.
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
 * `baseline.json` records the commit, the Chromium version and the shot count;
 * a compare refuses a baseline taken by a different Chromium.
 *
 * Exit code: 0 only on the success line; 1 otherwise; 2 on a usage error.
 */

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { styleText } from "node:util";

import { ALL_PRESETS, buildPlayground, describeTree, FROZEN_PRESETS, launch, MODES, openPlayground, ROOT, servePlayground, type Mode, type PresetName } from "./playground-browser.ts";
import { encodePng, pixelDiff } from "./png.ts";

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
    await page.evaluate(({ rtl, fixtures, html, freeze }) => {
      if (fixtures) {
        document.body.insertAdjacentHTML("afterbegin", html);
      }
      if (rtl) {
        document.documentElement.dir = "rtl";
      }
      const style = document.createElement("style");
      style.textContent = freeze;
      document.head.append(style);
      window.scrollTo(0, 0);
    }, { rtl: job.variant === "rtl", fixtures, html: FIXTURES, freeze: FREEZE });
  }

  async settle() {
    await this.page.evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))));
  }

  /** The crop round an element (24px of margin, whole pixels, inside the viewport), or the viewport. */
  async shoot(file: string, crop: string | null) {
    await this.settle();
    const box = crop === null ? null : await this.page.evaluate((selector) => {
      const element = document.querySelector(selector);
      if (!element) {
        return null;
      }
      const r = element.getBoundingClientRect();
      const [x0, y0] = [Math.max(0, Math.floor(r.left) - 24), Math.max(0, Math.floor(r.top) - 24)];
      const [x1, y1] = [Math.min(innerWidth, Math.ceil(r.right) + 24), Math.min(innerHeight, Math.ceil(r.bottom) + 24)];
      return x1 > x0 && y1 > y0 ? { x: x0, y: y0, width: x1 - x0, height: y1 - y0 } : null;
    }, crop);
    const png = box === null ? await this.page.screenshot({ animations: "disabled", caret: "hide" }) : await this.page.screenshot({ clip: box, animations: "disabled", caret: "hide" });
    writeFileSync(file, png);
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

/** Mark the last open overlay for the crop; null when none is open. */
const markOverlay = (page: Page) => page.evaluate((open) => {
  document.querySelectorAll("[data-shots-ov]").forEach((e) => e.removeAttribute("data-shots-ov"));
  const all = [...document.querySelectorAll(open)].filter((e) => e.getBoundingClientRect().width > 0);
  all.at(-1)?.setAttribute("data-shots-ov", "");
  return all.length > 0 ? "[data-shots-ov]" : null;
}, OPEN);

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
  recipes.push({ name: "staged-all", what: "every fixture at rest", fixtures: true, run: async() => "#shots-fixtures" });
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
    let crop: string | null;
    try {
      crop = await recipe.run(s);
    } catch(error) {
      shots.push({ name: `${recipe.name}-error`, what: String(error).split("\n")[0]! });
      continue;
    }
    if (recipe.name.endsWith("-error")) {
      shots.push({ name: recipe.name, what: recipe.what });
      continue;
    }
    const file = join(dir, `${recipe.name}.png`);
    if (crop === "full") {
      await s.settle();
      writeFileSync(file, await page.screenshot({ fullPage: true, animations: "disabled", caret: "hide" }));
    } else {
      await s.shoot(file, crop);
    }
    shots.push({ name: recipe.name, what: recipe.what });
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

function exportTree(ref: string): string {
  const dir = mkdtempSync(join(tmpdir(), "sorbet-shots-"));
  const archive = execFileSync("git", ["archive", "--format=tar", ref], { cwd: ROOT, maxBuffer: 1 << 30 });
  execFileSync("tar", ["-x", "-C", dir], { input: archive });
  execFileSync("pnpm", ["install", "--offline", "--frozen-lockfile"], { cwd: dir, stdio: ["ignore", "inherit", "inherit"] });
  return dir;
}

// ---------------------------------------------------------------------------------------------------------------
// Comparing

interface Manifest {
  tree: string;
  chromium: string;
  takenAt: string;
  shots: number;
}

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
const browser = await launch();
try {
  const chromium = browser.version();
  if (command === "baseline") {
    const ref = option("--at");
    const root = ref === undefined ? ROOT : exportTree(ref);
    try {
      if (!flag("--no-build") || ref !== undefined) {
        buildPlayground(root);
      }
      rmSync(BASELINE, { recursive: true, force: true });
      mkdirSync(BASELINE, { recursive: true });
      console.log(`Baseline of ${ref ?? describeTree(ROOT)} into ${BASELINE}`);
      const total = await shootAll(browser, root, BASELINE);
      const manifest: Manifest = {
        tree: ref === undefined ? describeTree(ROOT) : execFileSync("git", ["rev-parse", "--short", ref], { cwd: ROOT, encoding: "utf8" }).trim(),
        chromium,
        takenAt: new Date().toISOString(),
        shots: total,
      };
      writeFileSync(join(BASELINE, "baseline.json"), `${JSON.stringify(manifest, null, 2)}\n`);
      console.log(styleText("green", `✓ ${total} shots in ${jobs.length} runs, taken at ${manifest.tree} by Chromium ${chromium}`));
    } finally {
      if (ref !== undefined) {
        rmSync(root, { recursive: true, force: true });
      }
    }
  } else {
    const manifestPath = join(BASELINE, "baseline.json");
    if (!existsSync(manifestPath)) {
      console.error(`No baseline at ${BASELINE}: run \`pnpm shots baseline --at <ref>\` first.`);
      process.exit(1);
    }
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as Manifest;
    if (manifest.chromium !== chromium) {
      console.error(`The baseline was taken by Chromium ${manifest.chromium}; this is ${chromium}. Retake it: \`pnpm shots baseline --at ${manifest.tree.replace("+dirty", "")}\`.`);
      process.exit(1);
    }
    if (!flag("--no-build")) {
      buildPlayground(ROOT);
    }
    const [control, latest, diffs] = [join(STORE, "control"), join(STORE, "latest"), join(STORE, "diffs")];
    for (const dir of [control, latest, diffs]) {
      rmSync(dir, { recursive: true, force: true });
      mkdirSync(dir, { recursive: true });
    }
    console.log(`Control run of ${describeTree(ROOT)} (same commit, shot twice; a shot that differs between the two is unstable):`);
    await shootAll(browser, ROOT, control);
    console.log(`Shooting ${describeTree(ROOT)}:`);
    const total = await shootAll(browser, ROOT, latest);
    console.log(`\nAgainst the baseline taken at ${manifest.tree} (${manifest.takenAt}), ${total} shots:`);
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
    console.log(styleText("green", `\n✓ The frozen presets are pixel-identical in both modes, in ${VARIANTS.join(", ")} (${frozenJobs.reduce((n, r) => n + r.compared, 0)} shots, control stable).`));
  }
} finally {
  await browser.close();
}
