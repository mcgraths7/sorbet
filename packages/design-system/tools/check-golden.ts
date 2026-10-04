/**
 * The golden-file gate: every preset's theme CSS, pinned byte for byte in
 * `tools/golden/<preset>.css`. `pnpm check:golden` for the report;
 * build-tokens runs it on the strings it is about to write, before it writes.
 * `pnpm test:golden` (test-golden.ts) proves the comparison still bites.
 *
 * THE DEFECT THIS EXISTS TO CATCH — read it before deleting this as redundant
 * with the contrast gate. Semantic colours are not typed in, they are PICKED:
 * `semantics.ts` walks a ramp's steps and takes the first one that clears a
 * contrast floor, and when no step clears it, `pick()` returns its last
 * candidate without a word. The ramps it walks are shared between presets
 * (`sand` is the neutral of sorbet and forest, `lemon` the accent of sorbet
 * and noir, the four status ramps serve all five), and so are the lightness
 * and chroma curves every ramp is made from. An edit meant for ONE theme — a
 * ramp's chroma, a curve, a candidate list, a floor — can therefore re-pick
 * the colours of a theme nobody was looking at. Nothing errors: the re-picked
 * colour usually still clears WCAG, so the contrast gate passes, and `dist/`
 * is not in git, so no diff shows it. The first witness would be somebody
 * else's app looking different after its next re-vendor.
 *
 * These files are that missing diff, checked on every build. The contrast
 * gate answers "is this theme legible"; this one answers "is this theme the
 * SAME", and nothing else in the repo asks that.
 *
 * Two strengths of pin (see FROZEN_PRESETS):
 *   frozen — may not change at all. A mismatch is a defect in the change.
 *   pinned — changes only in a pull request whose stated purpose is to change
 *            that preset's values; the golden's diff is what its reviewer reads.
 *
 * The build never writes a golden. `update-golden.ts` does, by hand, for one
 * named preset — a gate that refreshed its own expectation on the way past
 * would pass every time.
 *
 * What stands behind "frozen". This comparison cannot tell a golden that was
 * left alone from one that was overwritten in the same change: both match.
 * `update-golden.ts` refusing the four names is a courtesy, not a lock — any
 * editor can write the file. The lock is `check-golden-base.ts`, which CI
 * runs on every pull request: a frozen golden must be byte-identical to the
 * copy on the branch the pull request merges into.
 *
 * What it does NOT cover — each of these can change with this gate green:
 *   - `dist/css/sorbet.css`: a shared-Sass edit can change how a frozen theme
 *     looks without moving a byte of its theme file.
 *   - `dist/themes/manifest.json`: a preset's `label` and `defaultMode`, and
 *     the order of presets, are emitted there and nowhere in a theme file.
 *     Left unpinned on purpose: the manifest's shape is due to change for all
 *     five presets at once (it gains each preset's contract), and a "frozen"
 *     file that has to be regenerated teaches the one habit this gate forbids.
 *   - `src/styles/abstracts/_generated.scss`: spacing, type, motion and
 *     breakpoints. It is tracked, so git shows its diff.
 *   - `dist/tokens/*.js`, which `sorbet theme <preset>` emits from: built by a
 *     separate step (`build:ts`), so running that step alone skips this gate.
 */

import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { styleText } from "node:util";

import { presets, themeCss } from "../src/tokens/index.ts";

const pkgRoot = join(import.meta.dirname, "..");

export const GOLDEN_DIR = join(import.meta.dirname, "golden");

/**
 * The presets whose theme file may not change by a single byte.
 *
 * What it is: the four themes that apps outside this repo, and another
 * person, were already loading when sorbet's own theme began to be reworked.
 * Their emitted CSS is a published interface — whatever they look like today
 * is what those readers chose.
 *
 * Why a list: a mismatch has to MEAN something different for these four than
 * for sorbet. For a frozen preset it is always a defect in the change being
 * made and never a reason to touch the golden, so `update-golden.ts` refuses
 * them and has no --force. For every other preset the golden may move, but
 * only in a pull request that says that is its purpose.
 *
 * How one is changed on purpose: by taking its name off this line, in a pull
 * request whose stated purpose is to change that theme (a later fix to the
 * four themes' dark-mode edges would be one). It is then pinned like sorbet:
 * `update-golden.ts` will rewrite it, and the base-branch check prints it as
 * "pinned, and changed" for the reviewer instead of failing.
 *
 * What retires it: the day no theme needs a stronger pin than "changes only on
 * purpose" — when the sorbet rework has landed and the four are no longer being
 * protected from it. It is deliberately NOT derived from anything a preset
 * declares about itself: frozen is a promise about a piece of work, and a
 * preset must not be able to unfreeze itself by changing its own description.
 */
export const FROZEN_PRESETS: readonly string[] = ["ocean", "forest", "noir", "midnight"];

export const isFrozen = (preset: string) => FROZEN_PRESETS.includes(preset);
export const goldenPath = (preset: string, dir = GOLDEN_DIR) => join(dir, `${preset}.css`);

/** The update command, spelled once so the failure text and the tool agree. */
export const updateCommand = (preset: string) => `pnpm --filter @sorbet/design-system update:golden ${preset}`;

/** Every preset's theme CSS, exactly as the build would write it. */
export function producedThemes(): Record<string, string> {
  return Object.fromEntries(Object.values(presets).map((preset) => [preset.name, themeCss(preset)]));
}

export interface GoldenLine {
  /** The golden's line number — or the produced file's, where the golden has no such line. */
  line: number;
  /** `undefined` where that side has no such line (the other side added it). */
  golden: string | undefined;
  produced: string | undefined;
}

export interface GoldenFailure {
  /** The preset, or "" when the comparison itself could not run. */
  preset: string;
  kind: "differs" | "missing" | "unreadable" | "orphan" | "dead";
  /** One line: what is wrong. */
  problem: string;
  /** kind "differs": every differing line, golden against produced. */
  lines?: GoldenLine[];
}

export interface GoldenReport {
  /**
   * The presets whose bytes were compared and found equal. Success is printed
   * from THIS, never from the preset count — a comparison that ran over
   * nothing must not be able to read as a pass.
   */
  matched: string[];
  failures: GoldenFailure[];
}

/**
 * The lines that differ, golden against produced. A real diff (longest common
 * subsequence), not a walk by position: one declaration added near the top
 * would otherwise shift every line below it and read as hundreds of changes.
 * A removed line and an added line at the same place are reported together,
 * as one changed line.
 */
export function diffLines(golden: string, produced: string): GoldenLine[] {
  const g = golden.split("\n");
  const p = produced.split("\n");

  // Peel off what both ends share, so the table below is only as big as the
  // part that actually moved.
  let head = 0;
  while (head < g.length && head < p.length && g[head] === p[head]) {
    head++;
  }
  let gEnd = g.length;
  let pEnd = p.length;
  while (gEnd > head && pEnd > head && g[gEnd - 1] === p[pEnd - 1]) {
    gEnd--;
    pEnd--;
  }
  const a = g.slice(head, gEnd);
  const b = p.slice(head, pEnd);

  // common[i][j]: how many lines a[i..] and b[j..] share, in order.
  const common: number[][] = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      common[i]![j] = a[i] === b[j] ? common[i + 1]![j + 1]! + 1 : Math.max(common[i + 1]![j]!, common[i]![j + 1]!);
    }
  }

  const lines: GoldenLine[] = [];
  let removed: number[] = [];
  let added: number[] = [];
  const flush = () => {
    for (let k = 0; k < Math.max(removed.length, added.length); k++) {
      const [r, d] = [removed[k], added[k]];
      lines.push({
        line: head + (r ?? d!) + 1,
        golden: r === undefined ? undefined : a[r],
        produced: d === undefined ? undefined : b[d],
      });
    }
    removed = [];
    added = [];
  };
  let i = 0;
  let j = 0;
  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && a[i] === b[j]) {
      flush();
      i++;
      j++;
    } else if (j >= b.length || (i < a.length && common[i + 1]![j]! >= common[i]![j + 1]!)) {
      removed.push(i++);
    } else {
      added.push(j++);
    }
  }
  flush();
  return lines;
}

/** Lines as an editor counts them: a final newline ends the last line, it does not start another. */
const lineCount = (text: string) => (text === "" ? 0 : text.split("\n").length - (text.endsWith("\n") ? 1 : 0));

/**
 * Compare `produced` (preset name → theme CSS, in memory) with the goldens in
 * `dir`. Reads only; never writes. Every way of NOT comparing is a failure:
 * a preset with no golden, a golden that cannot be read, a golden with no
 * preset, a frozen preset that is no longer produced, and nothing to compare.
 */
export function checkGolden(produced: Record<string, string>, dir = GOLDEN_DIR): GoldenReport {
  const matched: string[] = [];
  const failures: GoldenFailure[] = [];
  const rel = (preset: string) => relative(pkgRoot, goldenPath(preset, dir));

  if (Object.keys(produced).length === 0) {
    failures.push({ preset: "", kind: "dead", problem: "no preset was produced, so nothing was compared" });
  }

  for (const [preset, css] of Object.entries(produced)) {
    let golden: Buffer;
    try {
      golden = readFileSync(goldenPath(preset, dir));
    } catch(error) {
      const code = (error as NodeJS.ErrnoException).code ?? String(error);
      failures.push(
        code === "ENOENT"
          ? { preset, kind: "missing", problem: `no golden file: ${rel(preset)} does not exist` }
          : { preset, kind: "unreadable", problem: `${rel(preset)} could not be read (${code}), so it was not compared` },
      );
      continue;
    }
    // Bytes, not text: writeFile() encodes a string as UTF-8, so this is the
    // file dist/ would receive, with nothing normalised away on either side.
    if (golden.equals(Buffer.from(css))) {
      matched.push(preset);
      continue;
    }
    const text = golden.toString("utf8");
    const lines = diffLines(text, css);
    // The bytes differ, so this is a failure whatever the line diff says: a
    // golden that is not valid UTF-8 can decode to text that looks equal.
    const onlyFinalNewline = `${text}\n` === css || text === `${css}\n`;
    const count = lines.length === 0
      ? "the bytes differ although no line of text does (encoding)"
      : onlyFinalNewline
        ? `the final newline differs (the golden ${text.endsWith("\n") ? "has" : "lacks"} one)`
        : `${lines.length} line(s) differ`;
    const [was, now] = [lineCount(text), lineCount(css)];
    failures.push({
      preset,
      kind: "differs",
      problem: was === now ? count : `${count}; the golden has ${was} lines, the build produced ${now}`,
      lines,
    });
  }

  // The other direction: a golden nobody produces any more means a preset was
  // removed or renamed — a theme file other apps may load has stopped being
  // built. Only *.css counts as a golden; anything else in there is not ours.
  let onDisk: string[] = [];
  try {
    onDisk = readdirSync(dir)
      .filter((file) => file.endsWith(".css"))
      .map((file) => file.slice(0, -".css".length));
  } catch(error) {
    const code = (error as NodeJS.ErrnoException).code ?? String(error);
    // A missing directory is already reported above, once per preset.
    if (code !== "ENOENT") {
      failures.push({
        preset: "",
        kind: "dead",
        problem: `${relative(pkgRoot, dir)}/ could not be listed (${code}), so goldens without a preset were not looked for`,
      });
    }
  }
  for (const preset of onDisk) {
    if (!Object.hasOwn(produced, preset)) {
      failures.push({ preset, kind: "orphan", problem: `${rel(preset)} pins a preset the build no longer produces` });
    }
  }
  // Deleting a frozen preset AND its golden in one go would otherwise leave
  // nothing on either side to disagree.
  for (const preset of FROZEN_PRESETS) {
    if (!Object.hasOwn(produced, preset) && !onDisk.includes(preset)) {
      failures.push({ preset, kind: "orphan", problem: "the build no longer produces it, and its golden is gone too" });
    }
  }

  return { matched, failures };
}

/** How many differing lines a failure prints before it summarises the rest (the report's --all prints every one). */
const SHOWN = 3;

/** Characters JSON.stringify passes through that a terminal draws as nothing, or as a plain space. */
const INVISIBLE = /[\u007f-\u00a0\u00ad\u200b-\u200f\u2028-\u202f\u2060-\u2064\ufeff]/g;

/** Hard-wrap a paragraph: a build log has no soft wrap, and pnpm prefixes every line. */
function wrap(text: string, indent = "    ", width = 80): string[] {
  const lines: string[] = [];
  let line = indent;
  for (const word of text.split(" ")) {
    if (line.length + word.length > width && line !== indent) {
      lines.push(line.trimEnd());
      line = indent;
    }
    line += `${word} `;
  }
  lines.push(line.trimEnd());
  return lines;
}

/**
 * The failure, as text. Says what each kind of mismatch MEANS, and never
 * offers regeneration for a frozen preset: the cheapest way to make this gate
 * green is also the one way to defeat it. `shown` caps the differing lines
 * printed per preset.
 */
export function goldenFailureText(failures: readonly GoldenFailure[], shown = SHOWN): string {
  const out: string[] = [];
  const dead = failures.filter((f) => f.kind === "dead");
  const frozen = failures.filter((f) => f.kind !== "dead" && isFrozen(f.preset));
  const pinned = failures.filter((f) => f.kind !== "dead" && !isFrozen(f.preset));

  // JSON.stringify so a trailing space or a stray \r is visible, not implied —
  // and it leaves the characters that print as NOTHING alone (a byte-order
  // mark, a zero-width or no-break space), so those are escaped by hand: two
  // lines that differ must never look the same on screen.
  const show = (text: string | undefined, absent: string) =>
    text === undefined
      ? absent
      : JSON.stringify(text).replace(
        INVISIBLE,
        (ch) => `\\u${ch.charCodeAt(0).toString(16).padStart(4, "0")}`,
      );
  const describe = (f: GoldenFailure) => {
    out.push(`    ${styleText("bold", f.preset)}: ${f.problem}`);
    for (const l of (f.lines ?? []).slice(0, shown)) {
      const at = `line ${l.line}`;
      out.push(`      ${at}  golden    ${show(l.golden, "(not in the golden: the build added this line)")}`);
      out.push(`      ${" ".repeat(at.length)}  produced  ${show(l.produced, "(not produced: the build dropped this line)")}`);
    }
    if (f.lines && f.lines.length > shown) {
      out.push(`      … and ${f.lines.length - shown} more (every line: node ${relative(pkgRoot, import.meta.filename)} --all, from ${relative(join(pkgRoot, "..", ".."), pkgRoot)}/)`);
    }
  };

  out.push(styleText("red", `\n✗ ${failures.length} golden-file failure(s) — theme CSS against ${relative(pkgRoot, GOLDEN_DIR)}/:`));

  // "dead" is anything that left part of the comparison undone. The problem
  // line says which part; the files that WERE compared are not disowned here.
  for (const f of dead) {
    out.push(...wrap(`Not fully checked: ${f.problem}. That is a failure, never a skip.`, "  "));
  }

  if (frozen.length > 0) {
    out.push(`\n  ${styleText("bold", "FROZEN")} — ${frozen.map((f) => f.preset).join(", ")}`);
    frozen.forEach(describe);
    const frozenOf = (kind: GoldenFailure["kind"]) => frozen.filter((f) => f.kind === kind).map((f) => f.preset);
    out.push(
      "",
      ...wrap(
        `What it means: ${FROZEN_PRESETS.join(", ")} are frozen. Apps outside this repo load these theme files as built, `
        + "so they may not change by a byte, lose their golden, or stop being built. A frozen golden is never regenerated.",
      ),
    );
    if (frozenOf("differs").length > 0) {
      out.push(
        ...wrap(
          `${frozenOf("differs").join(", ")}: the theme the build produces has changed. That is a defect in the change being `
          + "made — usually an edit to a shared ramp, curve or walk that re-picked another theme's colours, which pick() does "
          + "without an error. Fix the change, not the golden.",
        ),
      );
    }
    if (frozenOf("missing").length > 0 || frozenOf("unreadable").length > 0) {
      out.push(
        ...wrap(
          `${[...frozenOf("missing"), ...frozenOf("unreadable")].join(", ")}: the golden itself is missing or cannot be read, `
          + "so nothing was compared. No colour need have moved. Restore the file from git (git checkout <base> -- <path>) and "
          + "check its permissions.",
        ),
      );
    }
    if (frozenOf("orphan").length > 0) {
      out.push(
        ...wrap(
          `${frozenOf("orphan").join(", ")}: the build no longer produces this theme. A frozen preset was removed or renamed, `
          + "so a theme file other apps load has stopped being built. Put the preset back.",
        ),
      );
    }
  }

  if (pinned.length > 0) {
    const of = (kind: GoldenFailure["kind"]) => pinned.filter((f) => f.kind === kind).map((f) => f.preset);
    out.push(`\n  ${styleText("bold", "PINNED")} — ${pinned.map((f) => f.preset).join(", ")}`);
    pinned.forEach(describe);
    out.push(
      "",
      ...wrap("What it means: a pinned theme changes only in a pull request whose STATED PURPOSE is to change that preset's values."),
    );
    if (of("differs").length > 0) {
      out.push(
        ...wrap(
          "If this is not that pull request, the change has leaked into a theme it was not aimed at: fix the change and "
          + "leave the golden alone. If it is, the golden is rewritten by hand, in it, and the golden's diff is what the "
          + "reviewer reads:",
        ),
        ...of("differs").map((name) => `      ${updateCommand(name)}`),
      );
    }
    if (of("missing").length > 0) {
      out.push(
        ...wrap("A golden that used to exist is restored from git, not rewritten. A NEW preset is pinned in the pull request that adds it:"),
        ...of("missing").map((name) => `      ${updateCommand(name)}`),
      );
    }
    if (of("unreadable").length > 0) {
      out.push(...wrap("A golden that cannot be read was not compared. That is a failure, never a skip."));
    }
    if (of("orphan").length > 0) {
      out.push(
        ...wrap(
          "A golden without a preset means a preset was removed or renamed, so a theme file stopped being built. If that "
          + "is this pull request's stated purpose, it deletes the golden too.",
        ),
      );
    }
  }

  return out.join("\n");
}

/** The success line, counted from what was actually compared. */
export function goldenSuccessText({ matched }: GoldenReport): string {
  const frozen = matched.filter(isFrozen).length;
  return styleText(
    "green",
    `✓ all ${matched.length} theme files match their golden copy byte for byte (${frozen} frozen, ${matched.length - frozen} pinned)`,
  );
}

// `import.meta.main`, not a comparison of process.argv[1] with this file's URL:
// that comparison is false whenever the path holds a space (the URL escapes
// it) or is reached through a symlink (the URL is resolved), and the report
// then printed nothing and exited 0 — over a golden that did not match.
if (import.meta.main) {
  console.log(styleText("bold", `theme CSS against ${relative(pkgRoot, GOLDEN_DIR)}/:`));
  const report = checkGolden(producedThemes());
  for (const preset of report.matched) {
    console.log(`  ${preset.padEnd(9)} ${isFrozen(preset) ? "frozen" : "pinned"}  matches`);
  }
  if (report.failures.length > 0) {
    console.error(goldenFailureText(report.failures, process.argv.includes("--all") ? Infinity : SHOWN));
    process.exit(1);
  }
  console.log(goldenSuccessText(report));
}
