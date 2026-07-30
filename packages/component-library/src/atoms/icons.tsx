import type { SVGProps } from "react";

/**
 * The glyphs Sorbet's own components need — not a general icon set.
 *
 * They're plain `<svg>`s drawn with `currentColor` and no intrinsic size, the
 * same shape every icon provider ships. So they compose with `<Icon>` exactly
 * like a Lucide or Phosphor icon does, and drop straight into a component that
 * already sizes its own `svg`.
 *
 * Decorative by default (`aria-hidden`); pass `aria-hidden={undefined}` plus a
 * label, or wrap in `<Icon label="…">`, when a glyph carries meaning on its own.
 *
 * House style: `currentColor`, round caps and joins, and a stroke weight that
 * reads as 1.5 on a 16 grid — scaled per viewBox so they all look equally
 * heavy side by side (2.25 on 24, 1.875 on 20).
 */
export type IconGlyphProps = SVGProps<SVGSVGElement>;

const base = {
  "aria-hidden": true,
  focusable: false,
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

export function CheckIcon(props: IconGlyphProps) {
  return (
    <svg viewBox="0 0 16 16" {...base} strokeWidth={1.5} {...props}>
      <path d="M13 4.5 6.5 11 3 7.5" />
    </svg>
  );
}

const ROTATION = { right: undefined, left: "180deg", up: "270deg", down: "90deg" } as const;

export interface ChevronIconProps extends IconGlyphProps {
  /** Which way it points (default "right"). Rotated, so the shape stays identical. */
  direction?: keyof typeof ROTATION;
}

export function ChevronIcon({ direction = "right", style, ...props }: ChevronIconProps) {
  const rotate = ROTATION[direction];
  return (
    <svg
      viewBox="0 0 16 16"
      {...base}
      strokeWidth={1.5}
      style={rotate ? { rotate, ...style } : style}
      {...props}
    >
      <path d="m6 3 5 5-5 5" />
    </svg>
  );
}

export function CloseIcon(props: IconGlyphProps) {
  return (
    <svg viewBox="0 0 16 16" {...base} strokeWidth={1.5} {...props}>
      <path d="M4 4l8 8M12 4l-8 8" />
    </svg>
  );
}

export function SearchIcon(props: IconGlyphProps) {
  // 20 grid: 1.5 × (20/16) = 1.875 keeps the weight matched to the 16-grid set.
  return (
    <svg viewBox="0 0 20 20" {...base} strokeWidth={1.875} {...props}>
      <circle cx="9" cy="9" r="5.5" />
      <path d="M13.5 13.5 17.5 17.5" />
    </svg>
  );
}

export function CalendarIcon(props: IconGlyphProps) {
  return (
    <svg viewBox="0 0 16 16" {...base} strokeWidth={1.5} {...props}>
      <rect x="2" y="3" width="12" height="11" rx="1.5" />
      <path d="M2 6h12M5 1.5v3M11 1.5v3" />
    </svg>
  );
}

export function UploadIcon(props: IconGlyphProps) {
  // 24 grid: 1.5 × (24/16) = 2.25.
  return (
    <svg viewBox="0 0 24 24" {...base} strokeWidth={2.25} {...props}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="m17 8-5-5-5 5" />
      <path d="M12 3v12" />
    </svg>
  );
}

export function EyedropperIcon(props: IconGlyphProps) {
  return (
    <svg viewBox="0 0 16 16" {...base} strokeWidth={1.5} {...props}>
      <path d="M10.5 2.5a1.6 1.6 0 0 1 2.3 2.3l-1 1 .8.8-1 1-.8-.8-4.2 4.2c-.2.2-.4.3-.7.4l-2.3.6.6-2.3c.1-.3.2-.5.4-.7l4.2-4.2-.8-.8 1-1 .8.8 1-1Z" />
    </svg>
  );
}

export function PlusIcon(props: IconGlyphProps) {
  return (
    <svg viewBox="0 0 16 16" {...base} strokeWidth={1.5} {...props}>
      <path d="M3.5 8h9M8 3.5v9" />
    </svg>
  );
}

export function MinusIcon(props: IconGlyphProps) {
  return (
    <svg viewBox="0 0 16 16" {...base} strokeWidth={1.5} {...props}>
      <path d="M3.5 8h9" />
    </svg>
  );
}
