/**
 * Standalone accessibility report: every WCAG pairing in the contract, per
 * preset and mode, with measured ratios. `npm run check:contrast`.
 */

import { styleText } from "node:util";
import { contrast, presets, RULES } from "@sorbet/tokens";
import type { Mode } from "@sorbet/tokens";

let failures = 0;
const opaque = (v: string) => /^#[0-9a-f]{6}$/i.test(v);

for (const preset of Object.values(presets)) {
  console.log(styleText("bold", `\n${preset.label} — ${preset.tagline}`));
  for (const mode of ["light", "dark"] as Mode[]) {
    const colors = preset.colors[mode];
    const rows: string[] = [];
    let worst = Infinity;
    for (const rule of RULES) {
      const fg = colors[rule.fg];
      const bg = colors[rule.bg];
      if (!opaque(fg) || !opaque(bg)) continue;
      const ratio = contrast(fg, bg);
      worst = Math.min(worst, ratio / rule.min);
      if (ratio < rule.min) {
        failures++;
        rows.push(styleText("red", `    ✗ ${rule.fg} on ${rule.bg}: ${ratio.toFixed(2)} < ${rule.min}`));
      }
    }
    const summary =
      rows.length === 0
        ? styleText("green", `all ${RULES.length} pairings pass (tightest margin ×${worst.toFixed(2)})`)
        : styleText("red", `${rows.length} failing`);
    console.log(`  ${mode.padEnd(5)} ${summary}`);
    for (const row of rows) console.log(row);
  }
}

if (failures > 0) {
  console.error(styleText("red", `\n✗ ${failures} contrast failure(s)`));
  process.exit(1);
}
console.log(styleText("green", "\n✓ WCAG AA contract holds for every preset in both modes"));
