import { Frame } from "@sorbet/component-library";

const fill = (from: string, to: string) =>
  ({
    width: "100%",
    height: "100%",
    background: `linear-gradient(135deg, var(${from}), var(${to}))`,
  }) as const;

/** Default 16:9 media box: fixed ratio, content fills and crops. */
export function Default() {
  return (
    <div style={{ width: 320 }}>
      <Frame>
        <div style={fill("--sb-primary-subtle", "--sb-accent-subtle")} />
      </Frame>
    </div>
  );
}

/** Square ratio via the `ratio` prop. */
export function Square() {
  return (
    <div style={{ width: 220 }}>
      <Frame ratio={1}>
        <div style={fill("--sb-info-subtle", "--sb-primary-subtle")} />
      </Frame>
    </div>
  );
}

/** Portrait ratio with rounded corners. */
export function PortraitRound() {
  return (
    <div style={{ width: 200 }}>
      <Frame ratio="3 / 4" round>
        <div style={fill("--sb-success-subtle", "--sb-accent-subtle")} />
      </Frame>
    </div>
  );
}
