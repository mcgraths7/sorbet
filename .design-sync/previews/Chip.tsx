import { Chip } from "@sorbet/component-library";

export function Default() {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      <Chip>Vegetarian</Chip>
      <Chip selected>Gluten-free</Chip>
      <Chip>Dairy-free</Chip>
    </div>
  );
}

export function Removable() {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      <Chip onRemove={() => {}} removeLabel="Remove Salmon filter">
        Salmon
      </Chip>
      <Chip onRemove={() => {}} removeLabel="Remove Under 30 min filter">
        Under 30 min
      </Chip>
    </div>
  );
}
