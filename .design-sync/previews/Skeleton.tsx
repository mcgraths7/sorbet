import { Skeleton } from "@sorbet/component-library";

export function TextLines() {
  return (
    <div style={{ width: 280 }}>
      <Skeleton variant="text" lines={3} />
    </div>
  );
}

export function CircleAndRect() {
  return (
    <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
      <Skeleton variant="circle" style={{ width: 48, height: 48 }} />
      <Skeleton variant="rect" style={{ width: 160, height: 96 }} />
    </div>
  );
}

export function CardPlaceholder() {
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "center", width: 280 }}>
      <Skeleton variant="circle" style={{ width: 40, height: 40 }} />
      <div style={{ flex: 1 }}>
        <Skeleton variant="text" lines={2} />
      </div>
    </div>
  );
}
