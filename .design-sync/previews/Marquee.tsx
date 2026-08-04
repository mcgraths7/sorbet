import { Marquee, Text } from "@sorbet/component-library";

const brands = ["Northwind", "Acme Kitchens", "Fresh Foundry", "Harborline", "Bramblewood", "Cedar & Co."];

export function Logos() {
  return (
    <Marquee aria-label="Trusted by 200+ kitchens" gap={8}>
      {brands.map((brand) => (
        <Text key={brand} as="span" size="lg" weight="semibold" tone="subtle">
          {brand}
        </Text>
      ))}
    </Marquee>
  );
}

export function Quotes() {
  return (
    <Marquee aria-label="What customers are saying" reverse gap={6}>
      <Text as="span" tone="muted">
        "Dinner planning finally feels solved." — Priya R.
      </Text>
      <Text as="span" tone="muted">
        "The kids actually eat the vegetables now." — Marcus T.
      </Text>
      <Text as="span" tone="muted">
        "Cut our grocery waste in half." — Dana K.
      </Text>
    </Marquee>
  );
}
