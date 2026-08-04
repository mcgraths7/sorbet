import { Button, ThemeProvider, useTheme } from "@sorbet/component-library";

// ThemeProvider has no visual output of its own — it applies data-theme to
// <html> and provides context (the preview harness already wraps every card
// in one). To demonstrate ITS OWN value, each demo here nests a SECOND,
// independent <ThemeProvider> and reads it back live via useTheme().

function ModeReadout() {
  const { mode, resolved, toggle } = useTheme();
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        padding: 16,
        background: "var(--sb-surface)",
        border: "1px solid var(--sb-border)",
        borderRadius: "var(--sb-radius-md)",
        width: 240,
      }}
    >
      <div>
        <div style={{ fontSize: 13, color: "var(--sb-text-muted)" }}>mode</div>
        <div style={{ fontWeight: 600 }}>{mode}</div>
      </div>
      <div>
        <div style={{ fontSize: 13, color: "var(--sb-text-muted)" }}>resolved</div>
        <div style={{ fontWeight: 600 }}>{resolved}</div>
      </div>
      <Button variant="secondary" onClick={toggle}>
        Toggle theme
      </Button>
    </div>
  );
}

/** Live `mode`/`resolved` readout + `toggle()`, from an inner ThemeProvider nested inside the harness's own. */
export function Default() {
  return (
    <ThemeProvider>
      <ModeReadout />
    </ThemeProvider>
  );
}

function ModeSwitcher() {
  const { mode, resolved, set } = useTheme();
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        padding: 16,
        background: "var(--sb-surface)",
        border: "1px solid var(--sb-border)",
        borderRadius: "var(--sb-radius-md)",
        width: 280,
      }}
    >
      <div style={{ fontSize: 13, color: "var(--sb-text-muted)" }}>
        mode: <strong>{mode}</strong> · resolved: <strong>{resolved}</strong>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        {(["light", "dark", "system"] as const).map((m) => (
          <Button key={m} variant={mode === m ? "primary" : "outline"} size="sm" onClick={() => set(m)}>
            {m}
          </Button>
        ))}
      </div>
    </div>
  );
}

/** Explicit `set(mode)` across all three ThemeMode values, with live mode/resolved feedback. */
export function ExplicitModeSet() {
  return (
    <ThemeProvider>
      <ModeSwitcher />
    </ThemeProvider>
  );
}
