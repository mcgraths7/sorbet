import { Badge, Button, Progress, Rating, Text } from "@sorbet/component-library/atoms";
import { Cluster, Grid, Stack } from "@sorbet/component-library/layout";
import {
  Alert,
  Card,
  CardBody,
  Section,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  useToast,
} from "@sorbet/component-library/molecules";

import { FEEDBACK, FULFILMENT, LOW_STOCK } from "../data.ts";

export function Kitchen() {
  const toast = useToast();
  const behind = FULFILMENT.filter((l) => l.done / l.total < 0.5);

  return (
    <Section id="kitchen" title="Kitchen" description="Packing progress and anything about to run out." gap={4}>
      {behind.length > 0 && (
        <Alert tone="warning" title={`${behind.length} line${behind.length === 1 ? "" : "s"} behind schedule`}>
          {behind.map((l) => l.line).join(", ")} — under half packed with dispatch at 16:00.
        </Alert>
      )}

      <Grid cols={2}>
        <Card>
          <CardBody>
            <Stack gap={4}>
              <Text weight="semibold">Today's packing</Text>
              {FULFILMENT.map((line) => {
                const pct = Math.round((line.done / line.total) * 100);
                return (
                  <Stack key={line.line} gap={1}>
                    <Cluster justify="between">
                      <Text size="sm">{line.line}</Text>
                      <Text size="sm" tone="subtle">
                        {line.done} / {line.total}
                      </Text>
                    </Cluster>
                    <Progress
                      value={pct}
                      tone={pct >= 90 ? "success" : pct < 50 ? "warning" : undefined}
                      label={`${line.line} packing progress`}
                    />
                  </Stack>
                );
              })}
            </Stack>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Stack gap={3}>
              <Cluster justify="between">
                <Text weight="semibold">Low stock</Text>
                <Button size="sm" variant="outline" onClick={() => toast("Purchase order drafted for 3 items.")}>
                  Reorder all
                </Button>
              </Cluster>
              <Table wrap={false} compact>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell scope="col">Item</TableHeaderCell>
                    <TableHeaderCell scope="col">Supplier</TableHeaderCell>
                    <TableHeaderCell scope="col" numeric>
                      On hand
                    </TableHeaderCell>
                    <TableHeaderCell scope="col" numeric>
                      Needed
                    </TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {LOW_STOCK.map((row) => (
                    <TableRow key={row.item}>
                      <TableHeaderCell scope="row">{row.item}</TableHeaderCell>
                      <TableCell>{row.supplier}</TableCell>
                      <TableCell numeric>
                        <Badge tone={row.onHand / row.needed < 0.4 ? "danger" : "warning"}>{row.onHand}</Badge>
                      </TableCell>
                      <TableCell numeric>{row.needed}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Stack>
          </CardBody>
        </Card>
      </Grid>
    </Section>
  );
}

export function Feedback() {
  return (
    <Section id="feedback" title="Recent feedback" description="Anything under four stars gets a look on Monday.">
      <Grid cols={3}>
        {FEEDBACK.map((item) => (
          <Card key={item.id} variant="sunken">
            <CardBody>
              <Stack gap={3}>
                <Cluster justify="between">
                  <Text weight="semibold" size="sm">
                    {item.meal}
                  </Text>
                  <Rating value={item.rating} size="sm" tone={item.rating < 4 ? "danger" : "warning"} />
                </Cluster>
                <Text size="sm">“{item.note}”</Text>
                <Text size="xs" tone="subtle">
                  {item.who}
                </Text>
              </Stack>
            </CardBody>
          </Card>
        ))}
      </Grid>
    </Section>
  );
}
