import { Button, Icon, PlusIcon } from "@sorbet/component-library";

export function Variants() {
  const variants = ["primary", "secondary", "accent", "danger", "soft", "outline", "ghost", "link"] as const;
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {variants.map((variant) => (
        <Button key={variant} variant={variant}>
          {variant}
        </Button>
      ))}
    </div>
  );
}

export function Sizes() {
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </div>
  );
}

export function States() {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
      <Button loading>Saving…</Button>
      <Button disabled>Disabled</Button>
      <Button pill>Pill</Button>
      <Button variant="outline" iconOnly aria-label="Add item">
        <Icon>
          <PlusIcon />
        </Icon>
      </Button>
    </div>
  );
}

export function WithIcon() {
  return (
    <Button variant="secondary">
      <Icon size="sm">
        <PlusIcon />
      </Icon>
      Add item
    </Button>
  );
}
