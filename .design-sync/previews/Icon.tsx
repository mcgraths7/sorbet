import { CalendarIcon, CheckIcon, Icon, SearchIcon } from "@sorbet/component-library";

export function Sizes() {
  return (
    <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
      <Icon size="xs">
        <SearchIcon />
      </Icon>
      <Icon size="sm">
        <SearchIcon />
      </Icon>
      <Icon size="md">
        <SearchIcon />
      </Icon>
      <Icon size="lg">
        <SearchIcon />
      </Icon>
      <Icon size="xl">
        <SearchIcon />
      </Icon>
    </div>
  );
}

export function Tones() {
  return (
    <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
      <Icon size="lg" tone="muted">
        <CheckIcon />
      </Icon>
      <Icon size="lg" tone="subtle">
        <CheckIcon />
      </Icon>
      <Icon size="lg" tone="primary">
        <CheckIcon />
      </Icon>
      <Icon size="lg" tone="success">
        <CheckIcon />
      </Icon>
      <Icon size="lg" tone="warning">
        <CheckIcon />
      </Icon>
      <Icon size="lg" tone="danger">
        <CheckIcon />
      </Icon>
      <Icon size="lg" tone="info">
        <CheckIcon />
      </Icon>
    </div>
  );
}

export function InlineWithText() {
  return (
    <p style={{ margin: 0, fontSize: 16 }}>
      Order confirmed{" "}
      <Icon tone="success">
        <CheckIcon />
      </Icon>{" "}
      — arriving Thursday.
    </p>
  );
}

export function LabeledStandalone() {
  return (
    <Icon size="lg" label="Search" tone="muted">
      <CalendarIcon />
    </Icon>
  );
}
