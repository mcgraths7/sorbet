import { Heading, Lead, Overline, Text } from "@sorbet/component-library/atoms";
import { Cluster, Stack } from "@sorbet/component-library/layout";

import type { Demo } from "./types.ts";

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
    </Stack>
  );
}

export const demo: Demo = { title: "Typography", layer: "atoms", order: 10, Component: TypographyDemo };
