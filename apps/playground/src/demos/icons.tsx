import {
  CalendarIcon,
  CheckIcon,
  ChevronIcon,
  CloseIcon,
  EyedropperIcon,
  Icon,
  MinusIcon,
  PlusIcon,
  SearchIcon,
  Text,
  UploadIcon,
  type IconSize,
  type IconTone,
} from "@sorbet/component-library/atoms";
import { Cluster, Stack } from "@sorbet/component-library/layout";

import type { DemoMeta } from "./types.ts";

const GLYPHS = [
  { name: "Check", El: CheckIcon },
  { name: "Chevron", El: ChevronIcon },
  { name: "Close", El: CloseIcon },
  { name: "Search", El: SearchIcon },
  { name: "Calendar", El: CalendarIcon },
  { name: "Upload", El: UploadIcon },
  { name: "Eyedropper", El: EyedropperIcon },
  { name: "Plus", El: PlusIcon },
  { name: "Minus", El: MinusIcon },
];

const SIZES: IconSize[] = ["xs", "sm", "md", "lg", "xl"];
const TONES: IconTone[] = ["muted", "subtle", "primary", "success", "warning", "danger", "info"];

/** A hand-written SVG standing in for a third-party icon (Lucide, Phosphor…).
 *  Drawn with currentColor and no fixed size — the same contract they all use,
 *  which is what lets <Icon> size and color it like a native glyph. */
function ThirdPartyStar(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinejoin="round" {...props}>
      <path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2Z" />
    </svg>
  );
}

export function IconsDemo() {
  return (
    <Stack gap={4}>
      <Text tone="muted" size="sm">
        The glyphs Sorbet's own components use — not a general icon set. Each is a plain SVG drawn with{" "}
        <code>currentColor</code>, so it composes with <code>&lt;Icon&gt;</code> exactly like a third-party one.
      </Text>
      <Cluster gap={4}>
        {GLYPHS.map(({ name, El }) => (
          <Stack key={name} gap={1} style={{ alignItems: "center", inlineSize: "5rem" }}>
            <Icon size="lg">
              <El />
            </Icon>
            <Text size="xs" tone="subtle">
              {name}
            </Text>
          </Stack>
        ))}
      </Cluster>

      <Text tone="muted" size="sm">
        Sizes step through the type scale; with no size an icon matches the text beside it.
      </Text>
      <Cluster gap={4} style={{ alignItems: "baseline" }}>
        {SIZES.map((size) => (
          <Cluster key={size} gap={1} style={{ alignItems: "center" }}>
            <Icon size={size}>
              <SearchIcon />
            </Icon>
            <Text size="xs" tone="subtle">
              {size}
            </Text>
          </Cluster>
        ))}
        <Text size="sm">
          inline with text <Icon><CheckIcon /></Icon> and it tracks the size
        </Text>
      </Cluster>

      <Text tone="muted" size="sm">
        Tones map to the semantic color tokens; anything else inherits <code>currentColor</code>.
      </Text>
      <Cluster gap={3}>
        {TONES.map((tone) => (
          <Icon key={tone} size="lg" tone={tone} label={`${tone} example`}>
            <CheckIcon />
          </Icon>
        ))}
      </Cluster>

      <Text tone="muted" size="sm">
        Bring your own provider — this star is a stand-in for a Lucide/Phosphor icon, sized and toned by the same
        wrapper, no adapter needed.
      </Text>
      <Cluster gap={3} style={{ alignItems: "center" }}>
        <Icon size="xs"><ThirdPartyStar /></Icon>
        <Icon size="sm" tone="muted"><ThirdPartyStar /></Icon>
        <Icon size="lg" tone="warning"><ThirdPartyStar /></Icon>
        <Icon size="xl" tone="primary" label="Featured"><ThirdPartyStar /></Icon>
      </Cluster>
    </Stack>
  );
}

IconsDemo.demo = { title: "Icons", layer: "atoms", order: 15 } satisfies DemoMeta;
