// The number the hero card and the marquee ticker quote — counted, not typed.
// It read "790 checks" long after the contract had changed size, because a
// figure in prose has no way to notice. `measurePreset` returns the pairs the
// build's contrast gate fails on, so its length IS the number of checks: the
// rules a preset's declared contract holds in a mode (`contractOf`, inside
// `measurePreset`), for each mode, for each preset. A contract named here
// would be a second answer to "which contract", and a count of checks nobody
// ran.
import { measurePreset, presets, type Mode } from "@sorbet/design-system/tokens";

const MODES: Mode[] = ["light", "dark"];
const all = Object.values(presets);

const checks = all.reduce((sum, preset) => sum + MODES.reduce((n, mode) => n + measurePreset(preset, mode).length, 0), 0);

/** e.g. "700 checks across 5 presets × 2 modes" — every figure in it derived. */
export const CONTRAST_CHECKS = `${checks} checks across ${all.length} presets × ${MODES.length} modes`;
