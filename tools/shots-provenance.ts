/**
 * Where a screenshot baseline came from, and whether `pnpm shots compare` may
 * use it (legibility-spec.md L155). Pure but for `digestPlayground`, which
 * reads a directory: no top-level side effects, so `pnpm test` drives it.
 *
 * THE DEFECTS THIS EXISTS TO CATCH.
 *
 * - F14 (audit of the step-2.3/2.4 repair, guards lens). The comparer never
 *   asked where its baseline came from. A baseline shot from the tree under
 *   test — the same commit, or a working tree nobody can reproduce — compares
 *   the stylesheet with itself, and printed "The frozen presets are
 *   pixel-identical" with exit 0. The success line did not name the baseline,
 *   so a quoted summary could not show it either.
 * - F6 (frozen lens). A baseline `--at e24df74` built e24df74's whole
 *   playground, whose own text counts the checks the design system's tokens
 *   make ("700 checks" there, "823" here): every frozen full-page shot
 *   differed, so the verdict L4 asks for (identical to e24df74) could never
 *   be given. The baseline is now THIS tree's playground with the other
 *   commit's LIBRARY STYLESHEET swapped in (shots.ts), so the stylesheet is
 *   the only thing that differs. `digestPlayground` is what holds that: a
 *   baseline shot on a different playground (its JavaScript or HTML differ)
 *   is refused, never compared.
 */

import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/** `baseline.json`. `libraryCss` and `playground` are absent from a manifest written before they existed. */
export interface Manifest {
  /** The commit the library stylesheet was compiled from (short sha), or `describeTree` of a working tree ("<sha>+dirty"). */
  libraryCss?: string;
  /** `digestPlayground` of the site that was shot. */
  playground?: string;
  /** How the baseline was made: "library-css-swap" for `--at`, "this-tree" without it. */
  mechanism?: string;
  /** The tree whose playground was built (`describeTree`). */
  tree: string;
  chromium: string;
  takenAt: string;
  shots: number;
}

/** What the comparing run knows about itself. `playground` is left out for the checks that run before the build. */
export interface Here {
  /** `git rev-parse` of a ref in this checkout, as a full sha; undefined when it names no commit. */
  resolve: (ref: string) => string | undefined;
  chromium: string;
  playground?: string;
}

/**
 * Why a compare must not use this baseline, or null when it may. The checks,
 * in order: a manifest from before provenance was recorded; a stylesheet from
 * a working tree with uncommitted changes (nothing can reproduce it); a
 * stylesheet commit this checkout does not have; the stylesheet of this
 * checkout's own HEAD (the tree compared with itself, F14); another Chromium;
 * another playground (F6).
 */
export function baselineRefusal(manifest: Manifest, here: Here): string | null {
  const retake = "Retake it: `pnpm shots baseline --at e24df74` (L4's reference)";
  if (manifest.libraryCss === undefined || manifest.playground === undefined) {
    return `The baseline does not record where its library stylesheet and its playground came from (it predates that check). ${retake}.`;
  }
  if (manifest.libraryCss.includes("+dirty")) {
    return `The baseline's library stylesheet came from a working tree with uncommitted changes (${manifest.libraryCss}): nothing can reproduce it. ${retake}.`;
  }
  const commit = here.resolve(manifest.libraryCss);
  if (commit === undefined) {
    return `The baseline's library stylesheet came from ${manifest.libraryCss}, which is not a commit in this checkout. ${retake}.`;
  }
  if (commit === here.resolve("HEAD")) {
    return `The baseline's library stylesheet is this checkout's own HEAD (${manifest.libraryCss}): comparing the tree with itself proves nothing about the frozen presets. ${retake}.`;
  }
  if (manifest.chromium !== here.chromium) {
    return `The baseline was taken by Chromium ${manifest.chromium}; this is ${here.chromium}. Retake it: \`pnpm shots baseline --at ${manifest.libraryCss}\`.`;
  }
  if (here.playground !== undefined && manifest.playground !== here.playground) {
    return `The baseline was shot on another playground (its JavaScript or HTML differ from this tree's build), so a difference would not be the stylesheet's alone. Retake it: \`pnpm shots baseline --at ${manifest.libraryCss}\`.`;
  }
  return null;
}

/** The stylesheet `index.html` links: the library's, and in this playground the only one (main.tsx imports nothing else). */
export function linkedStylesheet(html: string): string {
  const hrefs = [...html.matchAll(/<link\b[^>]*\brel="stylesheet"[^>]*>/g)].map((m) => /\bhref="([^"]+)"/.exec(m[0])?.[1]);
  if (hrefs.length !== 1 || hrefs[0] === undefined) {
    throw new Error(`the playground's index.html links ${hrefs.length} stylesheets, not the one library stylesheet the digest leaves out`);
  }
  return hrefs[0];
}

/**
 * A sha256 over a built playground (`apps/playground/dist`), by content: every
 * file's bytes except the library stylesheet `index.html` links, and
 * `index.html` with each asset it names replaced by that asset's content hash
 * (the library stylesheet by a placeholder). Content, not names, because the
 * bundler names the entry script after the stylesheet it ships with: two
 * builds whose scripts are byte-identical but whose stylesheets differ get
 * two script names (measured: e24df74's stylesheet in this playground). So
 * two builds that differ only in the library stylesheet digest the same; any
 * other change — the JavaScript, the HTML, a theme file (`?url` assets, whose
 * names are in the JavaScript) — does not.
 */
export function digestPlayground(dist: string): string {
  const html = readFileSync(join(dist, "index.html"), "utf8");
  const linked = linkedStylesheet(html);
  const sha = (bytes: Buffer | string) => createHash("sha256").update(bytes).digest("hex");
  const asset = (ref: string) => join(dist, ref.replace(/^\//, ""));
  const named = html.replace(/\b(src|href)="(\/[^"]+)"/g, (whole, attribute: string, ref: string) => {
    if (ref === linked) {
      return `${attribute}="<library stylesheet>"`;
    }
    return existsSync(asset(ref)) ? `${attribute}="sha256:${sha(readFileSync(asset(ref)))}"` : whole;
  });
  const walk = (dir: string): string[] => readdirSync(dir, { withFileTypes: true }).flatMap((entry) => (entry.isDirectory() ? walk(join(dir, entry.name)) : [join(dir, entry.name)]));
  const skip = new Set([join(dist, "index.html"), asset(linked)]);
  const contents = walk(dist).filter((file) => !skip.has(file)).map((file) => sha(readFileSync(file))).sort();
  return sha(`${named}\u0000${contents.join("\n")}`);
}
