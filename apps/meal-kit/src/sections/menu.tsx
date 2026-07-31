import { Badge, Button, Heading, Text } from "@sorbet/component-library/atoms";
import { Cluster, Frame, Grid, Stack } from "@sorbet/component-library/layout";
import { Section, Card, CardBody, Stepper } from "@sorbet/component-library/molecules";

const STEPS = [
  { label: "Pick your meals", description: "Swap any week" },
  { label: "We pack the exact amounts", description: "Chilled, next-day" },
  { label: "Cook in ~30 minutes", description: "One pan, mostly" },
];

interface Meal {
  emoji: string;
  name: string;
  blurb: string;
  minutes: number;
  tags: Array<{ label: string; tone?: "success" | "warning" | "info" }>;
  from: string;
  to: string;
}

const MEALS: Meal[] = [
  {
    emoji: "🍜",
    name: "Miso butter ramen",
    blurb: "Soft egg, charred corn, a broth that tastes like it simmered all day.",
    minutes: 25,
    tags: [{ label: "Veggie", tone: "success" }, { label: "Cosy" }],
    from: "warning",
    to: "danger",
  },
  {
    emoji: "🥗",
    name: "Charred halloumi bowl",
    blurb: "Herby grains, quick-pickled onion, lemon and honey dressing.",
    minutes: 20,
    tags: [{ label: "Veggie", tone: "success" }, { label: "Under 500 cal", tone: "info" }],
    from: "success",
    to: "secondary",
  },
  {
    emoji: "🌮",
    name: "Chipotle black bean tacos",
    blurb: "Smoky beans, charred sweetcorn salsa, lime crema.",
    minutes: 15,
    tags: [{ label: "Vegan", tone: "success" }, { label: "15 min", tone: "warning" }],
    from: "warning",
    to: "accent",
  },
  {
    emoji: "🍝",
    name: "Nduja rigatoni",
    blurb: "Slow-melted onion, a little chilli heat, plenty of parmesan.",
    minutes: 30,
    tags: [{ label: "Spicy", tone: "warning" }],
    from: "danger",
    to: "primary",
  },
  {
    emoji: "🐟",
    name: "Miso-glazed salmon",
    blurb: "Sticky glaze, sesame greens, rice that actually steams properly.",
    minutes: 25,
    tags: [{ label: "High protein", tone: "info" }],
    from: "info",
    to: "accent",
  },
  {
    emoji: "🍛",
    name: "Coconut dal",
    blurb: "Red lentils, curry leaves, a crisp tadka poured over at the end.",
    minutes: 30,
    tags: [{ label: "Vegan", tone: "success" }, { label: "Batch-friendly" }],
    from: "warning",
    to: "success",
  },
];

export function HowItWorks() {
  return (
    <Section
      id="how"
      title="Three steps, then dinner"
      description="No subscriptions to decode. Choose, cook, repeat — or skip a week entirely."
    >
      <Stepper current={1} steps={STEPS} />
    </Section>
  );
}

export function WeeklyMenu() {
  return (
    <Section
      id="menu"
      title="This week's menu"
      description="Twelve recipes, rotating every Monday. Here are six we're proud of."
      action={
        <Button variant="outline" as="a" href="#build">
          See all 12
        </Button>
      }
    >
      <Grid cols={3}>
        {MEALS.map((meal) => (
          <Card key={meal.name}>
            <Frame ratio="4 / 3">
              <div
                style={{
                  inlineSize: "100%",
                  blockSize: "100%",
                  display: "grid",
                  placeItems: "center",
                  fontSize: "3rem",
                  background: `linear-gradient(135deg, var(--sb-${meal.from}-subtle), var(--sb-${meal.to}-subtle))`,
                }}
              >
                {meal.emoji}
              </div>
            </Frame>
            <CardBody>
              <Stack gap={3}>
                <Stack gap={1}>
                  <Heading level={3} size="lg">
                    {meal.name}
                  </Heading>
                  <Text size="sm" tone="muted">
                    {meal.blurb}
                  </Text>
                </Stack>
                <Cluster justify="between">
                  <Cluster gap={2}>
                    {meal.tags.map((tag) => (
                      <Badge key={tag.label} tone={tag.tone}>
                        {tag.label}
                      </Badge>
                    ))}
                  </Cluster>
                  <Text size="sm" tone="subtle">
                    {meal.minutes} min
                  </Text>
                </Cluster>
              </Stack>
            </CardBody>
          </Card>
        ))}
      </Grid>
    </Section>
  );
}
