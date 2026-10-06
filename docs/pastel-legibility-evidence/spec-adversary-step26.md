SPEC ADVERSARY: step 2.6 "Sorbet dark" (`/home/user/sorbet` at 4a5f7f6, spec revision 3.6, L1 to L194; read-only)

The step was built in a scratch copy, with the dark values parsed by script from the spec's own tables (the parser
reproduces the shipped light record and light edges exactly), and every gate was run on it. The scratch evidence
(`sa26/` in the session scratchpad) is not committed.

## Takeaways
- **The values are right and they pass the gate.**
  - All 69 roles, the 20 optional tokens and the 13 dark edge recipes were parsed from §3.1, §3.2 and §5.2.
    Every D1 to D12 derivation and every copied hex checks out.
  - The parsed values equal the step-2.1 fixture `legibility-values.json`.
  - Under `measurePreset`, sorbet dark passes `legibility`: 193 of 193 measurements hold, with 0 structure
    failures. Every tier's weakest figure equals L61's dark column.
  - The tightest margin is ×1.0245 (R089). The reports print `(946 pairings measured): wcag-aa × 8,
    legibility × 2`.
  - The new dark record also holds `wcag-aa` (70 of 70).
- **1 critical finding: the step cannot pass its own rendered-edge acceptance.** `tools/measure-edges.ts --mode
  dark` was run on the built step-2.6 tree, twice:
  - the dark info status box measures **21.2 against a bar of 21.6**;
  - the dark sunken panel measures **12.7 against a bar of 12.8**.
- **4 major findings, 6 minor and 2 nits:**
  - halo-room: the step text says 1px, while L151, L98 and the existing test say 3px;
  - nine step-2.2 tests go red with no spec line that allows the edit;
  - "every name the light block emits" is false if read literally;
  - there is no "looked at" item, though all of sorbet dark's look changes.
- **25 existing tests go red.** L105's edits clear 15. The others are M6.8 (which #11 allows) and nine step-2.2
  tests that no spec line covers.
- **No finding in these:**
  - the golden's exact shape can be worked out from the spec;
  - every dark figure in L170, L178, L179, L164 and §13 reproduces;
  - `check:status-layout` passes;
  - `check:cli`, `check:catalog`, `check:consumable --no-build`, `check:golden`, typecheck and `test:status`
    are green.

## Findings

| id | sev | Step text / spec quoted | Conflicting code / spec / measurement | Smallest fix to the spec |
|---|---|---|---|---|
| C-1 | critical | 2.6: "rendered edges re-measured in dark, each no lower than sheet 2's figure less 1.0 … sunken panel 13.8 … status box 22.6". L191: every tone's box is filed under "Status box"/"card" | `measure-edges.ts --preset sorbet --mode dark` on the step-2.6 tree, the same over 2 runs. **Info status box on a card: 21.2**, against a bar of 21.6. All four sides read 21.23 at `#6c5a65`; the fill is `#554445`; the gate's figure (R279) is 21.46. Sheet 2 drew only the success box. **Sunken panel on a card: 12.7**, against a bar of 12.8. The bottom side reads 12.66 at `#120802`, the top 13.85 and the sides 13.15. L159's whole-boundary sampling finds a weaker side than sheet 2's three lines. Every other bar holds: card 13.2/12.2, quiet 17.2/16.2 and 19.3/18.3, text field 18.5/17.9, combobox 16.4/16.2, the lilac, blush, danger and butter buttons 58.1/57.6/57.6/63.9, checkbox 56.3, switch 56.8, success, warning and danger boxes 22.6/23.8/36.2 | An owner call before tests. Either (a) the two pass as rendered, or (b) the recipe changes, a look change shown first. Add: "a rendered bar that fails is a contradiction report to the owner, not a value edit" |
| M-1 | major | 2.6: "`--sb-halo-room` reads `1px` in dark (L151)" | L151: "**3px in dark** (the rims, `0 0 0 1px`, 1, plus the card's rise, 2)". L98: "which step 2.6 replaces with `3px`". `haloRoom(dark)` = 3. `test-contracts.ts:5031` asserts `[9, 3]`. Also stale: §12.4 M2 "(8px light, 1px dark)", and L151's last paragraph | 2.6 reads `3px` in each dark block, after the edge lines. Fix §12.4 M2 and L151's last paragraph to 9px and 3px |
| M-2 | major | L10: the tests a later step makes false are listed by that step (L183 for 2.5); 2.6 has no list | Nine step-2.2 tests go red with no line allowing it: `test-contracts.ts:3819`×3, `:3908`×2, `:4300`, `:4325`, `:4346`, `:4414` | An L183-style table for 2.6, each test with its new expectation |
| M-3 | major | 2.6 and L160: "every name the light block emits is emitted by the dark block too (but the two button-size lines)" | Read literally, `:root` also emits 9 names that hold in both modes: three fonts and six radii (`golden/sorbet.css:5-13`). There are also two dark blocks, not one. A check of names alone already passes at HEAD for every name but `danger-active`, because the resets emit the names | "Every `--sb-` name from `color-scheme: light;` to the end of `:root`, except the two button sizes, appears in each dark block with a value that is not `initial`; 116 names each" |
| M-4 | major | 2.6 has no "looked at" item | All of sorbet dark's look changes. Not yet seen rendered from the library in dark: the cocoa page with components; the danger button's and danger box's rims; the status icon's ink `#f3e7ce` on the dark washes; the dark link `#dac5fc`; the selected pill; the 3px inset; C-1's two edges | Acceptance: a rendered sheet of sorbet dark, shown to the owner before the step lands |
| m-1 | minor | L105 step 2.6: "#11, #25, #26, #30, #31 and #46 again" | #27 to #29 also go red (M6.6 at `:1188`, measured). The one `DECLARED` edit clears them. The line numbers are e24df74's | Add #27 to #29, and give the current anchors |
| m-2 | minor | 2.6's files: `presets.ts`, `golden/sorbet.css` | The test files are not listed. Lint fails at `presets.ts:84`: `SORBET_RECIPE` is unused. Its comment and the file header go stale | List the test files. `SORBET_RECIPE` and its comment go; the header says "sorbet's two records"; `chartThemes.sorbet` stays |
| m-3 | minor | "box in a well 19.1" | The measurer prints "Raised box on the well: no component in the library" | Mark it "no component (as step 2.4)", and say the run's table is quoted in the commit |
| m-4 | minor | L55 "41 lines in each dark block"; L97's 2.6 row "in place of the 41 reset lines" | There have been 42 since L151 (`--sb-halo-room: initial`). L97's row omits the `--sb-halo-room: 3px;` line | 42, and add the halo line. After 2.6 each dark block is 117 lines; the file is 377 lines |
| m-5 | minor | "sorbet dark passes `legibility` and the six checks" | This is weaker than step 2.2's light test (`:4330`), which pins each of the 193 measurements to appendix A in its view | Pin the dark 193 the same way |
| m-6 | minor | L105 #47 at `test-contrast.ts:215` | The tamper is now at `:226`. Moving it to forest dark turns the 3 red tests green | Update the anchor |
| n-1 | nit | — | The "as step 2.6 will make it" planted tests duplicate the shipped presets after 2.6 | Say keep or retire |
| n-2 | nit | — | `check-cvd` reads `chartThemes.sorbet`, not the `chart-*` hexes sorbet dark emits; they are equal today | Note it in §13 |

## Every existing assertion step 2.6 turns red

The base, HEAD, is all green.

| Assertion | What allows the change |
|---|---|
| `test-contracts.ts:774` M4 check700, and `:6067` M9 | #25, through the `DECLARED` edit at `:485` |
| `:915` M5 | #26 (the `DECLARED` line) |
| `:1188` M6.6 | #28. **Not in L105's 2.6 list**; the `DECLARED` edit clears it |
| `:1351` M6.8 | #11 again |
| `:1412` M6.9 | #30 |
| `:1688` M10.1 | #46 |
| `:2058` M10.7, ×6 | #31 |
| `:3819` "2.2 L86 L91" ×3 | **NONE** |
| `:3908` "2.2 L87" ×2 | **NONE** |
| `:4300` "2.2 L45" (`edges.dark === undefined`) | **NONE** |
| `:4325` "2.2 L101 L3" (dark is buildMode's) | **NONE** |
| `:4346` "2.2 L3 sorbet dark still passes wcag-aa" | **NONE** |
| `:4414` "2.2 L97" (the golden with 42 resets) | **NONE** |
| `test-contrast.ts` "the pairs and the counts it prints are the gate's", ×3 | #47 |

## Measured: the spec's dark values against the real mechanism
- 193 measured, 0 failures. `checkStructure` and `checkPreset` find nothing.
- Each tier's weakest figure, with the view it is in, against its dark floor:

  | Tier | Weakest | View | Floor |
  |---|---|---|---|
  | body | 85.2412 | protan | 83.2 |
  | secondary | 66.7902 | protan | 64.7 |
  | on-wash | 78.2242 | protan | 76.2 |
  | tinted | 59.7732 | protan | 57.7 |
  | label | 70.9165 | protan | 68.9 |
  | placeholder | 47.0223 | protan | 45.0 |
  | mark-area | 48.2020 | protan | 45.7 |
  | mark-line | 23.2295 | protan | 22.0 |
  | divider | 11.0849 | deutan | 10.5 |
  | focus-visible | 17.9592 | tritan | 17.0 |
  | tell-apart | 12.1820 | tritan | 11.5 |
  | palette | 5.3797 | deutan | 4.8 |
  | chart-mark | 44.1999 | protan | 41.9 |
  | scrim | 4.6844 | typical | 4.5 |
  | edge-container | 16.0570 | deutan | 15.2 |
  | edge-floating | 21.5781 | deutan | 20.4 |
  | edge-field | 31.7136 | deutan | 30.1 |
  | edge-sunken | 14.0641 | deutan | 13.3 |
  | edge-quiet | 17.1780 | deutan | 16.3 |
  | edge-filled | 57.6019 | protan | 54.7 |
  | edge-status | 21.4461 | protan | 20.3 |
- **The golden:**
  - only the two dark blocks change, 242 lines in all;
  - each block, in order: color-scheme, the roles, the 20 optional tokens, 5 shadows, 21 edge lines, then
    `--sb-halo-room: 3px`.
- **These figures reproduce exactly:** L179's, L170's, L178's (23.23), the selected pill's (18.49), and L109's
  divider pixel.

## Values a test author would have to invent
1. Dark `--sb-halo-room`: 1px or 3px.
2. What "the light block" is for the name check, whether both dark blocks are checked, and whether "no `initial`"
   is asserted.
3. New expectations for the nine step-2.2 tests.
4. The pin for "passes legibility".
5. What a failing rendered bar means, and the bar for the dark info, warning and danger boxes, which sheet 2
   never drew.
6. The bar for "box in a well", which has no component.
7. Whether `SORBET_RECIPE` is deleted, and what the comments in `presets.ts` say.
8. The current anchors of L105's edits.
9. Whether the "as step 2.6 will make it" tests stay.
10. That a test may take the expected dark record from `legibility-values.json`, whose dark half equals §3 and
    §5.2 key for key.
