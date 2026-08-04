import { Avatar } from "@sorbet/component-library";

export function Sizes() {
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
      <Avatar size="sm">JD</Avatar>
      <Avatar size="md">AL</Avatar>
      <Avatar size="lg">MK</Avatar>
      <Avatar size="xl">RS</Avatar>
    </div>
  );
}

export function Square() {
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
      <Avatar square>GH</Avatar>
      <Avatar square size="lg">TW</Avatar>
    </div>
  );
}
