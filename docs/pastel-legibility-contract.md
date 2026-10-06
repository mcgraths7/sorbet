# Proposal: a legibility contract, so the flagship theme can be a true pastel

**Status, 2026-10-06:** PR 1 is merged. PR 2 (sorbet's new look, PR #130 on
`feat/pastel-legibility`) has built steps 2.0 to 2.6 and 2.8; step 2.7 (the
Token Studio) is withdrawn (DECISIONS row 49). The text below is the proposal
as dated, kept as written.

**Status:** proposed. PR 1 (the groundwork, §8 steps 1.1 to 1.6) is built and
committed on `chore/contract-groundwork`. PR 2, sorbet's new look, is not
started. (Updated 2026-10-04, when steps 1.3 to 1.6 landed.) **Revision 2**,
2026-10-03 (second check applied 2026-10-04). Revision 1 was written against
the decisions record as it stood at 19:01. This revision adds the owner's
decisions 12 to 16 (19:03 to about 19:05), answers two independent attacks on
revision 1 (41 findings; both reports are in the evidence folder beside this
file), and applies a second check of its own text (40 items). The record now
has 19 rows. Where things stand:

| | State |
|---|---|
| The look (palette, ink, edges, dark page, label size, statuses) | **Decided** by the owner (§1) |
| How it lands | **Decided** by the owner: two pull requests (§8). PR 1's first two steps are built (commits `d223064`, `43f6003`, `c0e0af3`, then `2d3b765`); its third is being specified |
| The contract's shape: every rule gains a kind (what it protects: text, a shape with no label, the focus ring, a chart mark), a tier (the group of pairs that owe the same number) and a why (one sentence of reason); contracts are data; each preset declares one per mode | **Decided by the agent** (A2, A6), not objected to. PR 1's step 1.3 built it, with one member, `wcag-aa` (commit `b13bf3b`). As built, the kind belongs to the tier (`TIER_KIND`), not to each rule |
| The legibility contract's numbers and inputs (§5) | **Draft 1 — not implementable as written.** 24 defects (appendix G): 2 corrected outright, 22 open in whole or part. Rewritten as PR 2's first step |
| Open for the owner | Five items (§11); three of them hold up PR 2's first step, none holds up PR 1 |

**Affects:** `packages/design-system` (tokens, gate tools, Sass),
`packages/component-library` (status components, TokenStudio), `packages/cli`
(report, scaffold), the agent instructions (`CLAUDE.md`, `.claude/`).

**Does not affect:** the emitted theme files of ocean, forest, noir and midnight —
and a check, not a promise, is what says so.

**Follows:** `docs/pastel-primary-role-split.md` (shipped in #108). That split stays
correct for the four WCAG presets; this replaces what it could not fix for sorbet.

**Evidence:** in `docs/pastel-legibility-evidence/`, beside this file (the list
is at the top of the appendix). Step 1.6 commits it on the PR 1 branch; until
then the folder sits uncommitted in the `~/code/sorbet-pastel` worktree.

## 1. Summary

- **What changes.** Sorbet — the flagship preset only (a preset is one theme's
  recipe) — stops being judged by WCAG's contrast ratios and is judged by a
  *legibility contract* instead: can its one reader, who is colourblind, read the
  text, find every control, and see where things end. The other four presets keep
  today's WCAG contract, and a byte-for-byte snapshot of each emitted theme file
  (the pattern is a **golden file**) is what proves they did not move.
- **How it lands: two pull requests** (decision 12, §8).
  - **PR 1, groundwork nobody can see.** The golden-file gate (built); one
    measurement behind every report, in place of three hand-copied loops
    (built); the contract *mechanism* with a single member, `wcag-aa`, pinned
    to exactly today's 86 rules (being specified); the amended agent
    instructions; this document. No theme file and no stylesheet changes.
  - **PR 2, sorbet's new look.** Separately audited commits, merged once, so
    `main` never carries a half-changed sorbet. Its first step is a
    specification that closes the defects below, attacked by a second adversary
    before any test is written.
- **The contract in §5 cannot be tested yet, and says so.** A spec adversary (an
  agent whose only job is to attack a specification before anything is built on
  it) found six defects that make tests either impossible to satisfy or silently
  empty. The three worst:
  - Most of what the new rules must read is **not a token** (a token is a named
    design value, emitted as a CSS custom property such as `--sb-primary`): the
    ring round a checkbox (`#b096d7`), the bar on a selected row, the washes (a
    fill at part strength over what is behind it) and the rose rim on delete and
    invalid (`#d77784`). So a checker would pass on tokens while the stylesheet
    paints something else.
  - The floors were measured in light mode only. The **decided dark text fails
    them**: muted `#d7c9ae` reads Lc 70.3 on a card against a floor of 76. (Lc is a
    0-to-106 score of how strongly text stands off its background by
    brightness.)
  - The proposed light edge floor is **failed by the approved sheet**. Edges are
    scored on the separation scale (how far apart two colours look: under 5 is
    hard to tell apart, 10 or more is clearly different). The floor was 14; the
    approved text field measures 11.0.
- **What WCAG actually cost.** Not the dark text: today's text is 11.5:1 against a
  rule that asks 4.5:1. What the rules force is the 3:1 for shapes: the mid-tone
  outline `#777168` round every input and the three deep colours on every
  checkbox, slider and button edge (§3). And the rules do not only check sorbet's
  colours, they *choose* them — `semantics.ts` walks each colour ramp (a ramp is
  one hue at eleven lightness steps, named like `sand-700`: higher is darker) and
  takes the first step that clears a ratio. Turning the ratios down does not
  help: the walks return the same deep steps at a floor of 3, 2 and 1.5. Sorbet's
  values have to be picked, then checked.
- **The dark-mode "no edges" problem was a token bug, and it is still there.** In
  dark mode a card's border is the same hex as the card (`#38342f`) and the card
  is barely lighter than the page. The gate never looked at edges, so it passed.
  On that scale the card's shadow reaches 3.4; a pale rim *lighter* than the
  page measures 13 (§4).
- **Known costs, stated up front.**
  - **The dark-mode fault stays in ocean, forest, noir and midnight** in this
    refactor. pantry, wallpaper-admin and musicdisco load noir and follow the
    phone's setting, so they keep the problem in dark mode until a later PR (§12).
  - **Two apps draw their own marks in status tokens that go pale.** linecook's
    finished-timer alarm ring measures 43.4 today on that scale (39.5 at worst)
    and about 6 as blush on its own wash. PR 2 adds a mark-strength token for
    each status, and the rollout lists the app edits (§12).
  - **Button labels get weaker than today** (Lc 71 on lilac against 85.5), which
    is why they go to 16px semi-bold (decision 6).
  - **Twelve existing defects are listed, not fixed** (decision 16, §9).
- **Decided look** (table below): a cream `#fef4dc` page and milk `#fffbf1`
  cards; lilac `#dac5fc` leads, with blush `#f9c3c6`, butter `#f5e3a2` and
  robin's egg `#a6edee`; the ink is cocoa `#693800`; edges are the "halo" (E2) in
  light and a light rim in dark, on a cocoa page `#211409`; the four statuses are
  the four pastels as a pale wash with a mandatory icon and word. The owner on
  sheet 2: "edges are distinct in both modes".
- **What colour blindness changes, and what it does not.** The owner's swatch
  test matches a partial red-green (deutan-type) deficiency; that is a working
  assumption, not a diagnosis. In the new sorbet palette reading is largely
  unaffected: all text is one ink family, and text contrast is a brightness
  difference, which colour blindness largely leaves alone. Telling the four fills
  apart is affected: the closest pair sits 5.4 apart. So colour never carries
  meaning alone. *This is not true of the presets that stay on WCAG:* their
  coloured status text (`danger-text` on its pale fill) is 4.58:1 in typical
  vision and 3.91:1 under the deutan simulation, in noir and ocean too — a known
  cost of leaving them where they are.
- **One stylesheet serves both contracts.** Every place the two looks differ
  becomes an optional token whose fallback is today's value (a **seam**), so a
  theme that says nothing — all four WCAG presets — computes exactly what it
  computes today.
- **Needed from the owner:** five items (§11); none holds up PR 1. Permission to amend the agent
  instructions is no longer one of them: it was given (decision 15).

### How to read the numbers

| Name | What it measures | Scale |
|---|---|---|
| **Contrast ratio** (WCAG 2, the current web accessibility guidelines) | How many times brighter the lighter colour is than the darker one | 1:1 identical, 21:1 black on white. WCAG asks 4.5:1 for text and 3:1 for shapes |
| **Lc** (lightness contrast, from APCA: the Accessible Perceptual Contrast Algorithm, the measure drafted for the next version of those guidelines) | How strongly text stands off its background by brightness alone | About 106 is black on white; under about 15 is effectively invisible. Its authors' published minimums: **90** for paragraphs from 14px regular up (they call 90 "preferred"); **75** for paragraphs only if the type is at least 18px regular or 16px medium; **60** for text that is not a paragraph, and only at 16px bold, 18px semi-bold or 24px regular and up; **45** for big headings; **30** for placeholder and disabled text. These are minimums for a general audience from a draft method — not a measurement of this reader's eyes |
| **Separation**, "sep" (written ΔE in the code) | How far apart two colours look: the straight-line distance between them in OKLab, a colour space built so that equal distances look equally different, times 100 | Under 5 hard to tell apart; 10 or more clearly different. Those lines describe patches; a thin line needs more |
| **Four views** | The same pair measured in typical vision and through three simulations of colour blindness: protan and deutan (the two red-green kinds), tritan (the rare blue-yellow kind). The simulation is the complete form of each kind — a worst case; most colourblind people have a partial form | "Worst view" is the lowest of the four. Four numbers in a row are typical / protan / deutan / tritan |
| **OKLCH L, C, h** | The three dials of the colour model the palette is built in: lightness, chroma (colourfulness), hue angle | L 0 black to 1 white. C 0 is grey; these pastels are 0.06 to 0.09; vivid is 0.15 or more. h in degrees: about 30 red, 90 yellow, 200 green-blue, 260 blue, 310 purple |
| **Ink**; **family** | Ink is the text colour. A family is one hue of ink at several lightnesses | — |

Lc carries a sign: dark text on a light ground is positive, light text on a dark ground negative. This document always quotes its size, and names the text first.

Words used throughout:

| Word | Meaning |
|---|---|
| **Token**; **role** | A token is a named design value, emitted as a CSS custom property (`--sb-primary`). A role is what a colour token is *for* (`primary`, `surface`, `text-muted`); sorbet names 69 |
| **Preset** | One theme's recipe: sorbet, ocean, forest, noir, midnight |
| **Ramp**; **step** | One hue at eleven lightnesses. `sand-700` is the sand ramp's step 700; higher is darker |
| **Walk** | How today's builder chooses a value: step along a ramp and take the first step that clears a ratio |
| **Sass**; **partial**; **mixin** | Sass is the language the stylesheet is written in; a partial is one of its 76 source files; a mixin is a reusable block of declarations |
| **Seam** | An optional token read with a fallback, so a theme that does not define it gets today's value |
| **Wash** | A fill at part strength over what is behind it (lilac at 50% over a card) |
| **Halo**; **rim**; **well** | A soft glow round an element; a thin light line round it; a sunken area darker than the card |
| **Ring**; **bar**; **shade** | A ring is the line round a checkbox or switch. A bar is the 3px stripe on a selected row or tab. A shade is a fill made darker and more colourful, used for marks with no label (§6) |
| **Golden file**; **frozen**; **pinned** | A golden file is a stored copy of a theme file that the build must reproduce byte for byte. Four are frozen and may not change at all: ocean, forest, noir, midnight (a typed list in the gate, A19). Sorbet's is pinned: it changes only in a pull request whose stated purpose is to change sorbet |

Every number here comes from one instrument (`colorkit.mjs`; appendix F). Every
figure this revision changed or added was re-run with it on 2026-10-03, and
those its second check changed on 2026-10-04.

### Decided by the owner

Copied from the decisions record (`DECISIONS.md` in the evidence folder), with
the owner's words where there are any. Times are 2026-10-03, local, as the record
has them (the checker read the session transcript, which puts some a minute or
two either side). "Proposed" in the last column means the record carries no retirement
condition and this document offers one.

| # | Decision | Who, when | Retires when |
|---|---|---|---|
| 1 | **The WCAG gate no longer binds the sorbet theme; the rule is "legible to me".** Text floors stay; the 3:1 edge and shape rules go | owner, 17:02 (the brief, §2) | a reader of the sorbet theme who is not the owner |
| 2 | **Page and surfaces:** cream `#fef4dc`, milk `#fffbf1` | three proposals, three judges | the cream reading as yellow on a real screen |
| 3 | **Lead colour:** lilac `#dac5fc` primary; blush `#f9c3c6` secondary; butter `#f5e3a2` accent; robin's egg `#a6edee` success and decoration | owner, 18:38: "The identity problem isnt a problem - i never considered lilac at the time of initial conception" | the owner wanting robin's egg back in front |
| 4 | **Ink** (the text colour): cocoa `#693800` — hue 60°, lightness 0.395, colourfulness 0.092, the most a screen can show at that lightness. Lc 86 on cream, 90 on a card | owner: aubergine `#58366f` first (18:25), then "Switch to cocoa" (18:50), then "I played with the slider and found #693800 which is also a 90" (18:57) | text that looks grey or tiring on the owner's screens |
| 5 | **Shades worked out from the ink:** label and heading ink at lightness 0.30 (`#472400`); secondary 0.08 lighter (`#844d16`); placeholder 0.14 lighter (`#975e2a`) | judges; the owner has seen them on sheet 1 | labels on lilac or blush proving too weak |
| 6 | **Button labels:** 16px semi-bold (sorbet ships 14px) | owner, 18:50 | buttons feeling too large on dense screens |
| 7 | **Edges, light:** E2, "halo, no line" — a caramel `#a16e32` glow round cards and fields; each button's own hue as its glow; checkboxes and switches keep a firm lilac ring `#b096d7` (the record's row 7 printed `#b096d9` until it was corrected at 20:08; A12) | owner, 18:25: "E2 for outlines" | an edge the owner loses on a washed-out screen |
| 8 | **Edges, dark:** "rim" — a 1px light line at 18% plus a lit top edge; pastels at full strength | owner, 18:50 | pastels glaring on a dark page in real use |
| 9 | **Dark page:** cocoa `#211409` (hue 60°); card `#342417`, raised `#463425`, well `#140903`; dark text is the cream `#f3e7ce` | owner, 18:57 | the page reading as muddy next to lilac in real use. Aubergine `#1c1324` is the measured alternative |
| 10 | **Colour blindness:** type unknown to the owner. Swatch test, 18:50: aubergine and ink blue "similar but differentiable", plum and plain grey "very close" — the deutan (red-green) simulation, in a partial form | owner's answer | a formal test saying otherwise |
| 11 | **Edges confirmed by eye** on sheet 2, light and dark: "edges are distinct in both modes" | owner, 19:00 | proposed: a real page where things run together |
| 12 | **How it lands: two pull requests.** First the groundwork nobody can see, then sorbet's new look | owner, 19:03 | proposed: PR 2 growing past what one review can hold |
| 13 | **Danger and statuses:** the four pastels as a pale wash, each with a mandatory icon and word; delete and invalid add a 2px rose rim `#d77784` (seen as a mid grey `#898884` under the protan simulation — the icon and word carry it there) | owner, about 19:05 | a destructive action taken by mistake because it looked harmless |
| 14 | **16px label scope:** the sorbet theme only, as a per-theme setting with today's 14px as the fallback | owner, about 19:05 | the rule going universal |
| 15 | **Agent instructions: authorised** to replace "rules.ts is a legal requirement" in sorbet's `CLAUDE.md`, `contract-auditor`, `author-theme` and `debug-contrast` with the wording in §8 | owner, about 19:05 | proposed: every preset back on one contract |
| 16 | **Existing defects not in the groundwork's path (11):** listed here, fixed later as their own small PR; not part of this refactor | owner, about 19:05 | proposed: one of them biting in daily use before then |

### Decided by the agent, yours to overturn

Routine calls made and named, per the standing rule, plus the calls the
orchestrating agent took in answer to the two reviews. None has been signed off.
A3 and A6 to A8 are the record's row 17 (about 19:02, "decided by Claude, not
objected to"); A2 to A5 are its row 18 (19:29); A19 is its row 19 (20:08). The
rest (A1, A9 to A18, A20, A21) are recorded in this document only.

| # | Decision | Why | Retires when |
|---|---|---|---|
| A1 | **What each PR holds** (§8). PR 1: golden gate, one measurement, the contract mechanism with `wcag-aa` only, the instruments, the instructions, this document, and the five defects in that path (§9, items 7, 8, 10, 11 and 17) | it is the largest set that changes no theme file | a review finding PR 1 too large to audit: the mechanism splits out |
| A2 | **The legibility member is not in PR 1.** §5 stays as draft 1 and is rewritten as PR 2's first step | §5 cannot be tested as written (appendix G) | the rewritten specification surviving its second adversary |
| A3 | **The chart gate keeps its two views and its floors** through this whole refactor; the third (tritan) simulation is added to the shared simulation code only. Chart colours do not change; a pastel chart set is its own later proposal | adding the tritan view with floors unchanged turns four of ten cells red, two of them frozen presets (§5) | a formal test recording a blue-yellow deficiency, or the chart proposal |
| A4 | **Deferred to one later PR:** the 11 defects of decision 16, a twelfth found since (`danger-active`, §9), and the dark-mode edge fault in ocean, forest, noir and midnight. That PR changes the frozen goldens on purpose (§8) | the owner deferred the eleven (decision 16); the twelfth and the dark-mode fault each add or change a line in a frozen theme file | a deferred defect biting first: it becomes its own PR |
| A5 | **Each status gets an optional mark-strength token** that only the sorbet theme emits, with today's value as the fallback; the rollout lists the app edits (§12) | "danger" is doing two jobs, fill and mark — the role-split lesson again | no app drawing its own marks from status tokens |
| A6 | **The contract is chosen per preset, and per mode** | sorbet dark as shipped fails the new edge rule; buylist's readers are not the owner | every preset on one contract |
| A7 | **Sorbet is built whole from a recipe** (page, four pastels, one anchor ink), not as overrides on the shared builder, which is what the survey recommended | overrides have three holes that build green and look wrong (§8) | a second legibility preset: then the two share a builder |
| A8 | **Dark-mode edges are fixed for sorbet only this round** | the other four theme files are frozen | A4's PR |
| A9 | **Focus ring recoloured** to a mid violet `#8e6ac7`, one tone for both modes | 26.1 or more from every fill in light; 25.7 or more in dark | the ring being lost on a lilac button |
| A10 | **Links:** violet `#654199`, always underlined | 21.3 from the ink in typical vision, 11.5 at worst | underlines proving noisy in dense lists |
| A11 | **A "quiet" button replaces the outline button** in the sorbet look | an outline is the hard line the brief rules out | quiet and filled buttons being confused |
| A12 | **The ring hex is `#b096d7`.** The record's row 7 printed `#b096d9` and was corrected at 20:08, so the two now agree | the stated rule (the fill 0.14 darker, a quarter more colourful) yields `#b096d7`, and `edges-values.json`, which the record names as authoritative, holds `#b096d7`. Against milk they measure 27.03 and 26.96 | the owner saying `#b096d9` was meant |
| A13 | **Status text is the ordinary ink;** selected is a wash plus a 3px bar plus weight 600; hover and pressed move the shadow and never darken a fill | §6 | any of the three proving too quiet in use |
| A14 | **Robin's egg is never a lone button on the bare page; butter is used small, on cards.** Conventions, with no check behind them | 5.7 and 5.6 from cream at worst | a check being wanted (appendix G) |
| A15 | **12px text moves to the label ink, on cream or milk only.** `text-subtle` is used 47 times in the Sass and no step yet re-points any of it: PR 2's specification step must | no ink reaches that contrast on a fill | captions reading too heavy |
| A16 | **Paragraphs stay 16px regular.** Sheet 1 offered 16px medium and 18px; no answer is recorded | the ink was chosen to reach 90 at 16px regular on a card | text on the bare page (86) proving tiring |
| A17 | **The instruction edit touches five more places** than the four passages of decision 15. Step 1.5 lists them: two more files (`.claude/README.md`, `ship-change`), three descriptive lines of `CLAUDE.md`, one more passage in `author-theme` and two in `debug-contrast`. It also corrects three places that steps 1.1 and 1.2 made out of date | they restate the sentence being replaced, or describe what it replaces; the last three describe code PR 1 changed | the owner vetoing any of them |
| A18 | **The render-and-measure script is committed as evidence in PR 1. Step 2.3 builds two repo tools as new work:** a screenshot comparer and an edge measurer for the playground, under all four frozen presets in both modes. They are run by hand at each step; CI does not run them | two apps' screenshots covered two of four presets and no dark mode, and the committed script reads only sample sheet 2 | a test runner arriving in the repo |
| A19 | **The list of frozen themes is typed in the golden gate** (the `FROZEN_PRESETS` line of `check-golden.ts`) and is not derived from the contract a theme declares. Changing a frozen theme on purpose means taking its name off that line in a pull request that says so (§8) | frozen is a promise about this piece of work, and a theme must not be able to unfreeze itself by editing its own description | the owner objecting; or the sorbet rework landing, after which the four need no stronger pin than sorbet has |
| A20 | **The order inside PR 2 is steps 2.0 to 2.8 as listed** (§8) | the orchestrating agent's call. Only 2.7 could move: it needs nothing later than 2.2 | the owner wanting the playground's contract panel truthful sooner: then 2.7 moves up behind 2.2 |
| A21 | **`wcag-aa`'s seven tiers and four kinds (text, shape, focus, chart) are named in PR 1,** step 1.3. Floors are keyed by tier. PR 2 may add tiers and kinds and may not rename these | PR 1 pins all 86 rules to these names, and a rename in PR 2 would unpin what PR 1 pinned. The tiers are the second check's; the four kinds are the agent's | step 2.0's specification needs a tier split or renamed: then it is a stated change to check 5, in its own commit |

## 2. What was asked, and what it retires

The brief, verbatim (typos kept), 2026-10-03:

> I want to refactor sorbet. WCAG requirement was more of an experiment based on a
> work project. However for personal use I don't think I am bound by that
> requirement. I just need the palette to be legible as a colorblind person. I
> don't like all of the compromises wcag compliance has caused. I want a truly
> pastel palette led by a cream backdrop, blush pink, robins egg blue, lilac
> purple, and butter yellow. I will allow you to choose the primary secondary etc
> whichever fits the bill best. Text color can be determined for contrast but i
> don't need distinct visual separateion between the background and the elements,
> just text. i dont want to run into the dark mode problem from before where there
> was NO emphasis on edges, but i don't want harsh black or gray outlines either.
> I want soft edges where similarly colored box shadow can give the requisite
> amount of separation. The rule will eventually be universal but i want to use
> sorbet as the staging ground for this change. it should maintain accessibility
> from a usage perspective (react components using appropriate aria, screen reader
> compatibiloity, etc) but visually it should just be distinct enough for me as a
> colorblind person to be able to read everything. I want to start with a text
> color that is legible but doesnt need to be black or dark gray, i want to see
> where it can land and still be readable and look on brand for the colorway

And after the sheets, the same evening:

> on initial glance, I think I like aubergine at A L0.400 C0.100 hue310 #58366f for
> text and E2 for outlines.

> for reference i dont know my particular flavor of colorblindness. But similar
> hues collapse together on the color wheel. The identity problem isnt a problem -
> i never considered lilac at the time of initial conception. I was thinking about
> robins egg blue at the time which is why it was the hero initially

On the six swatches of sheet 1: "A B similar but differentiable, P G also very
close. I can tell the differencve between all of them but you could probably
cycle txt between those two pairs and i wouldnt notice (swatch looks different
but as text they;re very close)". The later answers are in the decided table (§1).

**What it retires — for the sorbet preset only:**

| Premise | Where it is written today | What replaces it |
|---|---|---|
| "`rules.ts` is a legal requirement, not a preference. Never lower a `min` to get a green build." | `CLAUDE.md:68-69`; `.claude/agents/contract-auditor.md:59-62`; `.claude/skills/author-theme/SKILL.md:70-72`; `.claude/skills/debug-contrast/SKILL.md:60-64`; `.claude/README.md:72` | "A preset's declared contract is binding." Which contract a preset declares is the owner's decision; no agent lowers a floor or switches a contract to get a green build. Authorised (decision 15); the wording is in §8 |
| "Shade selection is contrast-driven … That is what lets every preset guarantee WCAG AA" | `semantics.ts:4-7`; `presets.ts:3-4`; `author-theme/SKILL.md:13-18` | Each preset meets the contract it declares. A legibility preset's values are picked, then checked |
| "the gates are the point of the project, not an obstacle to it" | lab memory `~/homelab/claude-memory/sorbet-design-system.md` (an agent's note, not the owner's words) | The gate stays; what it measures changes for sorbet. The note already carries a dated correction (2026-10-03) |

**What it does not retire:**

| Kept | Why | How it stays checkable |
|---|---|---|
| Usage accessibility: ARIA, roles, keyboard handling, focus management | The brief says so. It all lives in `packages/component-library/src` and `packages/design-system/src/behaviors`, which hold no colour apart from four couplings (chart slot names in `charts/shell.tsx:18-23`, the `contrast` import in `atoms/color-input.tsx:3`, TokenStudio's badge, the three-role `BrandTone` type at `core/index.ts:17`) | `git diff main --stat -- packages/component-library/src packages/design-system/src/behaviors` on each step lists only the files that step names. Known limit: the repo has no behaviour or ARIA tests at all (no test runner), so that diff is the evidence |
| Keyboard focus you can see | It is the only cue a keyboard user has, and it only shows while focused | Kept as a floor in the new contract (§5) |
| The other four presets and their WCAG contract | Sorbet is "the staging ground". Reading that as "the others do not move yet" is this plan's inference, not the owner's words | Golden file: their emitted theme CSS is byte-identical (§8, PR 1) |
| buylist's reader | `~/code/buylist` is read by a friend's game-store staff and loads ocean. "Legible for me" is calibrated on one pair of eyes and is the wrong bar for that app | The contract is declared per preset; it is never a default that flips |
| Text over photographs (the scrim rule) | It is already a legibility rule: text must read over any image | Unchanged in both contracts |
| The chart colour-vision gate (`packages/design-system/tools/check-cvd.ts`) | Not a WCAG rule; it simulates colour blindness and serves this reader | Unchanged: the same two views (protan, deutan) and the same floors, for this whole refactor (A3) |
| A build that fails | The gate was never the problem; what it measured was | The legibility contract fails the build exactly as the WCAG one does |

"Eventually universal" is handled by making the contract a per-preset declaration:
a preset moves by changing one line and supplying picked values, in its own PR.

## 3. What WCAG cost the pastel theme

Measured on sorbet light as it ships today (page `#f8f7f5`), with the repo's own
`contrast()`. The last line of each item separates what a ratio forces from what the builder
merely chose — the second kind could have been softer under WCAG all along.

**1. A deep colour on every control that has no label: checkbox, radio, switch, slider, progress bar, spinner, tab indicator**

- *Value:* `primary-solid` `#008289`, `secondary-solid` `#c42876`, `accent-solid` `#8a6f00`
- *The rule behind it:* 3:1 against the page for shapes (WCAG 1.4.11, "non-text contrast"): `rules.ts:55-60`; chosen at `semantics.ts:146-148`
- *Measured:* 4.31, 5.01, 4.50:1. The pastel fills they stand in for: 1.21, 1.26, 1.23:1. 24 uses in the Sass
- *Forced by the ratio:* **Yes.** No pastel clears 3:1 on a light page

**2. A hard 1px deep outline on every pastel button**

- *Value:* a border in the `-solid` colour
- *The rule behind it:* the same rule; `atoms/_button.scss:49-51`
- *Measured:* outline against its own fill: 3.55, 3.98, 3.65:1
- *Forced by the ratio:* **Yes**

**3. A mid-grey outline on every input, select and checkbox**

- *Value:* `border-strong` `#777168` — the same hex as small text
- *The rule behind it:* 3:1 for control borders: `rules.ts:30-31`; chosen at `semantics.ts:202`
- *Measured:* 4.51:1 on the page, 4.83:1 on white; 18 uses. The soft `border` `#e3dfd9` it is not allowed to be: 1.24:1
- *Forced by the ratio:* **Yes**

**4. Deep coloured text and links**

- *Value:* `primary-text` and `link` `#00686d`, `secondary-text` `#c42876`, `accent-text` `#6f5800`
- *The rule behind it:* 4.5:1 for text: `rules.ts:34-36, 47-49, 65-66, 71-72`; `semantics.ts:137, 239`
- *Measured:* 6.13, 5.01, 6.39:1
- *Forced by the ratio:* **Yes**, for text in a brand hue

**5. Deep chart colours, none pastel**

- *Value:* eight slots at ramp steps 600 and 500
- *The rule behind it:* 3:1 against the surface: `rules.ts:93-100`; `charts.ts:39-53`
- *Measured:* 3.28 to 5.07:1 against white
- *Forced by the ratio:* **Yes**

**6. Near-black text with almost no colour in it**

- *Value:* `text` `#38342f`, `text-muted` `#5f5a52`, `text-subtle` `#777168`
- *The rule behind it:* 4.5:1 for text: `rules.ts:26-29`
- *Measured:* 11.54:1, Lc 93.4, chroma 0.010
- *Forced by the ratio:* **No.** The builder fixes `text` at the darkest-but-one neutral (`semantics.ts:196`); the rule asks 4.5. The chosen ink `#693800` is 8.9:1

**7. Near-black labels on every pastel fill**

- *Value:* `on-primary`, `on-secondary`, `on-accent`: `#26231f`
- *The rule behind it:* 4.5:1 on the resting, hover and active fill: `rules.ts:44-46, 62-64, 68-70`
- *Measured:* 12.05, 11.59, 11.85:1 (Lc 85.5, 83.1, 84.4)
- *Forced by the ratio:* **No.** The builder hard-wires the darkest neutral (`semantics.ts:130`)

**8. Vivid status colours beside a pastel brand**

- *Value:* success `#008944`, danger `#cb2c31`, info `#0f70d5`, warning `#efa024`
- *The rule behind it:* 4.5:1 for the label: `rules.ts:74-86`; `semantics.ts:160-177`
- *Measured:* white on `#008944` is 4.50:1 exactly
- *Forced by the ratio:* **Partly.** The builder chooses white labels, and white needs a deep fill

**9. A 60% black wash over images, in light mode too**

- *Value:* `scrim` `rgb(0 0 0 / 0.6)`
- *The rule behind it:* 4.5:1 for text over any photo: `rules.ts:41-42`; `semantics.ts:186-190`
- *Forced by the ratio:* Kept. This one is a legibility rule

**10. A deep teal focus ring**

- *Value:* `focus-ring` `#008289`
- *The rule behind it:* 3:1: `rules.ts:32-33`; `semantics.ts:235-238`
- *Measured:* 4.31:1
- *Forced by the ratio:* Kept firm; the colour may change

**11. Side effect: the checkbox tick is the weakest pairing in the theme**

- *Value:* `#26231f` on `#008289`
- *The rule behind it:* no rule covers it (`atoms/_choice.scss:27, 48`)
- *Measured:* 3.39:1, Lc 29.2 — under the published floor of 30

**12. Structural: every hue shares one lightness curve, so the three fills have the same lightness and differ only by hue**

- *Value:* fills at L 0.905, 0.906, 0.906
- *The rule behind it:* "tuned so 600+ carries white text at ≥4.5:1": `ramps.ts:4-6, 15-28`
- *Measured:* aqua `#adedf3` against pink `#ffd2e1`: separation 11.5 typical, 4.4 protan, 3.2 deutan. Pink against yellow `#f3e096`: 2.2 tritan

**13. Structural: the rules choose the shades, they do not only check them**

- *Value:* 15 call sites of `pick()`, with 4.5 and 3 typed in
- *The rule behind it:* `semantics.ts:76-83, 109-118`
- *Measured:* lowering the floor to 3, 2 or 1.5 returns the same deep steps (appendix C)

Items 1 to 3 are the pastel half of this work. Item 12 is the one that works
against a colourblind reader: it removes lightness, the cue colour blindness
largely leaves alone.

Found beside these, and not WCAG's doing: the "warm cream" page is not cream.
`#f8f7f5` measures chroma 0.003, a neutral off-white, and cards are pure `#ffffff`,
2.4 from the page.

## 4. The dark-mode "no emphasis on edges" episode

**What happened.** Times are local where the record gives one; the first two
rows are as the survey recorded them.

| Date | Event |
|---|---|
| 2026-07-19, 07-23 | Two early symptoms inside sorbet, each patched in one component: the slider track vanished in dark because `border` equals `surface-raised` (PR #27); the selected pill vanished because `surface` equals `bg-subtle` (PR #38) |
| 2026-09-09 | imagefeed admin (noir, dark): "the actual buttons are getting lost as they just look like more txt." |
| 2026-09-10, 21:58 | "Everything is very hard to discern." Measured that night on noir dark, as recorded in imagefeed commit `baf9d09` (22:00): body text was fine (10.70:1 on a card); a card against the page was 1.26:1; the `border` token against a card 1.32:1. An app-local stopgap went into `imagefeed/site/admin.html:61-66` — a hard 3:1 border `#8a8782`, which is the look this proposal exists to leave |
| 2026-09-11 | The admin was switched from noir to sorbet and measured within 0.01 of noir (card against page 1.27:1, border against card 1.32:1): the fault is the dark branch all five presets share. Owner: "the edges are still an issue yeah so let's table that." Then, on switching to light: "much better." |
| 2026-09-27 | buylist pinned to light: "Dark mode in general needs some work so lets just use light mode." |

It was never fixed in sorbet. The lines below are unchanged since the project's
first week.

**Root cause, `semantics.ts:204-208` and `216-217` (the dark branch of `buildMode`):**

```ts
out.bg = neutral[950];
out["bg-subtle"] = neutral[900];
out.surface = neutral[900];
out["surface-raised"] = neutral[800];
out["surface-sunken"] = neutral[950];
// …
out.border = neutral[800];
out["border-subtle"] = neutral[900];
```

In words: three neighbouring steps of one grey ramp are used both as the fills and
as the borders meant to outline those fills. The line round a card is the card's
own colour. A sunken card is the page's colour. The line round a popover is
*darker* than the popover, so the popover reads only because its fill is a real
step (13.9) from the page. (The `border` token does equal `surface-raised`; the
one thing that ever paired them was the slider track of PR #27.)

| In sorbet dark today | Hexes | Separation | Ratio |
|---|---|---|---|
| Card fill against the page | `#38342f` on `#26231f` | 6.9 | 1.27:1 |
| Card border (`border-subtle`) against its card | the same hex | 0 | 1.00:1 |
| Popover border (`border-subtle`) against its popover | `#38342f` on `#4b463f` — darker than the popover | 6.9 | 1.32:1 |
| Sunken card against the page | the same hex | 0 | 1.00:1 |
| Card shadow (`shadow-sm`) against the page | black at 0.216 | at most 3.4 | 1.10:1 |

The gate passed all of it, because `rules.ts` has no rule for a surface against
the page or a border against its surface. It measured text, and text was fine.

**Why a darker shadow cannot rescue it.** The shadow was not what failed — the
borders and the fill step were — but on a light page a shadow would have covered
for them, and on a dark one it cannot. `emit.ts:35` reads, in words: in dark mode
ignore the preset's shadow tint, use pure black, at 2.4 times the light-mode
strength, capped at 0.7. The page sits at lightness 0.258; there is almost
nothing below it to be darker with. The most each shadow can differ from the
page — at full strength, before blur weakens it:

| Shadow token | On the dark page `#26231f` | The same token on the light page `#f8f7f5` |
|---|---|---|
| `shadow-xs` | 2.1 | 3.9 |
| `shadow-sm` | 3.4 | 5.7 |
| `shadow-md` | 4.3 | 7.6 |
| `shadow-lg` | 5.8 | 10.3 |
| `shadow-xl` | 8.9 | 15.5 |

What does separate on a dark page, measured:

- A real lightness step for the fill: the stopgap's `#413d38` is 10.4 from the
  page; `#4b463f` is 13.9.
- An edge *lighter* than the page. Sorbet already ships one: the filled button's
  hue-matched falloff (PR #108, `atoms/_button.scss:70-78`). 22% of `#4cc7d1` over
  the dark page lands `#2e4746`, 12.4 from the page. The card rim on sheet 2 (a
  cream at 18% on the cocoa page) measures 13.3 at its weakest side, from
  rendered pixels.

**The rule that follows.**

1. An element, or its edge, must differ from what it sits on by lightness — and
   the direction flips with the mode: darker than the page in light, lighter than
   the page in dark. One shadow recipe multiplied by 2.4 cannot do both.
2. An edge colour may never equal the fill it outlines.
3. Every level of nesting needs its own step. The page that broke had four (page,
   card, group, control).
4. It has to be a build check, or it comes back. It surfaced three times (slider,
   pill, cards) and was patched locally each time.

**What this refactor does about it, and does not.** It fixes the fault for sorbet
only (A8). Ocean, forest, noir and midnight keep the dark branch above, because
their theme files are frozen; the apps that pay for that, and what retires it,
are in §12.

## 5. The proposed contract — Draft 1, not implementable as written

> **Read this first.**
>
> - **PR 1 builds the shape and nothing else from this section:** every rule
>   gains a `kind` (what it protects), a `tier` (the group of pairs that owe the
>   same number) and a `why` (the reason, in one sentence); contracts become
>   data in a new `contracts.ts` with **one** member, `wcag-aa`, pinned to
>   exactly today's 86 rules; every preset declares a contract per mode, all
>   five `wcag-aa`.
> - **Everything about the `legibility` member waits for PR 2's specification
>   step:** its floors, its pair lists, the mark, tell-apart, palette, focus and
>   edge rules, and four of the six true-or-false checks.
> - **Why:** a spec adversary found 24 defects (6 critical, 13 major, 5 minor)
>   and 18 things left unsaid. All are listed in appendix G. Nothing below is
>   redesigned here; what was simply wrong is corrected and marked.
> - **Every number below is a measurement of the approved sheets,** in light mode
>   unless it says dark. None is an enforced floor yet.

### The shape (PR 1)

The pattern is a **policy object** (the Strategy pattern's other name): the
contract is data a preset points at, instead of rules baked into the checker.

```ts
// rules.ts — what gets measured. PR 1 adds three fields to today's 86 entries.
interface Rule { fg; bg; kind; tier; why: string; mode?: Mode }

// contracts.ts — which tiers a contract holds, and what each owes.
// A tier a contract does not list is a rule that contract does not hold.
interface Contract {
  name: ContractName;                       // PR 1: "wcag-aa" only
  views: View[];                            // wcag-aa: ["typical"]
  tiers: Partial<Record<Tier, {
    metric: "ratio" | "lc" | "sep";
    min: number | Record<Mode, number>;     // some floors differ by mode
    why: string; retire: string;
  }>>;
}

// presets.ts — required, per mode. PR 1: all five declare "wcag-aa" twice.
contract: Record<Mode, ContractName>;
```

In words: a rule names the two colours compared, the kind of thing it protects
and the tier it belongs to. A contract lists the tiers it holds and, for each,
the measure, the least it must reach (one number, or one per mode), why, and
what would retire it. A preset names one contract for light and one for dark.

**Three things revision 1 said about this shape were wrong** (not merely
different), and are corrected above:

| Revision 1 said | What breaks | Corrected to |
|---|---|---|
| "One pair list … a new pair joins both contracts" | The new legibility pairs fail frozen presets: `text-subtle` on `bg-subtle` is 2.63:1 in ocean light and 2.65:1 in noir light against 3:1. And `wcag-aa` would hold more than 86 | A rule belongs only to the contracts that list its tier. New pairs go in tiers `wcag-aa` does not list |
| One number per tier | The chart floor is 3:1 in light and 2.25:1 in dark. And the draft's `subtle` tier mixed pairs that owe 3:1 today with pairs that owe 4.5:1 | `min` may be per mode. A tier is one group of pairs that owe the same number; PR 1 names one per group in today's rules |
| A rule is a pair, `fg` on `bg` | An edge rule needs four inputs (fill, edge, strength, what is behind) and most of them are not tokens | Not solved here. PR 2's specification defines it (appendix G) |

**The pinned check** (PR 1): the `wcag-aa` member resolves to today's 86 entries —
the same pair, mode and number for each — and nothing else. 70 apply in each
mode, in seven tiers: `text` 42, `text-subtle` 2, `scrim` 2, `control-border` 2,
`shape` 4, `focus` 2, `chart` 16 (step 1.3 gives each tier's number).

Why this shape, by the questions the lab's authoring doctrine asks:

| Axis that can move | What it would break | How the shape answers |
|---|---|---|
| A second preset joins the legibility contract ("eventually universal") | A contract written in sorbet's colour names (lilac, cream) | Rules name roles (`primary`, `surface`), never hues. *Open:* much of what the new rules read has no role yet (appendix G) |
| A second reader (buylist's) | A contract calibrated on one person applied to an app other people read | Declared per preset. `wcag-aa` is the published standard; `legibility` records who it was calibrated for |
| The colour-vision type gets recorded | Floors padded for simulations that do not apply | `views` is data on the contract: one line to narrow |
| Light and dark land in different commits of PR 2 | Sorbet dark as shipped *fails* the new edge rule (it is the known-bad fixture: a fixed input the check must reject, here sorbet exactly as it ships today), so one contract per preset would block light on dark | Declared per mode. Sorbet reads `{ light: "legibility", dark: "wcag-aa" }` on the branch until its dark step |
| The ruler changes (APCA is a draft) | Every floor restated | `metric` sits beside each number |

Retires when: every preset is back on one contract (the map has one member and
the field can go).

### The two members

| | `wcag-aa` (PR 1) | `legibility` (draft; PR 2) |
|---|---|---|
| Declared by | all five presets in PR 1; ocean, forest, noir, midnight after PR 2 | sorbet light, then sorbet dark, in PR 2 |
| Calibrated for | anyone (a published standard) | one reader: the owner |
| Views | typical vision | the worst of typical, protan, deutan, tritan |
| Text | ratio ≥ 4.5 (≥ 3 for `text-subtle`) | Lc floors per tier **and per mode** |
| Shapes with no label | ratio ≥ 3 against the page | separation from the thing each must be told apart from |
| Focus ring | ratio ≥ 3 on the page and surface | kept firm, and checked against the fills it rings as well |
| Chart marks | ratio ≥ 3 light, 2.25 dark | the mark rule, against the surface |
| Edges | not checked | edge presence, both modes |
| Text over the scrim | ratio ≥ 4.5, worst-case composite | the same rule, unchanged |

**The chart *order* gate (`packages/design-system/tools/check-cvd.ts`) belongs to neither contract and
does not change** (A3). Revision 1 said it "gains the tritan simulation" with its
floors unchanged. That cannot be done: the gate takes the smallest separation
between neighbouring chart colours, and under the tritan view four of the ten
cells fall below their floor.

| Preset, mode | Smallest separation, tritan view | The floor (`check-cvd.ts:44-50`) |
|---|---|---|
| sorbet light | 7.9 | 14.6 |
| sorbet dark | 4.1 | 14.9 |
| ocean light (frozen) | 3.9 | 11.6 |
| noir light (frozen) | 3.9 | 11.6 |

The only ways to green would be lowering a floor or reordering chart slots, and
this plan forbids both. So the tritan matrix moves into the shared simulation
code in PR 1 and the chart gate goes on reading two views.

### Why Lc for text and not the ratio

Different, not wrong: the ratio is the right ruler for the WCAG contract. And for
text on the page it was never the constraint — every ink on sheet 1 passes 4.5:1
down to step 6. It is the wrong ruler *here* because it cannot see the places
this palette is actually tight:

| Case | The old ratio says | Lc says |
|---|---|---|
| Ink step C6 `#9c622f` on cream | 4.57:1 — passes as body text | 68.1 — by the published minimums, only bold text of 16px and up |
| Label ink `#472400` on lilac `#dac5fc` | 8.80:1 — plenty of room | 72. Pure black only reaches 77.8 there, and a 14px semi-bold label wants about 75 |
| Today's dark `text-subtle` `#999389` on a card | 4.05:1 — passes its 3:1 | 38 — just over the published floor |

Retires when: the owner's own reading on a sheet contradicts the Lc ordering (two
inks at the same Lc, one clearly harder), or the guidelines settle on another
method. The number is the owner's either way; the metric is only the ruler.

### How a floor gets its number

"Legible for me" is not a standard, so the gate cannot decide it. The owner's eyes
do, on a sample sheet; the gate's job is to stop what was approved from drifting.
Each legibility floor is therefore a **regression baseline**: a measurement of
what was approved, taken at its worst view, with the floor set a little under
it. The repo already does this in `packages/design-system/tools/check-cvd.ts`
(the comment at lines 15-18: "regression baselines, not aspirations"; the floors
at 44-50). A floor is re-pinned when the owner approves a new sheet, and never
lowered by an agent.

Draft 1 set each floor by rounding the measurement down to a whole number. That
left margins as small as 0.06, where rounding inside the compositing code
decides pass or fail. PR 2 sets each floor with a stated margin, per mode and per
element class.

### Text: what the sheets measure

Lc, worst view (the lowest size of the four). "Draft floor" is revision 1's
proposal, measured in light mode only.

**`body`** — draft floor 84

- *Pairs:* `text` on `bg`, `surface`, `surface-raised`
- *Light:* the ink `#693800` on the cream page 84.9; on a card 88.8
- *Dark:* cream text `#f3e7ce` on page / card / raised: 90.9 / 88.8 / 85.2 — passes
- *Today's sorbet, same role:* 93.4
- *Published minimum:* 90 for 16px regular; 75 at 18px, or 16px medium
- *Moves when:* the owner picks a new ink on a sheet, or body type changes

**`secondary`** — draft floor 76, **failed by the decided dark text and by the sheets' own wash**

- *Pairs as drafted:* `text-muted` on those three; `text` on `bg-subtle` and `surface-sunken`; `link`, `link-hover`; each `-text` role on `bg`, `surface` and its own `-subtle`
- *Light:* muted ink `#844d16` on cream 76.3 — clears by 0.3
- *Light, not measured by the draft:* the ink on the lilac wash `#ede0f7` 75.3 (fails); on the blush wash `#fcdfdc` 76.2; the violet link `#654199` on the lilac wash 69.8 (fails)
- *Dark:* muted `#d7c9ae` on page / card / raised: 72.4 / 70.3 / 66.8 — **fails 76**
- *Today's sorbet, same role:* muted 78.9
- *Not decided:* the values of the seven `-text` and seven `-subtle` roles, `link` and `link-hover`

**`label`** — draft floor 70, valid only at 16px semi-bold, which a token checker cannot see

- *Pairs as drafted:* each `on-*` on its fill, its hover and its active (three brand, four status). Those words name 21 pairs; today's rules hold 14 (`rules.ts:44-46, 62-64, 68-70, 74-86`). Three of the named fills do not exist (`success-active`, `warning-active`, `info-active`); `danger-active` exists by name only (§9)
- *Light:* label ink `#472400` on blush under protan 70.9; on lilac 71.3; butter 82.6; robin's egg 79.1. Ceiling: pure black on lilac is 77.8
- *Dark:* the same hexes (decision 8), so the same figures
- *Today's sorbet, same role:* 80.6 to 83.2
- *Published minimum:* 60 at 16px bold; about 75 at 14px semi-bold. The decided size, 16px semi-bold, sits between
- *Has no pair:* the checkbox tick (`on-primary` on the checked fill). As shipped it reads 26.4 and no rule, old or drafted, reads it

**`subtle`** — draft floor 64, **failed by the decided dark text**

- *Pairs as drafted:* `text-subtle` on `bg` and `surface` (today's two, `rules.ts:28-29`), plus two new ones: on `surface-sunken` and on `bg-subtle` (a disabled input puts it there); `text-muted` on `bg-subtle`, `surface-sunken`
- *Light:* subtle ink `#975e2a` on the well `#f7ecd1` 64.2 — clears by 0.2; on cream 68.9
- *Dark:* subtle `#b3a58d` on page / card / raised: 52.7 / 50.6 / 47.0 — **fails 64**
- *Today's sorbet, same role:* 68.8
- *Published minimum:* 30 for placeholder and disabled text
- *Moves when:* 12px captions move to a darker ink, leaving this tier to placeholders and disabled text (A15)

**scrim** — `on-scrim`, `on-scrim-muted` on `scrim`: ratio 4.5, unchanged. Whether a
ratio rule under this contract is measured in one view or four is open.

Two things to notice. Text on the bare cream page (84.9) sits under the
published 90 for 16px regular, and on a card it meets it; the owner chose the ink
by eye at that size, and the floor records the choice rather than the guideline.
And the "today" lines are the useful anchor: the owner already reads today's
muted (79) and subtle (69) text every day in the lab apps.

The other text shades are *derived* from the one ink, so they cannot drift from
it (decision 5). The rule, in words: the label ink is the same hue at a fixed
dark lightness of 0.30 (a pastel button is darker than the page, so its label
needs the help); muted is the ink made 0.08 lighter; subtle is the ink made 0.14
lighter. That rule was written for light mode; the dark shades are hand-picked
and are the ones failing above (§11, item 2).

### The rules that go, for a legibility preset

- `border-strong` at 3:1 on `bg` and `surface` (`rules.ts:30-31`) — the `#777168` outline.
- `primary-solid` at 3:1 on `bg` and `surface`, `secondary-solid` and
  `accent-solid` on `bg` (`rules.ts:55-60`) — the deep shapes and button edges.
- The 16 chart-mark rules per mode (`rules.ts:93-100`).

The 46 text pairs stay as pairs. The legibility member also adds pairs of its
own (the label hovers and actives, six `-text` on `surface`, two for subtle, the
tick), which PR 2 must list literally, each marked "today" or "new".

### What replaces them

Dropping the 3:1 shape rules with nothing in their place is the dangerous version
of this change: with `primary-solid` collapsed to the pale fill, a progress bar
against its track measures 1.12:1 and a tab indicator against the page 1.21:1.
Five kinds of rule replace them, all in separation, worst view. **Most of their
inputs are not tokens today** — each item says so — and that is the largest open
defect (appendix G, 5).

**Mark, area** — draft floor 10 (the "clearly different" line)

- *In words:* a filled shape that carries information with no label must stand off the thing it is read against — not the page
- *Pairs as drafted:* progress and slider fill against its track; switch on-track against off-track; checked interior against unchecked; chart marks against the surface
- *Known-bad today that must fail it:* switch on against off 5.3 (in light; in dark it is 11.4 and passes); secondary progress bar against its track 4.3
- *The sheets measure:* switch and progress 23.0; checked against unchecked 13.1 on milk, 11.1 on cream; weakest status bar on its track 15.6
- *Not a token:* the off-track, the track, the status shades. What the Sass paints today for a toned progress bar is the pale fill itself (`_progress.scss:25`): 3.5 (butter), 5.0 (robin's egg), 8.0 (blush), 9.3 (lilac) against the well — all under 10
- *Moves when:* a bar or switch state is missed on a real screen

**Mark, line** — draft floor 20

- *In words:* a ring, bar or indicator 3px or thinner needs more than a patch does
- *Pairs as drafted:* the control ring against `surface` and `bg`; the tab indicator against `bg`; the selected bar against its wash
- *Known-bad today:* a pale fill used as a tab indicator, 5.0
- *The sheets measure:* control ring `#b096d7` 27.0 on milk, 24.9 on cream; selected bar 20.6 against its wash when the wash sits on a card, **19.7 when the same wash sits on the page — fails 20**
- *Not a token:* the ring, the bar, the wash
- *Moves when:* the ring proves faint (measured fallbacks, on milk: `#a686d6` 31, `#9b77cd` 35) or heavy (`#bba3e8`: 23 on milk, 21 on cream)

**Tell-apart** — draft floor 10

- *In words:* two colours whose difference is itself the message, with no other cue
- *Pairs as drafted:* the invalid edge against the resting field edge and against the focus ring; the focus ring against the control ring
- *Known-bad today:* invalid border against resting border 8.3. (Revision 1 also listed "an input's focused border against its resting border, 5.3"; no drafted pair reads it)
- *The sheets measure:* invalid rose `#d77784` 19.3 from the field edge, 14.1 from the focus ring; focus ring 12.2 from the control ring
- *Not a token:* the rose rim, the resting field edge (a shadow layer), the control ring

**Palette** — draft floor 5

- *In words:* no two fills may become the same colour for one kind of reader
- *Pairs as drafted:* "every pair among the four fills". Those are four hues; by role there are seven fills, and `info`, `danger` and `warning` share a hex with `primary`, `secondary` and `accent` — run over roles the rule fails at 0
- *Known-bad today:* aqua `#adedf3` against pink `#ffd2e1` 3.2 (deutan); pink against yellow `#f3e096` 2.2 (tritan)
- *The sheets measure:* worst pair 5.4 (blush against robin's egg, deutan); next 5.6 (lilac against robin's egg, deutan)
- *Moves when:* a formal test records the colour-vision type: then only that view is checked

**Focus** — draft floor 20

- *In words:* the one deliberately firm edge
- *Pairs as drafted:* `focus-ring` against `bg`, `surface`, `surface-raised` and every brand fill, in both modes. The success fill, hover and active fills and the well are not listed
- *Known-bad:* two of the three proposals used the lilac fill's own hex as the dark focus ring: 0 from a primary button
- *The sheets measure:* `#8e6ac7` 37.1 from cream, 39.2 from milk, 26.1 or more from every fill (robin's egg 32.0); in dark 39.1, 32.2, 25.7 from page, card, raised
- *Moves when:* not retired by this change. It may go up

The mark floors are judgements, not standards. 5 and 10 are the instrument's own
lines; 20 was pinned to the weakest line mark on the sheets, with 0.6 of room.

### Edge presence, in both modes

The owner's "NO emphasis on edges", as a rule a build can check.

In words: for every raised element, on everything it is allowed to sit on, either
its own fill or the first pixel of its edge — the edge colour blended over what is
behind it — must sit at least the floor away from what is behind it. In symbols:
`max( sep(fill, behind), sep(blend(edge, behind), behind) ) ≥ floor`.

- **Pairs as drafted:** `surface` on `bg`; `surface-raised` on `surface` and on
  `bg`; a field on `surface` and on `bg`; `surface` on each brand `-subtle` wash.
  Buttons, chips, the status box and the sunken panel have no pair.
- **Corrected:** revision 1 said the auth template paints the `-subtle` washes
  behind a card. It paints radial gradients of the wash mixed 30 to 50% toward
  transparent (`templates/_auth.scss:19-21`), so the full-strength wash is a
  worst case that is never on screen.
- **How the build measures it:** blend the edge's all-round layer over the
  backdrop with `compositeOver()` (`color.ts:126-134`, written for the scrim; the
  technique is alpha compositing: mixing a see-through colour with what is under
  it). Which layer of a several-layer shadow is "all-round", and what an *inset*
  edge, one drawn inside the element's own box, blends over (its own fill, not
  what is behind), are not defined.
- **Corrected:** revision 1 said "separation has no direction, so … a shadow
  darker than [a dark page] cannot [pass]". Separation has no direction, and that
  cuts the other way: a solid black line on the dark page measures 19.7 and
  passes; black at the 70% a shadow is drawn at measures 7.3. In light, black at
  25% (18.4) and today's solid outline `#777168` (41.4) both pass. So this rule
  bounds distance only. It does not hold the owner's "no harsh black or gray
  outlines", nor the direction rule of §4.
- **What it needs:** shadows as data the checker can read. Today they are strings
  assembled in `emit.ts:34-43`.
- **What it is not:** proof the edge is enough. It measures the edge at full
  strength before blur — an upper bound — so passing is necessary, not sufficient.
  Sufficiency is judged from rendered pixels, which sheet 2 already does
  (appendix F).

What the approved sheets measure, by the build's method, worst view:

| Pair | Fill step | Edge, by the build's method | Edge, rendered, weakest side |
|---|---|---|---|
| Sorbet dark as shipped — the failure, and it must fail | 6.9 | 3.4 (border: 0) | — |
| Sorbet light as shipped — the owner's "much better" | 2.4 | 5.7 | — |
| Light: card on the cream page (E2) | 2.4 | 14.4 | 13.1 |
| Light: floating menu on a card | 0 | 17.8 | 13 |
| Light: text field on a card | 0 | **11.0** | 12 (11) |
| Light: text field on the page | 2.4 | **10.5** | — |
| Light: card on a lilac / blush / butter wash | 6.4 / 6.1 / 4.1 | **13.3 / 12.8 / 13.9** | — |
| Dark: card on the cocoa page (rim) | 6.9 | 16.1 (16.06) | 13.3 |
| Dark: raised on a card / on the page | — | 21.6 / 24.4 | 17 |
| Dark: card, rim on the aubergine page — the alternative | 6.7 | 15.4 | 12.4 |
| Dark: card, "glow" — the variant the owner passed over | 6.7 | 18.5 | 9.0 |

**Revision 1's floors — light 14, dark 16 — are withdrawn.** 14 was pinned to the
card alone, and the four bold figures above fall under it: the sheet the owner
approved would have failed the floor the owner was asked to approve. 16 is
cleared by 0.06. (The draft also carried a second number, "never under 5" and
"never under 10", with no statement of which one the build enforces.) PR 2 sets
one floor per element class — container, floating, field, on a wash — and per
mode, with real margin. Whether the field's 11.0 is accepted or the field is
firmed up is the owner's call (§11, item 3).

Two more things to read off the table. The dark card's fill step on sheet 2 (6.7
to 6.9) is no bigger than the one that failed (6.9): the edge is the whole fix.
And the last row is the bound's blind spot: by the bound the blurred glow beats
the rim, and rendered it is the weaker.

Moves when: the owner reports a page where things run together while the gate is
green. The floor goes to that page's measurement plus a margin, and the page is
recorded beside it.

### Checks with no number

True-or-false, each a line in the build.

| # | Check | Lands in | Corrected or open |
|---|---|---|---|
| 1 | Every role name is emitted, in both modes | PR 2 | fails all five presets today: `danger-active` is named and produced by none (§9). Scope it to legibility presets, or it contradicts check 4 |
| 2 | The text hierarchy is ordered: label ink darker than body, body darker than muted, muted darker than subtle — "reversed in dark" | PR 2 | false as written: the label ink is `#472400` in both modes, so in dark it is far darker than the cream text. "Darker" has no stated measure; unscoped it fails the four WCAG presets, whose labels are white |
| 3 | No edge colour equals the fill it outlines | PR 2 | no map of which edge outlines which fill. Read plainly it fails every preset today; read for the new look it can never fire, because a see-through shadow never equals a hex |
| 4 | The four frozen theme files equal their golden files, byte for byte (sorbet's too, until PR 2 regenerates it on purpose) | **PR 1** | built (`c0e0af3`) |
| 5 | The `wcag-aa` contract resolves to today's 86 entries and nothing else | **PR 1** | reworded: revision 1 said "exactly today's 86" while also adding pairs to the shared list |
| 6 | The `legibility` contract, run against sorbet dark *as shipped*, fails on the card edge — the proof the new gate can see September | PR 2 | the shipped shadows have no all-round layer, so the method above has nothing to blend |

### What the gate cannot hold

A token gate sees colours. It cannot see that an alert has an icon, that a
selected row is bold, or that a switch thumb moved. Those cues live in components,
and the repo has no test runner. Two things stand in: status components derive
their icon and word from `tone` inside the component, so a status cannot be
rendered without them (§8, step 2.5); and the usage-accessibility diff in §2.

## 6. Palette, roles and ink, as decided

This is what is on the two sample sheets as built at 18:58 on 2026-10-03. The
palette is the judges' synthesis of three proposals; no single proposal survived
whole (appendix D).

### The palette

| Role | Name | Hex | L / C / h |
|---|---|---|---|
| page (`bg`) | Cream | `#fef4dc` | 0.969 / 0.033 / 88° |
| cards and fields (`surface`) | Milk | `#fffbf1` | 0.988 / 0.014 / 89° |
| `primary`; also `info` | Lilac | `#dac5fc` | 0.859 / 0.078 / 302° |
| `secondary`; also `danger` | Blush | `#f9c3c6` | 0.866 / 0.062 / 15° |
| `accent`; also `warning` | Butter | `#f5e3a2` | 0.915 / 0.085 / 94° |
| `success`; decoration | Robin's egg | `#a6edee` | 0.900 / 0.070 / 197° |

How each stands off the cream page, and what the two red-green simulations make of it (protan, then deutan):

| Name | From the cream page (four views) | Under the red-green simulations |
|---|---|---|
| Cream `#fef4dc` | — | `#faf3db`, `#fdf6dd` — keeps its colour |
| Milk `#fffbf1` | 2.8 / 3.0 / 2.7 / 2.4 — invisible by fill alone, on purpose: the edge carries it | — |
| Lilac `#dac5fc` | 15.4 / 15.1 / 15.2 / 11.1 | `#bbcefe`, `#becefa` — seen as a pale blue; keeps its colourfulness (0.070, 0.064) |
| Blush `#f9c3c6` | 12.0 / 12.6 / 10.3 / 11.9 | `#cccac6`, `#d8d4c5` — grey under protan (0.006), a faint tint under deutan (0.021) |
| Butter `#f5e3a2` | 7.5 / 8.0 / 7.2 / 5.6 | `#f0e09e`, `#f5e6a4` — keeps its colourfulness (0.086, 0.085) |
| Robin's egg `#a6edee` | 11.1 / 5.7 / 9.6 / 13.2 | `#e4e6ee`, `#d6dcef` — grey under protan (0.011), a faint tint under deutan (0.027) |

Today's page, for comparison: `#f8f7f5`, chroma 0.003. This cream is 0.033.

Supporting tones: the well `#f7ecd1` (sunken panels, tracks; body ink reads Lc 81
on it) and the divider `#e3d2b0` (12.0 from milk at worst), both near the cream's
hue. One more, from proposal B and endorsed by a judge, not on the sheets: deep cream `#efdcb5`,
for hover washes — body ink reads about Lc 72 on it, so labels only.

Three tones are derived from each fill, by the sheets' rules:

- **Shade** — the fill made 0.14 darker and a quarter more colourful. Used for rings, tracks, bars — anything with no label. 14 from its own fill in every view. Lilac `#b096d7`, blush `#d29397`, butter `#ccb563`, robin's egg `#66c2c4`
- **Halo tone** — the fill's hue at lightness 0.70, chroma 0.14. Used for the glow round a filled button in E2. Lilac `#af88e6`, blush `#e87783`, butter `#bb9c12`, robin's egg `#00b5b8`
- **Deep** — the fill's hue at lightness 0.55, chroma 0.12. Used for only ever inside a shadow, at low strength. Lilac `#7f5fab`, blush `#ac505b`, butter `#877000`, robin's egg `#008284`

### Why these roles

The owner left the roles to measurement ("whichever fits the bill best"). All
three proposals reached the same assignment independently and all three judges
confirmed it.

- **Lilac leads** because it stands furthest off the cream page for typical vision
  and in both red-green simulations (15, against 13 or less for the others), and
  with butter it is one of the two fills that keeps its colour there. Under the
  rare tritan simulation it is the other way round: robin's egg (13) and blush
  (12) stand off slightly more than lilac (11), and lilac is the one that fades
  (colourfulness 0.017). **This changes sorbet's lead colour**: today robin's egg
  (`#adedf3`) is the primary, lilac is not in the theme at all, and the tagline at
  `presets.ts:46` names robin's egg first. The owner has confirmed it (decision
  3): robin's egg was the hero only because lilac was not considered at the time.
- **Blush is secondary** because it is the better neighbour for lilac: 6.7 apart
  at worst, where robin's egg would be 5.6.
- **Butter is the accent** because it is lilac's opposite on the blue-to-yellow
  axis, the one red-green colour blindness keeps: the best-separated pair in the
  set (16.8 / 16.5 / 16.3, and 7.2 under tritan). It is weak against the page
  (5.6 at worst) because it shares the page's hue, so it is used small, on cards
  (8.0 at worst from milk), with its own-colour edge.
- **Robin's egg is never a lone button on the page.** It is 5.7 from cream under
  protan.
- **Lightness is staggered on purpose:** lilac and blush deep (0.86 to 0.87),
  butter and robin's egg light (0.90 to 0.92). At one shared lightness, blush and
  robin's egg collapse to 4.0 apart under deutan, and robin's egg and lilac to
  2.2. One shared lightness is what sorbet has today (§3, item 12).
- **The four statuses reuse the four pastels**; there is no fifth hue. A mint
  for success (one candidate was `#b9eec2`, 2.2 from its own proposal's blush
  `#fbcbcd` under deutan) was measured and rejected in all three proposals: it
  lands 0.4 to 2.6 from blush under deutan, the literal red-green confusion.
- **Revision 1 said "no new role is needed". That is withdrawn.** The page, the
  fills and the inks land in existing roles. The control ring, the selected bar
  and its wash, the switch's off-track, the rose rim, the resting field edge, the
  three derived tones above and the mark-strength status tokens (A5) have no
  role. PR 2's specification names an optional token for each and the Sass site
  that reads it. Optional means only sorbet emits it, so the other four theme
  files still gain no lines.
- **Not decided at all:** what the seven `-subtle` washes, the seven `-text`
  roles, `link-hover`, the `-hover` and `-active` fills, the three border
  tokens, the `-solid` tokens and `text-inverse` become. Sorbet names 69 roles;
  this section fixes about 20. The full role-to-value table, light and dark, is
  the first thing PR 2's specification step delivers (§8).

### Colour blindness: what collapses, and what that means

| Pair of fills | typical | protan | deutan | tritan |
|---|---|---|---|---|
| lilac / blush | 8.4 | 7.9 | 8.6 | 6.7 |
| lilac / butter | 16.8 | 16.5 | 16.3 | 7.2 |
| lilac / robin's egg | 12.5 | 9.5 | **5.6** | 11.4 |
| blush / butter | 10.8 | 10.2 | 8.3 | 6.4 |
| blush / robin's egg | 13.7 | 8.8 | **5.4** | 17.4 |
| butter / robin's egg | 12.3 | 10.0 | 11.4 | 13.9 |
| *today:* aqua `#adedf3` / pink `#ffd2e1` | 11.5 | 4.4 | **3.2** | 14.2 |
| *today:* pink / yellow `#f3e096` | 11.7 | 10.9 | 9.5 | **2.2** |

- **Which pairs collapse.** Blush against robin's egg (danger against success) and
  lilac against robin's egg (info against success), both under deutan. Better than
  today, and close to the limit: one proposal searched about four million pastel
  sets and the best worst-pair it found was 6.0 to 6.25, barely depending on how
  colourful the pastels are. The whole pastel lightness range is about 6 wide,
  and lightness is the one thing the simulations leave largely alone.
- **Why this does not affect reading.** Every text pairing is a lightness
  contrast. The ink on cream reads 85.8 / 87.8 / 85.2 / 84.9; the label ink never
  drops below 70.9 on any fill in any view. The scores move by 1 to 5 points
  under the simulations, most on blush under protan.
- **What it means for statuses.** Fill colour is decoration. Each status carries
  an icon with its own silhouette and its word, always (decision 13), and status
  text is the ordinary ink (A13): one proposal measured a danger-coloured text tone at 2.5 from
  body ink under deutan. This is a change to the component contract (Alert,
  Toast, Badge, the danger Button, the menu's danger item), not only to tokens.
- **What it means for selected and current states.** Use a lilac wash, and never
  the wash alone: add a solid bar in the lilac shade (20.6 from the wash, 27.0
  from milk) and a heavier weight. Today "current page" is hue only: its fill is
  2.3 from the hover fill at worst.
- **Buttons.** The label says which button it is.
- **Links** are always underlined.
- **Paragraphs never sit on a full-strength fill** (the ink reads 64 on lilac, 65
  on blush). A status box uses the fill at half strength over milk, where the ink
  reads 76 to 83 in typical vision and 75.3 at worst (on the lilac wash
  `#ede0f7`, under deutan — just under the draft secondary floor of §5); that
  wash is only 3.4 to 6.4 from milk at worst, so it carries its own halo.

### Ink: where the text colour can land

**Decided: cocoa `#693800`** (decision 4) — hue 60°, lightness 0.395, chroma
0.092, which is as colourful as a screen can show at that lightness. The owner's
route to it: aubergine `#58366f` "on initial glance"; then, at sorbet's real type
sizes, "Switch to cocoa"; then, with the slider, "#693800 which is also a 90".

| | Lc on the cream page (four views) | Lc on a card | Old ratio on cream |
|---|---|---|---|
| The ink `#693800` | 85.8 / 87.8 / 85.2 / 84.9 | 89.8 | 8.86:1 |
| Today's text `#38342f`, on today's page | 93.4 | — | 11.54:1 |

A card is a shade lighter than the page, so the same ink measures about 4 Lc
higher on it. The "90" the owner aimed at is the card figure, and 90 is the
published mark for paragraphs at sorbet's 16px regular. On the bare cream page
the same text reads 86, a little under that mark.

**How light it could have gone.** Sheet 1's cocoa ladder; aubergine agrees within
1 Lc at every step (appendix A). The chosen ink sits just on the dark side of
step C3:

| Step | Lightness | Lc on cream | Lc on a card | By the published minimums, on cream |
|---|---|---|---|---|
| C1 | 0.30 | 93.9 | 97.8 | paragraphs from 14px up — but this is as dark as today's text |
| C2 | 0.35 | 90.0 | 93.9 | paragraphs from 14px up |
| **the ink, `#693800`** | **0.395** | **85.8** | **89.8** | paragraphs at 18px, or 16px medium; on a card, 14px and up |
| C3 | 0.40 | 85.3 | 89.3 | paragraphs at 18px, or 16px medium |
| C4 | 0.45 | 79.9 | 83.8 | paragraphs at 18px, or 16px medium |
| C5 | 0.50 | 74.3 | 78.2 | headings and bold labels, 16px and up |
| C6 | 0.55 | 68.1 | 72.0 | headings and bold labels, 16px and up |
| C7 | 0.60 | 61.3 | 65.2 | headings and bold labels, 16px and up; fails the old 4.5:1 |

- **The answer to "where can it land", by the measurements:** about lightness
  0.40 for paragraphs at today's 16px regular on a card; about 0.50 only if
  paragraphs move to 18px or to a medium weight; lighter than that is for
  headings. The published minimums are for a general audience; the owner's eye
  decided, and it landed on the published mark.
- **Does it still look coloured?** Five inks from sheet 1's swatch strip: four
  at one lightness (0.40), and today's text, which is darker (0.327). The four
  number columns are how far each sits from a colourless tone of its own
  lightness:

  | Ink | typical | protan | deutan | tritan |
  |---|---|---|---|---|
  | **C · Cocoa** `#693800` (hue 60°) — the ink | 9.2 | 8.2 | 8.4 | 10.1 |
  | A · Aubergine `#57356e` (hue 310°) | 10.0 | 8.7 | 7.3 | **3.7** |
  | B · Ink blue `#314571` (hue 265°) | 7.9 | 7.7 | 8.2 | 6.2 |
  | P · Plum `#5f3656` (hue 335°), a control | 7.5 | 4.7 | **2.6** | 6.3 |
  | T · Today's text `#38342f` | 1.0 | 1.0 | 1.0 | 1.0 |

  Seen as, under protan and then deutan:

  - C · Cocoa: `#473d00`, `#534900` — an olive brown (colourfulness 0.074, 0.084)
  - A · Aubergine: `#274270`, `#30446d` — a dark blue (0.086, 0.075)
  - B · Ink blue: `#334973`, `#2c4370` — stays blue (0.076, 0.082)
  - P · Plum: `#364057`, `#414655` — nearly colourless (0.042, 0.026)
  - T · Today's text: `#36342f`, `#37352f` — colourless (0.009, 0.011)

  Cocoa and ink blue stay coloured in all three simulations. Aubergine loses most of
  its colour under tritan (`#543e4c`, colourfulness 0.038). Plum is a control —
  included to show what failing looks like — and is nearly colourless under
  deutan (`#414655`, 0.026).
- **What the swatch test showed** (decision 10). The owner reported two close
  pairs: aubergine with ink blue, and plum with plain grey. Those are the two the
  deutan simulation collapses hardest:

  | Pair, as shown in the test (lightness 0.40) | typical | protan | deutan | tritan |
  |---|---|---|---|---|
  | Aubergine `#58366f` and ink blue `#324673` | 7.1 | 2.8 | **1.1** | 9.2 |
  | Plum `#603758` and a grey of its lightness, `#474747` | 7.6 | 4.8 | **2.8** | 6.2 |
  | Aubergine `#58366f` and the cocoa swatch as shown, `#683b0e` | 15.1 | 15.7 | 14.9 | 6.9 |

  The owner can still tell every swatch apart — "swatch looks different but as
  text they;re very close" — so the form is partial, and size matters: a
  difference visible in a patch can vanish in text. That is the same reason the
  mark rule in §5 asks more of a thin line than of a patch.
- **Why cocoa serves this reader.** It does not depend on the kind of colour
  blindness. And it is the one candidate that keeps a link visibly different from
  body text by colour: a violet link `#654199` sits 21.3 / 22.1 / 20.7 / 11.5
  from the ink, against 7.6 / 7.9 / 7.3 / 6.3 from aubergine, where only the
  underline would do the work. That matters because `primary-text` is used as a
  state cue in 17 places in the Sass. Cocoa's cost: it is on the same side of the
  wheel as today's text (60° against 74°), so the change of hue is small; the
  change is in colourfulness, 0.092 against 0.010.
- **Hue and colourfulness are nearly free for reading.** A difference of 1 or 2
  Lc between two families at the same lightness means nothing.

**The shades derived from the ink** (decision 5; the rule is in §5):

| | Label ink | Ink | Muted | Subtle |
|---|---|---|---|---|
| Lightness | 0.30, fixed | 0.395 | 0.475 | 0.535 |
| Cocoa | `#472400` | `#693800` | `#844d16` | `#975e2a` |
| Lc on cream / on a card | 93.9 / 97.8 | 85.8 / 89.8 | 77.2 / 81.1 | 70.0 / 73.9 |

Label ink on the four fills, typical vision (worst view): lilac 71.8 (71.3), blush
73.0 (70.9), butter 83.8 (82.6), robin's egg 82.2 (79.1). At lightness 0.30 the
label ink shows chroma 0.070, the most a screen can show at that depth.

- **One ink family everywhere, not tone-on-tone** (a label in a dark shade of its
  own fill's colour). Measured by two proposals: tone-on-tone lands within 2 Lc
  and is often worse, costs four inks to maintain, and two of them turn grey for
  a red-green reader.
- **A cost none of the three proposals flagged: button labels get weaker than
  today.** Today's labels read 85.5, 83.1 and 84.4 on the three fills. The new
  label ink reads 72 on lilac and 73 on blush, and pure black itself only reaches
  77.8 and 78.9 there. The fills are darker than today's (0.86 against 0.906),
  and each 0.05 of fill lightness costs a label about 9 Lc. By the published
  minimums a 14px semi-bold label wants about 75 and a 16px bold one 60, which is
  why the labels go to 16px semi-bold (decision 6). The other consequence: hover
  and pressed move the shadow and never darken the fill.
- **12px text** (badges, hints — the smallest sorbet sets) belongs on cream or
  milk, in the label ink. No ink reaches that contrast on a fill. (A15: nothing
  yet re-points the 47 places the Sass uses `text-subtle`.)

## 7. The edge model

### The three treatments, and the one chosen

Every edge colour is a darker version of what it edges, never colourless or
black. (That is how the sheets are drawn. No drafted rule checks it: §5.)
Round cards it is a caramel, `#a16e32`: the cream taken darker and a little
toward orange (hue 68° against the cream's 88°). The text field's inset line is
a darker tone of the same family, `#815b1f`. Round a button it is the button's
own hue. Exact strings are in appendix E.

| | In words | A card's edge, by the build's method | Verdict |
|---|---|---|---|
| **E1 Hairline** | a 1px line at 26% strength, plus a tight shadow | 9.7 | Quietest. Nearly free: most of it is a values change |
| **E2 Halo, no line** | no line on the card or the buttons: a soft glow, a contact shadow, a wide soft one. The text field keeps a faint 1px inner line, because its fill is the card's and it would otherwise vanish | 14.4 | **Decided** (decision 7), and the judges' recommendation. The literal reading of "similarly colored box shadow" |
| **E3 Shade ring** | a crisp 1px ring in a darker shade | 17.1 | Firmest and safest on a washed-out screen. Reads as an outline |

In all three, checkboxes and switches keep a firm ring in the lilac shade
`#b096d7`: a box or a switch has no text inside it, and its outline is the only
thing showing where it is.

### E2 across real states: what sheet 2 measures

Sheet 2 draws E2 in the chosen ink across nesting, buttons and their states,
fields, unlabelled controls, selected rows, statuses and a table — in light, and
in dark with the rim on the chosen cocoa page and on the aubergine alternative.
The owner's verdict on it: "edges are distinct in both modes". Its numbers are read off
rendered pixels: each is the biggest step the eye meets crossing that element's
edge **at its weakest side**. The bracket is the same edge under the worst of
the three simulations.

| Element | Light | Dark (rim, cocoa page) | Dark, aubergine page |
|---|---|---|---|
| Card on the page | 13 (13) | 13 (13) | 12 (12) |
| Sunken panel on a card | 12 (12) | 14 (14) | 14 (13) |
| Raised box on the well | 15 (14) | 19 (19) | 19 (19) |
| Floating menu on a card | 13 (13) | 17 (17) | 16 (16) |
| Lilac button on a card | 16 (15) | 59 (58) | 59 (58) |
| Blush button on a card | 16 (15) | 59 (58) | 59 (57) |
| Butter button on a card | 17 (15) | 64 (64) | 65 (64) |
| Robin's-egg button on a card | 19 (13) | 63 (62) | 63 (62) |
| "Quiet" button on a card | 13 (13) | 17 (17) | 16 (16) |
| Butter button on the bare page | 15 (14) | 71 (71) | 72 (71) |
| Robin's-egg button on the bare page | 18 (12) | 70 (69) | 70 (69) |
| "Quiet" button on the bare page | 15 (14) | 19 (19) | 18 (18) |
| Text field on a card | 12 (11) | 19 (19) | 18 (18) |
| Checkbox, off, on a card | 29 (27) | 58 (56) | 57 (56) |
| Switch, off, on a card | 29 (27) | 58 (56) | 57 (56) |
| Status box on a card | 16 (11) | 23 (23) | 23 (23) |

Reading it: in light, the weakest is the status box under the protan simulation, 10.9; nothing else is under 11. In dark, the rim holds 13
or more everywhere on the cocoa page (12 on the aubergine one), so the page
colour was a matter of taste. Pastel buttons need no help in dark — they are the
bright things.
The "glow" variant the owner passed over (the same light, blurred, no line)
measured 9 for the card and the floating menu and 8 for the quiet button.

### The recipe, by element class

As drawn on sheet 2. These are draft tokens, not final values.

| Element class | Light | Dark |
|---|---|---|
| **Container** (card, panel) | caramel halo, no line; a 1px transparent border | a lighter surface plus a pale edge: a lit line inside the top edge at 22% and a 1px rim at 18%, with a dark pool for depth only. The edge colour is the cream, `rgb(254 244 220)` |
| **Floating** (menu, popover, modal, toast) | a second, stronger halo: a milk panel on a milk card has no fill step at all | the raised surface plus the rim at 28%. A judge measured 12% as too little: a popover's bottom edge fell to 4.3 |
| **Sunken panel, track** | the well `#f7ecd1` with an inner caramel shadow | a well darker than its card with an inner light line |
| **Text field** | the card's own milk, an inset caramel hairline and an inner top shadow. Not a darker well: that costs typed text about 9 Lc | the well, with an inner light ring at 34% |
| **Control with no label** (checkbox, radio, switch, slider) | an inset 1.5px ring in the lilac shade `#b096d7`. Checked: lilac fill, the same ring, a tick in the label ink (Lc 72). Switch on, slider and progress fill: the shade itself (23 from the track at worst) | the same ring; it is the light thing on a dark ground |
| **Filled button, chip** | a glow in the fill's own halo tone, no ring | the same fill and label; a glow in the fill's own colour |
| **"Quiet" button** (replaces today's outline button) | card fill with a caramel halo | raised fill with the rim |
| **Divider, table rule** | these are the line: `#e3d2b0` | the rim colour at 14% |
| **Selected, current** | a lilac wash, a 3px solid bar in the shade, weight 600 | the same, wash at 20% |
| **Status box** | the status pastel at half strength over the card, its own halo, an icon and the word | the pastel at 20%, the rim |
| **Focus** | `outline: 3px solid #8e6ac7`, 2px offset — one tone for both modes | the same |
| **Invalid; delete** | a 2px inset rose rim `#d77784` *added on top of* the normal edge, an icon, and words | the same |
| **Hover, pressed** | hover lifts 1px and grows the halo; pressed pulls it in and adds an inset shadow. The fill never darkens | the same |
| **Disabled** | the fill at 45% over the card, subtle ink, a faint inset ring | the same |

The dark page follows the ink (decision 9). The alternative has the same
lightness steps, so its edges measure the same:

| | Page | Card | Raised | Well |
|---|---|---|---|---|
| **Cocoa (hue 60°) — decided** | `#211409` | `#342417` | `#463425` | `#140903` |
| Aubergine (hue 308°) — the alternative | `#1c1324` | `#2d2237` | `#3e324a` | `#100916` |

Dark text is the cream in either case: `#f3e7ce` reads Lc 92 on the page, 90 on a
card, 86 on a raised surface; muted `#d7c9ae` 71 on a card; subtle `#b3a58d` 51
on a card (70.3 and 50.6 at the worst view: both under the draft floors of §5,
which is §11, item 2). The pastel fills and the label ink are the same hexes in both modes
(decision 8: full strength). The "softened" option the owner passed over takes
each pastel a step darker and costs the labels contrast: lilac 72 to 65, blush
73 to 66, butter 84 to 76, robin's egg 82 to 75.

Not drawn yet on either sheet: chart colours, text over a photo, tooltips, two
fields joined edge to edge, text selection, and the hover wash on list rows.

### The mechanics that decide whether it survives a component library

1. **One stylesheet serves both contracts, so every difference needs a seam.**
   `dist/css/sorbet.css` is shared by all five themes. Each place the two looks
   differ becomes an optional token read with a fallback — a CSS custom-property
   fallback, `var(--sb-edge-container, <today's shadow>)` — where the fallback is
   today's token. A theme that defines none of them computes exactly today's
   declarations, and the four WCAG theme files gain no lines. The seams number
   about ten, one per element class above, not one per declaration.
2. **`border-strong` is doing three jobs**, which is the role-split document's
   lesson again (one token, contradictory duties). Its 18 uses:

   | Job | Sites | In the new look |
   |---|---|---|
   | The frame of a text field | `atoms/_input.scss:8`, `_number-input.scss:13`, `_color-input.scss:188`; `molecules/_combobox.scss:63`, `_date-range.scss:16`, `_input-group.scss:39` | soft: text inside marks the field |
   | The ring or line of something with no fill | `atoms/_choice.scss:13`, `_button.scss:136`, `_divider.scss:26`; `molecules/_dropzone.scss:31, 64`, `_calendar.scss:126`, `_carousel.scss:83`; `organisms/_command-palette.scss:184`, `_chart.scss:62` | firm: it is all there is |
   | An "off" fill | `atoms/_switch.scss:12`, `_rating.scss:61`; `molecules/_carousel.scss:107` | a state: needs the mark floor |

   A values-only change cannot make the first soft and keep the second firm.
   This split is the first seam, and it is why even E1 is not quite free.
3. **`box-shadow` is one property.** Today `control-glow`
   (`abstracts/_mixins.scss:100-103`, 8 includes) writes it for focus and
   invalid; an edge written to the same property is deleted on focus, or deletes
   the focus glow. The fix is the pattern Tailwind's ring utilities use: compose
   the declaration from custom properties,
   `box-shadow: var(--_state, 0 0 #0000), var(--_edge, 0 0 #0000)`. In words:
   every element's shadow is two layers, a state layer on top of an edge layer.
   Each is a variable that falls back to a shadow of no size and no colour, so
   an unset layer draws nothing, and focus or invalid fill the state layer
   without touching the edge. Sheet 2 is built this way. It is the largest
   mechanical piece.
4. **A custom property that contains `var()` is resolved where it is declared,
   not where it is used.** A recipe at `:root` that refers to a button's own tint
   gets the root's tint. So the per-hue recipe is emitted on the element by the
   mixin, as the button already does (`atoms/_button.scss:49, 70-78`); only
   hue-free numbers live at `:root`.
5. **Rings on controls are inset.** An outer ring is cut off by a clipping parent
   and grows a 20px box to 23px.
6. **Keep a 1px transparent border on every control and card.** Forced-colours
   mode (the Windows high-contrast setting) strips `box-shadow` and keeps borders,
   and the stylesheet has no forced-colours rule; a transparent border is drawn by
   the OS there. It also keeps imagefeed's state rules *applying*, which recolour a
   sorbet control's border. It does not keep them visible: the status colours
   they use go pale (§12).
7. **Focus stays an `outline`,** not a shadow: forced-colours keeps it, and it
   does not compete for the shadow slot. It is defined three times today (§9,
   item 6: deferred; this refactor leaves all three and changes only sorbet's
   focus-ring value).
8. **Clipping parents cut off a child's halo:** `.sb-card` (`_card.scss:10`),
   `.sb-table-wrap` (`_table.scss:7`), `.sb-tabs__list` (`_tabs.scss:15`),
   `.sb-carousel__viewport` (`_carousel.scss:28`), `.sb-combobox__panel`
   (`_combobox.scss:117`), `.sb-marquee` (`_marquee.scss:33`). Scrolling parents
   get padding equal to the halo.
9. **Input-group seams.** The group joins neighbours with
   `border-inline-start: none` (`molecules/_input-group.scss:27, 46`). An inset
   ring has no per-side off switch: use per-side inset shadows, or a deliberate
   1px seam.
10. **`color-transition`** (`abstracts/_mixins.scss:111-116`, 7 includes) eases
    colour, background and border colour. Add `box-shadow`, or edges snap.
11. **`control-reset`** (`abstracts/_mixins.scss:73-87`, 23 includes) wipes
    border and background, so the edge is applied after it.
12. **Ring strength has a dead zone.** A translucent ring of a darker tone at 40
    to 55% lands on the fill's own lightness and vanishes (1.8 to 5.4 from the
    fill); 85% is clear (10). A dark tone at low strength over cream turns
    nearly colourless (chroma 0.019).
13. **Shadows become data, per preset** (`emit.ts:34-43`). The dark rim, the halo
    and the edge check all need it. The four WCAG presets keep today's function
    and today's output.

## 8. The work: two pull requests

Decision 12. `main` is protected and every consumer copies whatever `main`
builds, so the look lands whole or not at all: an app synced mid-way must never
pick up a half-finished sorbet.

| | PR 1 — groundwork nobody can see | PR 2 — sorbet's new look |
|---|---|---|
| Branch | `chore/contract-groundwork` | `feat/pastel-legibility` |
| Theme files | all five byte-identical | sorbet's regenerated on purpose; four frozen |
| Shared stylesheet | byte-identical | changed, behind seams |
| Other emitted files | `manifest.json` (the list of themes the build writes) gains one field per preset, its contract. Nothing reads the field yet; imagefeed's `sync-sorbet` copies the file | `manifest.json` changes in sorbet's entry only: its contract (steps 2.2 and 2.6) and its tagline (step 2.2) |
| Contract members | `wcag-aa` only | adds `legibility` |
| Merged | once | once, after every step is done |
| Built so far | steps 1.1 to 1.6, committed on `chore/contract-groundwork` | nothing |

Three rules hold for every step of both:

- **One concern per commit, audited before the next is built on it** (the lab's
  audit-increment lane). A step is a commit or a short run of commits.
- **Each step has a proving check, and the check is shown to fail without the
  change.** A check that has never been red proves nothing.
- **"Golden" means the snapshot from step 1.1.** "Frozen" means ocean, forest,
  noir and midnight; "pinned" means sorbet (§1, "Words used").

### PR 1 — groundwork nobody can see

Whole-PR check: all five goldens unchanged; `dist/css/sorbet.css` byte-identical
to `main`'s; `pnpm build`, `test`, `lint`, `typecheck`, `check:catalog`,
`check:consumable` and `check:cli` green.

**1.1 The golden-file gate** (built)

- *State:* committed locally on `chore/contract-groundwork` (worktree `~/code/sorbet-groundwork`), not pushed, as three commits. Two agents audited it before the commit: 16 findings, 2 of them major, all dealt with. Its two new CI steps have not yet run on GitHub
- *What:* pins every preset's emitted theme CSS before anything changes, and makes a failing check write nothing (§9, item 8). That is the whole promise: it does not cover a later build stage (Sass, TypeScript) failing after `build-tokens` has written, or a write that fails part-way. The gate also does not cover `dist/css/sorbet.css` (risk 7), `manifest.json`, `_generated.scss` or `dist/tokens/*.js`
- *`d223064`:* the colour-vision report printed nothing and exited 0 when the checkout path held a space or a symlink (a path that points at another path; on macOS `/tmp` is one). It now asks `import.meta.main`, Node's own answer to whether this file is the one being run (§9, item 17, found while auditing the gate)
- *`43f6003`:* the CLI scaffold's copy of the build tool, `packages/cli/scaffold/tools/build-tokens.ts`, now checks before it writes
- *`c0e0af3`:* the gate, in `packages/design-system/tools/`. `golden/<preset>.css` holds all five themes, byte-identical to today's output. `check-golden.ts` compares in memory before anything is written; a missing or unreadable golden, a golden with no preset and a comparison over nothing are failures, never skips. `build-tokens.ts` produces everything in memory, runs all four of its checks (contrast, token names, chart colour vision, golden), then writes. Ocean, forest, noir and midnight are frozen and the update tool refuses them; sorbet is pinned. The frozen list is typed, on the `FROZEN_PRESETS` line of `check-golden.ts`, and is not derived from the contract a preset declares (A19). `check-golden-base.ts`, which CI runs on pull requests, holds each frozen golden to the copy on the base branch (the branch the pull request merges into). The goldens are marked `-text` in `.gitattributes`, so a checkout that converts line endings cannot fail them. `manifest.json` is deliberately not pinned: its shape changes in step 1.3
- *Proves it:* `test-golden.ts`, in `pnpm test` and in CI, breaks the gate 32 ways and fails if one stays green. One of them nudges a shared ramp on a copy of the sources: the real build exits 1, names forest and writes nothing
- *Why first:* `pick()` (`semantics.ts:76-83`) returns its last candidate when none qualifies, silently. Ramps are shared (`sand` is sorbet's and forest's neutral; `lemon` is sorbet's and noir's accent; the four status ramps serve all five), and `dist/` is not in git. Until this gate nothing would notice a re-pick

**1.2 One measurement, read by every report and gate** (built)

- *State:* committed locally as `2d3b765` (18 files) on `chore/contract-groundwork`, not pushed. Two agents audited it before the commit: 14 findings, 3 of them major, all repaired. Its new CI step has not yet run on GitHub
- *What:* one measurement, `measureColors` (`src/tokens/rules.ts:165` on the branch), read by the build gate, the report tool, the CLI, the scaffold's report and TokenStudio, so a passing report can never sit beside a failing gate (§9, item 7). The three reports still print separately, because the scaffold's has to stand alone in a generated project; they share the measurement, the counting and the text of a ratio
- *What changed with it:*
  - a pair that cannot be measured is a named failure in every one of them. It used to be skipped, or to crash the tool
  - reports print the count they measured: 70 per mode, 700 in total
  - one colour reader, `parseColor` (`color.ts:187` on the branch). A production build minifies the theme (rewrites it shorter: `#ffffff` to `#fff`, the scrim to `#0009`, `#808080` to `gray`) and TokenStudio reads those strings off the page. The reader was checked against Chromium's own over 2,436 generated spellings, with no misreads
  - the scrim rule's worst case returns 1:1 when the text's brightness lies between the scrim over white and the scrim over black, because some image under it then matches the text exactly
  - a failing ratio is not printed rounded onto its floor
  - zero presets, and a mode that is neither light nor dark, are failures
  - the CLI smoke test (`tools/check-cli.ts:98, 117`, repo root) checks the counts each report prints, where it used to look for the word "holds"
  - the README's "47 contrast pairings" and the playground's "790 checks" are corrected (§9, item 10)
- *Proves it:* `packages/design-system/tools/test-contrast.ts`, 44 checks, in `pnpm test` with its own CI step. It does its own WCAG arithmetic, so a wrong measurement cannot pass because every tool agrees with it. On a copy of the sources with presets broken on purpose, both build tools and all three reports exit 1 and name the same pairs. Each fix was reverted alone and the test shown to fail. The verdict on the five shipped presets did not move: 700 measurements identical before and after, all five goldens untouched
- *Left for step 1.5:* `CLAUDE.md` and two skills still describe `pnpm test` and a failure's `actual` as they were

**1.3 The contract mechanism, and the instruments** (built)

- *State:* committed as `b13bf3b` on `chore/contract-groundwork`. The spec is `contract-mechanism-spec.md` in the evidence folder; its section M10 is the correction made after the audit. Where the bullets below and that spec differ, the spec is what was built
- *As built, differing from the plan below:* a rule carries `tier` and `why`; the kind is looked up from the tier. Check 5 runs in `tools/test-contracts.ts` (122 checks, in `pnpm test`, with its own CI step), not inside `build-tokens`. The instruments are checked against the spec's APCA and separation values and against a Python implementation of the simulation that shares no code with `color.ts`
- *Audit:* tests were written first by a separate author. Two agents then audited the build (`mechanism-audit-hostile.txt`, `mechanism-audit-diff.txt`). The critical finding: a contract whose own floor table said `txet` for `text` measured 28 pairs of 70 and every gate printed its success line. Fixed: a contract is validated whole before it is used. Of 40 defects planted on purpose, the first suite missed 11; tests for each were added. Also now refused: a rule with a mistyped mode, and a floor of exactly 1 (no ratio is below 1, so it could never fail)
- *Left for PR 2's spec:* the reports' success line says "WCAG AA" whatever contract a preset declares; no report says how many rules a contract leaves unheld; placeholder text is held at 3:1 by the `text-subtle` tier, where a strict reading of WCAG 1.4.3 asks 4.5:1 (existing behaviour, not changed here)

- *What:* §5's shape, with one member. No `legibility` member, no shadows as data, no new rule
- *The tiers of `wcag-aa`,* seven, counted per mode from `rules.ts:25-101`: `text` 4.5:1 (42 pairs); `text-subtle` 3:1 (2); `scrim` 4.5:1 on the worst-case composite (2); `control-border` 3:1 (2); `shape` 3:1 (4); `focus` 3:1 (2); `chart` 3:1 in light and 2.25:1 in dark (16). That is 70 per mode. Floors are keyed by tier. The kinds are the four of the status block: text (the first three tiers), shape (`control-border` and `shape`), focus, chart. PR 2 may add tiers and kinds; it may not rename these (A21)
- *Files:* `rules.ts` (each rule gains `kind`, `tier`, `why`); new `src/tokens/contracts.ts` (`wcag-aa`); `presets.ts:14-23` (`contract`, required, per mode — all five `wcag-aa`); `color.ts` (Lc, separation, and the three simulations, moved in from `packages/design-system/tools/check-cvd.ts:29-81` with the tritan matrix added; `check-cvd` imports them and goes on reading two views); `emit.ts:140-152` (the manifest names each preset's contract); `index.ts:10-11`
- *Proves it:* goldens unchanged. Check 5 of §5 (`wcag-aa` resolves to today's 86 entries and nothing else) runs inside `build-tokens`, so CI runs it. It is shown red three ways: add a pair, remove a pair, lower one number. The instruments reproduce reference values: the eight APCA pairs; Ottosson's published OKLab example table; and, for the simulations, the simulated output of three named hexes from an independent implementation, committed as fixtures (comparing a matrix with itself proves nothing). That test is a script in `pnpm test` with its own CI step, as `test-golden.ts` is. `check:cvd` prints the same ten minima as before

**1.4 Two stale-text defects** (§9, items 10 and 11; built: commits `9c7dccf` and `f660211`. The first also brings the README's contract paragraph up to step 1.3)

- *Files:* `README.md:398, 586` (586 is line 570 on `main`: step 1.2 added 16 lines above it); `docs/pastel-primary-role-split.md:3`. Item 10's two counts, `README.md:416` and `App.tsx:151`, were corrected in step 1.2
- *Proves it:* text only. Each corrected statement is checked against the source that owns it (the chart gate's floors table; sorbet's tagline); `check:catalog` green

**1.5 The agent instructions** (built: commit `8c1f387`) — last, so every name they use exists

- *What:* the wording the owner approved (decision 15), verbatim:

  > A preset's declared contract is binding. Never lower a floor, drop a rule,
  > or change which contract a preset declares to get a green build. Those are
  > the owner's decisions and each needs a PR that says so. The theme files of
  > the WCAG presets are frozen: any byte of change in them is a finding.

  "The WCAG presets" means the presets on the frozen list in the repo: ocean,
  forest, noir, midnight. Sorbet's golden is pinned too, but sorbet is not on
  that list; PR 2 regenerates it and says so.

- *Files, authorised:* `CLAUDE.md:68-69`; `.claude/agents/contract-auditor.md:59-62`; `.claude/skills/author-theme/SKILL.md:70-72`; `.claude/skills/debug-contrast/SKILL.md:60-64`
- *Files, a routine consequence the owner can veto (A17):* `CLAUDE.md:34, 40, 84`; `.claude/README.md:58, 72`; `.claude/skills/ship-change/SKILL.md:38`; `.claude/skills/author-theme/SKILL.md:13-18`; `.claude/skills/debug-contrast/SKILL.md:8-9, 17-23`
- *Files, made out of date by steps 1.1 and 1.2, also the owner's to veto (A17):* `CLAUDE.md:85` and `.claude/skills/ship-change/SKILL.md:39` describe `pnpm test` as "check:contrast + check:client"; it now also runs `test:golden` and `test:contrast`. `.claude/skills/debug-contrast/SKILL.md:13-15` describes a failure's `actual` as always a number; it is null for a pair that could not be measured
- *What follows from the wording:* `author-theme` gains "which contract" as step one; `debug-contrast` starts with "which contract does the failing preset declare"; the auditor's contract 10 becomes "a `wcag-aa` rule weakened, a contract switched without that being the PR's stated purpose, or a frozen golden changed"
- *Proves it:* text only — `git diff --stat` lists these files and no code; every name the text uses is found by `grep` in the tree at that commit

**1.6 This document and its evidence** — `docs/pastel-legibility-contract.md` and
`docs/pastel-legibility-evidence/` (listed in the appendix). The decisions
record's header and last paragraph are refreshed in the same commit. The header
still calls the folder temporary and names PR 2's branch; the last paragraph
still lists chart colours and the order of the work as not yet decided, which
its row 17 and this document's A20 decide.

### PR 2 — sorbet's new look

Whole-PR check, at every step: the four frozen goldens unchanged, and check 5
still holds.

**2.0 The specification** — no code

- *What:* §5 rewritten as something a test author can work from. It delivers:
  - the full role-to-value table, light and dark, for all 69 roles;
  - a map from every mark, edge and tell-apart input to the exact optional token or data field the checker reads, and the Sass site that consumes it;
  - the mark-strength status tokens (A5): their values, and the mark-line floor each must clear on a card and on its own wash;
  - the shape of shadows as data (layers; which is "all-round"; inset handling);
  - floors per mode and per element class, each with real margin;
  - the rule for a value the new rules cannot measure. For today's pairs step 1.2 settled it (a named failure, never a skip); still to state is what each see-through input is blended over;
  - the scope of each true-or-false check
- *Proves it:* every item and every checklist line of appendix G is closed in the text, or stated as "left to the eye". Every value not on sheet 1 or 2 is either derived by a stated rule from one that is, or shown to the owner on a third sheet before step 2.1 pins a floor to it. Then a **second spec adversary** attacks it, before any test is written
- *Waits on:* §11, items 1 to 3

**2.1 The `legibility` member, tests first**

- *What:* the lab's write-tests-first lane. The tests are written from the specification by an agent that never sees the implementation; the implementer may not change an expected value
- *Files:* `contracts.ts` (the second member); `rules.ts` (new rules, in tiers `wcag-aa` does not list); `emit.ts:34-43` (shadows as optional per-preset data; the four WCAG presets keep today's function and output)
- *Proves it:* all five presets still declare `wcag-aa`, so every golden is unchanged. The known-bad fixture: sorbet *as shipped* must fail on the dark card edge (fill 6.9, shadow 3.4, border 0), on the light switch (5.3) and on the tick (Lc 26.4). A gate that cannot see September is not worth adding

**2.2 Sorbet light: values from a recipe**

- *What:* the page, four pastels and one anchor ink, built whole (A7); `contract.light` becomes `legibility`. The tagline (`presets.ts:46`) is rewritten here and not in step 2.8: it is printed in the first line of the theme file (`emit.ts:53`) and in `manifest.json`, and sorbet's golden is pinned
- *Files:* `presets.ts:43-60`; sorbet's golden regenerated with the update tool
- *Proves it:* sorbet's golden diff shows its first line (the tagline) and its light block and nothing else; the legibility floors and checks 1 to 3 pass; re-measured on the final palette; looked at on phone and monitor
- *Delivers without touching the stylesheet:* the cream page, the pastel fills, the ink, tinted hairlines where borders exist today, caramel shadows. *Cannot:* line-free cards, the field-against-checkbox split, composed focus layers, the 16px label — steps 2.3 and 2.4

**2.3 Edge tokens and the mixin** — mechanism only

- *Files:* `abstracts/_mixins.scss` (a shared soft-edge mixin; `control-glow` becomes a state layer; `color-transition`); `abstracts/_tokens.scss` (an accessor with fallbacks); first consumer `atoms/_button.scss:49-80`
- *Two tools, both new work* and not a move of the evidence script (A18): (a) a screenshot comparer for the playground under the four frozen presets in both modes, with its baseline taken at the commit before this step; (b) the edge measurer, aimed at playground components instead of the sample sheet's selectors. `playwright` (the library that drives a headless browser) becomes a dev dependency. Both are run by hand at each step from here on; CI does not run them
- *Proves it:* all goldens unchanged. The playground rendered under each of the four frozen presets, in light and dark, is pixel-identical before and after. A lint rule (a check on the source text itself) forbids any partial outside `abstracts/` from writing `box-shadow` on a state selector. It ships with an allowlist (the named exceptions) generated by running the rule on `main`, not typed: today `atoms/_button.scss:84, 89`; `atoms/_fab.scss:32`; `molecules/_card.scss:81`; `molecules/_tabs.scss:89` (and `molecules/_calendar.scss:126` if `[data-…]` selectors count). The allowlist may only shrink

**2.4 Components by layer** — atoms; then molecules; then organisms and templates

- *What:* the `border-strong` split (18 sites); container edges and dividers (the 111 soft-edge candidates of appendix B); `control-surface` (`atoms/_input.scss:5-40`) and its hand copies; input-group; clipping parents; the selected bar; the 16px label as a sorbet-only seam (decision 14; `atoms/_button.scss:26`); re-pointing the 47 `text-subtle` sites (A15)
- *Proves it:* the frozen presets render pixel-identical in both modes; the mark and edge rules pass for sorbet, **and are re-measured from rendered pixels on the real components** (the build's bound can rank a weaker edge higher: 18.5 by the bound, 9.0 rendered); the usage-accessibility diff of §2 lists only the files this step names
- *Every re-routing goes through a seam.* Moving the switch's off-track away from `border-strong` in shared Sass would change ocean, so it reads an optional token whose fallback is `border-strong`

**2.5 Statuses carry an icon and a word**

- *Files:* `molecules/alert.tsx`, `molecules/toast.tsx`, `atoms/badge.tsx`, `atoms/button.tsx` (danger), `molecules/menu.tsx` (danger item), `atoms/icons.tsx` (four silhouettes); sorbet's status values; one optional mark-strength token per status (A5)
- *Proves it:* the icon and word are derived from `tone` inside the component, so a status cannot render without them — the invariant is held by construction, which matters in a repo with no test runner. `check:consumable` still renders its 126 components. The diff is reviewed as an ARIA change. Frozen goldens unchanged: an optional token adds no line to a theme that does not set it
- *Does not:* fix the React Menu ARIA defect in the same file (§9, item 12). It is deferred with the others
- *Waits on:* §11, item 4

**2.6 Sorbet dark**

- *Files:* sorbet's dark values and dark shadow recipes in `presets.ts`; `contract.dark` becomes `legibility`
- *Proves it:* edge presence **and the dark text floors** pass; the known-bad fixture still fails on the old values; sorbet's golden diff shows the dark block only

**2.7 TokenStudio**

- *Files:* `organisms/token-studio.tsx:357-370, 501-519`; `organisms/_token-studio.scss`
- *Where the contract comes from:* TokenStudio takes it from `presets[name].contract` in the tokens package (or the manifest), never from a CSS variable: a variable would add a line to each frozen theme file
- *Proves it:* load each of the five themes in the playground: the badge names that theme's contract; sorbet shows no list of WCAG failures

**2.8 Docs and stale numbers**

- *Files:* `README.md:3-6, 63-66, 388, 414-428, 607, 616-623, 721`; `apps/playground/src/App.tsx:119, 125, 152`; `demo/index.html:77, 79, 83, 366`; `packages/cli/src/index.ts:9, 90, 253`; `packages/cli/src/templates.ts:108, 118`
- *Proves it:* counts are derived from the rule list, not typed; `check:catalog` and `check:cli` green

**After the merge: consumer rollout,** one app at a time (§12).

**Charts have no step** (A3). Sorbet's chart colours as shipped already stand
31.7 or more from the new card (milk) and 30.0 from the new page (cream) in
light, and 44.2 or more from the new dark card and page, at the worst view,
against a draft mark floor of 10.

### Why sorbet's values are built whole (step 2.2)

Lower thresholds do not produce pastel (appendix C), so the values are picked.
Overrides on top of the walked recipe — what noir does for eight names
(`presets.ts:112-133`), and what the survey recommended — are not wrong; they
are the same mechanism with three holes, each of which builds green and looks
wrong:

| Trap | Where | What happens |
|---|---|---|
| An override never re-runs a walk | the merge at `semantics.ts:242` comes after every walk | override `text` lighter and the walked `text-muted` `#5f5a52` can end up *darker* than it: the hierarchy inverts |
| Values copied before the merge do not follow it | `link` is copied from `primary-text` at `semantics.ts:239`; hover and active keep their walked steps | override `primary-text` and links stay the deep `#00686d` |
| `??=` only fills a missing value | `semantics.ts:249-251`; in light with `brandStyle: "pastel"` the builder already wrote `-solid` at line 147 | override `primary` and every checkbox stays `#008289` |

`Preset.colors` is already just a complete record per mode (`presets.ts:22`).
Building it whole means nothing walked can leak, and the shared builder is not
edited at all. Sorbet's dark block keeps coming from `buildMode` until step 2.6.

### Regenerating a golden on purpose

- **Sorbet (pinned):** in PR 2, steps 2.2 (its first line, which prints the tagline, and its light block) and 2.6 (its dark block), with the update tool, by name. The golden's diff is the review artefact
- **Ocean, forest, noir, midnight (frozen):** not in this refactor; in the later PR of A4. The update tool refuses a frozen preset. That pull request takes the theme's name off the `FROZEN_PRESETS` line in `packages/design-system/tools/check-golden.ts`, says so as its stated purpose, and rewrites that golden with the update tool. The base-branch check then prints the theme as "pinned, and changed" for the reviewer instead of failing. The instructions call any changed byte "a finding"; the pull request saying so is the answer to the finding

## 9. Existing defects found in passing

Wrong today, independent of this change. All were re-checked against this
worktree. **Five sit in PR 1's path and are fixed there. Twelve are listed and
deferred to one later PR** (decision 16, A4), which is also where the frozen
goldens are changed on purpose (§8).

### In PR 1's path

**7. Three report loops skip see-through pairs, then print a count they did not measure**

- *Where:* `packages/design-system/tools/check-contrast.ts:27, 39`; `packages/cli/src/index.ts:232, 242`; `packages/cli/scaffold/tools/check-contrast.ts:28, 38`
- *Evidence:* "all 86 pairings pass" when 68 were measured per mode (70 apply; the 2 scrim rules are skipped). The real gate does measure them
- *Status:* **fixed in PR 1,** step 1.2, commit `2d3b765`

**8. A failed gate still writes the theme CSS, in both copies of the build tool**

- *Where:* `packages/design-system/tools/build-tokens.ts` (writes at 20-27, checks at 29-36); `packages/cli/scaffold/tools/build-tokens.ts` (writes at 23-28, checks at 31-38), the hand-kept copy that `sorbet create` puts in every new project
- *Evidence:* `debug-contrast/SKILL.md:8-9` states the opposite order. Anything that copies `dist/` without reading the exit code ships a theme that failed
- *Status:* **fixed in PR 1,** step 1.1: the design-system copy in `c0e0af3`, the scaffold copy in `43f6003`

**10. Stale numbers**

- *Where:* `README.md:416` ("47 contrast pairings"; there are 86 entries, 70 per mode); `README.md:570` ("ΔE ≥ 14.7 across every preset × mode"; the gate's own floors go down to 3.9); `README.md:398` (sorbet as "raspberry, mint, grape"); `apps/playground/src/App.tsx:151` ("790 checks"; 700)
- *Evidence:* counted from the sources
- *Status:* the two counts (`README.md:416`, `App.tsx:151`) are **fixed in PR 1,** step 1.2, commit `2d3b765`: the playground computes its figure and `pnpm test` recounts the README's. The other two are fixed in step 1.4

**11. The role-split note still says "proposed, not implemented"**

- *Where:* `docs/pastel-primary-role-split.md:3`
- *Evidence:* it shipped in #108
- *Status:* fixed in PR 1, step 1.4

**17. New, found while auditing the golden gate: the colour-vision report prints nothing and exits 0 from some paths**

- *Where:* `packages/design-system/tools/check-cvd.ts:119`
- *Evidence:* the file decides whether it is the script being run by comparing `process.argv[1]` with the path part of its own URL. The URL is percent-encoded (a space is written `%20`) and has symlinks resolved; the argument is neither. With a space or a symlink in the checkout path the comparison is false, so the report prints nothing and exits 0, which reads exactly like a pass. The build gate was never affected: it calls `checkCvd()` itself
- *Status:* **fixed in PR 1,** step 1.1, commit `d223064`: it now asks `import.meta.main`

### Deferred to the later PR

Each of these is deferred. A status line is given only where there is more to say.

**1. Unitless `outline-offset`**

- *Where:* `atoms/_color-input.scss:82, 129, 249`
- *Evidence:* `@include focus-ring(2)` and `(1)`. The built CSS holds `outline-offset: 2` twice and `outline-offset: 1` once — invalid, so the base 2px applies by accident

**2. `.sb-divider--strong` does nothing on a labelled divider**

- *Where:* `atoms/_divider.scss:25-27`
- *Evidence:* the `div` flavour sets `border: none` and draws its lines as pseudo-elements with their own colour (lines 9-22)

**3. The loading spinner is hard-wired to `on-primary` on every button variant**

- *Where:* `atoms/_button.scss:241`
- *Evidence:* on outline, ghost and link there is no primary fill behind it

**4. Progress tone bars use the pale fill tokens**

- *Where:* `atoms/_progress.scss:23-27`
- *Evidence:* secondary 1.17:1, accent 1.14:1, warning 1.87:1 against the track; no rule covers them
- *Status:* deferred for the four frozen presets. For sorbet, PR 2 re-points the bar through a seam whose fallback is today's token

**5. The checkbox tick and radio dot are unruled and weak**

- *Where:* `atoms/_choice.scss:27, 48, 53, 70`; `rules.ts:44-46`
- *Evidence:* `on-primary` on `primary-solid` is 3.39:1, Lc 29.2; the rule only checks `on-primary` against `primary`
- *Status:* for sorbet, PR 2 gives the tick a rule

**6. The focus ring is defined three times, and "selected" reuses it**

- *Where:* `abstracts/_mixins.scss:29-32`; `base/_root.scss:42-45`; `atoms/_color-input.scss:263-266`
- *Evidence:* a selected swatch and a focused one look identical

**9. Stale comment: it says `primary` is exempt from pastel**

- *Where:* `semantics.ts:48-57`
- *Evidence:* since #108 the code applies pastel to `primary` (`#adedf3`)

**12. React Menu promises a menu and renders a group of buttons**

- *Where:* `packages/component-library/src/molecules/menu.tsx:79`
- *Evidence:* `aria-haspopup="menu"` on the trigger; no `role="menu"`, no `menuitem`, no `aria-expanded` (the vanilla `behaviors/menu.ts:42` does set it). A usage-accessibility defect

**13. Menu-item keyboard focus is removed and replaced by the hover fill**

- *Where:* `molecules/_menu.scss:36-40`
- *Evidence:* `outline: none`; the fill is 1.16:1 and identical to hover

**14. Hover is invisible on the even rows of a striped table**

- *Where:* `molecules/_table.scss:43-49`
- *Evidence:* `--hover` uses `bg-subtle`, `--striped` uses `surface-sunken`; in light they are the same hex (`semantics.ts:182, 185`)

**15. The date-range control has no disabled style**

- *Where:* `molecules/_date-range.scss:16`
- *Evidence:* only its trigger button has one (line 84)

**16. New, found by the spec adversary: `danger-active` is named and read, and produced by no preset**

- *Where:* named at `semantics.ts:25`; read at `atoms/_button.scss:109`
- *Evidence:* undefined in all ten preset-and-mode records, so a pressed danger button has no background colour of its own. `status()` (`semantics.ts:160-177`) writes the role, `-hover`, `on-`, `-subtle` and `-text` only
- *Status:* the fix adds a line to every frozen theme file

Also deferred to that PR, and not an item because it is §4's subject: the
dark-mode edge fault in ocean, forest, noir and midnight.

Three more are wrong today for this reader and are fixed *by* the feature, for
sorbet: switch on against off (5.3), the invalid border against the resting one
(8.3), and an input's focused border against its resting one (5.3) are all told
apart by hue alone.

## 10. Risks

Ordered by severity. Silent and wide comes first. Each says what breaks and
when, then what guards it.

**1. A silent re-pick of the other four presets.** Any edit to a walk or
candidate list in `semantics.ts`, to the shared curves in `ramps.ts:16-43`, or to
a shared ramp changes other themes with no error, because `pick()` falls back
instead of failing. Noir is what pantry, wallpaper-admin and musicdisco load;
ocean is buylist.
- *Guard:* the golden-file gate, built as PR 1's first step (`c0e0af3`) and permanent. The shared builder is not edited by this plan.

**2. The checker passes on tokens while the stylesheet paints something else.**
Most inputs of the new rules are not tokens (§5). If a rule reads a value the
Sass does not use, the build is green and the screen is wrong: today's toned
progress bars paint fills that measure 3.5 to 9.3 against a floor of 10.
- *Guard:* step 2.0's map from each input to its token and its Sass site; step 2.4 re-measures rendered pixels.

**3. A value the new rules cannot measure is skipped.** On `main` a see-through
or unparseable colour returns "no claim" and the rule is dropped
(`rules.ts:120-126`). Step 1.2 ended that for the pairs the contract holds
today (commit `2d3b765`): a pair that cannot be measured is a failure that
names the pair. What remains is PR 2's. The new look is mostly see-through
values (washes, rims, and halos written with `color-mix()`, the CSS function
that mixes a colour toward transparent), the colour reader refuses
`color-mix()`, and an edge rule is not a pair (§5), so it needs measuring code
of its own. If that code skips what it cannot read, it silently drops exactly
the new rules.
- *Guard:* step 2.0 states the rule for the new kinds before any test exists: unmeasurable is a failure that names its inputs, as it now is for pairs. `test-contrast.ts` holds the pair half.

**4. A "visual only" change removes focus or state.** If `focus-ring` or a
`-solid` value goes pastel, keyboard focus (31 `focus-ring` includes) and checked
or selected states (`primary-solid`, 23 uses) stop being visible. This is the one
route by which a colour change damages usage accessibility.
- *Guard:* the focus, mark and tell-apart rules of §5, once specified.

**5. Apps' own status marks go pale.** On the first sync after the merge.
linecook's finished-timer alarm ring: 43.4 today (39.5 at worst), about 6 as
blush on its own wash (6.8 typical, 5.9 at worst). imagefeed's armed, danger and
done borders: 42 to 55 today, 12 to 15 as a 1px pastel line, and 6.5 for "done"
under protan. Both apps also colour text with the status `-text` tokens, which
become ordinary ink (A13), so the mark is the only cue left. The build gate
cannot see app CSS.
- *Guard:* the mark-strength status tokens (A5) and the app edits on §12's rollout checklist, shipped with the sync.

**6. The edge and the focus glow overwrite each other.** The moment a control
with a shadow edge is focused: `box-shadow` is one property and `control-glow`
writes it (8 includes).
- *Guard:* composed custom properties (§7, mechanic 3), plus the lint rule of step 2.3.

**7. A shared-Sass edit changes the WCAG presets' look.** The golden file covers
theme files, not `dist/css/sorbet.css`. A re-routed token with no fallback
changes ocean, and buylist takes it on its next re-pack.
- *Guard:* every seam has today's value as its fallback; from step 2.3 on, the playground is rendered under all four frozen presets in both modes and compared pixel for pixel, by the screenshot comparer that step builds. It is run by hand at each step; CI does not run it.

**8. The dark-mode fault stays live in three apps.** pantry, wallpaper-admin and
musicdisco load noir and follow the phone's setting; in dark mode a card's border
is still the card's own colour.
- *Guard:* none in this refactor. It is a stated cost (§12); A4's later PR retires it.

**9. The contract is calibrated on an assumed colour-vision type.** The swatch
test points to a partial red-green deficiency, but it is one test, not a
diagnosis. Lilac as primary leans on it: under tritan lilac fades (colourfulness
0.017).
- *Guard:* every floor stays the worst of four views until a formal test says otherwise; the ink does not depend on the type.

**10. An agent lowers a floor to get green.** Likeliest where a floor has almost
no room: revision 1's floors cleared by 0.06 to 0.9.
- *Guard:* decision 15's wording; floors carry `why` and `retire`, printed on failure; step 2.0 sets floors with real margin.

**11. A status stops reading as a status.** Danger shares blush `#f9c3c6` with
the secondary button. The rose rim `#d77784` of decision 13 is seen as a mid
tone with no colour, `#898884`, under the protan simulation. Two places signal
danger by text colour alone today and lose that cue under one ink: the menu's
danger item and TokenStudio's failures list.
- *Guard:* step 2.5's icon and word, derived inside the component.

**12. Button labels get weaker than today.** Lc 71 on lilac against 85.5 today,
and no ink can pass 77.8 there.
- *Guard:* decision 6 (16px semi-bold). Both land in the same merge, so `main` never shows the weaker label at 14px.

**13. A soft edge is removed by its surroundings.** A clipping parent cuts a
child's halo; forced-colours mode (the Windows high-contrast setting) strips
every shadow; a washed-out screen or a warm night filter eats the thin margins
first (butter 5.6 and robin's egg 5.7 from cream).
- *Guard:* inset rings, transparent borders, padding on scrolling parents; E3 is the fallback treatment.

**14. PR 2 is too large to review in one sitting.** The cost of decision 12.
- *Guard:* each step is audited as it lands on the branch, and its commits stay separate in the merge.

**15. The reports disagree mid-conversion.** A green report beside a red gate.
- *Guard:* done in one commit (`2d3b765`, step 1.2): the three reports, both build tools, the CLI smoke test and TokenStudio read one measurement, and `test-contrast.ts` fails if any of them measures for itself again.

**16. Chart colours bypass the colour-vision gate.** If a chart colour is ever
set outside `charts.ts`, `check-cvd` never sees it
(`packages/design-system/tools/check-cvd.ts:93-95`).
Sorbet's chart floors (14.6, 14.9) are regression baselines and fail the moment
its steps move.
- *Guard:* none added here: this refactor sets no chart colour (A3). A build error for that belongs to the chart proposal.

**17. Dark pastels glare.** Full-strength fills (decision 8) are 64 to 71 from
the dark page. Nobody has lived with large pastel areas at night.
- *Guard:* decision 8 carries its own retirement; the softened set is measured and costs each label about 7 Lc.

**18. Disabled looks absent.** Sheet 2's disabled button is the fill at 45% over
the card: butter and robin's egg are then 3.7 and 3.0 from the card, so the faint
ring is all that shows the shape.
- *Guard:* look at it on sheet 2; not assumed.

**19. Rollout mixes changes or ships by accident.** Every `sync-sorbet` copies
whatever `dist/` the main checkout holds. linecook's design-system tarball
predates #120 and #123, so its first re-vendor mixes those with the palette.
- *Guard:* work stays in worktrees; linecook is re-vendored at current `main` first (§12).

**20. The evidence scripts cannot run from the repo as committed.** Three
imports and one folder assumption need changing; the appendix lists them under
"What is committed beside this document". The browser they drive is not a repo
dependency.
- *Guard:* step 2.3 builds the repo's own tools (A18); until then those four edits make the evidence scripts run.

**21. Numbers go stale.** The recipes on sheet 2 are draft tokens, and the
published minimums are a draft method's.
- *Guard:* re-measure on the final palette inside step 2.2; floors are pinned to what the owner approved, not to a published line.

## 11. Open decisions for the owner

**Decided 2026-10-04** (decisions record, rows 20 to 24): 1(a), 2(a), 3(a),
4(a), and for 5 the owner chose (b): "we'll move them later". The options are
kept below as the record of what was offered.

The look, the landing and the instruction change are decided (§1). Five things
were open. The recommendation is first in each and labelled; the others are real
alternatives. Items 1 to 3 hold up step 2.0; item 4 holds up step 2.5; nothing
holds up PR 1.

1. **How each legibility floor gets its number.**
   - (a) **Recommended:** pin each floor to what you approved on the sheets, a
     little under the measurement, separately for light and dark. Your eye sets
     the bar; the gate stops drift.
   - (b) Use the published minimums (Lc 90 for paragraphs). Stricter than your
     own pick: the ink reads 86 on the bare page, so it would have to go darker.
   - (c) One set of floors for both modes. Simplest, and the decided dark text
     fails it (item 2).
2. **Dark-mode secondary and placeholder text.** At the worst view, on a card:
   as decided, muted `#d7c9ae` reads Lc 70 and subtle `#b3a58d` 51; in light the
   same roles read 80 and 72. Today's sorbet dark reads 70 and 38 in those roles.
   - (a) **Recommended:** keep the two shades and give dark its own floors,
     pinned to them. They are what sheet 2 shows: the first matches what you
     read today, the second is well above it.
   - (b) Lighten both until they meet the light floors (76 and 64). Costs
     hierarchy: dark body text is 85 to 91, so secondary text would sit within
     about 10 of it.
   - (c) See them on a dark text sample first. Sheet 2 was approved for its
     edges; nobody was asked about its small text.
3. **The text field's edge.** By the build's method the approved field measures
   11.0 on a card; the card itself measures 14.4.
   - (a) **Recommended:** a floor per kind of element, so the field's is pinned
     to the field. It is what you approved by eye.
   - (b) Firm the field up to the card's figure. One floor for everything, and
     it changes a field you have already seen and passed.
4. **The status icons** (decision 13 made them mandatory; the set is not chosen).
   - (a) **Recommended,** as drawn on sheet 2: four different outlines — a tick
     in a circle, an exclamation mark in a triangle, a cross in an octagon, an i
     in a square. The outline is what survives when the colour does not.
   - (b) The four glyphs with no outline round them. Smaller and quieter; the
     tick, cross and "i" are harder to tell apart at 12px.
5. **Which apps move.** imagefeed and linecook load the sorbet theme and change
   on their next sync.
   - (a) **Recommended:** pantry, wallpaper-admin and musicdisco stay on noir and
     buylist stays on ocean; none of the four changes. The three noir pages keep
     the dark-mode edge fault (§12).
   - (b) Move the three noir pages to the new sorbet theme once it has settled.
     That also ends the dark-mode fault for them without waiting for A4's PR.

Not asked, because already answered: danger and statuses (decision 13), the
label's scope (14), the instruction change (15), the 11 defects (16). Not asked,
because the agent decided and named it: everything in the A table of §1 — chart
colours, paragraph size and the order inside PR 2 (A20) among them. Say so to
overturn any of it.

## 12. Consumers

Nothing outside the sorbet repo changes until someone re-syncs it: every consumer
holds a copy (a "vendored" copy: the files are copied in, not installed from a
registry). The four static pages are at sorbet `5e1bf6b` (2026-09-09).

### The two that change

**imagefeed** (viewer and admin) — sorbet theme; seeded light, dark reachable from the admin

- *Gets sorbet by:* vendored CSS, `~/homelab/imagefeed/sync-sorbet`
- *What changes:* everything. It is the first page outside the repo the new palette lands on
- *Re-sync:* `pnpm build:design-system`, then `sync-sorbet`; bump `CACHE` in `site/sw.js`
- *App edits that must ship with the sync:*
  - `site/index.html:198, 217, 218, 290` — the armed, danger, done and nudge borders are drawn in `--sb-danger` and `--sb-success`. Today 42 to 55 from the card; as pastels 12 to 15, and 6.5 for "done" under protan. Point them at the mark-strength tokens (A5)
  - the same four rules colour their text with `--sb-danger-text` and `--sb-success-text`, which become ordinary ink, so the border in the mark token is the only cue left: confirm that is enough or add the icon
  - `#fav.on` and `.sb-chip.hit` use the accent *fill* as an indicator (`#f3e096` today, 1.32:1 on white; butter `#f5e3a2` after): the same edit
  - `site/admin.html:61-66` — the dark stopgap hard-codes four hexes in the old hue. Delete it

**linecook** — sorbet theme; follows the OS

- *Gets sorbet by:* vendored tarballs (dated 2026-08-30)
- *What changes:* everything, on its next `pack:vendor`
- *Re-sync:* `pnpm pack:vendor --to ~/code/linecook/vendor`, then install, build, kickstart. Re-vendor at current `main` *first*, so #120 and #123 arrive separately from the palette
- *App edits that must ship with the sync:*
  - `src/app.css:196-242` — the finished-timer alarm, written to "survive being ignored for a minute", is an inset ring in `--sb-danger` on a `--sb-danger-subtle` ground: 43.4 today (39.5 at worst), about 6 as blush on its own wash. Point the ring at the mark-strength token
  - `.lc-timer--done .lc-timer__time` (`src/app.css:205-206`) is coloured with `--sb-danger-text`, which becomes ordinary ink, so the ring in the mark token is the only cue left: confirm that is enough or add the icon
  - its 3px card stripes use `--sb-info` and `--sb-warning`: the same edit
- *Watch:* it pairs `on-primary` with `primary-solid` on a done tick (3.39:1 today, unruled). It draws its own bordered cards from tokens, which will sit beside shadow-edged ones

The mark-strength tokens exist only in the sorbet theme, and their fallback is
today's token, so the edit is safe to make before or after the sync.

### The four that do not change — and what that costs

**pantry, wallpaper-admin, musicdisco admin** — noir; follow the OS

- *What changes:* nothing. Noir is frozen and every seam falls back to today
- *Known cost:* **the dark-mode edge fault of §4 stays live in all three.** Whenever the phone is in dark mode, a card's border is the card's own colour (`#333537` on `#333537`) and the card is 1.26:1 from the page. Their coloured status text also reads 3.91:1 under the deutan simulation in light mode (4.58:1 in typical vision)
- *What retires it:* A4's later PR, which fixes the shared dark branch and regenerates the four goldens on purpose (§8) — or moving the three pages to the new sorbet theme (§11, item 5b)
- *Re-sync:* `sync-sorbet`; `pantry-watch` re-renders pantry. For wallpaper-admin read `site/vendor/sorbet/VERSION` after — its script has failed silently before
- *Watch:* on noir light, card and page are the same white: the border is the only card edge. This is why seams fall back to borders. Separate from this work: pantry's stock levels are drawn in three text colours of identical lightness (0.471, 0.469, 0.471) — hue only, for this reader, today

**buylist** — ocean; forced light

- *What changes:* nothing, by design: its readers are not the owner
- *Re-sync:* `pnpm pack:vendor --to ~/code/buylist/web/vendor`, then install and build
- *Watch:* check `apps/admin` (ocean, tables, stats) before any re-pack: it is the in-repo stand-in

**bananasplit** client — all five themes, default sorbet; dormant (replaced by
Actual Budget, kept). Listed so the count is honest.

### Inside the repo

| Surface | Theme | What it is for | Watch |
|---|---|---|---|
| **playground** | all five, switchable, Light / Auto / Dark | the review surface, and from step 2.3 the thing rendered to prove the frozen presets did not move | never switch branches under it; its marketing copy (`App.tsx:119, 125, 152`) becomes false at step 2.2 and is corrected at 2.8 |
| **`apps/admin`**, **`apps/meal-kit`** | ocean; forest | in-repo stand-ins for a real consumer | typecheck is their only gate |
| **`demo/`** | any, from the manifest | reads `dist/`; shows nothing new until a build succeeds | "AA verified" badge at `demo/index.html:77` |
| **CLI scaffold** | the chosen preset | copies `src/tokens`, `src/styles`, `dist` into a new project, so future scaffolds inherit the contract mechanism | `pnpm check:cli` |

Two rules for the rollout. Every `sync-sorbet` copies whatever `dist/` the main
checkout holds, so an experimental build there can be shipped by any routine
sync: this work stays in worktrees until merged. And keep names, change values:
six apps read `--sb-border*`, `--sb-bg` and `--sb-surface*` raw with no fallback,
so a renamed token makes hairlines vanish and sticky bars go transparent with no
error.

## Appendix

### What is committed beside this document

Everything the plan depends on is in `docs/pastel-legibility-evidence/`,
committed with this document on the PR 1 branch (step 1.6). Source entry names in appendices B to D refer
to `workflow-result.json` there.

| File | What it is |
|---|---|
| `DECISIONS.md` | the decisions record, rows 1 to 19 — the authority for §1 |
| `index.html`; `build-sheet.mjs` | sample sheet 1 (text colour) and its builder |
| `edges.html`; `build-edges.mjs` | sample sheet 2 (edges and dark mode) and its builder |
| `colorkit.mjs` | the measuring kit: every number in this document |
| `values.json` | sheet 1's palette, ladders and swatches |
| `edges-values.json` | sheet 2's tokens, shades and Lc figures |
| `edges-measure.json` | sheet 2's rendered-pixel measurements, per element and side, for light, dark on the cocoa page, and dark on the aubergine page |
| `workflow-result.json` | the twelve-agent survey: the edge, WCAG and history maps, the three proposals, the three judges |
| `doc-refute.txt` | the checker's report on revision 1 (17 findings) |
| `spec-adversary.txt`; `spec-adversary.json` | the spec adversary's report on §5 (24 findings, 18 things left unsaid) |
| `edges-measure.mjs`; `make-edges.sh` | the render-and-measure script and its wrapper |
| `sheetcolour.js`; `check-sheetcolour.mjs` | sheet 1's live picker maths, and the check that it agrees with the kit |
| `proposal-second-check.txt` | the second check of this document |
| `audit-golden-gate.txt`; `audit-one-checker.txt` | the audits of steps 1.1 and 1.2 |
| `contract-mechanism-spec.md`; `mechanism-adversary.txt` | step 1.3's spec (M10 is the post-audit correction) and the adversary's report on its first draft |
| `mechanism-audit-hostile.txt`; `mechanism-audit-diff.txt` | the two audits of step 1.3 as built, with the 40-row table of planted defects |

Three cautions about those files as committed:

- Three imports and one folder assumption need changing before the scripts run
  from the repo (§10, risk 20): `colorkit.mjs:16` (an absolute path to
  `color.ts` in the main checkout); `edges-measure.mjs:5` (`../colorkit.mjs`
  should be `./colorkit.mjs`); `make-edges.sh:4` (a session's temporary folder)
  and its `cd pw` step, which expects a folder holding its own Playwright
  install.
- `edges-values.json` was last written with the aubergine dark page
  (`#1c1324`), the alternative. The decided cocoa dark values are in §7 and in
  the "Dark" block of `edges-measure.json`.
- `colorkit.mjs` line 66 decides whether it is being run as a command with the
  same comparison that commit `d223064` removed from `check-cvd.ts`. Run from a
  path that holds a space or a symlink it prints nothing and exits 0. Importing
  it, which is how every measuring script uses it, is not affected.

### A. The ladders on the sample sheet

The two seven-step ladders — cocoa (hue 60°) and aubergine (hue 310°), each step
with its hex, Lc on cream, worst view, Lc on a card and WCAG ratio — are in
`values.json` under `ladders`. The cocoa ladder is the table in §6. What the
plan takes from them:

- Aubergine agrees with cocoa within 1 Lc at every step (A3 `#58366f` reads 86.0
  on cream; C3 `#6b3900` reads 85.3).
- Every step passes the old 4.5:1 down to step 6 (C6 4.57:1, A6 4.65:1; step 7 is
  3.70:1 and 3.75:1). The old rule never required dark text.
- The label ink is fixed at lightness 0.30 in each family (`#472400` for cocoa,
  `#3d1b52` for aubergine), whatever the step.
- Step labels (`C3`, `A4`) are how a pick is recorded. The chosen ink,
  `#693800`, is lightness 0.395: between C2 and C3.

### B. Where the stylesheet draws an edge

Source entries `map:edges-atoms`, `map:edges-molecules`, `map:edges-organisms`:
every `border`, `outline` and `box-shadow` declaration in the stylesheet's 76
Sass partials, classified. The full per-declaration list (file, selector, line,
note) is in those three entries of `workflow-result.json`, committed in the
evidence folder: it is step 2.4's work-list. The molecules entry repeats ten
shared-mixin rows already listed under atoms (four of them candidates); drop
them to get the 262 and 111 below. In the count column the bracket is atoms and
shared files / molecules / organisms and templates.

| What the declaration is for | Count | A soft edge could replace |
|---|---|---|
| The shape of a control (field frame, checkbox box) | 24 (14 / 9 / 1) | 23 |
| The edge of a container (card, table, panel) | 28 (5 / 12 / 11) | 28 |
| A raised surface (shadow) | 12 (5 / 4 / 3) | 12 |
| A dividing line | 26 (5 / 10 / 11) | 20 |
| Decoration | 8 (4 / 3 / 1) | 7 |
| Keyboard focus | 51 (17 / 29 / 5) | 0 |
| A state (checked, selected, invalid, hover, disabled) | 63 (24 / 26 / 13) | 10 |
| A mark with no label (slider, progress, spinner) | 25 (21 / 3 / 1) | 1 |
| Other (resets, accessors, tokens) | 25 (18 / 5 / 2) | 10 |
| **total** | **262** (113 / 101 / 48) | **111** |

Reading it: all 51 focus declarations stay as they are; 53 of the 63 state
declarations and 24 of the 25 unlabelled marks need a lightness cue, not
softening; the 111 soft-edge candidates are almost entirely frames, container
edges, shadows and dividers.

**Loses its boundary entirely if the line is simply deleted** (so it needs the
edge, not just the absence of a border):

- Atoms: input, textarea, select (a white field on a white card is 1.00:1);
  number input; an unchecked checkbox or radio; the outline button (identical to
  ghost without its ring); an unselected chip; dividers; the avatar-group
  knockout ring; `kbd`.
- Molecules: accordion, table wrapper, flat card, inline calendar, dropzone file
  row and zone, combobox field, date-range control, input-group seams, carousel
  arrow, stepper marker and connector, tabs rail, table rows, menu separator,
  the calendar's "today" ring.
- Organisms and templates: command trigger, the sticky navbar's bottom rule, the
  app-shell sidebar, the header and footer rules of drawer and command palette,
  TokenStudio rows, the chart tooltip, chart gridlines and axis.

**Already has no line, and works:** modal and drawer (shadow only), raised card,
soft button (1.06:1), badge (1.08:1), progress track (1.08:1), skeleton, avatar
(1.09:1). So "elements need not separate from the background" is already half
true; the WCAG cost sits in controls, not containers.

**State signals that are hue-only today** — unreliable for this reader whatever
WCAG says, and each must gain a lightness, thickness or shape cue rather than be
softened:

| Signal | Where | Today |
|---|---|---|
| Switch on against off | `atoms/_switch.scss:12, 31` | 1.05:1; separation 5.3 at worst. Only the thumb's position tells them apart |
| Invalid border against the resting border | `atoms/_input.scss:34`; combobox; date-range | 1.10:1; 8.3 |
| A text control's focused border against its resting border | `abstracts/_mixins.scss:101` | 1.05:1; 5.3. The visible part is a 2px halo at 30%, 1.50:1 on white |
| Text selection | `base/_root.scss:36-39` | 1.06:1 against the page; 1.7 |
| Current page in navbar and sidebar | `organisms/_navbar.scss`, `_sidebar.scss` | fill against hover fill 1.01:1 (2.3); text against resting text 1.04:1; no weight change, no bar |
| Highlighted option in the command palette and combobox | `organisms/_command-palette.scss`; `molecules/_combobox.scss` | 1.14:1 — and in the palette it is the only keyboard cursor, because the input sets `outline: none` |
| Menu item keyboard focus | `molecules/_menu.scss:36-40` | the ring is removed; the fill is 1.16:1 and identical to hover |
| Toast tone stripe; alert tone fills | `molecules/_toast.scss`, `_alert.scss` | success, danger and info stripes share one lightness; the four alert fills sit within one point of each other |
| Dropzone hover and drag-over; carousel current dot | `molecules/_dropzone.scss`, `_carousel.scss` | 1.05:1. The dot's width is what actually carries it |
| Pagination current page; calendar selected day and range | `molecules/_pagination.scss`, `_calendar.scss` | fills at 1.30:1 and 1.14:1; the page number has no weight change |

**State signals that must stay visible through the change:** focus (the one place
a firm line is the right answer); checked, with a tick that reads on its fill;
disabled (opacity 0.55 — re-measure on pastels); marks with no label (slider,
progress, spinner, rating, select caret, close glyphs); link underlines; the
required asterisk; text over images (the scrim); the tooltip, whose background is
the text colour and so moves with the ink; the modal backdrop; chart crosshair,
legend and table view.

**The shared levers** — where one edit reaches many components:

| Lever | Where | Uses | Note |
|---|---|---|---|
| `border` | `semantics.ts:200, 216` | 18 | `#e3dfd9`; in dark equal to `surface-raised` |
| `border-subtle` | `semantics.ts:201, 217` | 25 | `#f1eeeb`; in dark equal to `surface` — the root of §4 |
| `border-strong` | `semantics.ts:202, 218` | 18 | `#777168`; three jobs (§7) |
| `primary-solid`, `secondary-solid`, `accent-solid` | `semantics.ts:147, 249-251` | 23, and 1 for the other two | the other two are only ever the button edge |
| `focus-ring`, 3px wide | `semantics.ts:235-238`; `scales.ts:113` | 3 definitions | — |
| `shadow-xs` to `-xl` | `emit.ts:34-43` | about 20 | one tint per preset; black in dark; every level is a downward drop — none has an all-round layer, which replacing a border needs |
| `border-width` 1px, `-thick` 2px | `scales.ts:114-115` | 41, 6 | setting the width to 0 is a blunt instrument: it shifts layout and removes the border focus recolours |
| mixin `focus-ring`, `focus-ring-style` | `abstracts/_mixins.scss:29-42` | 31 and 3 | — |
| mixin `control-glow` | `abstracts/_mixins.scss:100-103` | 8 | focus and invalid chrome of every text-shaped control |
| mixin `popover-surface` | `abstracts/_mixins.scss:176-186` | 5 | popover, colour picker, menu, combobox list, calendar; toast and the chart tooltip copy it by hand |
| mixin `elevate` | `abstracts/_mixins.scss:90-93` | 1 | the natural home for a raised surface, but only the segmented control uses it; card, modal, drawer and toast hand-write the same pair |
| mixin `control-reset` | `abstracts/_mixins.scss:73-87` | 23 | owns disabled opacity 0.55; wipes border and background |
| mixin `color-transition` | `abstracts/_mixins.scss:111-116` | 7 | does not ease `box-shadow` |
| local mixin `control-surface` | `atoms/_input.scss:5-40` | input, textarea, select | number input, combobox and date-range duplicate it by hand |
| the button's knobs | `atoms/_button.scss:6-11, 49, 70-78` | 1 | the existing soft edge, private to the button |
| not centralised at all | — | — | the container border is hand-written in accordion, card, dropzone, table wrap and toast; organisms and templates hold 13 one-pixel rules, 10 of them the same declaration; raw widths of 1.5px, 2px, 2.5px and 3px |

### C. Where WCAG is encoded

Source entry `map:wcag-gate`. WCAG lives in three layers, and none of them knows
which preset it is judging.

| Layer | File and lines | What it encodes | What changes |
|---|---|---|---|
| The contract | `src/tokens/rules.ts:25-101` | one list for every preset: 86 entries; a rule is a pair and a number, with no reason and no kind | stays as the WCAG list; gains `kind`, `tier`, `why` (PR 1) |
| The checker | `rules.ts:112-139` | `checkColors` receives a preset *name* and always loops the global list | reads the one shared measurement, `measureColors` (PR 1, built: `2d3b765`) |
| The chooser | `semantics.ts:76-83, 109-118` | `pick()` and `solid()`, with 4.5 and 3 typed in at 15 call sites | untouched |
| The walks | `semantics.ts:124-158, 160-177, 179-219, 234-240` | brand, status, surfaces and text, focus and links | untouched |
| The override merge | `semantics.ts:242-251` | overrides spread last; then `-solid ??= fill` | untouched |
| Presets | `presets.ts:14-23, 43-60, 112-133` | no contract field; sorbet's recipe; noir's eight overrides | `contract` added (PR 1); sorbet supplies picked values (PR 2) |
| The instrument | `color.ts:89-105, 126-134, 146-160` | WCAG luminance and ratio; `compositeOver`; `worstCaseContrast` | one colour reader, `parseColor` (PR 1, built: `2d3b765`); gains Lc, separation and the three simulations (PR 1, step 1.3) |
| Ramps | `ramps.ts:15-43, 69-93` | the shared lightness and chroma curves; ramps shared across presets | untouched |
| Charts | `charts.ts:11-13, 39-53` | steps chosen to hold 3:1 | untouched (A3) |
| Emitters | `emit.ts:34-43, 140-152` | shadows as strings; manifest fields listed by hand | `contract` in the manifest (PR 1); shadows as data (PR 2) |
| Exports | `index.ts:10-11` | `RULES`, `checkPreset`, `checkColors`, `Failure`, imported by the CLI, both tools, the scaffold and TokenStudio | names kept; new ones added |
| The build gate | `packages/design-system/tools/build-tokens.ts:20-37, 74-86` | writes the themes, then checks | golden comparison; checks before it writes (PR 1, built: `c0e0af3`) |
| The reports | `packages/design-system/tools/check-contrast.ts`; `packages/cli/src/index.ts:218-254`; `packages/cli/scaffold/tools/check-contrast.ts` | three hand-copied loops | read the shared measurement and print the count it measured (PR 1, built: `2d3b765`) |
| The colour-vision gate | `packages/design-system/tools/check-cvd.ts:29-50, 91-117` | protan and deutan only; a per-preset floors table — the repo's existing precedent for a per-preset gate | its simulation code moves into `src/tokens`, where the tritan matrix is added; the gate itself keeps its two views and its floors (A3) |
| The live gate | `packages/component-library/src/organisms/token-studio.tsx:357-370, 501-519` | always the global list; its `preset` prop is a label | takes the contract from `presets[name].contract` in the tokens package (or the manifest), never from a CSS variable, which would add a line to each frozen theme file (PR 2, step 2.7) |
| The CLI smoke test | `tools/check-cli.ts:74-77` (repo root, not the design-system package) | passes if the output contains "holds" | checks the counts each report prints against the measurement (PR 1, built: `2d3b765`) |
| CI | `.github/workflows/build.yml:132, 138, 145` | the gate runs inside `pnpm run build`, plus `check:consumable` and `check:cli`. `pnpm test` is not run in CI | PR 1 adds three steps: the base-branch check of the frozen goldens on pull requests and the test that the golden gate still bites (`c0e0af3`), and the test that the contract is measured once (`2d3b765`). None has run on GitHub yet |
| Agent instructions | `CLAUDE.md:68-69`; `.claude/agents/contract-auditor.md:59-62`; `author-theme`; `debug-contrast` | "never lower a min" | PR 1, step 1.5 |
| Copy | `README.md`; `apps/playground/src/App.tsx`; `demo/index.html`; CLI strings; `packages/cli/src/templates.ts` | "WCAG AA — enforced at build time", "Provably accessible" | PR 2, step 2.8 |

Not contract sites, listed so they are not mistaken for one:
`atoms/color-input.tsx:3, 139` uses `contrast()` to choose a white or black thumb
ring; the marquee's pause control cites WCAG 2.2.2 and is usage accessibility,
which is kept.

**Thresholds alone do not produce pastel.** Each line is one walk, and what it
returns if its floor were 4.5, 3, 2 or 1.5, re-run against this worktree; bold
is today's actual pick.

- `text-muted`: at 4.5, **sand-700** `#5f5a52`; at 3, 2 and 1.5, sand-600
- `border-strong`: at 4.5, sand-600; at 3, **sand-600** `#777168`; at 2 and 1.5, sand-500 `#999389`
- `primary-solid`: at 4.5, aqua-700; at 3, **aqua-600** `#008289`; at 2 and 1.5, aqua-600
- `primary-text`: at 4.5, **aqua-700** `#00686d`; at 3, 2 and 1.5, aqua-600
- `focus-ring`: at 4.5, aqua-700; at 3, **aqua-600** `#008289`; at 2 and 1.5, aqua-500 `#00a8b1`

The candidate lists themselves (`[600, 700, 800]`, `[500, 600]`) were written for
WCAG, so the lightest thing a walk can return is still a deep mid-tone.

### D. The three proposals and the three judges

Source entries `propose:*` and `judge:*`. Three proposals were written
independently from three starting points; three judges re-measured every claim
(152 of 152 ladder steps reproduced; 197 edge placements rendered) and scored
them, out of 10, through three lenses.

| | A · colour science first | B · fidelity to the five names | C · edges first | On the sheet |
|---|---|---|---|---|
| Cream | `#fef5e0` | `#fef4dc` | `#fcf1d9` | `#fef4dc` |
| Surface | `#fffbf1` | `#fffbf1` | `#fffbf2` | `#fffbf1` |
| Blush | `#fbbfc3` | `#fbcbcd` | `#fec5cc` | `#f9c3c6` |
| Robin's egg | `#bee9ee` | `#98e3dd` | `#a5e8f2` | `#a6edee` |
| Lilac | `#d9c7fc` | `#dbc6fa` | `#dac5fc` | `#dac5fc` |
| Butter | `#efdea1` | `#f9e49f` | `#f6e39e` | `#f5e3a2` |
| Worst pair of fills | 5.9 | 3.2 | 4.1 | 5.4 |
| Its ink | cocoa `#694323` | plum `#643d60` | aubergine `#5c3e71` | cocoa `#693800` (the owner's choice) |
| Roles | lilac, blush, butter; robin's egg for success | the same | the same | the same |
| Score: can this reader read it | 7.5 | 6.5 | 7 | — |
| Score: is it what was asked for | 6.5 | 7.5 | 7 | — |
| Score: does it survive the library | 7 | 6 | 7.5 | — |

What each got right: A, the two lightness tiers (the only palette with no pair
under 5.9) and the type-independent ink; B, the hexes closest to what the five
names mean, and the softest light edges; C, the only complete edge system and the
only dark mode that fixes the named problem.

Claims the judges refuted, kept because each was plausible:

- "Blush and robin's egg cannot be tuned apart inside pastel" (B). They can: put
  robin's egg at least 0.034 lighter than blush.
- "Plum ink stays a colour for a red-green reader" (B). It is 3.2 from grey under
  deutan; the sheet's plum is 2.8. The owner's own swatch test agrees: plum and
  plain grey are "very close".
- "Labels on fills clear the 60 needed for labels" (all three). The numbers are
  right; the published 60 is for 16px bold and up, and sorbet's button label is
  14px semi-bold.
- "Lightness 0.50 is the paragraph floor" (A, B). Its worst view is 73 to 74, and
  the published 75 is for 18px, or 16px medium.
- "The dark focus ring is the pastel itself" (B, C). Then it is the lilac fill's
  own hex: 0 from a primary button. One mid tone, `#8e6ac7`, works in both modes.
- "The button has no ringless version" (C). A zero-offset 4px glow renders at
  11.0 / 15.4 / 20.6 on butter. Drop shadows alone fail; a glow does not.
- C's 2px danger ring `#b14e61`. It is 4.92:1, as strong as today's
  `border-strong`, and under protan it is seen as `#626261`: a dark grey outline.
- "Each fill is edged in a deeper tone of itself" (A). At 26% over cream the
  lilac ring lands near-neutral (chroma 0.019).
- Robin's egg as the selected wash (C). It is 6.0 from cream under protan; lilac
  is 11.1.
- A's dark card, "7.5 from the page". Rendered: 6.7 top, 4.0 bottom — the dark
  pool cancels the rim at the bottom. Hence the 18% floor on the rim.
- Not flagged by anyone: the primary button label gets weaker than today (§6).

A second, independent review of sheet 1 (five reviewers, the same evening)
reproduced every number and corrected four statements that had come through the
judges. They are corrected throughout this document: the published Lc minimums
are tied to type size and weight (the 60 line is not for "labels and buttons" in
general); there is no source for those minimums "running cautious"; lilac is not
furthest from cream in *every* simulation (not under tritan); and cocoa is not
the *only* ink that stays coloured in all three simulations (ink blue does too).

### E. The recipes, as strings

Draft values from the sheets, not final tokens. `<halo> N%`, `<deep> N%` and
`<shade> N%` mean that tone of the fill at N% strength (written
`color-mix(in srgb, <that tone> N%, transparent)` in CSS); the three tones per
fill are in §6.

How to read one: a `box-shadow` layer is four lengths and a colour — how far
right, how far down, how much blur, how much it grows past the element (the
"spread") — and `inset` draws it inside the element instead of outside. Layers
are separated by commas. `rgb(161 110 50 / .38)` is the caramel `#a16e32` at
38% strength; `rgb(129 91 31 / …)` is the field tone `#815b1f`.

**Sheet 1, the three treatments** (`build-sheet.mjs`):

**E1**

- Card: `0 0 0 1px rgb(161 110 50 / .26), 0 1px 2px rgb(161 110 50 / .18)`
- Filled button, chip: `0 0 0 1px <halo> 55%, 0 1px 2px <halo> 45%`
- Text field: `inset 0 0 0 1px rgb(129 91 31 / .24), inset 0 2px 3px rgb(129 91 31 / .14)`

**E2** (decided)

- Card: `0 0 6px 1px rgb(161 110 50 / .38), 0 2px 4px rgb(161 110 50 / .18), 0 10px 28px -8px rgb(161 110 50 / .26)`
- Filled button, chip: `0 0 4px 1px <halo> 70%, 0 1px 2px <halo> 60%, 0 4px 10px -2px <deep> 26%`
- Text field: E1's, plus `0 1px 0 rgb(255 255 255 / .9)`

**E3**

- Card: `0 0 0 1px rgb(161 110 50 / .45), 0 2px 6px -2px rgb(161 110 50 / .26)`
- Filled button, chip: `0 0 0 1px <shade> 85%`
- Text field: `inset 0 0 0 1px rgb(129 91 31 / .45)`

The same in all three: checkbox `inset 0 0 0 1.5px #b096d7`, lilac fill when
checked; switch off-track the well `#f7ecd1` with the same ring, on-track
`#b096d7`; focus `outline: 3px solid #8e6ac7; outline-offset: 2px`; list dividers
`#e3d2b0`.

**Sheet 2, E2 across states** (`build-edges.mjs`). Every element is written as
`box-shadow: var(--state), var(--rest)`: its state is a layer added on top of its
edge. One heading per element; "Dark" is the rim, the decided treatment.

**Card**

- Light: E2's card recipe, and `border: 1px solid transparent`
- Dark: `inset 0 1px 0 rgb(R / .22), 0 0 0 1px rgb(R / .18), 0 10px 28px -6px rgb(5 2 10 / .7)`

**Floating menu**

- Light: `0 0 10px 2px rgb(161 110 50 / .44), 0 4px 8px rgb(161 110 50 / .20), 0 18px 44px -10px rgb(161 110 50 / .36)`
- Dark: `inset 0 1px 0 rgb(R / .28), 0 0 0 1px rgb(R / .28), 0 18px 44px -10px rgb(5 2 10 / .8)`

**Text field**

- Light: E2's field recipe; fill is the card's
- Dark: `inset 0 1px 3px rgb(5 2 10 / .7), inset 0 0 0 1px rgb(R / .34), 0 1px 0 rgb(R / .12)`; fill is the well

**Sunken panel, track**

- Light: `inset 0 1px 3px rgb(161 110 50 / .30), inset 0 0 0 1px rgb(161 110 50 / .12)`
- Dark: `inset 0 1px 3px rgb(5 2 10 / .7), inset 0 0 0 1px rgb(R / .14)`

**Filled button, rest**

- Light: E2's button recipe
- Dark: `inset 0 1px 0 rgb(255 255 255 / .5), 0 0 0 1px rgb(F / .35), 0 0 14px -2px rgb(F / .35)`

**Filled button, hover**

- Light: `0 0 6px 2px <halo> 75%, 0 2px 4px <halo> 60%, 0 9px 18px -3px <deep> 32%`, lifted 1px
- Dark: `inset 0 1px 0 rgb(255 255 255 / .5), 0 0 0 1px rgb(F / .45), 0 0 20px -1px rgb(F / .5)`, lifted 1px

**Filled button, pressed**

- Light: `0 0 2px 1px <halo> 80%, inset 0 1px 3px <deep> 38%`
- Dark: `inset 0 2px 4px <deep> 55%, 0 0 6px -2px rgb(F / .3)`

**"Quiet" button**

- Light: card fill; `0 0 4px 1px rgb(161 110 50 / .42), 0 1px 2px rgb(161 110 50 / .30), 0 4px 10px -2px rgb(161 110 50 / .24)`
- Dark: raised fill; `inset 0 1px 0 rgb(R / .22), 0 0 0 1px rgb(R / .22)`

**Disabled button**

- Light: the fill at 45% over the card; subtle ink; `inset 0 0 0 1px <deep> 22%`
- Dark: the same, muted ink

**Delete; invalid field**

- Light: state layer `inset 0 0 0 2px #d77784`
- Dark: the same

**Selected tab; selected row**

- Light: the lilac at 50% over the card; `inset 0 -3px 0 #b096d7` (tab) or `inset 3px 0 0 #b096d7` (row); weight 600
- Dark: the same, lilac at 20%

**Status box**

- Light: the status pastel at 50% over the card; `0 0 5px 1px <halo> 60%, 0 1px 2px <halo> 50%`
- Dark: the pastel at 20%; `0 0 0 1px rgb(F / .34)`

`R` is the rim colour: the cream `254 244 220` on the cocoa page (decided);
`239 230 255` on the aubergine alternative. `F` is the fill's own colour. The
"glow" variant the owner passed over replaced the 1px rim with
`0 0 7px 1px rgb(R / .22)` (card) and `0 0 12px 2px rgb(R / .30)` (menu).

### F. How the numbers were made

So they can be reproduced. The instrument is `colorkit.mjs` (about 100 lines),
committed in the evidence folder; step 1.3 moves the same maths into
`src/tokens`.

| Quantity | Method |
|---|---|
| Contrast ratio; OKLCH to hex | imported from `packages/design-system/src/tokens/color.ts`, so there is one definition |
| Lc | APCA as published in `apca-w3` 0.1.9 (the 0.0.98G-4g constants), checked against eight published reference pairs |
| Separation | Euclidean distance in OKLab (Ottosson), times 100 — the formula already at `packages/design-system/tools/check-cvd.ts:61-81` |
| The simulations | Machado, Oliveira and Fernandes 2009, severity 1.0, applied in linear RGB (the screen's values with the display curve removed, so they add the way light does), each channel then clamped to the 0-to-1 range. The protan and deutan matrices are the ones at `packages/design-system/tools/check-cvd.ts:30-41`; tritan was added |
| Worst view | the lowest of typical vision and the three simulations, with both colours of the pair simulated |
| Edge, by the §5 method | the edge colour at its strength, straight-alpha composited over the backdrop, then separation from the backdrop. An upper bound: blur only weakens it |
| Edge, rendered (sheet 2, and the judges before it) | the page is rendered in headless Chromium at 2x (Playwright, driven by `edges-measure.mjs` in the evidence folder; the browser is not a repo dependency until step 2.3), and the pixels crossing each element's top, side and bottom edge are sampled. An edge's strength on a side is the biggest step met crossing it — any pixel of the edge band against what the element sits on, or against the element's own fill — and never less than the plain fill step. The weakest side is reported |
| Independent check | sheet 1's numbers were recomputed by a separate implementation: every number reproduced, the live picker agreed at all 10,324 slider positions, and the simulation matrices matched the paper |
| "Hard to tell apart" at 5, "clearly different" at 10 | the instrument's own convention for patches of colour. Not a standard |

### G. Open defects against section 5

From the spec adversary's report on revision 1 (`spec-adversary.txt`): 6
critical, 13 major, 5 minor. "Against" quotes revision 1. Figures are the
adversary's, re-run with the kit for this revision; where a re-run differs the
re-run is given. Each item ends with its state: **corrected** means the wrong
statement is fixed in this revision; **open** means PR 2's specification step
(2.0) must close it.

**G1, critical. Checks 1 and 4 cannot both pass**

- *Against:* "Every semantic colour name is emitted, in both modes" and "The four WCAG theme files equal their snapshots, byte for byte"
- *Defect:* `danger-active` is named (`semantics.ts:25`), read (`_button.scss:109`) and produced by nothing; fixing it adds a line to every frozen file. The defect itself is §9, item 16
- *Measured:* undefined in all 10 preset-and-mode records
- *State:* **open:** the scope of check 1

**G2, critical. The tier table cannot re-express today's rules**

- *Against:* "One pair list … a new pair joins both" and "exactly today's 86 entries"
- *Defect:* the `subtle` tier mixes 3:1 and 4.5:1 pairs; chart is 3 light and 2.25 dark but a tier had one number; new pairs would join `wcag-aa`
- *Measured:* `text-subtle` on `bg-subtle`: 2.63 ocean light, 2.65 noir light. `focus-ring` on `primary`: 1.00 in five of the ten records
- *State:* **corrected** in §5's shape, and the seven tiers of `wcag-aa` are named in step 1.3. **Open:** the legibility member's additional tiers and kinds

**G3, critical. The decided dark shades fail the one set of floors**

- *Against:* Secondary floor 76 and subtle floor 64, against §7's dark text shades
- *Defect:* nothing says whether dark gets its own floors or new shades
- *Measured:* dark muted 72.4 / 70.3 / 66.8 on page / card / raised; dark subtle 52.7 / 50.6 / 47.0; dark body passes (85.2 on raised)
- *State:* **open** (§11, item 2)

**G4, critical. Two edge numbers per mode, and the decided recipes fail the larger**

- *Against:* "light: **14**. Never under 5" and "dark: **16**. Never under 10"
- *Defect:* no statement of which number the build enforces; the decided recipes fail the larger on four listed pairs
- *Measured:* field 11.03 on a card, 10.53 on the page; card on the lilac / blush / butter wash 13.25 / 12.83 / 13.85; card on cream 14.40; dark card 16.06
- *State:* floors **withdrawn** in §5. **Open:** one floor per element class and mode, with margin (§11, item 3)

**G5, critical. Most inputs of the new rules are neither roles nor tokens**

- *Against:* "Rules name roles, never hues" and "No new role is needed"
- *Defect:* control ring, selected bar, its wash, off-track, track, invalid edge, resting field edge, status bars. A pair of `fg` and `bg` cannot carry an edge rule. The checker would pass on tokens while the Sass paints others
- *Measured:* toned progress bars paint the pale fills: 3.54, 4.96, 8.01, 9.27 against the well (floor 10); the sheets' 15.6 uses a shade that has no token
- *State:* "no new role" **withdrawn** in §6. **Open:** the input-to-token-to-Sass map

**G6, critical. No rule says whether a value that cannot be measured is a failure**

- *Against:* the whole section is silent; on `main`, `rules.ts:120-126`: "Null = unmeasurable … no claim is made"
- *Defect:* the new look is mostly see-through values, so skipping drops exactly the new rules
- *Measured:* on `main`: a see-through or missing `fg` is skipped; a missing `bg` throws; `compositeOver` returns an unparseable string unchanged (`color.ts:128-130`)
- *State:* **closed for today's pairs** by PR 1's step 1.2 (`2d3b765`): each of those three is now a failure that names the pair. **Open:** the same rule for the legibility member's new kinds, and what a see-through input is blended over before it is measured

**G7, major. The document's own wash fails the secondary floor**

- *Against:* Secondary tier: "each `-text` role on `bg`, `surface` and its own `-subtle`" at 76, against "the ink reads 77 to 83" on the wash
- *Defect:* it fails at the worst view; the `-text` and `-subtle` values are not decided
- *Measured:* ink on the lilac wash `#ede0f7`: 76.48 typical, 75.33 deutan; blush wash 76.17; link `#654199` on the lilac wash 69.8
- *State:* figures **corrected** in §5 and §6. **Open:** the values, and whether that pair gets its own tier

**G8, major. No rule reads the tick, and the switch fails only in light**

- *Against:* "sorbet as shipped must fail … on the dark card edge (6.9), the switch (5.3) and the tick (Lc 26 at worst)"
- *Defect:* "focused border against resting border" has no pair either
- *Measured:* tick 26.35; `on-primary` on `primary` 83.22 (passes 70); switch 5.28 light, 11.39 dark
- *State:* stated in §5. **Open:** the pairs, and the mode of each known-bad

**G9, major. Check 3 has no map and no scope**

- *Against:* Check 3: "No edge colour equals the fill it outlines"
- *Defect:* no map of which edge outlines which fill. Plainly read it fails every preset, the frozen four included; for the new look it can never fire
- *Measured:* all five presets: in light `border-subtle` = `bg-subtle` = `surface-sunken`; in dark `border` = `surface-raised` and `border-subtle` = `surface` = `bg-subtle`
- *State:* **open**

**G10, major. Check 2 is false in dark for the decided values**

- *Against:* Check 2: "…reversed in dark", against "the label ink [is] the same hexes in both modes"
- *Defect:* "label ink" is seven `on-*` tokens; "darker" has no measure; no scope
- *Measured:* label ink lightness 0.30 against dark text 0.93. The WCAG presets' `on-primary` is `#ffffff` in light
- *State:* **open**

**G11, major. The edge rule bounds only distance**

- *Against:* "Separation has no direction, so a rim lighter than a dark page passes and a shadow darker than it cannot" and "Every edge colour is a darker version of what it edges, never grey or black"
- *Defect:* nothing stops a colourless or black outline, nothing enforces direction, nothing bounds harshness
- *Measured:* light, on cream: black at 25% 18.4; solid `#777168` 41.4. Dark: solid black 19.7 on the page, 26.6 on a card; black at 70% 7.3 / 11.5
- *State:* the first sentence **corrected** in §5. **Open:** a hue or colourfulness rule for edges, or a statement that it is left to the eye

**G12, major. The label tier's words name 21 pairs; today holds 14**

- *Against:* Label tier: "each `on-*` on its fill, its hover and its active", under the heading "the same pairs `RULES` holds today"
- *Defect:* three members do not exist, one by name only, three exist unruled. `-text` on `surface` adds 6; subtle adds 2, not 1
- *Measured:* `rules.ts:74-86`; `semantics.ts:23-26`
- *State:* counts **corrected** in §5. **Open:** the literal pair list per tier, each marked today or new

**G13, major. "The four fills" are hues, not roles**

- *Against:* Palette: "every pair among the four fills"
- *Defect:* by role there are seven fills and three share a hex, so the rule fails at 0; a second legibility preset cannot know which four
- *Measured:* the six real pairs: worst 5.38 (blush / robin's egg, deutan), next 5.64
- *State:* **open**

**G14, major. The selected bar's pass depends on what its wash sits on**

- *Against:* Mark, line: "the selected bar against its wash", floor 20; ring `#b096d7`
- *Defect:* the wash's backdrop is unstated. The ring hex disagreed with the record, which has since been corrected (A12)
- *Measured:* bar against the wash on a card 20.63; on the page 19.70
- *State:* ring hex **settled**. **Open:** the wash's backdrop per pair

**G15, major. Raised elements with no pair**

- *Against:* "for every raised element, on everything it is allowed to sit on", against four pair groups
- *Defect:* buttons, chips, the quiet button, the status box, the sunken panel and the disabled fill have no pair; the two placement conventions (A14) have no check
- *Measured:* butter against cream 5.63; robin's egg against cream 5.72; sunken panel on a card: fill 4.47, edge 4.72
- *State:* **open**

**G16, major. The focus rule's backgrounds are not all listed**

- *Against:* Focus: "`focus-ring` against `bg`, `surface`, `surface-raised` and every brand fill, in both modes"
- *Defect:* "brand fill" is three roles; the sheets measured four. Success, hover and active fills, the well and `bg-subtle` are unlisted. Mode is stated for Focus only
- *Measured:* robin's egg 32.01; the well 35.21 light, 44.29 dark — listing them costs nothing
- *State:* **open**

**G17, major. The all-round layer and the inset blend are undefined**

- *Against:* "blend the edge's all-round layer over the backdrop" and the formula
- *Defect:* which layer is all-round; which shadow belongs to which pair; that an inset edge blends over its own fill. The known-bad fixture has no all-round layer. Whether edge floors are worst-view is unsaid
- *Measured:* dark field ring at 34%: 19.4 by one reading, 26.0 by the other. Card on cream: 14.76 typical, 14.40 tritan
- *State:* **open:** the shadow data shape

**G18, major. Lc is signed, and the floors are positive numbers**

- *Against:* Text tiers: "Lc, worst view", with floors as positive numbers
- *Defect:* Lc is not symmetric; light text on dark is negative, so "at least the floor" fails every dark pair
- *Measured:* cream text on the dark page −91.87; ink on cream 85.84, cream "on" ink −89.44
- *State:* noted in §1. **Open:** state that floors compare size, text first

**G19, major. The auth template does not paint the `-subtle` washes**

- *Against:* Edge pairs: "`surface` on each brand `-subtle` wash (the auth template paints washes behind a card)"
- *Defect:* it paints gradients of the wash mixed toward transparent, so the rule measures a backdrop never on screen
- *Measured:* `templates/_auth.scss:19-21`
- *State:* **corrected** in §5. **Open:** keep it as a worst case, or drop the pair

**G20, minor. The label floor holds only at 16px semi-bold, and three rules have no check**

- *Against:* Label tier: "Moves when: … the label type changes again"; "hover and pressed … never darken the fill"
- *Defect:* the floor of 70 depends on a Sass value the checker cannot read. The three unchecked rules: never darken a fill; 12px text on cream or milk only; no paragraph on a full fill
- *Measured:* ink on full lilac 62.47, on blush 63.92; `_button.scss:25-26`
- *State:* **open:** unchecked conventions, or data on the contract

**G21, minor. The status line and "fourteen increments" were stale**

- *Against:* Status line: "Seven items … are open"; "Fourteen increments. Each is one PR"
- *Defect:* the decisions record had moved past the document
- *Measured:* `DECISIONS.md`, rows 12 to 17
- *State:* **corrected** throughout

**G22, minor. The scrim rule's views, and the clamp, were unstated**

- *Against:* Scrim: "the same rule, unchanged", with four views on the contract
- *Defect:* unsaid whether a ratio rule is measured in one view or four, and that the simulation clamps out-of-range channels
- *Measured:* `on-scrim-muted` 4.968 typical, 4.949 protan
- *State:* clamp stated in appendix F. **Open:** the views

**G23, minor. The check-cvd quote was cited at the wrong lines**

- *Against:* "`tools/check-cvd.ts:44-50` ("regression baselines, not aspirations")"
- *Defect:* the phrase is in the comment at lines 15-18; 44-50 is the floors table
- *Measured:* read of the file
- *State:* **corrected**

**G24, minor. The field edge is a different colour from the caramel**

- *Against:* "Round cards and fields it is a caramel, `#a16e32`", against the field recipe's `rgb(129 91 31 / .24)`
- *Defect:* the field edge is `#815b1f`, so "the resting field edge" has two candidates
- *Measured:* rose against the field edge 19.30; against the caramel 11.27
- *State:* both named in §7. **Open:** which one the rule reads

**What step 2.0 must also settle.** The adversary listed 18 things revision 1
left unsaid, so no test could be written for them. One, the ring hex, is settled
(A12). The second check of this revision added the last two lines.

- [ ] The legibility member's additional tiers and kinds (the seven tiers of `wcag-aa`, and that floors are keyed by tier, are fixed in step 1.3)
- [ ] How a per-mode number is written (chart 3 and 2.25; the edge floors; any dark text floors)
- [ ] What an unmeasurable value does for each new kind of rule (for today's pairs step 1.2 settled it: a named failure, never a skip or a throw), and how a see-through value is measured outside the scrim rule
- [ ] That Lc floors compare size, and the order of text and background
- [ ] The light values not yet decided: `surface-raised`, `bg-subtle` (the well or the deep cream), the three border tokens, `text-inverse`, every `-hover` and `-active` fill, the seven `-text` and seven `-subtle` roles, `link`, `link-hover`, the three `-solid` tokens, `on-scrim`, `on-scrim-muted`, `chart-muted`
- [ ] Which token, existing or new and optional, carries: the control ring, the selected bar, the selected wash, the off-track, the track, the rose rim `#d77784`, the resting field edge, the status shades, the halo and deep tones
- [ ] Dark values for muted and subtle text that meet the floors, or dark floors (§11, item 2)
- [ ] The shape of shadows as data: layers, which is all-round, inset handling, which shadow belongs to which edge pair
- [ ] Which edge number is enforced (§11, item 3)
- [ ] The scope of checks 1, 2 and 3: all presets or legibility presets; the edge-to-fill map for check 3; the measure of "darker" for check 2
- [ ] Whether the mark, tell-apart and palette rules run in dark as well as light
- [ ] Which roles are "the four fills" and "every brand fill"
- [ ] Whether chart marks are checked against `bg` as well as `surface`, and whether `chart-muted` is in the rule
- [ ] Whether ratio rules (the scrim) use the contract's four views
- [ ] The rounding rule for a regression baseline: a whole number, or one decimal as `check-cvd` does, and the margin
- [ ] Check 6: must the failure list contain the card edge, or consist only of it; and where the as-shipped fixture's shadow data comes from
- [ ] The shape of the `legibility` contract's record of who it was calibrated for
- [ ] Whether tooltip text (`text-inverse` on `text`) gets a rule
- [ ] Whether the tab indicator is checked against `surface` as well as `bg`
