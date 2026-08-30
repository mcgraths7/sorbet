import { Text } from "@sorbet/component-library/atoms";
import { Grid, Stack } from "@sorbet/component-library/layout";
import { Card, CardBody, DescriptionDetail, DescriptionItem, DescriptionList, DescriptionTerm } from "@sorbet/component-library/molecules";

import type { DemoMeta } from "./types.ts";

export function DescriptionListDemo() {
  return (
    <Stack gap={4}>
      <Text tone="muted" size="sm">
        Term/value pairs. Reach for this over a two-column table: labelled facts have no meaningful second axis, so a
        table&rsquo;s row/column semantics describe them wrongly and force a sideways scroll on a phone.
      </Text>

      <Grid cols={2}>
        <Card>
          <CardBody>
            <Text size="sm" tone="subtle">
              stacked &mdash; the default, safest when narrow
            </Text>
            <DescriptionList>
              <DescriptionItem term="Servings">4</DescriptionItem>
              <DescriptionItem term="Total time">1 hr 10 min</DescriptionItem>
              <DescriptionItem term="Containers">3 &times; medium, 1 &times; tall</DescriptionItem>
            </DescriptionList>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Text size="sm" tone="subtle">
              inline + divided &mdash; the receipt shape, tabular figures
            </Text>
            <DescriptionList layout="inline" divided>
              <DescriptionItem term="Calories">620</DescriptionItem>
              <DescriptionItem term="Protein">41 g</DescriptionItem>
              <DescriptionItem term="Carbohydrate">48 g</DescriptionItem>
              <DescriptionItem term="Fat">27 g</DescriptionItem>
            </DescriptionList>
          </CardBody>
        </Card>
      </Grid>

      <Text tone="muted" size="sm">
        One term can carry several values &mdash; drop to the raw parts for that.
      </Text>
      <Card>
        <CardBody>
          <DescriptionList>
            <DescriptionTerm>Safe internal temperature</DescriptionTerm>
            <DescriptionDetail>Poultry &mdash; 165&deg;F</DescriptionDetail>
            <DescriptionDetail>Ground meat &mdash; 160&deg;F</DescriptionDetail>
            <DescriptionDetail>Whole cuts &mdash; 145&deg;F, rested 3 min</DescriptionDetail>
          </DescriptionList>
        </CardBody>
      </Card>
    </Stack>
  );
}

DescriptionListDemo.demo = { title: "Description list", layer: "molecules", order: 12 } satisfies DemoMeta;
