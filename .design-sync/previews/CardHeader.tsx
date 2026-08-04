import { Badge, Card, CardBody, CardFooter, CardHeader, CardTitle, Text, Button } from "@sorbet/component-library";

export function Default() {
  return (
    <Card style={{ maxWidth: 320 }}>
      <CardHeader>
        <CardTitle>Weekly delivery</CardTitle>
        <Badge tone="info">Ships Thu</Badge>
      </CardHeader>
      <CardBody>
        <Text tone="muted">3 recipes, 2 servings each — arrives between 8am and 6pm.</Text>
      </CardBody>
      <CardFooter>
        <Button size="sm" variant="outline">
          Change recipes
        </Button>
      </CardFooter>
    </Card>
  );
}

export function TitleOnly() {
  return (
    <Card style={{ maxWidth: 320 }}>
      <CardHeader>
        <CardTitle>Recipe of the week</CardTitle>
      </CardHeader>
      <CardBody>
        <Text tone="muted">Miso-glazed cod with charred broccolini and sesame rice.</Text>
      </CardBody>
    </Card>
  );
}
