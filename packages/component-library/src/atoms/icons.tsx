import { cx, type Tone } from "../core/index.ts";

import type { ReactElement, SVGProps } from "react";

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
 * heavy side by side (2.25 on 24, 1.875 on 20). The four status glyphs at the
 * end are the exception: filled shapes with the symbol cut out, below.
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

// ----- status glyphs ----------------------------------------------------------
//
// A status is told apart by its SHAPE, never by its colour alone: a tick in a
// circle (success), an exclamation mark in a triangle (warning), a cross in an
// octagon (danger), an i in a rounded square (info). Each is a silhouette
// filled in `currentColor` with the symbol knocked out, so the surface under
// the icon shows through the symbol and the icon has exactly one colour pair:
// its ink against what it sits on (legibility-spec.md L169, L170).
//
// The knock-out is ONE path under the even-odd rule: the first subpath is the
// silhouette and the others are the symbol, each a hole. So the symbol's
// subpaths never overlap one another (the cross is one outline, the union of
// its two strokes: two overlapping subpaths would fill the centre again), and
// nothing is referenced by id: a <mask> needs an id unique in the document,
// which needs a hook, which would make this a client module. No colour is
// written anywhere in a glyph.
//
// The geometry is the status-icons sheet's, on a 24 grid, written as outlines:
// the silhouette includes the sheet's 2-unit round-joined stroke (a disc of
// radius 11; the triangle and octagon grown by 1 with round corners; the
// square from 1 to 23 with corner radius 5.5), and the symbol is the sheet's
// 2.6-unit round-capped strokes and its two dots of radius 1.61.
//
// Sized by the stylesheet (`.sb-status-icon`, 1.1em), so like the house
// glyphs above they have no intrinsic size.

const STATUS_PATHS: Record<Tone, string> = {
  success:
    "M1 12A11 11 0 1 0 23 12A11 11 0 1 0 1 12Z" +
    "M6.581 13.419L9.581 16.419A1.3 1.3 0 0 0 11.455 16.382L17.455 9.882A1.3 1.3 0 0 0 15.545 8.118L10.462 13.624L8.419 11.581A1.3 1.3 0 0 0 6.581 13.419Z",
  warning:
    "M12.868 2.303L23.068 20.103A1 1 0 0 1 22.2 21.6L1.8 21.6A1 1 0 0 1 0.932 20.103L11.132 2.303A1 1 0 0 1 12.868 2.303Z" +
    "M10.7 9.3A1.3 1.3 0 0 1 13.3 9.3V13.9A1.3 1.3 0 0 1 10.7 13.9Z" +
    "M10.39 17.2A1.61 1.61 0 1 0 13.61 17.2A1.61 1.61 0 1 0 10.39 17.2Z",
  danger:
    "M8.1 0.8L15.9 0.8A1 1 0 0 1 16.607 1.093L22.907 7.393A1 1 0 0 1 23.2 8.1L23.2 15.9A1 1 0 0 1 22.907 16.607" +
    "L16.607 22.907A1 1 0 0 1 15.9 23.2L8.1 23.2A1 1 0 0 1 7.393 22.907L1.093 16.607A1 1 0 0 1 0.8 15.9L0.8 8.1" +
    "A1 1 0 0 1 1.093 7.393L7.393 1.093A1 1 0 0 1 8.1 0.8Z" +
    "M12 10.162L14.281 7.881A1.3 1.3 0 0 1 16.119 9.719L13.838 12L16.119 14.281A1.3 1.3 0 0 1 14.281 16.119L12 13.838" +
    "L9.719 16.119A1.3 1.3 0 0 1 7.881 14.281L10.162 12L7.881 9.719A1.3 1.3 0 0 1 9.719 7.881Z",
  info:
    "M6.5 1H17.5A5.5 5.5 0 0 1 23 6.5V17.5A5.5 5.5 0 0 1 17.5 23H6.5A5.5 5.5 0 0 1 1 17.5V6.5A5.5 5.5 0 0 1 6.5 1Z" +
    "M10.39 7.6A1.61 1.61 0 1 0 13.61 7.6A1.61 1.61 0 1 0 10.39 7.6Z" +
    "M10.7 11A1.3 1.3 0 0 1 13.3 11V17A1.3 1.3 0 0 1 10.7 17Z",
};

function statusGlyph(tone: Tone, { className, ...props }: IconGlyphProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      focusable={false}
      {...props}
      className={cx("sb-status-icon", `sb-status-icon--${tone}`, className)}
    >
      <path fill="currentColor" fillRule="evenodd" d={STATUS_PATHS[tone]} />
    </svg>
  );
}

/** Success: a tick knocked out of a circle. */
export function SuccessIcon(props: IconGlyphProps) {
  return statusGlyph("success", props);
}

/** Warning: an exclamation mark knocked out of a triangle. */
export function WarningIcon(props: IconGlyphProps) {
  return statusGlyph("warning", props);
}

/** Danger: a cross knocked out of an octagon. */
export function DangerIcon(props: IconGlyphProps) {
  return statusGlyph("danger", props);
}

/** Info: an i knocked out of a rounded square. */
export function InfoIcon(props: IconGlyphProps) {
  return statusGlyph("info", props);
}

// ----- internal: for the status components only, not exported by the barrel --

/** Which glyph each status takes. Internal (not in `atoms/index.ts`). */
export const STATUS_GLYPHS: Record<Tone, (props: IconGlyphProps) => ReactElement> = {
  success: SuccessIcon,
  warning: WarningIcon,
  danger: DangerIcon,
  info: InfoIcon,
};

/**
 * The word a screen reader says before a status's own words. "Error", not
 * "Danger": the tone is named for the colour's job, the word for what a
 * listener needs. "Information", not "Info": a word a reader says, not an
 * abbreviation it may spell out. The slot adds the colon and the space.
 * Internal (not in `atoms/index.ts`).
 */
export const STATUS_WORDS: Record<Tone, string> = {
  success: "Success",
  warning: "Warning",
  danger: "Error",
  info: "Information",
};

export interface StatusMarkProps {
  tone: Tone;
  /** Replaces the word (another language); trimmed, and an empty one gives the default. */
  statusLabel?: string;
  /** The danger button and the danger menu item: their label is their word. */
  wordless?: boolean;
  /** Added after `sb-status`: the alert's and the toast's slot box. */
  className?: string;
}

/**
 * The status slot: the glyph and, unless `wordless`, the visually hidden word,
 * in one positioned span. It is the word's containing block (the word is
 * `position: absolute`), so the word stays inside its component and inside
 * any scroller round it. The only place the slot's markup is written. Every
 * status component renders it from its status, so a status cannot render
 * without its icon and word (legibility-spec.md L168, L171, L186).
 * Internal (not in `atoms/index.ts`).
 */
export function StatusMark({ tone, statusLabel, wordless, className }: StatusMarkProps) {
  const Glyph = STATUS_GLYPHS[tone];
  const word = statusLabel?.trim() || STATUS_WORDS[tone];
  return (
    <span className={cx("sb-status", className)}>
      <Glyph />
      {!wordless && <span className="u-visually-hidden">{`${word}: `}</span>}
    </span>
  );
}
