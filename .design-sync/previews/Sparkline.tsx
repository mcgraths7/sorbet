import { Sparkline } from "@sorbet/component-library";

/** Default: accent on the current (final) period. */
export function Default() {
  return <Sparkline data={[42, 45, 41, 48, 52, 49, 55, 58, 54, 61, 65, 63]} />;
}

/** `accentLast` off: a flat single-tone trend line. */
export function NoAccent() {
  return <Sparkline data={[128, 132, 119, 141, 138, 152, 149, 160]} accentLast={false} />;
}

/** Realistic usage: the trend line riding alongside a stat tile's headline number. */
export function InStatTile() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        padding: 16,
        background: "var(--sb-surface)",
        border: "1px solid var(--sb-border)",
        borderRadius: "var(--sb-radius-md)",
        width: 260,
      }}
    >
      <div>
        <div style={{ fontSize: 13, color: "var(--sb-text-muted)" }}>Weekly signups</div>
        <div style={{ fontSize: 24, fontWeight: 700 }}>1,284</div>
      </div>
      <Sparkline data={[860, 910, 875, 940, 1020, 1150, 1284]} width={110} height={32} />
    </div>
  );
}
