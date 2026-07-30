import {
  Avatar,
  AvatarGroup,
  Badge,
  Chip,
  Kbd,
  Progress,
  Skeleton,
  Spinner,
} from "@sorbet/component-library/atoms";
import { Cluster, Grid, Stack } from "@sorbet/component-library/layout";
import { useState } from "react";

import type { DemoMeta } from "./types.ts";

export function IndicatorsDemo() {
  const [chips, setChips] = useState(["Design", "Engineering", "Research"]);
  return (
    <>
      <Cluster>
        <Badge>Neutral</Badge>
        <Badge tone="primary">Primary</Badge>
        <Badge tone="success" dot>
          Active
        </Badge>
        <Badge tone="warning">Pending</Badge>
        <Badge tone="danger" solid>
          Failed
        </Badge>
        {chips.map((c) => (
          <Chip key={c} selected={c === "Design"} onRemove={() => setChips(chips.filter((x) => x !== c))}>
            {c}
          </Chip>
        ))}
        <AvatarGroup>
          <Avatar>AL</Avatar>
          <Avatar>GH</Avatar>
          <Avatar>+3</Avatar>
        </AvatarGroup>
        <Spinner />
        <Kbd>esc</Kbd>
      </Cluster>
      <Grid cols={2}>
        <Stack gap={2}>
          <Progress value={65} label="Upload" />
          <Progress value={100} tone="success" label="Complete" />
          <Progress indeterminate label="Working" />
        </Stack>
        <Skeleton lines={3} />
      </Grid>
    </>
  );
}

IndicatorsDemo.demo = { title: "Badges, chips & indicators", layer: "atoms", order: 40 } satisfies DemoMeta;
