import { Masonry, Text } from "@sorbet/component-library";

const heights = [90, 150, 60, 130, 100, 170, 80, 110];
const chartVar = (i: number) => `var(--sb-chart-${(i % 8) + 1})`;

const brick = (h: number, i: number) =>
  ({
    height: h,
    background: chartVar(i),
    borderRadius: "var(--sb-radius-md)",
    display: "flex",
    alignItems: "flex-end",
    padding: 8,
  }) as const;

const bricks = () =>
  heights.map((h, i) => (
    <div key={i} style={brick(h, i)}>
      <Text size="xs" style={{ color: "var(--sb-text-inverse)" }}>
        {i + 1}
      </Text>
    </div>
  ));

/** Pinterest-style packing: items of different heights fill columns evenly. */
export function Default() {
  return <Masonry min="9rem">{bricks()}</Masonry>;
}

/** Fixed column count instead of auto-fit. */
export function FixedCols() {
  return <Masonry cols={3}>{bricks()}</Masonry>;
}

/** A wider `min` yields fewer, wider columns. */
export function WideColumns() {
  return <Masonry min="16rem">{bricks()}</Masonry>;
}
