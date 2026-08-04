import { Heading, Lead } from "@sorbet/component-library";

export function IntroParagraph() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 560 }}>
      <Heading level={1}>Meal kits, delivered weekly</Heading>
      <Lead>
        Fresh, pre-portioned ingredients and chef-designed recipes — on your
        table in 30 minutes or less, every night of the week.
      </Lead>
    </div>
  );
}

export function Centered() {
  return (
    <div style={{ maxWidth: 480, margin: "0 auto", textAlign: "center" }}>
      <Lead align="center">
        Join thousands of home cooks who've traded takeout menus for a box
        that shows up right on time.
      </Lead>
    </div>
  );
}
