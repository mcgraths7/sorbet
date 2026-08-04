import { Heading, Overline } from "@sorbet/component-library";

export function AboveHeading() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <Overline>New feature</Overline>
      <Heading level={2}>Real-time collaboration</Heading>
    </div>
  );
}

export function SectionKickers() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <Overline>Pricing</Overline>
        <Heading level={3} size="lg">
          Plans for every team size
        </Heading>
      </div>
      <div>
        <Overline>Case study</Overline>
        <Heading level={3} size="lg">
          How Nimbus cut onboarding time by 40%
        </Heading>
      </div>
    </div>
  );
}
