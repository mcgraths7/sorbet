import { Button, Card, CardBody, CardFooter, CardHeader, CardTitle, Text } from "@sorbet/component-library";

export function Split() {
  return (
    <Card style={{ maxWidth: 320 }}>
      <CardHeader>
        <CardTitle>Pause deliveries</CardTitle>
      </CardHeader>
      <CardBody>
        <Text tone="muted">Skip next week or pause your subscription entirely — you can resume any time.</Text>
      </CardBody>
      <CardFooter split>
        <Button size="sm" variant="ghost">
          Skip next week
        </Button>
        <Button size="sm" variant="outline">
          Pause subscription
        </Button>
      </CardFooter>
    </Card>
  );
}

export function SingleAction() {
  return (
    <Card style={{ maxWidth: 320 }}>
      <CardHeader>
        <CardTitle>Confirm this week's box</CardTitle>
      </CardHeader>
      <CardBody>
        <Text tone="muted">Locks in Thursday's delivery with your current recipe picks.</Text>
      </CardBody>
      <CardFooter>
        <Button size="sm">Confirm box</Button>
      </CardFooter>
    </Card>
  );
}
