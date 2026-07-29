import { Cluster, Grid, GridSpan2, Split, SplitAside, SplitMain, Stack } from "@sorbet/component-library/layout";
import { Card, CardBody, CardHeader } from "@sorbet/component-library/molecules";

import type { Demo } from "./types.ts";
import type { CSSProperties } from "react";

const demoBox: CSSProperties = {
  padding: "var(--sb-space-3)",
  borderRadius: "var(--sb-radius-sm)",
  background: "var(--sb-primary-subtle)",
  color: "var(--sb-primary-text)",
  fontSize: "var(--sb-text-sm)",
  fontWeight: "var(--sb-weight-medium)" as "500",
  textAlign: "center",
};

export function LayoutDemo() {
  return (
    <Grid cols={2}>
      <Card>
        <CardBody>
          <Stack gap={2}>
            <CardHeader className="sb-overline">Stack</CardHeader>
            <div style={demoBox}>one</div>
            <div style={demoBox}>two</div>
          </Stack>
        </CardBody>
      </Card>
      <Card>
        <CardBody>
          <Stack gap={2}>
            <CardHeader className="sb-overline">Cluster</CardHeader>
            <Cluster gap={2}>
              <div style={demoBox}>chip</div>
              <div style={demoBox}>wrap</div>
              <div style={demoBox}>gap</div>
            </Cluster>
          </Stack>
        </CardBody>
      </Card>
      <GridSpan2>
        <Card>
          <CardBody>
            <Stack gap={2}>
              <CardHeader className="sb-overline">Split</CardHeader>
              <Split aside="8rem">
                <SplitAside>
                  <div style={demoBox}>aside</div>
                </SplitAside>
                <SplitMain>
                  <div style={demoBox}>main takes the rest, stacks when narrow</div>
                </SplitMain>
              </Split>
            </Stack>
          </CardBody>
        </Card>
      </GridSpan2>
    </Grid>
  );
}

export const demo: Demo = { title: "Layout", layer: "layout", order: 10, Component: LayoutDemo };
