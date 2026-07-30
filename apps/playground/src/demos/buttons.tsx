import { Button, Tooltip } from "@sorbet/component-library/atoms";
import { Cluster } from "@sorbet/component-library/layout";

import type { DemoMeta } from "./types.ts";

export function ButtonsDemo() {
  return (
    <>
      <Cluster>
        <Button>Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="accent">Accent</Button>
        <Button variant="danger">Danger</Button>
        <Button variant="soft">Soft</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="link">Link</Button>
      </Cluster>
      <Cluster>
        <Button size="sm">Small</Button>
        <Button size="lg">Large</Button>
        <Button pill>Pill</Button>
        <Button disabled>Disabled</Button>
        <Button loading>Loading</Button>
        <Tooltip content="Settings (Tooltip atom)">
          <Button variant="ghost" iconOnly aria-label="Settings">
            ⚙︎
          </Button>
        </Tooltip>
        <Button as="a" href="#atoms" variant="outline">
          Anchor button
        </Button>
      </Cluster>
    </>
  );
}

ButtonsDemo.demo = { title: "Buttons", layer: "atoms", order: 20 } satisfies DemoMeta;
