import { Rating } from "@sorbet/component-library";

export function Default() {
  return <Rating value={4.3} showValue />;
}

export function Sizes() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <Rating value={3.5} size="sm" showValue />
      <Rating value={3.5} size="md" showValue />
      <Rating value={3.5} size="lg" showValue />
    </div>
  );
}

export function Tones() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <Rating value={4.5} tone="warning" showValue />
      <Rating value={4.5} tone="success" showValue />
      <Rating value={4.5} tone="danger" showValue />
      <Rating value={4.5} tone="info" showValue />
    </div>
  );
}
