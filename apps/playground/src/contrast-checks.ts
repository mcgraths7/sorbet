// The number the hero card and the marquee ticker quote — counted, not typed.
// It read "790 checks" long after the contract had changed size, because a
// figure in prose has no way to notice. `measureColors` returns the pairs the
// build's contrast gate fails on, so its length IS the number of checks: the
// rules that apply in a mode, for each mode, for each preset.
import { measureColors, presets, type Mode } from "@sorbet/design-system/tokens";

const MODES: Mode[] = ["light", "dark"];
const all = Object.values(presets);

const checks = all.reduce(
  (sum, preset) => sum + MODES.reduce((n, mode) => n + measureColors(mode, preset.colors[mode]).length, 0),
  0,
);

/** e.g. "700 checks across 5 presets × 2 modes" — every figure in it derived. */
export const CONTRAST_CHECKS = `${checks} checks across ${all.length} presets × ${MODES.length} modes`;
