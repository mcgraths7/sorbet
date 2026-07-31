import { Avatar, Badge, Button, CheckIcon, Icon, Text } from "@sorbet/component-library/atoms";
import { Cluster, Grid, Stack } from "@sorbet/component-library/layout";
import {
  Section,
  Accordion,
  AccordionItem,
  Card,
  CardBody,
  Carousel,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@sorbet/component-library/molecules";

const QUOTES = [
  {
    quote: "We went from three takeaways a week to none. The 15-minute recipes are the reason it stuck.",
    name: "Priya R.",
    detail: "Bristol · 14 months",
    initials: "PR",
  },
  {
    quote: "I cook for one and still don't waste anything. The portions are genuinely portions.",
    name: "Marcus O.",
    detail: "Leeds · 8 months",
    initials: "MO",
  },
  {
    quote: "The kids eat what we eat now. That alone is worth the money.",
    name: "Hannah & Tom",
    detail: "Cardiff · 2 years",
    initials: "HT",
  },
  {
    quote: "Skipped six weeks over summer with two taps. No guilt-trip emails.",
    name: "Dee L.",
    detail: "Glasgow · 11 months",
    initials: "DL",
  },
];

const PLANS = [
  { name: "Taster", meals: "2 / week", perServing: "£6.50", delivery: "£3.99", best: false },
  { name: "Regular", meals: "3–4 / week", perServing: "£5.75", delivery: "Free", best: true },
  { name: "Full house", meals: "5 / week", perServing: "£4.95", delivery: "Free", best: false },
];

const FAQS = [
  {
    q: "Can I skip a week?",
    a: "Yes — skip, pause or cancel any week up to Thursday. No fees, no phone call, no retention email.",
  },
  {
    q: "How does it arrive?",
    a: "Chilled, in an insulated box that stays cold for 12 hours. Everything is recyclable kerbside except the liner, which we take back.",
  },
  {
    q: "What if I don't like a recipe?",
    a: "Tell us and that meal is free. We also stop showing you anything with those ingredients.",
  },
  {
    q: "Do you deliver to my area?",
    a: "We cover mainland UK. Enter a postcode at checkout and we'll confirm the day before you pay.",
  },
];

export function Testimonials() {
  return (
    <Section
      title="Cooks who stuck with it"
      description="The honest test of a meal kit is month six, not week one."
    >
      <Carousel aria-label="Customer stories" perView={2} gap={4}>
        {QUOTES.map((item) => (
          <Card key={item.name} variant="sunken">
            <CardBody>
              <Stack gap={4}>
                <Text size="lg">“{item.quote}”</Text>
                <Cluster gap={3}>
                  <Avatar>{item.initials}</Avatar>
                  <Stack gap={0}>
                    <Text weight="semibold">{item.name}</Text>
                    <Text size="sm" tone="subtle">
                      {item.detail}
                    </Text>
                  </Stack>
                </Cluster>
              </Stack>
            </CardBody>
          </Card>
        ))}
      </Carousel>
    </Section>
  );
}

export function Plans() {
  return (
    <Section
      id="plans"
      title="Plans & pricing"
      description="Per serving, and it drops as the box grows. Cancel whenever."
    >

      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell scope="col">Plan</TableHeaderCell>
            <TableHeaderCell scope="col">Meals</TableHeaderCell>
            <TableHeaderCell scope="col" numeric>
              Per serving
            </TableHeaderCell>
            <TableHeaderCell scope="col" numeric>
              Delivery
            </TableHeaderCell>
            <TableHeaderCell scope="col" />
          </TableRow>
        </TableHead>
        <TableBody>
          {PLANS.map((plan) => (
            <TableRow key={plan.name}>
              <TableHeaderCell scope="row">
                <Cluster gap={2}>
                  {plan.name}
                  {plan.best && <Badge tone="success">Most popular</Badge>}
                </Cluster>
              </TableHeaderCell>
              <TableCell>{plan.meals}</TableCell>
              <TableCell numeric>{plan.perServing}</TableCell>
              <TableCell numeric>{plan.delivery}</TableCell>
              <TableCell numeric>
                <Button size="sm" variant={plan.best ? "primary" : "outline"} as="a" href="#build">
                  Choose
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Grid cols={3}>
        {["Skip any week", "No lock-in contract", "Free delivery over £40"].map((perk) => (
          <Cluster key={perk} gap={2}>
            <Icon tone="success">
              <CheckIcon />
            </Icon>
            <Text size="sm">{perk}</Text>
          </Cluster>
        ))}
      </Grid>
    </Section>
  );
}

export function Faq() {
  return (
    <Section id="faq" title="Questions we actually get">
      <Accordion name="faq">
        {FAQS.map((item, i) => (
          <AccordionItem key={item.q} name="faq" summary={item.q} defaultOpen={i === 0}>
            {item.a}
          </AccordionItem>
        ))}
      </Accordion>
    </Section>
  );
}
