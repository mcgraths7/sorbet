# The 47 `text-subtle` sites (L72), classified for step 2.4

Committed with step 2.4 (L147 (d)). Each site that wrote `clr(text-subtle)` at
`e24df74` is one row. The rule (L72, decision A15): a site is a **caption** when
any element it colours renders text smaller than 14px, and then it reads
`seam(text-caption)`; otherwise it **stays** `clr(text-subtle)`. A caption
site's fallback is `text-subtle`, so the four frozen presets paint exactly what
they painted before.

**How the sizes were obtained.** The library stylesheet was compiled from
`src/styles/index.scss` with a source map, and every declaration reading
`var(--sb-text-subtle)` was traced back to its Sass line, which gives the
compiled selectors each site lands in (a mixin or a loop can give several). Each
selector was then queried in the built playground, rendered under sorbet light
at 1280×900 and the default root size (16px), and the computed `font-size` of
every matching element was read (for a pseudo-element, the pseudo-element's own;
dynamic pseudo-classes such as `:hover` were dropped from the query, real states
such as `:disabled` kept). A selector that matches nothing is decided by the
size its own rule or the nearest enclosing rule in the same partial sets, as L72
says, and the row says so. The script that did this is not committed (step 2.4
is Sass only); it used the browser tooling of step 2.3 (`tools/playground-browser.ts`).

Result: **12 captions, 35 stay** (47 in all; `grep -rn "clr(text-subtle)"`
now finds 35 and `grep -rn "seam(text-caption)"` 12).

"Line" is the line in this step's tree; "at e24df74" is the same site's line on
`main`.

| # | Site | At e24df74 | Property | Compiled selector(s) | Computed size | Class | How decided |
|---|---|---|---|---|---|---|---|
| 1 | `atoms/_choice.scss:90` | 89 | `color` | `.sb-choice:has(input:disabled)` | 14px | **stays** | computed `font-size` of 1 matched element(s) |
| 2 | `atoms/_color-input.scss:191` | 190 | `color` | `.sb-color-input__eyedropper` | 14, 16px | **stays** | computed `font-size` of 70 matched element(s) |
| 3 | `atoms/_color-input.scss:238` | 237 | `color` | `.sb-color-input__field-label` | 12px | **caption** | computed `font-size` of 280 matched element(s) |
| 4 | `atoms/_divider.scss:14` | 14 | `color` | `div.sb-divider` | 14px | **stays** | computed `font-size` of 1 matched element(s) |
| 5 | `atoms/_icon.scss:51` | 51 | `color` | `.sb-icon--subtle` | 18px | **stays** | computed `font-size` of 1 matched element(s) |
| 6 | `atoms/_input.scss:21` | 15 | `color` | `.sb-input::placeholder`<br>`.sb-textarea::placeholder`<br>`.sb-select select::placeholder` | 14, 16px | **stays** | computed `font-size` of 463 matched element(s) |
| 7 | `atoms/_input.scss:32` | 26 | `color` | `.sb-input:disabled`<br>`.sb-textarea:disabled`<br>`.sb-select select:disabled` | — | **stays** | matches nothing (no disabled field in the playground); its rule (`&:disabled` in `control-surface`) and the enclosing mixin set no size: stays |
| 8 | `atoms/_label.scss:17` | 17 | `color` | `.sb-label[data-optional]::after` | 14px | **stays** | computed `font-size` of 2 matched element(s) |
| 9 | `atoms/_number-input.scss:55` | 52 | `color` | `.sb-number-input__field::placeholder` | 16px | **stays** | computed `font-size` of 1 matched element(s) |
| 10 | `atoms/_number-input.scss:59` | 56 | `color` | `.sb-number-input__field:disabled` | — | **stays** | matches nothing (no disabled number field); `&__field` sets no size: stays |
| 11 | `atoms/_number-input.scss:86` | 83 | `color` | `.sb-number-input__step:disabled` | 16px | **stays** | computed `font-size` of 1 matched element(s) |
| 12 | `atoms/_spinner.scss:26` | 26 | `border-block-start-color` | `.sb-spinner--muted` | — | **stays** | matches nothing (no muted spinner); it colours a spinner's ring, no text: stays |
| 13 | `atoms/_text.scss:30` | 30 | `color` | `.sb-text--subtle` | 12, 14, 16px | **caption** | computed `font-size` of 31 matched element(s) |
| 14 | `base/_utilities.scss:21` | 21 | `color` | `.u-text-subtle` | — | **stays** | matches nothing (no `.u-text-subtle`); the utility sets no size: stays |
| 15 | `molecules/_breadcrumb.scss:25` | 25 | `color` | `.sb-breadcrumb li:not(:first-child)::before` | 14px | **stays** | computed `font-size` of 2 matched element(s) |
| 16 | `molecules/_calendar.scss:57` | 55 | `color` | `.sb-calendar__nav` | 16px | **stays** | computed `font-size` of 8 matched element(s) |
| 17 | `molecules/_calendar.scss:101` | 99 | `color` | `.sb-calendar__weekday` | 12px | **caption** | computed `font-size` of 28 matched element(s) |
| 18 | `molecules/_calendar.scss:123` | 121 | `color` | `.sb-calendar__day[data-outside]` | 14px | **stays** | computed `font-size` of 44 matched element(s) |
| 19 | `molecules/_calendar.scss:163` | 161 | `color` | `.sb-calendar__day[aria-disabled=true]` | 14px | **stays** | computed `font-size` of 41 matched element(s) |
| 20 | `molecules/_carousel.scss:88` | 88 | `color` | `.sb-carousel__arrow:disabled` | 16px | **stays** | computed `font-size` of 2 matched element(s) |
| 21 | `molecules/_combobox.scss:35` | 35 | `color` | `.sb-combobox__button` | 14px | **stays** | computed `font-size` of 3 matched element(s) |
| 22 | `molecules/_combobox.scss:86` | 83 | `color` | `.sb-combobox__field[data-disabled]` | — | **stays** | matches nothing (no disabled combobox); `&__field` sets no size: stays |
| 23 | `molecules/_combobox.scss:101` | 98 | `color` | `.sb-combobox__field > input::placeholder` | 16px | **stays** | computed `font-size` of 1 matched element(s) |
| 24 | `molecules/_combobox.scss:153` | 150 | `color` | `.sb-combobox__option[aria-disabled=true]` | 14px | **stays** | computed `font-size` of 2 matched element(s) |
| 25 | `molecules/_combobox.scss:166` | 163 | `color` | `.sb-combobox__option-desc` | 12px | **caption** | computed `font-size` of 12 matched element(s) |
| 26 | `molecules/_combobox.scss:180` | 177 | `color` | `.sb-combobox__heading` | 12px | **caption** | computed `font-size` of 3 matched element(s) |
| 27 | `molecules/_date-picker.scss:31` | 31 | `color` | `.sb-date-picker__trigger` | 16px | **stays** | computed `font-size` of 1 matched element(s) |
| 28 | `molecules/_date-range.scss:48` | 45 | `color` | `.sb-date-range__input::placeholder` | 16px | **stays** | computed `font-size` of 2 matched element(s) |
| 29 | `molecules/_date-range.scss:62` | 59 | `color` | `.sb-date-range__sep` | 16px | **stays** | computed `font-size` of 1 matched element(s) |
| 30 | `molecules/_date-range.scss:75` | 72 | `color` | `.sb-date-range__trigger` | 16px | **stays** | computed `font-size` of 1 matched element(s) |
| 31 | `molecules/_menu.scss:58` | 58 | `color` | `.sb-menu__kbd` | 12px | **caption** | computed `font-size` of 2 matched element(s) |
| 32 | `molecules/_menu.scss:75` | 75 | `color` | `.sb-menu__heading` | 12px | **caption** | computed `font-size` of 1 matched element(s) |
| 33 | `molecules/_pagination.scss:46` | 44 | `color` | `.sb-pagination > span` | 14px | **stays** | computed `font-size` of 1 matched element(s) |
| 34 | `molecules/_stat.scss:53` | 53 | `color` | `.sb-stat__delta[data-trend=flat]` | 14px | **stays** | computed `font-size` of 1 matched element(s) |
| 35 | `molecules/_toast.scss:55` | 54 | `color` | `.sb-toast__dismiss` | — | **stays** | matches nothing (no toast open); its own rule sets `fs(lg)`: stays |
| 36 | `organisms/_chart.scss:41` | 41 | `fill` | `.sb-chart__tick` | 12px | **caption** | computed `font-size` of 58 matched element(s) |
| 37 | `organisms/_chart.scss:183` | 183 | `color` | `.sb-chart__vlegend-share` | 14px | **stays** | computed `font-size` of 5 matched element(s) |
| 38 | `organisms/_command-palette.scss:26` | 26 | `color` | `.sb-command__search-icon` | 16px | **stays** | computed `font-size` of 1 matched element(s) |
| 39 | `organisms/_command-palette.scss:40` | 40 | `color` | `.sb-command__input::placeholder` | 18px | **stays** | computed `font-size` of 1 matched element(s) |
| 40 | `organisms/_command-palette.scss:60` | 60 | `color` | `.sb-command__heading` | 12px | **caption** | computed `font-size` of 3 matched element(s) |
| 41 | `organisms/_command-palette.scss:82` | 82 | `color` | `.sb-command__option[aria-disabled=true]` | 16px | **stays** | computed `font-size` of 1 matched element(s) |
| 42 | `organisms/_command-palette.scss:114` | 114 | `color` | `.sb-command__desc` | 14px | **stays** | computed `font-size` of 2 matched element(s) |
| 43 | `organisms/_command-palette.scss:136` | 136 | `color` | `.sb-command__footer` | 12px | **caption** | computed `font-size` of 1 matched element(s) |
| 44 | `organisms/_command-palette.scss:178` | 178 | `color` | `.sb-command-trigger` | 14px | **stays** | computed `font-size` of 1 matched element(s) |
| 45 | `organisms/_footer.scss:65` | 65 | `color` | `.sb-footer__meta` | 14px | **stays** | computed `font-size` of 1 matched element(s) |
| 46 | `organisms/_sidebar.scss:21` | 21 | `color` | `.sb-sidebar__heading` | 12px | **caption** | computed `font-size` of 1 matched element(s) |
| 47 | `organisms/_token-studio.scss:96` | 96 | `color` | `.sb-token-studio__heading` | 12px | **caption** | computed `font-size` of 12 matched element(s) |
