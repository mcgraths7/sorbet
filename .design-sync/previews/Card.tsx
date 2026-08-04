import { Badge, Button, Card, CardBody, CardFooter, CardHeader, CardTitle, Text } from "@sorbet/component-library";

export function Default() {
  return (
    <Card style={{ maxWidth: 320 }}>
      <CardHeader>
        <CardTitle>Plan usage</CardTitle>
      </CardHeader>
      <CardBody>
        <Text tone="muted">You've used 8 of 10 included seats this billing cycle.</Text>
      </CardBody>
      <CardFooter>
        <Button size="sm" variant="outline">
          Manage seats
        </Button>
      </CardFooter>
    </Card>
  );
}

export function Variants() {
  return (
    <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
      {(["default", "raised", "flat", "sunken", "interactive"] as const).map((variant) => (
        <Card key={variant} variant={variant} style={{ width: 180 }}>
          <CardBody>
            <Text weight="semibold">{variant}</Text>
            <Text size="sm" tone="muted">
              Card variant
            </Text>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}

export function FooterSplit() {
  return (
    <Card style={{ maxWidth: 320 }}>
      <CardHeader>
        <CardTitle>Invite teammate</CardTitle>
        <Badge tone="info">Pending</Badge>
      </CardHeader>
      <CardBody>
        <Text tone="muted">alex@acme.com was invited 2 days ago.</Text>
      </CardBody>
      <CardFooter split>
        <Button size="sm" variant="ghost">
          Revoke
        </Button>
        <Button size="sm">Resend invite</Button>
      </CardFooter>
    </Card>
  );
}
