import { Icon, UploadIcon } from "@sorbet/component-library";

export function Default() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        border: "1px dashed var(--sb-border)",
        borderRadius: 8,
        padding: 24,
        width: 220,
        textAlign: "center",
      }}
    >
      <Icon size="xl" tone="primary">
        <UploadIcon />
      </Icon>
      <span>Drop files here or click to upload</span>
    </div>
  );
}

export function Sizes() {
  return (
    <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
      <Icon size="sm" tone="muted">
        <UploadIcon />
      </Icon>
      <Icon size="md" tone="muted">
        <UploadIcon />
      </Icon>
      <Icon size="lg" tone="muted">
        <UploadIcon />
      </Icon>
      <Icon size="xl" tone="muted">
        <UploadIcon />
      </Icon>
    </div>
  );
}

export function Tones() {
  return (
    <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
      <Icon size="lg" tone="primary">
        <UploadIcon />
      </Icon>
      <Icon size="lg" tone="success">
        <UploadIcon />
      </Icon>
      <Icon size="lg" tone="muted">
        <UploadIcon />
      </Icon>
    </div>
  );
}
