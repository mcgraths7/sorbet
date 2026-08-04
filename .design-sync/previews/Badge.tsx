import { Badge } from "@sorbet/component-library";

export function Tones() {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      <Badge>Default</Badge>
      <Badge tone="primary">Primary</Badge>
      <Badge tone="success">Success</Badge>
      <Badge tone="warning">Warning</Badge>
      <Badge tone="danger">Danger</Badge>
      <Badge tone="info">Info</Badge>
    </div>
  );
}

export function Solid() {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      <Badge tone="primary" solid>
        Primary
      </Badge>
      <Badge tone="success" solid>
        Success
      </Badge>
      <Badge tone="danger" solid>
        Danger
      </Badge>
    </div>
  );
}

export function WithDot() {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      <Badge tone="success" dot>
        Online
      </Badge>
      <Badge tone="danger" dot>
        Offline
      </Badge>
      <Badge tone="warning" dot solid>
        Away
      </Badge>
    </div>
  );
}
