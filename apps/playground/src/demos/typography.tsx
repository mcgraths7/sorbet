import { Heading, Lead, Overline, Text } from "@sorbet/component-library/atoms";
import { Cluster, Stack } from "@sorbet/component-library/layout";

import type { DemoMeta } from "./types.ts";

export function TypographyDemo() {
  return (
    <Stack gap={3}>
      <Overline>Text primitives</Overline>
      <Heading level={2}>Heading — semantic level, chosen size</Heading>
      <Heading level={3} size="xl">
        An h3 sized like an xl (level ≠ appearance)
      </Heading>
      <Lead>A lead paragraph: a larger, muted intro that frames the section without shouting.</Lead>
      <Text>
        Body text is the default — a plain paragraph, tokenized to the sans stack at md size and normal line height.
      </Text>
      <Text tone="muted" size="sm">
        Info text — <code>&lt;Text tone="muted" size="sm"&gt;</code> for hints and captions.
      </Text>
      <Cluster gap={4}>
        <Text weight="semibold">Semibold</Text>
        <Text tone="subtle">Subtle</Text>
        <Text as="span" size="xs" tone="muted">
          xs muted span
        </Text>
      </Cluster>

      <Overline>Alignment</Overline>
      <Text align="start" tone="muted" size="sm">
        start — the default, and how you reset an inherited alignment.
      </Text>
      <Text align="center" tone="muted" size="sm">
        center
      </Text>
      <Text align="end" tone="muted" size="sm">
        end — logical, so it flips with the writing direction rather than pinning right.
      </Text>
      <Text align="justify" tone="muted" size="sm">
        justify — spreads each line to both edges. Worth a look on a paragraph long enough to wrap, which is why
        this sentence keeps going for a while longer than it strictly needs to.
      </Text>
    </Stack>
  );
}

TypographyDemo.demo = { title: "Typography", layer: "atoms", order: 10 } satisfies DemoMeta;
