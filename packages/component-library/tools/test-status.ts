/**
 * Every status carries its icon and its word. `pnpm test:status`; part of
 * `pnpm test`, and a step of CI's build job (legibility-spec.md L181, L187 to
 * L189; step 2.5).
 *
 * WHAT THIS EXISTS TO CATCH. A status is told apart by a glyph (a tick, an
 * exclamation mark, a cross, an i) and a word a screen reader says first
 * ("Error: "). The word is visually hidden, so its absence shows nothing on
 * screen: no screenshot, no contrast gate and no eye can see it go. And the
 * frozen screenshot compare masks the slot that holds both (L167), so a change
 * to the rest of a status component's markup is invisible there too. So this
 * renders the built components the way a consumer gets them (the barrel in
 * `dist`) on the server and reads the markup:
 *
 *   - L181: the slot is the component's first element child, it holds exactly
 *     one icon of the status's tone and, where the component has one, exactly
 *     one word, and the read text starts with the word;
 *   - L187: with every slot removed, the markup is what 9b83e50's build
 *     rendered for the same props (status-markup.at-9b83e50.json, recorded by
 *     record-status-markup.mts.txt and pinned by sha256);
 *   - L188: the toast provider, which only renders after mount, passes the
 *     tone and the word to ToastItem (read from its source);
 *   - L189: the internal names stay internal, and a missing or stale build
 *     fails before any case, since `pnpm test` does not build.
 *
 * Each test's name starts with the statement it holds ("L181 case 2 A1 …" is
 * L181's case 2 on L187's case A1). Its expected values are the spec's, or
 * 9b83e50's recorded markup. The dist is imported as namespaces after the
 * build check, so a missing export is one failing case, not a module that will
 * not load. Planted copies live in a temporary directory; nothing here writes
 * inside the repository.
 */

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, utimesSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { styleText } from "node:util";

import type { ComponentType, ReactNode } from "react";

const LIB = join(import.meta.dirname, "..");
const ROOT = join(LIB, "..", "..");

// ── L189: a missing or stale build fails before any case ───────────────────────────────────────────────────────────

/**
 * The first source file under `<root>/packages/component-library/src` (.ts and .tsx, not .d.ts), in sorted order of
 * its path, whose counterpart under `dist` (the same path, `.js`) does not exist or is older than it; null when every
 * one is built. Paths relative to `root`.
 */
function staleBuild(root: string): string | null {
  const lib = join(root, "packages", "component-library");
  const [src, dist] = [join(lib, "src"), join(lib, "dist")];
  const posix = (path: string) => relative(root, path).split(sep).join("/");
  const walk = (dir: string): string[] => readdirSync(dir, { withFileTypes: true }).flatMap((entry) => (entry.isDirectory() ? walk(join(dir, entry.name)) : [join(dir, entry.name)]));
  const sources = walk(src).filter((file) => /\.tsx?$/.test(file) && !file.endsWith(".d.ts")).map((file) => relative(src, file).split(sep).join("/")).sort();
  for (const path of sources) {
    const [source, counterpart] = [join(src, path), join(dist, path.replace(/\.tsx?$/, ".js"))];
    if (!existsSync(counterpart)) {
      return `${posix(counterpart)} does not exist`;
    }
    if (statSync(counterpart).mtimeMs < statSync(source).mtimeMs) {
      return `${posix(source)} is newer than ${posix(counterpart)}`;
    }
  }
  return null;
}

const unbuilt = staleBuild(ROOT);
if (unbuilt !== null) {
  console.error(`✗ test:status reads the built component library: ${unbuilt}. Run pnpm build first.`);
  process.exit(1);
}

// Only now the build may be imported. react and react-dom/server resolve from packages/component-library (its peer
// dependencies), the dist the same way a consumer's would; both as namespaces (L189).
const { createElement } = await import("react");
const { renderToStaticMarkup } = await import("react-dom/server");
const DIST = join(LIB, "dist");
let barrel: Record<string, unknown> = {};
let barrelMissing = "";
try {
  barrel = (await import(pathToFileURL(join(DIST, "index.js")).href)) as Record<string, unknown>;
} catch(error) {
  barrelMissing = (error as Error).message;
}
let toastModule: Record<string, unknown> = {};
let toastMissing = "";
try {
  toastModule = (await import(pathToFileURL(join(DIST, "molecules", "toast.js")).href)) as Record<string, unknown>;
} catch(error) {
  toastMissing = (error as Error).message;
}

const tmp = mkdtempSync(join(tmpdir(), "sorbet status "));

let ran = 0;
const failed: string[] = [];
function test(name: string, fn: () => void) {
  ran++;
  try {
    fn();
    console.log(`  ${styleText("green", "✓")} ${name}`);
  } catch(error) {
    failed.push(name);
    console.error(`  ${styleText("red", "✗")} ${name}\n      ${String((error as Error).message).split("\n").join("\n      ")}`);
  }
}

// ── the cases: L187's table, props as data ─────────────────────────────────────────────────────────────────────────

type Props = Record<string, unknown>;
type Tone = "success" | "warning" | "danger" | "info";
const STATUS: Tone[] = ["success", "warning", "danger", "info"];
/** L171: the word, a colon and one space. */
const WORD: Record<Tone, string> = { success: "Success: ", warning: "Warning: ", danger: "Error: ", info: "Information: " };
const GLYPH: Record<Tone, string> = { success: "SuccessIcon", warning: "WarningIcon", danger: "DangerIcon", info: "InfoIcon" };
const INPUT = { element: "input", props: { className: "sb-input" } };
const RICE = "That is more rice than the pantry holds.";

/** Every case of L187's table, by id: the component and its props as data ("noop" is a function that does nothing). */
const CASES: Record<string, { component: string; props: Props }> = {
  A1: { component: "Alert", props: { tone: "success", title: "Deployed", children: "Build 214 is live in production." } },
  A2: { component: "Alert", props: { tone: "danger", title: "Payment failed", role: "alert", children: "We could not charge your card." } },
  A3: { component: "Alert", props: { tone: "warning", children: "Two items run out before Thursday." } },
  A4: { component: "Alert", props: { tone: "info", title: "Note", onDismiss: "noop", children: "The Thursday shop covers the rest of the week." } },
  A5: { component: "Alert", props: { children: "No tone was given." } },
  ...Object.fromEntries(STATUS.map((tone, i) => [`B${i + 1}`, { component: "Badge", props: { tone, children: "Overdue" } }])),
  ...Object.fromEntries(STATUS.map((tone, i) => [`B${i + 5}`, { component: "Badge", props: { tone, solid: true, children: "7" } }])),
  B9: { component: "Badge", props: { tone: "primary", dot: true, children: "New" } },
  B10: { component: "Badge", props: { tone: "secondary", children: "Draft" } },
  B11: { component: "Badge", props: { tone: "accent", dot: true, children: "Beta" } },
  B12: { component: "Badge", props: { children: "Neutral" } },
  B13: { component: "Badge", props: { dot: true, children: "Neutral" } },
  ...Object.fromEntries(STATUS.map((tone, i) => [`B${i + 14}`, { component: "Badge", props: { tone, dot: true, children: "Active" } }])),
  ...Object.fromEntries(STATUS.map((tone, i) => [`B${i + 18}`, { component: "Badge", props: { tone, solid: true, dot: true, children: "7" } }])),
  C1: { component: "Button", props: { variant: "danger", children: "Delete account" } },
  C2: { component: "Button", props: { variant: "danger", size: "sm", children: "Delete" } },
  C3: { component: "Button", props: { variant: "danger", size: "lg", children: "Delete" } },
  C4: { component: "Button", props: { variant: "danger", as: "a", href: "#delete", children: "Delete" } },
  C5: { component: "Button", props: { variant: "danger", iconOnly: true, "aria-label": "Delete", children: "x" } },
  C6: { component: "Button", props: { variant: "danger", loading: true, children: "Deleting" } },
  C7: { component: "Button", props: { children: "Save" } },
  ...Object.fromEntries(["primary", "secondary", "accent", "soft", "outline", "ghost", "link"].map((variant, i) => [`C${i + 8}`, { component: "Button", props: { variant, children: "Save" } }])),
  D1: { component: "MenuItem", props: { danger: true, children: "Delete project" } },
  D2: { component: "MenuItem", props: { danger: true, shortcut: "Del", children: "Delete" } },
  D3: { component: "MenuItem", props: { children: "Rename" } },
  D4: { component: "MenuItem", props: { shortcut: "R", children: "Rename" } },
  E1: { component: "Field", props: { label: "Rice", error: RICE, invalid: true, children: INPUT } },
  E2: { component: "Field", props: { label: "Rice", hint: "Cups, cooked.", children: INPUT } },
  E3: { component: "Field", props: { label: "Rice", error: RICE, children: INPUT } },
  F1: { component: "ToastItem", props: { tone: "success", title: "Sticky", message: "I stay until dismissed.", onDismiss: "noop" } },
  F2: { component: "ToastItem", props: { tone: "danger", message: "Account deleted.", leaving: true, onDismiss: "noop" } },
  F3: { component: "ToastItem", props: { message: "All changes saved.", onDismiss: "noop" } },
  G1: { component: "Alert", props: { tone: "danger", statusLabel: "Fehler", children: "x" } },
  G2: { component: "Badge", props: { tone: "danger", statusLabel: "Fehler", children: "x" } },
  G3: { component: "Field", props: { label: "Rice", error: "x", invalid: true, statusLabel: "Fehler", children: INPUT } },
  G4: { component: "ToastItem", props: { tone: "danger", statusLabel: "Fehler", message: "x", onDismiss: "noop" } },
  G5: { component: "Alert", props: { tone: "danger", children: "x", statusLabel: " Fehler " } },
  G6: { component: "Alert", props: { tone: "danger", children: "x", statusLabel: "" } },
  G7: { component: "Alert", props: { tone: "danger", children: "x", statusLabel: "  " } },
};
/** L187: the 39 the fixture holds, in its order; the rest are the ones 9b83e50 cannot render the same way. */
const RECORDED = ["A1", "A2", "A3", "A4", "A5", ...Array.from({ length: 13 }, (_, i) => `B${i + 1}`), ...Array.from({ length: 14 }, (_, i) => `C${i + 1}`), "D1", "D2", "D3", "D4", "E1", "E2", "E3"];

/** Props as data, made React props. */
function live(props: Props): Props {
  const made: Props = {};
  for (const [key, value] of Object.entries(props)) {
    if (key === "onDismiss" && value === "noop") {
      made[key] = () => {};
    } else if (key === "children" && typeof value === "object" && value !== null && "element" in value) {
      const child = value as { element: string; props: Props };
      made[key] = createElement(child.element, child.props);
    } else {
      made[key] = value;
    }
  }
  return made;
}

/** A component of this tree's build: from the barrel, or ToastItem from its module (L189), or the case fails naming it. */
function built(name: string): ComponentType<Props> {
  if (name === "ToastItem") {
    assert.equal(toastMissing, "", `packages/component-library/dist/molecules/toast.js does not load: ${toastMissing}`);
    assert.equal(typeof toastModule.ToastItem, "function", "packages/component-library/dist/molecules/toast.js exports no ToastItem (L173)");
    return toastModule.ToastItem as ComponentType<Props>;
  }
  assert.equal(barrelMissing, "", `packages/component-library/dist/index.js does not load: ${barrelMissing}`);
  assert.equal(typeof barrel[name], "function", `the built barrel, packages/component-library/dist/index.js, exports no ${name}`);
  return barrel[name] as ComponentType<Props>;
}
const render = (name: string, props: Props) => renderToStaticMarkup(createElement(built(name), live(props)) as ReactNode);
const renderCase = (id: string) => render(CASES[id]!.component, CASES[id]!.props);

// ── reading the markup ─────────────────────────────────────────────────────────────────────────────────────────────

interface El {
  tag: string;
  attrs: Record<string, string>;
  children: Node[];
}
type Node = El | string;
const VOID = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"]);
const decode = (text: string) => text.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, "\"").replace(/&#x27;|&#39;/g, "'").replace(/&amp;/g, "&");

/** renderToStaticMarkup's output read back as a tree (it is well formed: every attribute double-quoted, void elements closed). */
function parse(html: string): Node[] {
  const root: El = { tag: "#root", attrs: {}, children: [] };
  const stack: El[] = [root];
  const token = /<\/([a-zA-Z][\w:-]*)\s*>|<([a-zA-Z][\w:-]*)((?:\s+[^\s"'>/=]+(?:="[^"]*")?)*)\s*(\/?)>|([^<]+)/g;
  let at = 0;
  for (const m of html.matchAll(token)) {
    assert.equal(m.index, at, `unreadable markup at ${at}: ${html.slice(at, at + 40)}`);
    at = m.index + m[0].length;
    const top = stack.at(-1)!;
    if (m[1] !== undefined) {
      assert.equal(top.tag, m[1], `</${m[1]}> closes <${top.tag}>`);
      stack.pop();
    } else if (m[2] !== undefined) {
      const attrs = Object.fromEntries([...m[3]!.matchAll(/([^\s"'>/=]+)(?:="([^"]*)")?/g)].map((a) => [a[1]!, decode(a[2] ?? "")]));
      const el: El = { tag: m[2], attrs, children: [] };
      top.children.push(el);
      if (m[4] !== "/" && !VOID.has(m[2])) {
        stack.push(el);
      }
    } else {
      top.children.push(decode(m[5]!));
    }
  }
  assert.equal(at, html.length, "the markup does not parse to its end");
  assert.equal(stack.length, 1, `<${stack.at(-1)!.tag}> is not closed`);
  return root.children;
}
const isEl = (node: Node): node is El => typeof node !== "string";
const classes = (el: El) => (el.attrs.class ?? "").split(/\s+/).filter((name) => name !== "");
/** Every element, in document order. */
const elements = (nodes: Node[]): El[] => nodes.filter(isEl).flatMap((el) => [el, ...elements(el.children)]);
const textOf = (nodes: Node[]): string => nodes.map((node) => (isEl(node) ? textOf(node.children) : node)).join("");
/** L181: the markup's text with every aria-hidden="true" element removed with its contents, whitespace collapsed, trimmed. */
const readTextOf = (nodes: Node[]): string => {
  const read = (list: Node[]): string => list.map((node) => (!isEl(node) ? node : node.attrs["aria-hidden"] === "true" ? "" : read(node.children))).join("");
  return read(nodes).replace(/\s+/g, " ").trim();
};
/** L181's definitions. */
const isSlot = (el: El) => classes(el).includes("sb-status");
const isIcon = (el: El) => el.tag === "svg" && classes(el).includes("sb-status-icon");
const toneOf = (icon: El) => classes(icon).filter((name) => /^sb-status-icon--/.test(name)).map((name) => name.slice("sb-status-icon--".length));
const isHidden = (el: El) => classes(el).includes("u-visually-hidden");
const describe = (el: El | undefined) => (el === undefined ? "nothing" : `<${el.tag}${el.attrs.class === undefined ? "" : ` class="${el.attrs.class}"`}>`);

/** The one root element of a render. */
function rootOf(html: string): El {
  const nodes = parse(html);
  const roots = nodes.filter(isEl);
  assert.equal(roots.length, 1, `${roots.length} root elements in ${html}`);
  assert.ok(nodes.every((node) => isEl(node) || node.trim() === ""), `text beside the root in ${html}`);
  return roots[0]!;
}

interface Presence {
  /** The element whose first element child is the slot: the root, or the field's error paragraph. */
  holder: (root: El) => El;
  /** The slot's class list, exactly (L181, L186). */
  slotClass: string;
  tone: Tone;
  /** The word, or null where the component takes none. */
  word: string | null;
}
/** L181: the slot is first, holds one icon of the tone and then, where there is one, one word; no other icon or slot anywhere. */
function assertPresent(html: string, want: Presence): { root: El; slot: El } {
  const root = rootOf(html);
  const holder = want.holder(root);
  const first = holder.children.find(isEl);
  assert.ok(first !== undefined && isSlot(first), `the first element child of ${describe(holder)} is ${describe(first)}, not the status slot: ${html}`);
  assert.equal(classes(first).join(" "), want.slotClass, `the slot's class list (${html})`);
  const all = elements([root]);
  assert.equal(all.filter(isSlot).length, 1, `one slot, exactly: ${html}`);
  const icons = all.filter(isIcon);
  assert.equal(icons.length, 1, `one icon, exactly, and no second icon of any tone: ${html}`);
  assert.ok(elements(first.children).includes(icons[0]!), `the icon is not inside the slot: ${html}`);
  assert.deepEqual(toneOf(icons[0]!), [want.tone], `the icon's tone: ${html}`);
  const words = all.filter(isHidden);
  if (want.word === null) {
    assert.deepEqual(words.map((el) => textOf(el.children)), [], `no word: ${html}`);
  } else {
    assert.equal(words.length, 1, `one word, exactly: ${html}`);
    assert.equal(textOf(words[0]!.children), want.word, `the word: ${html}`);
    const inSlot = elements(first.children);
    assert.ok(inSlot.includes(words[0]!), `the word is not inside the slot: ${html}`);
    assert.ok(inSlot.indexOf(icons[0]!) < inSlot.indexOf(words[0]!), `the slot holds the icon and THEN the word: ${html}`);
  }
  return { root, slot: first };
}
/** No slot, no status icon, no word anywhere. */
function assertAbsent(html: string) {
  const all = elements([rootOf(html)]);
  assert.deepEqual(all.filter(isSlot).map(describe), [], `a slot: ${html}`);
  assert.deepEqual(all.filter(isIcon).map(describe), [], `a status icon: ${html}`);
  assert.deepEqual(all.filter(isHidden).map((el) => textOf(el.children)), [], `a word: ${html}`);
}
const atRoot = (root: El) => root;
const errorParagraph = (root: El) => {
  const found = elements([root]).filter((el) => el.tag === "p" && classes(el).includes("sb-field__error"));
  assert.equal(found.length, 1, "one p.sb-field__error");
  return found[0]!;
};
const toneOfCase = (id: string) => (CASES[id]!.props.tone ?? "info") as Tone;

try {
  // ── L181 case 1: each glyph alone ────────────────────────────────────────────────────────────────────────────────
  for (const tone of STATUS) {
    for (const props of [{}, { className: "x" }] as Props[]) {
      const name = GLYPH[tone];
      test(`L181 case 1 ${name}${"className" in props ? ' with className="x"' : " alone"}: one svg, the icon of ${tone}, aria-hidden, not focusable, a 24 viewBox, one evenodd path in currentColor; no other fill or stroke, no colour, no id, url(, mask, clip-path or style, no slot`, () => {
        const html = render(name, props);
        const svg = rootOf(html);
        assert.equal(svg.tag, "svg", html);
        const all = elements([svg]);
        assert.equal(all.filter((el) => el.tag === "svg").length, 1, `one svg: ${html}`);
        assert.equal(svg.attrs.class, "className" in props ? `sb-status-icon sb-status-icon--${tone} x` : `sb-status-icon sb-status-icon--${tone}`, `the class list (L169): ${html}`);
        assert.equal(svg.attrs["aria-hidden"], "true", "aria-hidden");
        assert.equal(svg.attrs.focusable, "false", "focusable");
        assert.equal(svg.attrs.viewBox, "0 0 24 24", "viewBox");
        assert.deepEqual(all.slice(1).map((el) => el.tag), ["path"], `the svg holds exactly one path: ${html}`);
        const path = all[1]!;
        assert.equal(path.attrs.fill, "currentColor", "the path's fill");
        assert.equal(path.attrs["fill-rule"], "evenodd", "the path's fill-rule");
        const strays = all.flatMap((el) => Object.keys(el.attrs).filter((attr) => (attr === "fill" && el !== path) || attr === "stroke" || attr === "id" || attr === "style").map((attr) => `${el.tag}[${attr}]`));
        assert.deepEqual(strays, [], `no other fill, no stroke, no id, no style: ${html}`);
        for (const literal of ["#", "rgb(", "hsl(", "oklch(", "url(", "mask", "clip-path"]) {
          assert.ok(!html.toLowerCase().includes(literal), `${literal} in ${html}`);
        }
        assert.equal(all.filter(isSlot).length, 0, "a glyph alone is not in a slot");
      });
    }
  }

  test("L169 each glyph has no intrinsic size (no width or height), and passes a consumer's other props to the svg, as the house glyphs do", () => {
    for (const tone of STATUS) {
      const svg = rootOf(render(GLYPH[tone], { "data-probe": "1" }));
      assert.equal(svg.attrs.width, undefined, `${GLYPH[tone]} width`);
      assert.equal(svg.attrs.height, undefined, `${GLYPH[tone]} height`);
      assert.equal(svg.attrs["data-probe"], "1", `${GLYPH[tone]} does not pass data-probe to its svg`);
    }
  });

  // ── L181 case 2: Alert ───────────────────────────────────────────────────────────────────────────────────────────
  const ALERT_LEAD: Record<string, string> = { A1: "Deployed", A2: "Payment failed", A3: "Two items run out before Thursday.", A4: "Note", A5: "No tone was given." };
  for (const id of ["A1", "A2", "A3", "A4", "A5"]) {
    const tone = toneOfCase(id);
    test(`L181 case 2 ${id} Alert${CASES[id]!.props.tone === undefined ? " with no tone" : ` ${tone}`}: the slot is first, exactly sb-status sb-alert__icon, with one icon of ${tone} and then the word "${WORD[tone]}"; the read text starts with the word and then the ${["A3", "A5"].includes(id) ? "children" : "title"}; role ${id === "A2" ? "alert, the consumer's" : "status"}`, () => {
      const html = renderCase(id);
      const { root } = assertPresent(html, { holder: atRoot, slotClass: "sb-status sb-alert__icon", tone, word: WORD[tone] });
      assert.ok(readTextOf([root]).startsWith(`${WORD[tone]}${ALERT_LEAD[id]}`), `the read text is "${readTextOf([root])}", not "${WORD[tone]}${ALERT_LEAD[id]}…"`);
      assert.equal(root.attrs.role, id === "A2" ? "alert" : "status", "role (L172, S39)");
    });
  }

  // ── L181 case 3: ToastItem ───────────────────────────────────────────────────────────────────────────────────────
  for (const id of ["F1", "F2"]) {
    const tone = toneOfCase(id);
    const lead = id === "F1" ? "Sticky" : "Account deleted.";
    test(`L181 case 3 ${id} ToastItem ${tone}: the slot is first, exactly sb-status sb-toast__icon, with one icon of ${tone} and one word; the read text starts with the word and then the ${id === "F1" ? "title" : "message"} (L180)`, () => {
      const html = renderCase(id);
      const { root } = assertPresent(html, { holder: atRoot, slotClass: "sb-status sb-toast__icon", tone, word: WORD[tone] });
      assert.ok(readTextOf([root]).startsWith(`${WORD[tone]}${lead}`), `the read text is "${readTextOf([root])}"`);
    });
  }
  test("L181 case 3 F3 ToastItem with no tone: no slot, no icon, no word", () => {
    assertAbsent(renderCase("F3"));
  });

  // ── L181 case 4: Badge ───────────────────────────────────────────────────────────────────────────────────────────
  for (let i = 1; i <= 21; i++) {
    const id = `B${i}`;
    const { props } = CASES[id]!;
    if (i >= 9 && i <= 13) {
      const dots = [9, 11, 13].includes(i) ? 1 : 0;
      test(`L181 case 4 ${id} Badge, ${props.tone === undefined ? "no tone" : `tone ${props.tone as string}`}${props.dot ? ", dot" : ""}: no slot, no icon, no word; ${dots === 1 ? "the dot, exactly" : "no dot"}`, () => {
        const html = renderCase(id);
        assertAbsent(html);
        assert.equal(elements([rootOf(html)]).filter((el) => classes(el).includes("sb-badge__dot")).length, dots, `.sb-badge__dot: ${html}`);
      });
      continue;
    }
    const tone = props.tone as Tone;
    const kind = `${props.solid ? "solid" : "soft"}${props.dot ? ", dot" : ""}`;
    test(`L181 case 4 ${id} Badge ${tone}, ${kind}: the slot is first, exactly sb-status, with one icon of ${tone} and one word, then the children${props.dot ? "; no .sb-badge__dot (L174: the icon takes its place)" : ""}`, () => {
      const html = renderCase(id);
      const { root } = assertPresent(html, { holder: atRoot, slotClass: "sb-status", tone, word: WORD[tone] });
      assert.equal(readTextOf([root]), `${WORD[tone]}${props.children as string}`, "the read text: the word, then the children (L180)");
      assert.equal(elements([root]).filter((el) => classes(el).includes("sb-badge__dot")).length, 0, `.sb-badge__dot: ${html}`);
    });
  }

  // ── L181 case 5: Button ──────────────────────────────────────────────────────────────────────────────────────────
  for (const id of ["C1", "C2", "C3", "C4", "C6"]) {
    const label = CASES[id]!.props.children as string;
    test(`L181 case 5 ${id} Button danger${id === "C6" ? ", loading" : ""}: the slot is first, exactly sb-status, holding one icon of danger and no word; the read text is the label, "${label}"`, () => {
      const html = renderCase(id);
      const { root } = assertPresent(html, { holder: atRoot, slotClass: "sb-status", tone: "danger", word: null });
      assert.equal(readTextOf([root]), label, "the read text");
    });
  }
  test("L181 case 5 C5 Button danger, iconOnly: no slot (its one glyph is the consumer's, L175)", () => {
    assertAbsent(renderCase("C5"));
  });
  for (let i = 7; i <= 14; i++) {
    const id = `C${i}`;
    test(`L181 case 5 ${id} Button ${(CASES[id]!.props.variant as string | undefined) ?? "with no variant"}: no slot`, () => {
      assertAbsent(renderCase(id));
    });
  }

  test("L175 S41 a glyph the consumer passes among a danger button's children stays where it is, after the slot", () => {
    const html = renderToStaticMarkup(createElement(built("Button"), { variant: "danger" }, createElement(built("CloseIcon")), "Delete"));
    const { root } = assertPresent(html, { holder: atRoot, slotClass: "sb-status", tone: "danger", word: null });
    assert.deepEqual(root.children.filter(isEl).map((el) => (isSlot(el) ? "slot" : el.tag)), ["slot", "svg"], html);
  });

  test("L176 S41 in a danger menu item the octagon sits inside the slot, out of reach of (j)'s `> svg`, and a consumer's glyph stays a direct child, which (j) hides", () => {
    const html = renderToStaticMarkup(createElement(built("MenuItem"), { danger: true }, createElement(built("CloseIcon")), "Delete"));
    const { root } = assertPresent(html, { holder: atRoot, slotClass: "sb-status", tone: "danger", word: null });
    assert.deepEqual(root.children.filter(isEl).map((el) => (isSlot(el) ? "slot" : el.tag)), ["slot", "svg"], html);
    assert.ok(!root.children.filter(isEl).some(isIcon), `the octagon is a direct child of the item: ${html}`);
  });

  // ── L181 case 6: MenuItem ────────────────────────────────────────────────────────────────────────────────────────
  for (const id of ["D1", "D2"]) {
    test(`L181 case 6 ${id} MenuItem danger${id === "D2" ? " with a shortcut" : ""}: the slot is first (exactly sb-status, L186), holding one icon of danger and no word`, () => {
      assertPresent(renderCase(id), { holder: atRoot, slotClass: "sb-status", tone: "danger", word: null });
    });
  }
  for (const id of ["D3", "D4"]) {
    test(`L181 case 6 ${id} MenuItem, not danger: no slot`, () => {
      assertAbsent(renderCase(id));
    });
  }

  // ── L181 case 7: Field ───────────────────────────────────────────────────────────────────────────────────────────
  for (const id of ["E1", "E3"]) {
    test(`L181 case 7 ${id} Field with error${id === "E1" ? ", invalid" : ""}: in p.sb-field__error the slot is first (exactly sb-status, L186), with one icon of danger and then "Error: ", then the message; the paragraph's read text is "Error: ${RICE}"`, () => {
      const html = renderCase(id);
      const { root } = assertPresent(html, { holder: errorParagraph, slotClass: "sb-status", tone: "danger", word: "Error: " });
      const paragraph = errorParagraph(root);
      assert.equal(readTextOf([paragraph]), `Error: ${RICE}`, "the paragraph's read text");
      const after = paragraph.children.slice(paragraph.children.findIndex((node) => isEl(node) && isSlot(node)) + 1);
      assert.equal(textOf(after), RICE, "the message follows the slot");
    });
  }
  test("L181 case 7 E2 Field with a hint and no error: no slot and no word anywhere in the field", () => {
    assertAbsent(renderCase("E2"));
  });

  // ── L181 case 8: overrides ───────────────────────────────────────────────────────────────────────────────────────
  const OVERRIDES: [id: string, word: string, holder: (root: El) => El, slotClass: string][] = [
    ["G1", "Fehler: ", atRoot, "sb-status sb-alert__icon"],
    ["G2", "Fehler: ", atRoot, "sb-status"],
    ["G3", "Fehler: ", errorParagraph, "sb-status"],
    ["G4", "Fehler: ", atRoot, "sb-status sb-toast__icon"],
    ["G5", "Fehler: ", atRoot, "sb-status sb-alert__icon"],
    ["G6", "Error: ", atRoot, "sb-status sb-alert__icon"],
    ["G7", "Error: ", atRoot, "sb-status sb-alert__icon"],
  ];
  for (const [id, word, holder, slotClass] of OVERRIDES) {
    const { component, props } = CASES[id]!;
    test(`L181 case 8 ${id} ${component} with statusLabel ${JSON.stringify(props.statusLabel)}: the word is "${word}" (L171: the component adds the colon and the space; a statusLabel is trimmed, and an empty one gives the default)`, () => {
      assertPresent(renderCase(id), { holder, slotClass, tone: "danger", word });
    });
  }

  // ── L181 case 9, L187: the markup is otherwise unchanged ─────────────────────────────────────────────────────────
  const FIXTURE = join(LIB, "tools", "fixtures", "status-markup.at-9b83e50.json");
  const FIXTURE_SHA256 = "c616a18114b6d1e13246c75abb84c92d621b6247d0b5294baf6f8eb357439f81";
  const fixture = JSON.parse(readFileSync(FIXTURE, "utf8")) as { recordedFrom: string; cases: { id: string; component: string; props: Props; html: string }[] };
  /** L187's removal: a slot, whole, with its glyph and its word. */
  const SLOT = /<span class="sb-status[^"]*"><svg[^>]*>[\s\S]*?<\/svg>(?:<span class="u-visually-hidden">[^<]*<\/span>)?<\/span>/g;
  const unslotted = (html: string) => html.replace(SLOT, "");

  test("L187 (fixture) status-markup.at-9b83e50.json is byte for byte what record-status-markup.mts.txt recorded from 9b83e50's build: pinned by sha256", () => {
    assert.equal(createHash("sha256").update(readFileSync(FIXTURE)).digest("hex"), FIXTURE_SHA256);
  });

  test("L187 (fixture) it was recorded from 9b83e50 and holds the 39 cases A1 to A5, B1 to B13, C1 to C14, D1 to D4 and E1 to E3, in order, each with L187's component and props", () => {
    assert.equal(fixture.recordedFrom, "9b83e50");
    assert.deepEqual(fixture.cases.map((entry) => entry.id), RECORDED);
    for (const entry of fixture.cases) {
      assert.deepEqual({ component: entry.component, props: entry.props }, CASES[entry.id], entry.id);
      assert.deepEqual(Object.keys(entry), ["id", "component", "props", "html"], `${entry.id}: the case's keys`);
    }
  });

  test("L187 (checker) the removal takes a slot whole, glyph, word and box class, and nothing else: a slot that holds anything more is left in place, so the markup differs", () => {
    const glyph = "<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\" focusable=\"false\" class=\"sb-status-icon sb-status-icon--danger\"><path fill=\"currentColor\" fill-rule=\"evenodd\" d=\"M1 1Z\"></path></svg>";
    assert.equal(unslotted(`<span class="sb-badge sb-badge--danger"><span class="sb-status">${glyph}<span class="u-visually-hidden">Error: </span></span>Overdue</span>`), "<span class=\"sb-badge sb-badge--danger\">Overdue</span>", "L174's badge");
    assert.equal(unslotted(`<div role="status" class="sb-alert sb-alert--danger"><span class="sb-status sb-alert__icon">${glyph}<span class="u-visually-hidden">Error: </span></span><div>x</div></div>`), "<div role=\"status\" class=\"sb-alert sb-alert--danger\"><div>x</div></div>", "an alert's slot, with its box class");
    assert.equal(unslotted(`<button class="sb-button sb-button--danger" type="button"><span class="sb-status">${glyph}</span>Delete</button>`), "<button class=\"sb-button sb-button--danger\" type=\"button\">Delete</button>", "a wordless slot");
    for (const extra of [`<span class="sb-status">${glyph}<b>!</b></span>`, `<span class="sb-status" data-x="1">${glyph}</span>`, `<span class="sb-status">${glyph}<span class="u-visually-hidden">Error: </span><span class="u-visually-hidden">Error: </span></span>`]) {
      assert.notEqual(unslotted(`<span class="sb-badge">${extra}x</span>`), "<span class=\"sb-badge\">x</span>", extra);
    }
  });

  for (const entry of fixture.cases) {
    test(`L187 ${entry.id} ${entry.component}: with every slot removed, the markup this tree's build renders is 9b83e50's, character for character`, () => {
      assert.equal(unslotted(render(entry.component, entry.props)), entry.html);
    });
  }

  /** L187: the toast has no server-renderable form at 9b83e50; its markup after removal, as given there. */
  const TOAST_HTML: Record<string, string> = {
    F1: "<div class=\"sb-toast sb-toast--success\"><div><p class=\"sb-toast__title\">Sticky</p><p class=\"sb-toast__body\">I stay until dismissed.</p></div><button type=\"button\" class=\"sb-toast__dismiss sb-close\" aria-label=\"Dismiss notification\"></button></div>",
    F2: "<div class=\"sb-toast sb-toast--danger\" data-leaving=\"true\"><div><p class=\"sb-toast__body\">Account deleted.</p></div><button type=\"button\" class=\"sb-toast__dismiss sb-close\" aria-label=\"Dismiss notification\"></button></div>",
    F3: "<div class=\"sb-toast\"><div><p class=\"sb-toast__body\">All changes saved.</p></div><button type=\"button\" class=\"sb-toast__dismiss sb-close\" aria-label=\"Dismiss notification\"></button></div>",
  };
  for (const [id, html] of Object.entries(TOAST_HTML)) {
    test(`L187 L173 ${id} ToastItem: with its slot removed, the markup is what molecules/toast.tsx rendered for the same record at 9b83e50, and no attribute it was not given a prop for`, () => {
      assert.equal(unslotted(renderCase(id)), html);
    });
  }

  // ── L181 case 9, L188: the provider passes the tone and the word through ─────────────────────────────────────────
  /** L188's four textual checks on toast.tsx, its whitespace runs collapsed to one space: each that fails, by what it reads. */
  function providerFindings(source: string): string[] {
    const text = source.replace(/\s+/g, " ");
    const findings: string[] = [];
    const uses = text.split("<ToastItem ").length - 1;
    if (uses !== 1) {
      findings.push(`"<ToastItem " occurs ${uses} times, not exactly once`);
    }
    const use = text.indexOf("<ToastItem ");
    const element = use === -1 ? "" : text.slice(use, text.indexOf("/>", use) === -1 ? undefined : text.indexOf("/>", use));
    for (const attribute of ["tone={t.tone}", "statusLabel={t.statusLabel}"]) {
      if (!element.includes(attribute)) {
        findings.push(`the ToastItem element does not pass ${attribute}`);
      }
    }
    const between = (open: string, close: string) => {
      const from = text.indexOf(open);
      const to = from === -1 ? -1 : text.indexOf(close, from + open.length);
      return from === -1 || to === -1 ? undefined : text.slice(from + open.length, to);
    };
    const options = between("(message: ReactNode, {", "}: ToastOptions");
    if (!(options ?? "").includes("statusLabel")) {
      findings.push(options === undefined ? "no \"(message: ReactNode, { … }: ToastOptions\"" : "toast() does not destructure statusLabel from its options");
    }
    const record = between("[...all, {", "}");
    if (!(record ?? "").includes("statusLabel")) {
      findings.push(record === undefined ? "no \"[...all, { … }\"" : "the record toast() adds does not hold statusLabel");
    }
    return findings;
  }
  const TOAST_SOURCE = join(LIB, "src", "molecules", "toast.tsx");

  test("L188 (checker) the provider checks pass the source form L188 pins, and each fails alone when the one attribute or name it reads is deleted", () => {
    const good = [
      "export interface ToastOptions {\n  title?: ReactNode;\n  tone?: Tone;\n  statusLabel?: string;\n  duration?: number;\n}",
      "const toast = useCallback(\n    (message: ReactNode, { title, tone, statusLabel, duration = 5000 }: ToastOptions = {}) => {",
      "      setToasts((all) => [...all, { id, message, title, tone, statusLabel, duration }]);",
      "{toasts.map((t) => (\n  <ToastItem\n    key={t.id}\n    title={t.title}\n    message={t.message}\n    tone={t.tone}\n    statusLabel={t.statusLabel}\n    leaving={t.leaving}\n    onDismiss={() => dismiss(t.id)}\n  />\n))}",
    ].join("\n");
    assert.deepEqual(providerFindings(good), []);
    const cut = (from: string, to: string) => {
      assert.ok(good.includes(from), from);
      return providerFindings(good.replace(from, to));
    };
    assert.deepEqual(cut("    tone={t.tone}\n", ""), ["the ToastItem element does not pass tone={t.tone}"]);
    assert.deepEqual(cut("    statusLabel={t.statusLabel}\n", ""), ["the ToastItem element does not pass statusLabel={t.statusLabel}"]);
    assert.deepEqual(cut("{ title, tone, statusLabel, duration = 5000 }", "{ title, tone, duration = 5000 }"), ["toast() does not destructure statusLabel from its options"]);
    assert.deepEqual(cut("{ id, message, title, tone, statusLabel, duration }", "{ id, message, title, tone, duration }"), ["the record toast() adds does not hold statusLabel"]);
    assert.deepEqual(providerFindings(`${good}\n<ToastItem key={1} message="x" onDismiss={f} />`), ["\"<ToastItem \" occurs 2 times, not exactly once"]);
  });

  test("L173 the toast region is unchanged: role=\"region\", aria-live=\"polite\", aria-label=\"Notifications\"", () => {
    assert.ok(readFileSync(TOAST_SOURCE, "utf8").replace(/\s+/g, " ").includes("<div className=\"sb-toast-region\" role=\"region\" aria-live=\"polite\" aria-label=\"Notifications\">"));
  });

  test("L188 the provider passes the tone and the word through: in src/molecules/toast.tsx, <ToastItem occurs once and passes tone={t.tone} and statusLabel={t.statusLabel}; toast() destructures statusLabel and its record holds it", () => {
    assert.deepEqual(providerFindings(readFileSync(TOAST_SOURCE, "utf8")), []);
  });

  // ── L181 case 10, L189: the barrel ───────────────────────────────────────────────────────────────────────────────
  test("L189 L169 the built barrel exports the four glyphs, SuccessIcon, WarningIcon, DangerIcon and InfoIcon", () => {
    assert.equal(barrelMissing, "", `packages/component-library/dist/index.js does not load: ${barrelMissing}`);
    assert.deepEqual(Object.values(GLYPH).filter((name) => typeof barrel[name] !== "function"), []);
  });

  test("L181 case 10 L189 internal names stay internal: the barrel exports none of StatusMark, STATUS_GLYPHS, STATUS_WORDS and ToastItem", () => {
    assert.equal(barrelMissing, "", `packages/component-library/dist/index.js does not load: ${barrelMissing}`);
    assert.ok(Object.keys(barrel).length > 100, `the barrel exports ${Object.keys(barrel).length} names: it was not read`);
    assert.deepEqual(["StatusMark", "STATUS_GLYPHS", "STATUS_WORDS", "ToastItem"].filter((name) => name in barrel), []);
  });

  test("L173 L189 ToastItem is exported from packages/component-library/dist/molecules/toast.js", () => {
    built("ToastItem");
  });

  test("L189 the wiring: test:status in the package and at the root, the root test chain ending in test:contracts and then test:status, CI's step between test:contracts and check:consumable, and CLAUDE.md's pnpm test line", () => {
    const scripts = (dir: string) => (JSON.parse(readFileSync(join(dir, "package.json"), "utf8")) as { scripts: Record<string, string> }).scripts;
    assert.equal(scripts(LIB)["test:status"], "node tools/test-status.ts", "packages/component-library/package.json");
    assert.equal(scripts(ROOT)["test:status"], "pnpm --filter @sorbet/component-library test:status", "package.json");
    assert.ok(scripts(ROOT).test!.endsWith(" && pnpm run test:contracts && pnpm run test:status"), `the root test chain: ${scripts(ROOT).test}`);
    const ci = readFileSync(join(ROOT, ".github", "workflows", "build.yml"), "utf8");
    assert.match(ci, /\n {6}- name: Verify every status carries its icon and word\n {8}run: pnpm run test:status\n/, "build.yml's step");
    const runs = [...ci.matchAll(/^ +run: (.+)$/gm)].map((m) => m[1]!.trim());
    const at = (command: string) => runs.findIndex((run) => run === command || run.startsWith(`${command} `));
    assert.ok(at("pnpm run test:contracts") !== -1 && at("pnpm run test:contracts") < at("pnpm run test:status") && at("pnpm run test:status") < at("pnpm run check:consumable"), `build.yml's order: ${runs.join(" | ")}`);
    assert.ok(readFileSync(join(ROOT, "CLAUDE.md"), "utf8").includes("pnpm test           # check:contrast + check:client + test:golden + test:contrast + test:contracts + test:status\n"), "CLAUDE.md's pnpm test line");
  });

  // ── L189: the build check, on planted copies ─────────────────────────────────────────────────────────────────────
  test("L189 (checker) the build check names the first source file, in sorted order, whose counterpart in dist is missing or older; .d.ts files have none; paths are relative to the repo root", () => {
    const root = join(tmp, "build-check");
    const lib = join(root, "packages", "component-library");
    const plant = (path: string, mtime: number) => {
      mkdirSync(dirname(join(lib, path)), { recursive: true });
      writeFileSync(join(lib, path), "export {};\n");
      utimesSync(join(lib, path), mtime, mtime);
    };
    for (const path of ["src/atoms/a.tsx", "src/b.ts", "src/types.d.ts"]) {
      plant(path, 1_000);
    }
    for (const path of ["dist/atoms/a.js", "dist/b.js"]) {
      plant(path, 2_000);
    }
    assert.equal(staleBuild(root), null, "a built tree");
    utimesSync(join(lib, "src/b.ts"), 3_000, 3_000);
    assert.equal(staleBuild(root), "packages/component-library/src/b.ts is newer than packages/component-library/dist/b.js");
    rmSync(join(lib, "dist/atoms/a.js"));
    assert.equal(staleBuild(root), "packages/component-library/dist/atoms/a.js does not exist", "atoms/a.tsx sorts before b.ts");
    rmSync(join(lib, "dist"), { recursive: true });
    assert.equal(staleBuild(root), "packages/component-library/dist/atoms/a.js does not exist", "no dist at all");
  });

  test("L189 a missing or stale build fails before any case: this file, run on a planted copy of the package, prints L189's line naming pnpm build and exits 1", () => {
    const root = join(tmp, "planted");
    const lib = join(root, "packages", "component-library");
    mkdirSync(join(lib, "tools"), { recursive: true });
    cpSync(join(LIB, "tools", "test-status.ts"), join(lib, "tools", "test-status.ts"));
    cpSync(join(LIB, "src"), join(lib, "src"), { recursive: true });
    cpSync(join(LIB, "dist"), join(lib, "dist"), { recursive: true, preserveTimestamps: true });
    const run = () => spawnSync(process.execPath, [join(lib, "tools", "test-status.ts")], { encoding: "utf8" });
    // cpSync gave the sources new times; put the build after them, then make one source newer.
    const later = Date.now() / 1000 + 60;
    const walk = (dir: string): string[] => readdirSync(dir, { withFileTypes: true }).flatMap((entry) => (entry.isDirectory() ? walk(join(dir, entry.name)) : [join(dir, entry.name)]));
    for (const file of walk(join(lib, "dist"))) {
      utimesSync(file, later, later);
    }
    utimesSync(join(lib, "src", "molecules", "toast.tsx"), later + 60, later + 60);
    const stale = run();
    assert.equal(stale.status, 1, `exit ${stale.status}: ${stale.stdout}${stale.stderr}`);
    assert.equal(`${stale.stdout}${stale.stderr}`.trim(), "✗ test:status reads the built component library: packages/component-library/src/molecules/toast.tsx is newer than packages/component-library/dist/molecules/toast.js. Run pnpm build first.");
    rmSync(join(lib, "dist", "atoms", "badge.js"));
    const missing = run();
    assert.equal(missing.status, 1, `exit ${missing.status}`);
    assert.equal(`${missing.stdout}${missing.stderr}`.trim(), "✗ test:status reads the built component library: packages/component-library/dist/atoms/badge.js does not exist. Run pnpm build first.");
  });
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

if (failed.length > 0) {
  console.error(styleText("red", `\n✗ ${failed.length} of ${ran} status checks failed: a status component renders without its icon, its word or its slot, or its markup is not otherwise 9b83e50's.`));
  process.exit(1);
}
// A run that tested nothing must not read as a pass.
if (ran < 100) {
  console.error(styleText("red", `\n✗ only ${ran} status checks ran`));
  process.exit(1);
}
console.log(styleText("green", `✓ every status carries its icon and its word, and its markup is otherwise 9b83e50's: ${ran} checks`));
