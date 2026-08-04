import { Heading } from "@sorbet/component-library";

export function Levels() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <Heading level={1}>Plan your next trip</Heading>
      <Heading level={2}>Destinations we love</Heading>
      <Heading level={3}>Popular this season</Heading>
      <Heading level={4}>Recently viewed</Heading>
      <Heading level={5}>Traveler tips</Heading>
      <Heading level={6}>Fine print</Heading>
    </div>
  );
}

export function SizeDecoupledFromLevel() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <Heading level={1} size="lg">
        A quieter h1 for a dense dashboard
      </Heading>
      <Heading level={3} size="4xl">
        A section heading that needs to shout
      </Heading>
    </div>
  );
}

export function Aligned() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <Heading level={2} align="center">
        Everything you need to get started
      </Heading>
      <Heading level={4} align="end">
        Checkout
      </Heading>
    </div>
  );
}
