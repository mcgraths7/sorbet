/**
 * Proof that the golden gate still bites. `pnpm test:golden`; part of
 * `pnpm test`, and a step of CI's build job.
 *
 * WHAT THIS EXISTS TO CATCH. A gate that has stopped working looks exactly
 * like a gate that is passing: one green line. The golden comparison
 * (check-golden.ts) is the only thing standing between an edit to a shared
 * ramp and a silent change to ocean, forest, noir or midnight, and every way
 * it can be weakened leaves the build green — an early `continue`, a
 * normalised newline, a caught error, the call deleted from build-tokens, the
 * check moved back below the writes, a report that prints nothing and exits 0.
 * So this breaks things on purpose and asserts each one FAILS:
 *
 *   - one changed byte in any single theme fails, naming that theme alone;
 *   - a missing, unreadable, orphaned or re-encoded golden fails;
 *   - comparing nothing fails;
 *   - the real build, run on a copy of the sources with one shared ramp
 *     nudged, exits 1, names forest, and writes nothing;
 *   - the update tool refuses every frozen preset and leaves tools/golden/
 *     untouched; and a frozen golden that differs from the base branch fails;
 *   - the standalone report speaks when run through a path with a space and a
 *     symlink in it (it once printed nothing and exited 0 there).
 *
 * Everything is done on in-memory strings or in a temporary directory. This
 * never writes to tools/golden/ or dist/, and it says so by fingerprinting
 * tools/golden/ before and after.
 */

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { styleText } from "node:util";

import { PRESET_NAMES } from "../src/tokens/index.ts";

import { checkAgainstBase } from "./check-golden-base.ts";
import {
  checkGolden, diffLines, FROZEN_PRESETS, GOLDEN_DIR, goldenFailureText, goldenPath, isFrozen, producedThemes, updateCommand,
} from "./check-golden.ts";

const pkgRoot = join(import.meta.dirname, "..");
// The space is deliberate: every path below goes through it.
const tmp = mkdtempSync(join(tmpdir(), "sorbet golden "));

const produced = producedThemes();
const names = Object.keys(produced);

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

/** A fresh golden directory holding exactly what the build produces. */
let seeds = 0;
function seeded(): string {
  const dir = join(tmp, `golden-${seeds++}`);
  mkdirSync(dir);
  for (const [preset, css] of Object.entries(produced)) {
    writeFileSync(goldenPath(preset, dir), css);
  }
  return dir;
}

/** A byte-order mark: the character that prints as nothing. */
const BOM = String.fromCharCode(0xfeff);

const kinds = (report: ReturnType<typeof checkGolden>) => report.failures.map((f) => `${f.preset || "(gate)"}:${f.kind}`).sort();
const fingerprint = (dir: string) =>
  readdirSync(dir).sort().map((file) => `${file} ${createHash("sha1").update(readFileSync(join(dir, file))).digest("hex")}`).join("\n");
const node = (args: string[], cwd = pkgRoot) => spawnSync(process.execPath, args, { cwd, encoding: "utf8" });

/** Change exactly one character of a theme: the first digit of its first hex colour. */
function nudge(css: string): string {
  const out = css.replace(/#([0-9a-f])/, (_, d: string) => `#${d === "0" ? "1" : "0"}`);
  assert.notEqual(out, css, "the nudge changed nothing — there was no hex colour to change");
  return out;
}

const goldenBefore = fingerprint(GOLDEN_DIR);
console.log(styleText("bold", "the golden gate, broken on purpose:"));

try {
  // ── the list itself ────────────────────────────────────────────────────
  test("every frozen name is a real preset (a typo would silently unfreeze it)", () => {
    for (const preset of FROZEN_PRESETS) {
      assert.ok(PRESET_NAMES.includes(preset as never), `"${preset}" is frozen but is not a preset`);
      assert.ok(Object.hasOwn(produced, preset), `"${preset}" is frozen but the build does not produce it`);
    }
  });

  // ── the real tree ──────────────────────────────────────────────────────
  test("the untouched tree passes, and every preset was actually compared", () => {
    const report = checkGolden(produced);
    assert.deepEqual(kinds(report), []);
    assert.deepEqual([...report.matched].sort(), [...names].sort());
    assert.ok(report.matched.length >= FROZEN_PRESETS.length);
  });

  // ── the comparison ─────────────────────────────────────────────────────
  test("a seeded copy passes (so the failures below are caused by the breakage)", () => {
    const report = checkGolden(produced, seeded());
    assert.deepEqual(kinds(report), []);
    assert.equal(report.matched.length, names.length);
  });

  for (const preset of names) {
    test(`one changed character in ${preset} fails, naming ${preset} alone`, () => {
      const report = checkGolden({ ...produced, [preset]: nudge(produced[preset]!) }, seeded());
      assert.deepEqual(kinds(report), [`${preset}:differs`]);
      assert.ok(!report.matched.includes(preset));
      assert.equal(report.matched.length, names.length - 1);
      assert.equal(report.failures[0]!.lines!.length, 1);
    });
  }

  const victim = FROZEN_PRESETS[0] ?? names[0]!;
  const reEncodings: [string, (css: string) => string | Buffer][] = [
    ["a trailing space", (css) => css.replace("\n", " \n")],
    ["CRLF line endings", (css) => css.replaceAll("\n", "\r\n")],
    ["a dropped final newline", (css) => css.replace(/\n$/, "")],
    ["an extra final newline", (css) => `${css}\n`],
    ["a byte-order mark", (css) => BOM + css],
    ["an empty file", () => ""],
  ];
  for (const [what, change] of reEncodings) {
    test(`a golden with ${what} fails (bytes are compared, nothing is normalised)`, () => {
      const dir = seeded();
      const changed = change(produced[victim]!);
      assert.notEqual(changed, produced[victim]);
      writeFileSync(goldenPath(victim, dir), changed);
      assert.deepEqual(kinds(checkGolden(produced, dir)), [`${victim}:differs`]);
    });
  }

  test("a missing golden fails", () => {
    const dir = seeded();
    rmSync(goldenPath(victim, dir));
    assert.deepEqual(kinds(checkGolden(produced, dir)), [`${victim}:missing`]);
  });

  test("a golden that cannot be read fails (it is not skipped)", () => {
    const dir = seeded();
    rmSync(goldenPath(victim, dir));
    mkdirSync(goldenPath(victim, dir)); // reading a directory fails for every user, root included
    assert.deepEqual(kinds(checkGolden(produced, dir)), [`${victim}:unreadable`]);
  });

  test("a golden no preset produces fails", () => {
    const dir = seeded();
    writeFileSync(goldenPath("ghost", dir), produced[victim]!);
    assert.deepEqual(kinds(checkGolden(produced, dir)), ["ghost:orphan"]);
  });

  test("a new preset with no golden fails", () => {
    assert.deepEqual(kinds(checkGolden({ ...produced, lagoon: produced[victim]! }, seeded())), ["lagoon:missing"]);
  });

  test("a missing golden directory fails once per preset, and matches nothing", () => {
    const report = checkGolden(produced, join(tmp, "no-such-directory"));
    assert.deepEqual(kinds(report), names.map((preset) => `${preset}:missing`).sort());
    assert.deepEqual(report.matched, []);
  });

  test("comparing nothing fails", () => {
    const report = checkGolden({}, seeded());
    assert.ok(report.failures.some((f) => f.kind === "dead"));
    assert.deepEqual(report.matched, []);
  });

  for (const preset of FROZEN_PRESETS) {
    test(`${preset} dropped from the build fails, with its golden kept or deleted`, () => {
      const { [preset]: _dropped, ...rest } = produced;
      const kept = seeded();
      assert.deepEqual(kinds(checkGolden(rest, kept)), [`${preset}:orphan`]);
      const deleted = seeded();
      rmSync(goldenPath(preset, deleted));
      assert.deepEqual(kinds(checkGolden(rest, deleted)), [`${preset}:orphan`]);
    });
  }

  // ── what the failure says ──────────────────────────────────────────────
  test("the failure text never offers to regenerate a frozen golden", () => {
    for (const preset of FROZEN_PRESETS) {
      const report = checkGolden({ ...produced, [preset]: nudge(produced[preset]!) }, seeded());
      const text = goldenFailureText(report.failures);
      assert.match(text, /FROZEN/);
      assert.ok(!text.includes("update:golden"), `the text for ${preset} mentions update:golden`);
    }
    const pinned = names.find((preset) => !isFrozen(preset));
    if (pinned !== undefined) {
      const report = checkGolden({ ...produced, [pinned]: nudge(produced[pinned]!) }, seeded());
      const text = goldenFailureText(report.failures);
      assert.ok(text.includes(updateCommand(pinned)));
      assert.ok(FROZEN_PRESETS.every((preset) => !text.includes(updateCommand(preset))));
    }
  });

  test("one added line reads as one line, not as every line below it", () => {
    const css = produced[victim]!;
    const at = css.indexOf("\n", css.indexOf(":root")) + 1;
    const grown = `${css.slice(0, at)}  --sb-probe: 0;\n${css.slice(at)}`;
    assert.deepEqual(diffLines(css, grown).map((l) => [l.golden, l.produced]), [[undefined, "  --sb-probe: 0;"]]);
    assert.deepEqual(diffLines(grown, css).map((l) => [l.golden, l.produced]), [["  --sb-probe: 0;", undefined]]);
    assert.deepEqual(diffLines(css, css), []);
    assert.equal(diffLines(css, nudge(css)).length, 1);
  });

  test("a difference nobody can see is spelled out in the failure text", () => {
    const dir = seeded();
    writeFileSync(goldenPath(victim, dir), BOM + produced[victim]!);
    assert.ok(goldenFailureText(checkGolden(produced, dir).failures).includes("\\ufeff"));
  });

  // ── the real build, on a copy with one shared ramp nudged ──────────────
  test("the real build exits 1 on a nudged shared ramp, names forest, and writes nothing", () => {
    const copy = join(tmp, "package copy");
    for (const part of [join("src", "tokens"), join("src", "styles"), "tools"]) {
      cpSync(join(pkgRoot, part), join(copy, part), { recursive: true });
    }
    const generated = join(copy, "src", "styles", "abstracts", "_generated.scss");
    const generatedBefore = readFileSync(generated);

    // Unchanged, the copy must build — otherwise the failure below proves nothing.
    const clean = node(["tools/build-tokens.ts"], copy);
    assert.equal(clean.status, 0, clean.stderr);
    for (const preset of names) {
      assert.ok(readFileSync(join(copy, "dist", "themes", `${preset}.css`)).equals(readFileSync(goldenPath(preset))));
    }
    rmSync(join(copy, "dist"), { recursive: true });

    // `sand` is forest's neutral. One thousandth of chroma: still legible,
    // so the contrast gate stays green and only the golden gate can object.
    const ramps = join(copy, "src", "tokens", "ramps.ts");
    const source = readFileSync(ramps, "utf8");
    const nudged = source.replace(/(sand:\s*\{[^}]*chroma:\s*)([0-9.]+)/, (_, head: string, c: string) => `${head}${(Number(c) + 0.001).toFixed(3)}`);
    assert.notEqual(nudged, source, "ramps.ts no longer defines sand's chroma the way this test edits it — update the test");
    writeFileSync(ramps, nudged);

    const broken = node(["tools/build-tokens.ts"], copy);
    assert.equal(broken.status, 1, "the build passed with a shared ramp changed");
    assert.match(broken.stdout, /contrast contract holds/, "the contrast gate was meant to stay green here");
    assert.match(broken.stderr, /FROZEN — .*forest/);
    assert.ok(!existsSync(join(copy, "dist")), "a failing build wrote to dist/");
    assert.ok(readFileSync(generated).equals(generatedBefore), "a failing build rewrote _generated.scss");
  });

  // ── the tools around it ────────────────────────────────────────────────
  test("update-golden refuses every frozen preset, and anything that is not one preset", () => {
    for (const preset of FROZEN_PRESETS) {
      const run = node(["tools/update-golden.ts", preset]);
      assert.equal(run.status, 1, `update-golden ${preset} did not fail`);
      assert.match(run.stderr, /is frozen/);
    }
    for (const args of [[], ["--all"], ["--force", victim], [names[0]!, victim], ["constructor"], ["__proto__"], ["no-such-preset"]]) {
      const run = node(["tools/update-golden.ts", ...args]);
      assert.equal(run.status, 1, `update-golden ${args.join(" ")} did not fail`);
      assert.match(run.stderr, /Usage|Unknown preset/, `update-golden ${args.join(" ")} crashed instead of refusing`);
    }
  });

  test("a frozen golden that differs from the base branch fails; a pinned one is reported", () => {
    const base = (preset: string) => Buffer.from(produced[preset]!);
    const same = checkAgainstBase(names, base, base);
    assert.deepEqual(same.failures, []);
    assert.deepEqual([...same.same].sort(), [...FROZEN_PRESETS].sort());

    for (const preset of FROZEN_PRESETS) {
      const rewritten = checkAgainstBase(names, base, (p) => (p === preset ? Buffer.from(nudge(produced[p]!)) : base(p)));
      assert.deepEqual(rewritten.failures.map((f) => f.preset), [preset]);
      const deleted = checkAgainstBase(names, base, (p) => (p === preset ? undefined : base(p)));
      assert.deepEqual(deleted.failures.map((f) => f.preset), [preset]);
    }
    const fresh = checkAgainstBase(names, () => undefined, base);
    assert.deepEqual(fresh.failures, []);
    assert.deepEqual([...fresh.fresh].sort(), [...FROZEN_PRESETS].sort());
    assert.equal(checkAgainstBase(FROZEN_PRESETS, () => undefined, () => undefined).failures.length, FROZEN_PRESETS.length);

    const pinned = names.find((preset) => !isFrozen(preset));
    if (pinned !== undefined) {
      const moved = checkAgainstBase(names, base, (p) => (p === pinned ? Buffer.from(nudge(produced[p]!)) : base(p)));
      assert.deepEqual(moved.failures, []);
      assert.deepEqual(moved.moved, [pinned]);
    }
  });

  test("the standalone reports speak when run through a symlink and a path with a space", () => {
    const link = join(tmp, "linked tools");
    symlinkSync(join(pkgRoot, "tools"), link);
    const verdict = checkGolden(produced).failures.length === 0 ? 0 : 1;
    const golden = node([join(link, "check-golden.ts")]);
    assert.equal(golden.status, verdict);
    assert.match(golden.stdout + golden.stderr, /golden/, "check-golden.ts printed nothing");
    const cvd = node([join(link, "check-cvd.ts")]);
    assert.match(cvd.stdout + cvd.stderr, /floor/, "check-cvd.ts printed nothing");
  });

  test("none of the above touched tools/golden/", () => {
    assert.equal(fingerprint(GOLDEN_DIR), goldenBefore);
  });
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

if (failed.length > 0) {
  console.error(styleText("red", `\n✗ ${failed.length} of ${ran} golden-gate checks failed: the gate, or one of its tools, has stopped biting.`));
  process.exit(1);
}
// A run that tested nothing must not read as a pass.
if (ran < 20) {
  console.error(styleText("red", `\n✗ only ${ran} golden-gate checks ran`));
  process.exit(1);
}
console.log(styleText("green", `✓ the golden gate bites: ${ran} breakages, each one caught`));
