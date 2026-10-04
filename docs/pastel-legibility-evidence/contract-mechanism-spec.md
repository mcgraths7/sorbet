# Spec: the contract mechanism (groundwork PR, step 1.3)

Revision 2, 2026-10-04. Revision 1 was attacked by a spec adversary (13
findings, 3 critical); every finding and every item it listed as "left free"
is closed below. Nothing here changes what any theme looks like or whether any
theme passes. Paths are relative to `packages/design-system/` unless they start
with `packages/`, `apps/` or `tools/` (the last meaning the repo root's
`tools/` only when written `<root>/tools/`).

## M1. Purpose

Today the contrast contract is one list, `RULES` in `src/tokens/rules.ts`, where
every entry carries its own number (`min`), and every preset is judged by it.
A later pull request will hold ONE preset (sorbet) to a different contract.
This increment makes "which contract a preset is held to" a piece of data,
while every preset keeps exactly the contract it has today.

The pattern is a policy object: the contract is data a preset points at,
instead of numbers baked into the rule list.

## M2. Vocabulary

- A **rule** names a pair of semantic colours to compare (`fg` on `bg`),
  optionally restricted to one mode. A rule carries NO number.
- A **tier** is a group of rules that owe the same floor under a contract.
  There are seven (M4). Every rule belongs to exactly one.
- A **kind** says what a tier protects: `"text" | "shape" | "focus" | "chart"`.
  The kind belongs to the TIER, in one table; a rule does not restate it.
- A **contract** maps tiers to floors. A floor is: the metric, the least value
  that passes (`min`: one number, or one per mode), a one-sentence reason
  (`why`) and a one-sentence retirement condition (`retire`: what would make
  this floor wrong).
- A **preset declares** one contract per mode.

## M3. Types and exports (in `src/tokens/`)

```ts
// contracts.ts (new)
export type Kind = "text" | "shape" | "focus" | "chart";
export type Tier = "text" | "text-subtle" | "scrim" | "control-border" | "shape" | "focus" | "chart";
/** Every tier, in the order of the M4 table. */
export const TIERS: readonly Tier[];
/** What each tier protects. The one place a tier's kind is written. */
export const TIER_KIND: Readonly<Record<Tier, Kind>>;
export type ContractName = "wcag-aa";
export interface TierFloor {
  metric: "ratio";                       // the WCAG 2 contrast ratio; later contracts add metrics
  min: number | Record<Mode, number>;    // one number, or one per mode
  why: string;                           // non-empty after trimming
  retire: string;                        // non-empty after trimming
}
export interface Contract {
  name: ContractName;
  /** One sentence: who this contract was calibrated for. Non-empty after trimming. */
  calibratedFor: string;
  /** A KNOWN tier the contract does not list is a rule the contract does not hold. */
  tiers: Partial<Record<Tier, TierFloor>>;
}
/** A plain, mutable object (not frozen), as RULES is. */
export const contracts: Record<ContractName, Contract>;
/** Derived: Object.keys(contracts). */
export const CONTRACT_NAMES: readonly ContractName[];
/** The floor a contract sets for a tier in a mode; `undefined` when the contract does not list that (known) tier. */
export function floorFor(contract: ContractName, tier: Tier, mode: Mode): number | undefined;

// rules.ts (changed)
export interface Rule {
  fg: SemanticColorName;
  bg: SemanticColorName;
  tier: Tier;
  why: string;      // non-empty after trimming: why this pair is in the contract
  mode?: Mode;
}
export const RULES: Rule[];             // mutable as today; no `min` and no `kind` on any entry
export interface Measurement {
  fg; bg;                               // as today
  tier: Tier;
  kind: Kind;                           // TIER_KIND[tier]
  min: number;                          // the floor the CONTRACT set for this pair in this mode
  actual: number | null;                // as today
  holds: boolean;                       // as today
}
export function measureColors(mode: Mode, colors: Partial<SemanticColors> | undefined, contract: ContractName): Measurement[];
export function checkColors(presetName: string, mode: Mode, colors: Partial<SemanticColors> | undefined, contract: ContractName): Failure[];
/** The contract a preset declares for a mode, validated (M5). */
export function contractOf(preset: Preset, mode: Mode): ContractName;
export function checkPreset(preset: Preset): Failure[];   // measures each mode against contractOf(preset, mode)

// presets.ts (changed)
export interface Preset { /* as today, plus: */ contract: Record<Mode, ContractName> }
```

`Failure` is unchanged (it gains no tier and no kind). `tally` and `ratioText`
are unchanged. From `src/tokens/index.ts` (the public barrel) export, in
addition to what it exports today: `contracts`, `CONTRACT_NAMES`, `TIERS`,
`TIER_KIND`, `floorFor`, `contractOf`, and the types `Kind`, `Tier`,
`ContractName`, `TierFloor`, `Contract`, `Rule`.

The `contract` argument of `measureColors` and `checkColors` is REQUIRED. There
is no default: a default is a second place that decides, and the one a later
change forgets to flip.

## M4. The one contract: `wcag-aa`

`wcag-aa` is today's `RULES`, re-expressed. Its seven tiers, with the number of
rules that apply in each mode:

| Tier | Kind | Floor (ratio) | Rules per mode | The pairs |
|---|---|---|---|---|
| `text` | text | 4.5 | 42 | every rule whose `min` is 4.5 at commit `2d3b765`, except the two scrim pairs |
| `text-subtle` | text | 3 | 2 | `text-subtle` on `bg` and on `surface` |
| `scrim` | text | 4.5 | 2 | `on-scrim` and `on-scrim-muted` on `scrim` |
| `control-border` | shape | 3 | 2 | `border-strong` on `bg` and on `surface` |
| `shape` | shape | 3 | 4 | `primary-solid` on `bg` and `surface`; `secondary-solid` on `bg`; `accent-solid` on `bg` |
| `focus` | focus | 3 | 2 | `focus-ring` on `bg` and on `surface` |
| `chart` | chart | light 3, dark 2.25 | 16 | `chart-1` … `chart-8`, each on `surface` and on `bg` |

That is 70 rules in each mode. `RULES` keeps its 86 entries, in the order they
have at commit `2d3b765`, with the same `fg`, `bg` and `mode` on each: 54
entries with no mode, 16 light-only chart entries and 16 dark-only chart
entries. The `chart` tier's floor is written per mode
(`{ light: 3, dark: 2.25 }`); every other tier's floor is one number.

The literal list of pairs is the fixture of M9.1, recorded from commit
`2d3b765`; the table above is its summary.

THE INVARIANT (call it check 5): for each mode, the list of
`(fg, bg, floor)` that `measureColors(mode, colors, "wcag-aa")` produces, in
order, is exactly the list the code at `2d3b765` produces from
`measureColors(mode, colors)` — the same 70 triples in the same order — and
nothing else. Floors, order and verdicts (`holds`) are compared exactly. Each
measured ratio (`actual`) of each shipped preset in both modes (700 of them) is
compared to within 1e-9, because the fixture is recorded on one machine and
checked on another and the ratios pass through a power function.

`calibratedFor` for `wcag-aa` says that it is a published standard, calibrated
for anyone. The exact sentence is the implementer's.

## M5. Presets, and a bad declaration

Every one of the five presets declares
`contract: { light: "wcag-aa", dark: "wcag-aa" }`. The field is required by the
type. Types are not checked when a tool runs (the tools run TypeScript
directly), so the declaration is also validated at run time, in one place:

`contractOf(preset, mode)` returns `preset.contract[mode]` when it is the name
of a contract in `contracts` (an own property, so `"toString"` and
`"__proto__"` are not names). Otherwise it throws a `TypeError` whose message
contains the preset's `name` and a rendering of the bad value. The bad cases,
each of which throws: `contract` absent; `contract` null; `contract` not an
object; the asked mode missing from it; the value not the name of a contract.

Everything that measures a preset obtains the contract through `contractOf`:
`checkPreset`, the three reports, `<root>/tools/check-cli.ts` and
`apps/playground/src/contrast-checks.ts`. So a bad declaration is the same
`TypeError` everywhere. It is not caught: a gate or a report that meets one
ends with a non-zero exit code and that message, having written nothing. It is
never measured against some other contract and never reads as "no failures".

## M6. Behaviour

1. `measureColors(mode, colors, contract)` returns one `Measurement` for every
   rule that applies in `mode` AND whose tier the contract lists, in `RULES`
   order. For `wcag-aa` that is all 70. A rule whose tier is a KNOWN tier (one
   of `TIERS`) that the contract does not list produces no measurement (the
   contract does not hold it); that is not a failure. Everything
   `measureColors` did before this increment still holds: a pair that cannot be
   measured is `actual: null, holds: false`; a missing colour record makes
   every pair unmeasurable; a mode that is neither `"light"` nor `"dark"`
   throws a `TypeError`.
2. A rule whose `tier` is NOT one of `TIERS` (mistyped, undefined) makes
   `measureColors` throw a `TypeError` naming the rule's `fg`, `bg` and the bad
   tier. A mistyped tier must never read as "the contract does not hold it".
3. An unknown `contract` name (not an own property of `contracts`) throws a
   `TypeError` that contains the name, in `measureColors`, `checkColors` and
   `floorFor` alike. It is never treated as `wcag-aa`.
4. A contract that yields ZERO measurements in a mode (an empty tier map, or
   one that lists no tier any rule uses) makes `measureColors` throw a
   `TypeError` naming the contract: a contract over nothing would pass
   everything.
5. When both the mode and the contract are bad, the mode's `TypeError` is the
   one thrown (it is checked first, as today).
6. `holds` is `actual !== null && actual >= min`, with `min` the contract's
   floor for the rule's tier in that mode.
7. `floorFor(contract, tier, mode)`: for a tier with one number it is that
   number in both modes; for a per-mode floor it is the mode's number
   (`floorFor("wcag-aa", "chart", "light")` is 3, `…"dark"` is 2.25); for a
   known tier the contract does not list it is `undefined`. It throws a
   `TypeError` when: the mode is neither `"light"` nor `"dark"` (for every
   tier); the tier is not one of `TIERS`; a per-mode floor lacks the asked
   mode; the tier's `metric` is not `"ratio"`; or the floor it resolves is not
   a finite number greater than or equal to 1 (a ratio below 1 cannot exist,
   and `null`, `0`, a negative number or a string would otherwise pass every
   pair).
8. The reports (`tools/check-contrast.ts`, `sorbet contrast` in
   `packages/cli/src/index.ts`, `packages/cli/scaffold/tools/check-contrast.ts`),
   both gates (`tools/build-tokens.ts`,
   `packages/cli/scaffold/tools/build-tokens.ts`), `<root>/tools/check-cli.ts`,
   `apps/playground/src/contrast-checks.ts` and Token Studio
   (`packages/component-library/src/organisms/token-studio.tsx`) keep working,
   and for the five shipped presets each prints exactly what it prints at
   `2d3b765`. The reports, gates, check-cli and the playground module pass
   `contractOf(preset, mode)`. Token Studio passes the literal `"wcag-aa"`: it
   does not yet know which preset is loaded. Its call becomes exactly
   `setFailures(checkColors("studio", mode, colors, "wcag-aa"));`, with a
   comment directly above it that contains the words "does not yet know which
   preset is loaded".
9. `manifest()` in `src/tokens/emit.ts` adds each preset's `contract` (the
   `{ light, dark }` object) as the LAST key of its entry. No theme file
   changes: all five golden files stay byte-identical.
10. The scaffold made by `sorbet create` still builds and its report still
    runs: the scaffold copies `src/tokens`, so `contracts.ts` goes with it.

## M7. The instruments

Four measuring functions are added to `src/tokens/color.ts` for the contract a
later pull request adds. In this increment they are called only by their tests
and by the chart gate.

```ts
export type CvdKind = "protan" | "deutan" | "tritan";
/** A colour in OKLab (Ottosson): [L, a, b]. Null when parseColor cannot read it or it is not opaque. */
export function oklabOf(color: string): [number, number, number] | null;
/** APCA lightness contrast. Signed: positive for dark text on a light background, negative for light text on dark. Null when either colour cannot be read by parseColor or is not opaque. */
export function apcaLc(text: string, background: string): number | null;
/** A colour as one kind of complete colour blindness is modelled to see it, as a 6-digit lower-case hex FOR DISPLAY. Throws a TypeError on a value that is not an opaque colour parseColor can read. */
export function simulateCvd(color: string, kind: CvdKind): Hex;
/** How far apart two colours look: Euclidean distance in OKLab, times 100. With `view`, both colours are simulated first. Null when either cannot be read or is not opaque. */
export function separation(a: string, b: string, view?: CvdKind): number | null;
```

Bad input, for all four: a colour that is not a string counts as "cannot be
read" (null for `oklabOf`, `apcaLc` and `separation`; a `TypeError` for
`simulateCvd`). A `kind` or `view` that is not one of the three `CvdKind`
values throws a `TypeError` naming it, in both `simulateCvd` and `separation`
(`"protanopia"` is not a `CvdKind`). `separation` with a view returns null, not
a throw, when a colour cannot be read.

**sRGB to linear.** For `oklabOf`, the simulation and `separation`: each
channel `c` in 0..1 becomes `c / 12.92` when `c <= 0.04045`, otherwise
`((c + 0.055) / 1.055) ** 2.4`. (This is the sRGB standard's decode, the one
`tools/check-cvd.ts` uses today. `luminance()` keeps its own WCAG threshold and
is not changed.)

**OKLab.** From linear r, g, b:
`l = cbrt(0.4122214708 r + 0.5363325363 g + 0.0514459929 b)`,
`m = cbrt(0.2119034982 r + 0.6806995451 g + 0.1073969566 b)`,
`s = cbrt(0.0883024619 r + 0.2817188376 g + 0.6299787005 b)`;
`L = 0.2104542553 l + 0.7936177850 m − 0.0040720468 s`,
`a = 1.9779984951 l − 2.4285922050 m + 0.4505937099 s`,
`b = 0.0259040371 l + 0.7827717662 m − 0.8086757660 s`.
Published check values, to 1e-6: `#ff0000` is (0.627955, 0.224863, 0.125846);
`#00ff00` is (0.866440, −0.233888, 0.179498); `#0000ff` is
(0.452014, −0.032457, −0.311528); `#000000` is (0, 0, 0); `#ffffff` is
(1, 0, 0).

**The simulation.** Machado, Oliveira & Fernandes 2009, severity 1.0. The
3×3 matrix is applied to the LINEAR r, g, b, and each resulting channel is
clamped to 0..1. Matrices (rows):
protan `[0.152286, 1.052583, −0.204868] / [0.114503, 0.786281, 0.099216] / [−0.003882, −0.048116, 1.051998]`;
deutan `[0.367322, 0.860646, −0.227968] / [0.280085, 0.672501, 0.047413] / [−0.011820, 0.042940, 0.968881]`;
tritan `[1.255528, −0.076749, −0.178779] / [−0.078411, 0.930809, 0.147602] / [0.004733, 0.691367, 0.303900]`.

**`separation` keeps floats.** With a view, both colours are simulated in
linear RGB as above and the clamped LINEAR values go straight to OKLab. They
are never rounded to 8 bits on the way. `simulateCvd`'s hex is a display value
(each clamped linear channel encoded with the sRGB encode, `v * 12.92` when
`v <= 0.0031308` otherwise `1.055 * v ** (1 / 2.4) − 0.055`, times 255,
rounded to the nearest integer) and `separation` does not pass through it.
Routing the chart gate through the hex would change 5 of its 10 printed minima
and fail 4 floors.
Check values, to 1e-9, taken from the chart gate at `2d3b765`:

| a | b | no view | protan | deutan | tritan |
|---|---|---|---|---|---|
| `#008289` | `#9e6400` | 19.472571036629873 | 14.61818592879111 | 15.742857549545816 | 21.169819272558314 |
| `#ec5198` | `#8a6f00` | 26.53416007752937 | 16.89457050891632 | 15.850368872011622 | 19.410368065524125 |
| `#0f70d5` | `#e8672e` | 35.36055657939406 | 26.220374004871775 | 33.59562229960631 | 32.90604947566381 |

`separation(a, b)` equals `separation(b, a)`, and is 0 for identical colours.

**APCA** (apca-w3 0.1.9, constants "0.0.98G-4g"). For each colour,
`Y = 0.2126729 R^2.4 + 0.7151522 G^2.4 + 0.0721750 B^2.4` with R, G, B the
8-bit channels divided by 255; then, if `Y <= 0.022`, `Y += (0.022 − Y)^1.414`.
If `|Ybg − Ytxt| < 0.0005` the result is 0. If `Ybg > Ytxt` (dark text on
light): `S = (Ybg^0.56 − Ytxt^0.57) × 1.14`; the result is 0 when `S < 0.1`,
otherwise `(S − 0.027) × 100`. Otherwise (light text on dark):
`S = (Ybg^0.65 − Ytxt^0.62) × 1.14`; the result is 0 when `S > −0.1`,
otherwise `(S + 0.027) × 100`.
Published check values, to 1e-9: `#888` text on `#fff` is 63.056469930209424;
`#fff` on `#888` is −68.54146436644962; `#000` on `#aaa` is 58.146262578561334;
`#aaa` on `#000` is −56.24113336839742; `#123` on `#def` is 91.66830811481631;
`#def` on `#123` is −93.06770049484275; `#123` on `#444` is 8.32326136957393;
`#444` on `#123` is −7.526878460278154. Zero cases: `#888` on `#999` is 0;
`#777` on `#777` is 0; and the reverse of the first is not zero: `#999` on
`#888` is −7.849647529091758.

**The chart gate.** `tools/check-cvd.ts` stops carrying its own copy of the
simulation and the OKLab conversion: its `cvdDeltaE` calls `separation` with a
view. It maps its own names to the shared ones (`"protanopia"` to `"protan"`,
`"deuteranopia"` to `"deutan"`) and keeps printing its own names. Its behaviour
does not change: it still checks those two only, its `FLOORS` are untouched,
and its report is identical, character for character once colour codes are
removed, to the report at `2d3b765`.

These four functions are exported from `color.ts`. They are NOT added to the
public `src/tokens/index.ts` barrel in this increment.

## M8. What stays out

- No second contract. No change to any floor. No change to any emitted theme.
- The list of frozen themes in `tools/check-golden.ts` stays a typed list. It
  is not derived from `Preset.contract`.
- The chart gate's views and floors.
- `semantics.ts`: the builder's own thresholds (the numbers `pick()` and
  `solid()` walk ramps against) choose colours and are a different thing from
  the contract that judges them. They are untouched.
- The agent instructions and the prose that mention `min` (they are amended in
  a later step of the same pull request).

## M9. The permanent check, and the edits to the existing one

**A new script, `tools/test-contracts.ts`** (plain `node:assert`, in the style
of `tools/test-golden.ts` and `tools/test-contrast.ts`, with a docblock naming
what it exists to catch), run by a package script `test:contracts`, added to
the root `pnpm test` chain and given its own CI step in
`.github/workflows/build.yml`. It fails when any of these stops being true:

1. Check 5 (M4), against `tools/fixtures/contracts/wcag-aa.triples.json`: for
   each mode the ordered list of `[fg, bg, floor]`, RECORDED FROM COMMIT
   `2d3b765` by running that commit's `measureColors`, not recomputed from the
   new code. It is shown to fail three ways: a pair added to `RULES`, a pair
   removed, one floor changed in `contracts` (mutating the exported objects in
   process and restoring them, or on a planted copy: the test author's choice).
2. The 700 measurements of the shipped presets against
   `tools/fixtures/contracts/wcag-aa.measurements.json`, recorded the same way:
   floor, `holds` and order exact, `actual` to 1e-9.
3. Every tier in M4 has the kind and the floor the table states and the
   per-mode count the table states; every rule has a non-empty `why`; every
   floor of every contract a non-empty `why` and `retire`; `CONTRACT_NAMES`
   equals the keys of `contracts`.
4. All five presets declare `wcag-aa` in both modes. (Changing that is a later
   pull request's stated purpose; this check is edited there, on purpose.)
5. M5 (each of the five bad declarations throws a `TypeError` containing the
   preset's name) and M6.1 to M6.7. The "known tier not listed" arm of M6.1 is
   exercised by removing one tier from `contracts["wcag-aa"].tiers` in process
   and restoring it.
6. The instruments (M7): the eleven APCA values; the five OKLab values; the
   twelve `separation` values, its symmetry and its zero; the bad-input
   behaviour; `simulateCvd` against outputs for at least three colours times
   three kinds computed by an implementation that shares no code with
   `color.ts` and is not the measuring kit used to write this spec (for
   example a short script in another language), committed as a fixture
   (comparing a matrix with itself proves nothing); and the chart gate's report
   against `tools/fixtures/contracts/check-cvd.report.txt`, recorded from
   `2d3b765` with colour codes off.
7. The manifest carries each preset's `contract` as the last key of its entry.

**Edits to `tools/test-contrast.ts`** (it is part of `pnpm test` and pins
things this increment changes). These edits are the TEST AUTHOR's, made before
the implementation exists, and the implementer may not alter them:

- Where it reads a floor off a `RULES` entry (`min`), it reads it from its own
  table of today's floors per tier, written into the test (not from `floorFor`,
  or it would be marking its own homework).
- Every call of `measureColors` and `checkColors` passes `"wcag-aa"`.
- The exact source line it requires of Token Studio becomes
  `setFailures(checkColors("studio", mode, colors, "wcag-aa"));`.
- Its list of files allowed to import `RULES` gains `tools/test-contracts.ts`.
- Any other assertion in it that this specification makes false is rewritten
  to assert what this specification says, and each such rewrite is listed in
  the test author's report with the specification sentence that requires it.

**The gates the increment must leave green**, all at the repo root:
`pnpm build`, `pnpm test`, `pnpm lint`, `pnpm typecheck`, `pnpm check:cli`,
`pnpm check:catalog`, `pnpm check:consumable --no-build`, `pnpm check:golden`.

## M10. CORRECTION 2026-10-04: what two audits of the built increment found

Two agents audited the increment as built (reports beside this file:
`mechanism-audit-hostile.txt`, `mechanism-audit-diff.txt`). Where this section
and M3 to M9 disagree, this section wins. Every statement here needs a test in
`tools/test-contracts.ts` that fails without it.

**M10.1 A contract is validated whole before it is used.** `floorFor`,
`measureColors`, `checkColors`, `checkPreset` and `contractOf` refuse, with a
`TypeError` whose message names the contract, any contract (reached by its key
in `contracts`) of which one of these is true:
- its `tiers` is not a non-null, non-array object;
- an own key of its `tiers` is not one of `TIERS` (the message also names the
  key). This was the critical finding: a contract whose map said `txet` for
  `text` measured 28 pairs instead of 70 and every gate printed its success
  line. A tier a contract does NOT list is still legitimate and means "not
  held"; a key that is not a tier is never legitimate;
- its `name` is not the key it is registered under;
- any listed tier's floor is unusable **in either mode**, whichever mode was
  asked (a per-mode floor must carry a usable number for both `light` and
  `dark`). Before, a caller that measured only light never saw a bad dark half.

**M10.2 A floor must be finite and GREATER than 1.** This replaces "at least 1"
in M6.6 and M6.7. No ratio is below 1, so a floor of exactly 1 passes every
pair, which is M6.7's own reason for refusing 0. "Not held" is said by leaving
the tier out, not by a floor that cannot fail.

**M10.3 A rule's `mode`, when present, must be `"light"` or `"dark"`.**
Anything else (`"Dark"`, `"both"`) makes `measureColors` throw a `TypeError`
naming the rule's `fg`, `bg` and the bad mode. Before (and at `2d3b765`) such a
rule was silently never measured.

**M10.4 A mistyped tier on a rule throws whichever mode is being measured,**
including a rule restricted to the other mode. (M6.2 was silent.)

**M10.5 A declaration's modes are own properties.** `contractOf` refuses a
declaration that only inherits `light` or `dark`. Asked for a mode that is
neither `"light"` nor `"dark"`, `contractOf` throws a `TypeError` that names
the mode as not being a mode, and does not blame the preset.

**M10.6 A report prints nothing before the error.** When any preset's
declaration is bad, each of the three reports (`tools/check-contrast.ts`,
`sorbet contrast`, the scaffold's `tools/check-contrast.ts`) exits non-zero
with stdout EMPTY: no preset's verdict may be printed ahead of the error.

**M10.7 The declaration is what decides, shown by behaviour.** The test plants,
in a scratch copy of the sources, a second contract (a copy of `wcag-aa` with a
`text` floor no pair can reach) and has ONE preset declare it for ONE mode.
Each of the three reports and both build gates must then fail, naming that
preset and mode and no other preset. A surface that measures everything with a
constant, however it is spelled, fails this. For `tools/check-cli.ts` and
`apps/playground/src/contrast-checks.ts`, which cannot be run this way, the
text check is tightened: the contract argument of every measuring call must be
the `contractOf(...)` call itself or a name assigned from one.

**M10.8 The manifest validates.** `manifest()` gets each preset's contract
through `contractOf`, so it throws on a bad declaration (amends M6.9).

**M10.9 The chart gate's refusals.** `cvdDeltaE` in `tools/check-cvd.ts`
throws (never returns a number) for a colour that cannot be read and for a
deficiency it has no view for. It reads any spelling `parseColor` reads; that
is a deliberate widening over `2d3b765`, which read 6-digit hex only (amends
M7's "its behaviour does not change", which stays true of every number it
returns for the shipped palettes).

**M10.10 Instruments.** In `separation`, a bad `view` is a `TypeError`
whatever the colours are, readable or not. The simulation clamps each linear
channel to 0..1 before OKLab; the test pins this with at least one pair whose
simulated channel exceeds 1 before the clamp (for example `#00ff00` against
`#ffffff` under protanopia), its expected value computed by an implementation
that shares no code with `color.ts` (the Python fixture script may be extended
to do it). An explicitly passed `undefined` view remains "no view"; callers
that look a view up must guard the lookup themselves, as `cvdDeltaE` does.

**M10.11 `CONTRACT_NAMES`** is the list of names at module load, for showing
and typing. Nothing may decide by it; deciding asks `contracts` itself (amends
M3's "Derived").

**M10.12 The recorder is committed.** The script that recorded the fixtures
from `2d3b765` is committed beside them, in a form `pnpm lint` and the tests
ignore, so re-recording does not mean rewriting it.

**Recorded, not changed here (the later pull request's spec must settle them):**
the reports' success line says "WCAG AA" whatever contract a preset declares;
no report says how many rules a contract leaves unheld; placeholder text is
held at 3:1 by `text-subtle`.

**M10.13 Readings fixed after the test author's questions (2026-10-04).**
- "Names the contract" means the message carries the KEY the contract was
  reached by, also when its `name` differs.
- A floor is "unusable" when the tier entry is not an object, its metric is not
  `"ratio"`, or its number (each mode's number, for a per-mode floor) is absent
  or not a finite number greater than 1.
- A value in `contracts` that is not an object at all is refused the same way,
  naming the key.
- `contractOf(preset, mode)` validates the contract it reaches; it need not
  validate the one declared for the other mode. `checkPreset` and the reports
  ask both modes, so they reach both.
- An empty `tiers: {}` is a valid shape and is refused only by M6.4.
- The chart gate has views for `protanopia` and `deuteranopia` only; any other
  name, the instruments' own `protan` / `deutan` / `tritan` included, is a
  deficiency it has no view for.
