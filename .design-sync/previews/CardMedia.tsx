import { Card, CardBody, CardHeader, CardMedia, CardTitle, Text } from "@sorbet/component-library";

// No real photo asset ships in this repo — an inline SVG data URI stands in
// for a recipe photo. Using a real <img> (rather than a plain styled div)
// matters here specifically: `.sb-card__media img` is what carries the
// aspect-ratio/object-fit rules in _card.scss, so an <img> renders CardMedia
// through its real CSS contract instead of approximating it by hand.
function placeholderPhoto(label: string, color: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><rect width="100%" height="100%" fill="${color}"/><text x="50%" y="50%" font-family="sans-serif" font-size="28" font-weight="600" fill="#fff" text-anchor="middle" dominant-baseline="middle">${label}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export function Default() {
  return (
    <Card style={{ maxWidth: 320 }}>
      <CardMedia>
        <img src={placeholderPhoto("Salmon grain bowl", "#f2709c")} alt="Seared salmon grain bowl" />
      </CardMedia>
      <CardHeader>
        <CardTitle>Seared salmon grain bowl</CardTitle>
      </CardHeader>
      <CardBody>
        <Text tone="muted">25 min · 610 cal per serving</Text>
      </CardBody>
    </Card>
  );
}

export function Collection() {
  return (
    <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
      {(
        [
          ["Harvest vegetable salad", "#56ab2f"],
          ["Miso-glazed cod", "#4568dc"],
        ] as const
      ).map(([label, color]) => (
        <Card key={label} style={{ width: 200 }}>
          <CardMedia>
            <img src={placeholderPhoto(label, color)} alt={label} />
          </CardMedia>
          <CardBody>
            <Text weight="semibold" size="sm">
              {label}
            </Text>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}
