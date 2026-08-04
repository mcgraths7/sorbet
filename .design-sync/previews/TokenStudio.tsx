import { TokenStudio, type ThemeMode } from "@sorbet/component-library";
import { useState } from "react";

/**
 * The live token editor, open with the preset selector and mode toggle wired
 * up (both are opt-in via props — an app that skips `onPresetChange` just
 * gets the plain editor). Colors/type/layout/effects tabs, the accordion'd
 * color sections and the WCAG report in the footer all come from the design
 * system's real token catalog, not fixture data.
 */
export function Default() {
  // "sorbet" matches the flagship preset this design-sync loads as the active
  // theme (see learnings) — so the swatches below actually match the label
  // selected in the dropdown, instead of a mismatched preset name.
  const [preset, setPreset] = useState("sorbet");
  const [themeMode, setThemeMode] = useState<ThemeMode>("light");
  return (
    <TokenStudio
      open
      onClose={() => {}}
      preset={preset}
      onPresetChange={setPreset}
      themeMode={themeMode}
      onThemeModeChange={setThemeMode}
    />
  );
}
