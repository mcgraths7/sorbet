import { Button, Heading, NumberInput, Select, Text } from "@sorbet/component-library/atoms";
import { Cluster, Grid, Split, SplitAside, SplitMain, Stack } from "@sorbet/component-library/layout";
import {
  Section,
  Card,
  CardBody,
  CardFooter,
  DatePicker,
  Field,
  MultiCombobox,
  Segment,
  SegmentedControl,
  Table,
  TableBody,
  TableCell,
  TableFoot,
  TableHeaderCell,
  TableRow,
  useToast,
} from "@sorbet/component-library/molecules";
import { useState } from "react";

const DIETS = [
  { value: "veggie", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
  { value: "pescatarian", label: "Pescatarian" },
  { value: "gluten-free", label: "Gluten free" },
  { value: "dairy-free", label: "Dairy free" },
  { value: "no-pork", label: "No pork" },
];

/** Per-serving price falls as the box grows — the maths the summary explains. */
const PRICE_PER_SERVING = { 2: 6.5, 4: 5.75, 6: 4.95 } as const;
const money = (n: number) => n.toLocaleString("en-GB", { style: "currency", currency: "GBP" });

export function PlanBuilder() {
  const toast = useToast();
  const [servings, setServings] = useState<"2" | "4" | "6">("4");
  const [meals, setMeals] = useState<number | null>(3);
  const [diets, setDiets] = useState<string[]>(["veggie"]);

  const perServing = PRICE_PER_SERVING[Number(servings) as keyof typeof PRICE_PER_SERVING];
  const portions = Number(servings) * (meals ?? 0);
  const subtotal = portions * perServing;
  const delivery = subtotal > 40 ? 0 : 3.99;

  return (
    <Section
      id="build"
      title="Build your box"
      description="Change anything week to week — this is just where you start."
    >

      <Split aside="22rem">
        <SplitMain>
          <Card>
            <CardBody>
              <Grid cols={2}>
                <Field label="How many are eating?" hint="Per meal, not per week.">
                  <SegmentedControl
                    aria-label="Servings per meal"
                    value={servings}
                    onValueChange={(v) => setServings(v as "2" | "4" | "6")}
                  >
                    <Segment value="2">2 people</Segment>
                    <Segment value="4">4 people</Segment>
                    <Segment value="6">6 people</Segment>
                  </SegmentedControl>
                </Field>

                <Field label="Meals per week" hint="Between 2 and 5.">
                  <NumberInput
                    value={meals}
                    onValueChange={setMeals}
                    min={2}
                    max={5}
                    aria-label="Meals per week"
                  />
                </Field>

                <Field label="Delivery day">
                  <Select defaultValue="Thursday">
                    <option>Monday</option>
                    <option>Tuesday</option>
                    <option>Wednesday</option>
                    <option>Thursday</option>
                    <option>Friday</option>
                  </Select>
                </Field>

                <Field label="First delivery" hint="Anything from tomorrow onward.">
                  <DatePicker format="dd/mm/yyyy" name="first-delivery" disablePast />
                </Field>

                <Field
                  label="Dietary preferences"
                  hint="We'll only ever show recipes that match."
                  optional
                >
                  <MultiCombobox
                    options={DIETS}
                    value={diets}
                    onValueChange={setDiets}
                    placeholder="Add a preference…"
                    name="diets"
                  />
                </Field>
              </Grid>
            </CardBody>
          </Card>
        </SplitMain>

        <SplitAside>
          <Card variant="sunken">
            <CardBody>
              <Stack gap={3}>
                <Heading level={3} size="lg">
                  Your box
                </Heading>
                <Table wrap={false}>
                  <TableBody>
                    <TableRow>
                      <TableHeaderCell scope="row">Meals</TableHeaderCell>
                      <TableCell numeric>{meals ?? 0} per week</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableHeaderCell scope="row">Servings</TableHeaderCell>
                      <TableCell numeric>{portions} portions</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableHeaderCell scope="row">Per serving</TableHeaderCell>
                      <TableCell numeric>{money(perServing)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableHeaderCell scope="row">Delivery</TableHeaderCell>
                      <TableCell numeric>{delivery === 0 ? "Free" : money(delivery)}</TableCell>
                    </TableRow>
                  </TableBody>
                  <TableFoot>
                    <TableRow>
                      <TableHeaderCell scope="row">Weekly total</TableHeaderCell>
                      <TableCell numeric>{money(subtotal + delivery)}</TableCell>
                    </TableRow>
                  </TableFoot>
                </Table>
                <Text size="sm" tone="subtle">
                  {delivery === 0
                    ? "Free delivery — your box is over £40."
                    : `Spend ${money(40 - subtotal)} more for free delivery.`}
                </Text>
              </Stack>
            </CardBody>
            <CardFooter>
              <Cluster gap={2}>
                <Button
                  onClick={() =>
                    toast(`Box saved — ${meals ?? 0} meals for ${servings}.`, {
                      title: "Nice one",
                      tone: "success",
                    })
                  }
                >
                  Start this plan
                </Button>
              </Cluster>
            </CardFooter>
          </Card>
        </SplitAside>
      </Split>
    </Section>
  );
}
