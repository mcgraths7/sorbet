/**
 * Pure date helpers for DatePicker — format masking, parsing a typed string
 * against a format, the simple validity/reasonableness checks, and the month
 * grid for the calendar. No React, no DOM: all string and number math, so the
 * masking and validation are trivially testable and reusable.
 */

export type DatePart = "y" | "m" | "d";

/** One piece of a parsed format: either a value segment or a literal char. */
type TemplateItem = { kind: "seg"; part: DatePart; length: number } | { kind: "lit"; char: string };

export interface DateFormatSpec {
  /** The original format string, e.g. "yyyy/mm/dd". */
  format: string;
  /** Segments + literals in order — the mask walks this. */
  template: TemplateItem[];
  /** Just the value segments, in order. */
  segments: { part: DatePart; length: number }[];
  /** First literal char, used as the canonical separator. */
  separator: string;
}

/**
 * Split a format like "yyyy/mm/dd" into ordered value segments and the literal
 * separators between them. Runs of y/m/d (case-insensitive) become segments;
 * everything else is a literal.
 */
export function parseFormat(format: string): DateFormatSpec {
  const template: TemplateItem[] = [];
  const lower = format.toLowerCase();
  let i = 0;
  while (i < lower.length) {
    const c = lower[i];
    if (c === "y" || c === "m" || c === "d") {
      let j = i;
      while (j < lower.length && lower[j] === c) {
        j++;
      }
      template.push({ kind: "seg", part: c, length: j - i });
      i = j;
    } else {
      template.push({ kind: "lit", char: format.charAt(i) });
      i++;
    }
  }
  const segments = template.flatMap((t) => (t.kind === "seg" ? [{ part: t.part, length: t.length }] : []));
  const firstLit = template.find((t) => t.kind === "lit");
  return { format, template, segments, separator: firstLit && firstLit.kind === "lit" ? firstLit.char : "/" };
}

/** Total number of digits a fully-typed value holds for this format. */
export function totalDigits(spec: DateFormatSpec): number {
  return spec.segments.reduce((n, s) => n + s.length, 0);
}

/**
 * Re-mask raw typed text against the format: strip non-digits, distribute them
 * across the segments, and re-insert the literal separators. When `growing`
 * (the user is adding, not deleting), a full segment gets its trailing
 * separator so "12" shows as "12/" — but never while deleting, so a backspace
 * can cross the separator instead of the mask re-adding it.
 */
export function formatDateInput(raw: string, spec: DateFormatSpec, growing: boolean): string {
  const digits = raw.replace(/\D/g, "").slice(0, totalDigits(spec));
  let out = "";
  let di = 0;
  for (let t = 0; t < spec.template.length; t++) {
    const item = spec.template[t];
    if (!item) {
      break;
    }
    if (item.kind === "seg") {
      const take = Math.min(item.length, digits.length - di);
      if (take <= 0) {
        break;
      }
      out += digits.slice(di, di + take);
      di += take;
      if (di >= digits.length) {
        const next = spec.template[t + 1];
        if (growing && take === item.length && next && next.kind === "lit") {
          out += next.char;
        }
        break;
      }
    } else if (di < digits.length) {
      out += item.char;
    } else {
      break;
    }
  }
  return out;
}

export interface DateParts {
  year: number;
  month: number;
  day: number;
}

/** Pull numeric year/month/day out of a fully-typed value; null if short. */
export function parseParts(value: string, spec: DateFormatSpec): DateParts | null {
  const digits = value.replace(/\D/g, "");
  if (digits.length < totalDigits(spec)) {
    return null;
  }
  const parts: Partial<DateParts> = {};
  let di = 0;
  for (const seg of spec.segments) {
    const n = Number(digits.slice(di, di + seg.length));
    di += seg.length;
    if (seg.part === "y") {
      // A 2-digit year pivots into the 2000s so "25" reads as 2025.
      parts.year = seg.length <= 2 ? 2000 + n : n;
    } else if (seg.part === "m") {
      parts.month = n;
    } else {
      parts.day = n;
    }
  }
  if (parts.year == null || parts.month == null || parts.day == null) {
    return null;
  }
  return parts as DateParts;
}

/** Days in a 1-based month, leap years included. */
export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/** True when the parts name a real calendar date (month length, leap years). */
export function isValidParts({ year, month, day }: DateParts): boolean {
  return month >= 1 && month <= 12 && day >= 1 && day <= daysInMonth(year, month);
}

/** A local-midnight Date from parts. */
export function toDate({ year, month, day }: DateParts): Date {
  return new Date(year, month - 1, day);
}

/** Strip the time so two dates compare by calendar day. */
export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * Coerce a bound (Date or string) to a local-midnight Date. Strings are read as
 * ISO "yyyy-mm-dd" first, then falling back to the picker's own format.
 */
export function coerceDate(input: string | Date | undefined | null, spec: DateFormatSpec): Date | null {
  if (input == null) {
    return null;
  }
  if (input instanceof Date) {
    return Number.isNaN(input.getTime()) ? null : startOfDay(input);
  }
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(input.trim());
  if (iso) {
    const parts = { year: Number(iso[1]), month: Number(iso[2]), day: Number(iso[3]) };
    return isValidParts(parts) ? toDate(parts) : null;
  }
  const parts = parseParts(input, spec);
  return parts && isValidParts(parts) ? toDate(parts) : null;
}

export interface DateValidation {
  /** Nothing typed yet. */
  empty: boolean;
  /** Every segment has its digits. */
  complete: boolean;
  /** Parses to a real calendar date. */
  valid: boolean;
  /** Within [min, max] — the "reasonable" check. */
  inRange: boolean;
  /** The parsed date when valid, else null. */
  date: Date | null;
  parts: DateParts | null;
}

/** Run the simple checks over a typed value. min/max are pre-coerced bounds. */
export function validate(
  value: string,
  spec: DateFormatSpec,
  min: Date | null,
  max: Date | null,
): DateValidation {
  const digits = value.replace(/\D/g, "");
  const empty = digits.length === 0;
  const complete = digits.length >= totalDigits(spec);
  const parts = complete ? parseParts(value, spec) : null;
  const valid = parts != null && isValidParts(parts);
  const date = valid && parts ? toDate(parts) : null;
  let inRange = true;
  if (date) {
    if (min && date < min) {
      inRange = false;
    }
    if (max && date > max) {
      inRange = false;
    }
  }
  return { empty, complete, valid, inRange, date, parts };
}

/** Render a Date back into the format's string form. */
export function formatDate(date: Date, spec: DateFormatSpec): string {
  const full: Record<DatePart, string> = {
    y: String(date.getFullYear()).padStart(4, "0"),
    m: String(date.getMonth() + 1).padStart(2, "0"),
    d: String(date.getDate()).padStart(2, "0"),
  };
  let out = "";
  for (const item of spec.template) {
    out += item.kind === "lit" ? item.char : full[item.part].slice(-item.length).padStart(item.length, "0");
  }
  return out;
}

/** ISO "yyyy-mm-dd" key, handy as a stable React key / lookup. */
export function isoKey(date: Date): string {
  return `${String(date.getFullYear()).padStart(4, "0")}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/** A new Date `n` days from `date`. */
export function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

/** A new Date `n` months from `date`, clamping the day to the target month. */
export function addMonths(date: Date, n: number): Date {
  const d = new Date(date.getFullYear(), date.getMonth() + n, 1);
  d.setDate(Math.min(date.getDate(), daysInMonth(d.getFullYear(), d.getMonth() + 1)));
  return d;
}

export interface CalendarDay {
  date: Date;
  day: number;
  /** Belongs to the displayed month (vs. a padding day from an adjacent one). */
  inMonth: boolean;
  iso: string;
}

/**
 * Six weeks × seven days covering `month` (0-based) of `year`, padded with the
 * adjacent months so every row is full. `weekStartsOn`: 0 = Sunday, 1 = Monday.
 */
export function monthGrid(year: number, month: number, weekStartsOn = 0): CalendarDay[][] {
  const first = new Date(year, month, 1);
  const startOffset = (first.getDay() - weekStartsOn + 7) % 7;
  const cursor = new Date(year, month, 1 - startOffset);
  const weeks: CalendarDay[][] = [];
  for (let w = 0; w < 6; w++) {
    const week: CalendarDay[] = [];
    for (let d = 0; d < 7; d++) {
      week.push({ date: new Date(cursor), day: cursor.getDate(), inMonth: cursor.getMonth() === month, iso: isoKey(cursor) });
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }
  return weeks;
}

/** Short weekday labels ("Su"…), rotated for `weekStartsOn`, in `locale`. */
export function weekdayLabels(weekStartsOn = 0, locale?: string): { short: string; long: string }[] {
  const shortFmt = new Intl.DateTimeFormat(locale, { weekday: "short" });
  const longFmt = new Intl.DateTimeFormat(locale, { weekday: "long" });
  // 2024-01-07 is a Sunday — a stable anchor for weekday names.
  const sunday = new Date(2024, 0, 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = addDays(sunday, (i + weekStartsOn) % 7);
    return { short: shortFmt.format(d), long: longFmt.format(d) };
  });
}
