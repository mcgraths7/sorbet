import { Badge, Text } from "@sorbet/component-library/atoms";
import { Cluster } from "@sorbet/component-library/layout";
import { Marquee } from "@sorbet/component-library/molecules";

import type { DemoMeta } from "./types.ts";

const LOGOS = [
  { emoji: "🍓", name: "Raspberry" },
  { emoji: "🌊", name: "Seafoam" },
  { emoji: "🍋", name: "Zest" },
  { emoji: "🫐", name: "Blueberry" },
  { emoji: "🌿", name: "Sprout" },
  { emoji: "🍊", name: "Citrus" },
];

const TICKER = [
  "Contrast verified on every build",
  "790 checks across 5 presets × 2 modes",
  "Native dialogs, zero runtime deps",
  "Dark mode included, not bolted on",
  "A failing palette fails the build",
];

export function MarqueeDemo() {
  return (
    <>
      <Text tone="muted">
        Pure-CSS animation on a duplicated track — JS only measures. Hover, focus, or the hidden pause button (Tab to
        it) all stop it, and it stays still entirely under <code>prefers-reduced-motion</code>.
      </Text>

      <Text size="sm" tone="subtle">
        Logo cloud — speed is px/second, so it crawls at the same rate however many logos there are:
      </Text>
      <Marquee aria-label="Customer logos" gap={8} speed={50}>
        {LOGOS.map((l) => (
          <Cluster key={l.name} gap={2}>
            <span style={{ fontSize: "1.75rem" }} aria-hidden="true">
              {l.emoji}
            </span>
            <Text weight="semibold" tone="muted">
              {l.name}
            </Text>
          </Cluster>
        ))}
      </Marquee>

      <Text size="sm" tone="subtle">
        Reversed ticker with links — Tab into it and the row pauses, so the targets stop moving:
      </Text>
      <Marquee aria-label="Product facts" gap={4} speed={35} reverse>
        {TICKER.map((fact) => (
          <Cluster key={fact} gap={2}>
            <Badge tone="primary">✦</Badge>
            <a href="#organisms">{fact}</a>
          </Cluster>
        ))}
      </Marquee>
    </>
  );
}

MarqueeDemo.demo = { title: "Marquee", layer: "molecules", order: 47 } satisfies DemoMeta;
