import { Text } from "@sorbet/component-library/atoms";
import { Cluster, Stack } from "@sorbet/component-library/layout";
import { Calendar } from "@sorbet/component-library/molecules";
import { useState } from "react";

import type { DemoMeta } from "./types.ts";

export function CalendarDemo() {
  const [picked, setPicked] = useState<Date | null>(null);
  const today = new Date();
  const min = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const max = new Date(today.getFullYear(), today.getMonth() + 2, 0);

  return (
    <Stack gap={4}>
      <Text tone="muted" size="sm">
        The DatePicker grid without the input or the popover &mdash; for scheduling views and date summaries. Same
        keyboard model: arrows move, Home/End jump the week, PageUp/PageDown change month.
      </Text>

      <Cluster gap={6} align="top">
        <Calendar value={picked} onChange={setPicked} aria-label="Pick a date" />

        <Stack gap={3}>
          <Text size="sm" tone="subtle">
            Selected
          </Text>
          <Text>{picked ? picked.toDateString() : "nothing yet"}</Text>

          <Text size="sm" tone="subtle">
            Bounded &mdash; last month through next, days outside are disabled
          </Text>
          <Calendar min={min} max={max} weekStartsOn={1} aria-label="Bounded calendar, weeks start Monday" />
        </Stack>
      </Cluster>
    </Stack>
  );
}

CalendarDemo.demo = { title: "Calendar", layer: "molecules", order: 13 } satisfies DemoMeta;
