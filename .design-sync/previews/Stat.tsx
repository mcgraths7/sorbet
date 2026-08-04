import { Sparkline, Stat } from "@sorbet/component-library";

export function Default() {
  return <Stat label="Monthly revenue" value="$48,210" delta="+12.4%" trend="up" />;
}

export function WithSparkline() {
  return (
    <Stat
      label="Active subscribers"
      value="8,412"
      delta="+3.1%"
      trend="up"
      chart={<Sparkline data={[62, 68, 65, 74, 79, 83, 91]} />}
    />
  );
}

export function MultipleStats() {
  return (
    <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
      <Stat label="Orders this week" value="1,284" delta="-4.2%" trend="down" />
      <Stat label="Avg. delivery time" value="38 min" delta="No change" trend="flat" />
      <Stat label="Customer rating" value="4.8" delta="+0.2" trend="up" />
    </div>
  );
}
