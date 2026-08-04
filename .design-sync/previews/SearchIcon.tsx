import { Icon, SearchIcon } from "@sorbet/component-library";

export function Default() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        border: "1px solid var(--sb-border)",
        borderRadius: 8,
        padding: "8px 12px",
        width: 260,
        color: "var(--sb-text-muted, #6b7280)",
      }}
    >
      <Icon size="md" tone="muted">
        <SearchIcon />
      </Icon>
      <span>Search recipes, ingredients…</span>
    </div>
  );
}

export function Sizes() {
  return (
    <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
      <Icon size="sm" tone="muted">
        <SearchIcon />
      </Icon>
      <Icon size="md" tone="muted">
        <SearchIcon />
      </Icon>
      <Icon size="lg" tone="muted">
        <SearchIcon />
      </Icon>
      <Icon size="xl" tone="muted">
        <SearchIcon />
      </Icon>
    </div>
  );
}

export function Tones() {
  return (
    <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
      <Icon size="lg" tone="primary">
        <SearchIcon />
      </Icon>
      <Icon size="lg" tone="muted">
        <SearchIcon />
      </Icon>
      <Icon size="lg" tone="subtle">
        <SearchIcon />
      </Icon>
    </div>
  );
}
