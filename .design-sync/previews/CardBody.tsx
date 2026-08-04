import { Card, CardBody, CardFooter, CardHeader, CardTitle, Text, Button } from "@sorbet/component-library";

export function Default() {
  return (
    <Card style={{ maxWidth: 320 }}>
      <CardHeader>
        <CardTitle>Seared salmon grain bowl</CardTitle>
      </CardHeader>
      <CardBody>
        <Text>Farm-raised salmon over a warm farro and roasted vegetable base, finished with a lemon-herb dressing.</Text>
        <Text tone="muted" size="sm">
          25 min · 610 cal per serving
        </Text>
      </CardBody>
      <CardFooter>
        <Button size="sm">Add to plan</Button>
      </CardFooter>
    </Card>
  );
}

export function WithList() {
  return (
    <Card style={{ maxWidth: 320 }}>
      <CardHeader>
        <CardTitle>Harvest vegetable salad</CardTitle>
      </CardHeader>
      <CardBody>
        <Text tone="muted" size="sm">
          What's in the box:
        </Text>
        <ul style={{ margin: 0, paddingInlineStart: 20 }}>
          <li>
            <Text as="span">Baby kale &amp; arugula</Text>
          </li>
          <li>
            <Text as="span">Roasted squash</Text>
          </li>
          <li>
            <Text as="span">Toasted pepitas</Text>
          </li>
          <li>
            <Text as="span">Maple-cider vinaigrette</Text>
          </li>
        </ul>
      </CardBody>
    </Card>
  );
}
