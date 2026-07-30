import { Avatar, Badge, Text } from "@sorbet/component-library/atoms";
import { Cluster, Frame, Stack } from "@sorbet/component-library/layout";
import { Card, CardBody, Carousel } from "@sorbet/component-library/molecules";

import type { DemoMeta } from "./types.ts";

const QUOTES = [
  { quote: "We re-themed the whole product in an afternoon. One file.", name: "Ada Lovelace", role: "Staff Engineer", initials: "AL" },
  { quote: "The contrast gate caught a palette that would have shipped broken.", name: "Grace Hopper", role: "Accessibility Lead", initials: "GH" },
  { quote: "Native dialogs and the Popover API — nothing to keep in sync.", name: "Dieter Rams", role: "Design Systems", initials: "DR" },
  { quote: "Dark mode was free. That never happens.", name: "Susan Kare", role: "Product Designer", initials: "SK" },
];

const SHOTS = [
  { emoji: "🍓", caption: "Raspberry ripple", from: "primary", to: "accent" },
  { emoji: "🌊", caption: "Sea foam", from: "secondary", to: "info" },
  { emoji: "🍋", caption: "Lemon zest", from: "warning", to: "accent" },
  { emoji: "🫐", caption: "Blueberry dusk", from: "info", to: "accent" },
  { emoji: "🌅", caption: "Golden hour", from: "warning", to: "danger" },
];

export function CarouselDemo() {
  return (
    <>
      <Text tone="muted">
        CSS scroll snap underneath — swipe, trackpad, or arrow keys once the track has focus. Children can be anything;
        the carousel never inspects them.
      </Text>

      <Text size="sm" tone="subtle">
        Text slides — one at a time:
      </Text>
      <Carousel aria-label="Testimonials" gap={4}>
        {QUOTES.map((q) => (
          <Card key={q.name}>
            <CardBody>
              <Stack gap={4}>
                <Text size="lg">“{q.quote}”</Text>
                <Cluster gap={3}>
                  <Avatar>{q.initials}</Avatar>
                  <Stack gap={1}>
                    <Text weight="semibold">{q.name}</Text>
                    <Text size="sm" tone="muted">
                      {q.role}
                    </Text>
                  </Stack>
                </Cluster>
              </Stack>
            </CardBody>
          </Card>
        ))}
      </Carousel>

      <Text size="sm" tone="subtle">
        Media slides — three across, centered snap:
      </Text>
      <Carousel aria-label="Gallery" perView={3} gap={3} align="center">
        {SHOTS.map((s) => (
          <Card key={s.caption} variant="flat">
            <Frame ratio="4 / 3">
              <div
                style={{
                  inlineSize: "100%",
                  blockSize: "100%",
                  display: "grid",
                  placeItems: "center",
                  fontSize: "2.5rem",
                  background: `linear-gradient(135deg, var(--sb-${s.from}-subtle), var(--sb-${s.to}-subtle))`,
                }}
              >
                {s.emoji}
              </div>
            </Frame>
            <div style={{ padding: "var(--sb-space-3)" }}>
              <Cluster justify="between" gap={2}>
                <Text size="sm">{s.caption}</Text>
                <Badge tone="primary">4:3</Badge>
              </Cluster>
            </div>
          </Card>
        ))}
      </Carousel>
    </>
  );
}

CarouselDemo.demo = { title: "Carousel", layer: "molecules", order: 45 } satisfies DemoMeta;
