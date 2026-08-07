import { Cluster, Frame, Grid, GridSpan2, Layer, LayerContent, Split, SplitAside, SplitMain, Stack } from "@sorbet/component-library/layout";
import { Card, CardBody, CardHeader } from "@sorbet/component-library/molecules";

import type { DemoMeta } from "./types.ts";
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
      <GridSpan2>
        <Card>
          <CardBody>
            <Stack gap={2}>
              <CardHeader className="sb-overline">Layer</CardHeader>
              <Grid cols={2} gap={4}>
                <Layer scrim round>
                  <Frame ratio="16 / 9">
                    <div
                      style={{
                        inlineSize: "100%",
                        blockSize: "100%",
                        background: "linear-gradient(135deg, var(--sb-primary), var(--sb-accent))",
                      }}
                    />
                  </Frame>
                  <LayerContent>
                    <strong>Bottom band</strong>
                    <div style={{ fontSize: "var(--sb-text-sm)" }}>scrim gradient, place=&quot;end&quot;</div>
                  </LayerContent>
                </Layer>
                <Layer scrim place="center" round>
                  <Frame ratio="16 / 9">
                    <div
                      style={{
                        inlineSize: "100%",
                        blockSize: "100%",
                        background: "linear-gradient(135deg, var(--sb-accent), var(--sb-secondary))",
                      }}
                    />
                  </Frame>
                  <LayerContent>
                    <strong>Centered</strong>
                    <div style={{ fontSize: "var(--sb-text-sm)" }}>even scrim, place=&quot;center&quot;</div>
                  </LayerContent>
                </Layer>
              </Grid>
            </Stack>
          </CardBody>
        </Card>
      </GridSpan2>
    </Grid>
  );
}

LayoutDemo.demo = { title: "Layout", layer: "layout", order: 10 } satisfies DemoMeta;
