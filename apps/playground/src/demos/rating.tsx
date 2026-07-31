import { Rating, Text, type RatingTone } from "@sorbet/component-library/atoms";
import { Cluster, Grid, Stack } from "@sorbet/component-library/layout";

import type { DemoMeta } from "./types.ts";

const TONES: RatingTone[] = ["warning", "primary", "secondary", "accent", "success", "danger", "info"];

export function RatingDemo() {
  return (
    <Stack gap={4}>
      <Text tone="muted" size="sm">
        Fractional fill is real, not rounded to halves — each row below fills to its exact percentage.
      </Text>
      <Grid cols={2}>
        {[5, 4.8, 4.5, 4.3, 3.7, 2.1, 0.5, 0].map((value) => (
          <Cluster key={value} gap={3}>
            <Rating value={value} showValue />
            <Text size="sm" tone="subtle">
              {((value / 5) * 100).toFixed(0)}% filled
            </Text>
          </Cluster>
        ))}
      </Grid>

      <Text tone="muted" size="sm">
        Sizes track the type scale; the stars and the value scale together.
      </Text>
      <Cluster gap={4}>
        <Rating value={4.3} size="sm" showValue />
        <Rating value={4.3} showValue />
        <Rating value={4.3} size="lg" showValue />
      </Cluster>

      <Text tone="muted" size="sm">
        Gold is only the default — any semantic tone works.
      </Text>
      <Cluster gap={4}>
        {TONES.map((tone) => (
          <Rating key={tone} value={4} tone={tone} />
        ))}
      </Cluster>

      <Text tone="muted" size="sm">
        Any scale — <code>max</code> isn't fixed at five.
      </Text>
      <Cluster gap={4}>
        <Rating value={7.5} max={10} showValue />
        <Rating value={2} max={3} showValue />
      </Cluster>
    </Stack>
  );
}

RatingDemo.demo = { title: "Rating", layer: "atoms", order: 45 } satisfies DemoMeta;
