import { Carousel } from "@sorbet/component-library";

// No real photo assets ship in this repo — styled colored panels stand in for
// slide imagery (labeled, not empty boxes), per the sync's placeholder rule.
function Slide({ gradient, label }: { gradient: string; label: string }) {
  return (
    <div
      style={{
        height: 200,
        borderRadius: "var(--sb-radius-md)",
        background: gradient,
        display: "flex",
        alignItems: "flex-end",
        padding: 16,
        color: "#fff",
        fontWeight: 600,
        fontSize: 16,
        textShadow: "0 1px 3px rgb(0 0 0 / 0.35)",
      }}
    >
      {label}
    </div>
  );
}

const recipes: Array<[string, string]> = [
  ["linear-gradient(135deg, #ff9472, #f2709c)", "Seared salmon grain bowl"],
  ["linear-gradient(135deg, #56ab2f, #a8e063)", "Harvest vegetable salad"],
  ["linear-gradient(135deg, #4568dc, #b06ab3)", "Miso-glazed cod"],
  ["linear-gradient(135deg, #f7971e, #ffd200)", "Roasted squash risotto"],
];

export function Default() {
  return (
    <div style={{ width: 360 }}>
      <Carousel aria-label="This week's recipes">
        {recipes.map(([gradient, label]) => (
          <Slide key={label} gradient={gradient} label={label} />
        ))}
      </Carousel>
    </div>
  );
}

const testimonials: Array<[string, string]> = [
  ["linear-gradient(135deg, #6a11cb, #2575fc)", "“Dinner is figured out for the week — huge relief.” — Dana"],
  ["linear-gradient(135deg, #ee0979, #ff6a00)", "“The kids actually eat the vegetables now.” — Marcus"],
  ["linear-gradient(135deg, #11998e, #38ef7d)", "“Recipes take 25 minutes, exactly as promised.” — Priya"],
];

export function PeekNext() {
  return (
    <Carousel aria-label="Customer testimonials" perView={1.15} gap={4}>
      {testimonials.map(([gradient, label]) => (
        <div
          key={label}
          style={{
            height: 160,
            borderRadius: "var(--sb-radius-md)",
            background: gradient,
            display: "flex",
            alignItems: "center",
            padding: 20,
            color: "#fff",
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          {label}
        </div>
      ))}
    </Carousel>
  );
}

export function ControlsOnly() {
  return (
    <Carousel aria-label="This week's recipes" indicators={false}>
      {recipes.slice(0, 3).map(([gradient, label]) => (
        <Slide key={label} gradient={gradient} label={label} />
      ))}
    </Carousel>
  );
}
