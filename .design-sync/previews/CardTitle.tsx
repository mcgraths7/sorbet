import { Badge, Card, CardBody, CardHeader, CardTitle, Text } from "@sorbet/component-library";

export function Default() {
  return (
    <Card style={{ maxWidth: 320 }}>
      <CardHeader>
        <CardTitle>Your plan is active</CardTitle>
      </CardHeader>
      <CardBody>
        <Text tone="muted">Next delivery arrives Thursday, August 6.</Text>
      </CardBody>
    </Card>
  );
}

export function WithBadge() {
  return (
    <Card style={{ maxWidth: 320 }}>
      <CardHeader>
        <CardTitle>Roasted squash risotto with sage brown butter</CardTitle>
        <Badge tone="success">New</Badge>
      </CardHeader>
      <CardBody>
        <Text tone="muted">A longer title wraps onto a second line while staying aligned with its badge.</Text>
      </CardBody>
    </Card>
  );
}
