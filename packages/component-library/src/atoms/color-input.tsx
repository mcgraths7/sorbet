import { useState, type ComponentPropsWithRef } from "react";

import { cx } from "../core/index.ts";

import { Input } from "./input.tsx";

export interface ColorInputProps extends Omit<ComponentPropsWithRef<"div">, "onChange" | "defaultValue"> {
  /** Current value (controlled). #rrggbb drives the swatch; any string shows in the hex field. */
  value?: string;
  defaultValue?: string;
  /** Fires with a normalized lowercase #rrggbb on every valid change. */
  onValueChange?: (hex: string) => void;
  disabled?: boolean;
  /** Accessible name for the pair ("Pick color"). */
  pickerLabel?: string;
}

const HEX = /^#[0-9a-f]{6}$/i;

/**
 * Native color picker styled as a swatch, beside a hex text field. The two
 * stay in sync; free-typing only commits once the text is a valid #rrggbb.
 */
export function ColorInput({
  value,
  defaultValue,
  onValueChange,
  disabled,
  pickerLabel = "Pick color",
  className,
  ...rest
}: ColorInputProps) {
  const [internal, setInternal] = useState(defaultValue ?? "#000000");
  /** In-progress text that isn't a valid hex yet; null = mirror the value. */
  const [draft, setDraft] = useState<string | null>(null);
  const current = value ?? internal;

  const commit = (hex: string) => {
    setInternal(hex);
    onValueChange?.(hex);
  };

  return (
    <div className={cx("sb-color-input", className)} {...rest}>
      <input
        type="color"
        className="sb-color-input__swatch"
        aria-label={pickerLabel}
        value={HEX.test(current) ? current.toLowerCase() : "#000000"}
        disabled={disabled}
        onChange={(e) => {
          setDraft(null);
          commit(e.target.value);
        }}
      />
      <Input
        size="sm"
        className="sb-color-input__hex"
        aria-label={`${pickerLabel} (hex)`}
        value={draft ?? current}
        disabled={disabled}
        onChange={(e) => {
          const text = e.target.value.trim();
          const hex = text.startsWith("#") ? text : `#${text}`;
          if (HEX.test(hex)) {
            setDraft(null);
            commit(hex.toLowerCase());
          } else {
            setDraft(e.target.value);
          }
        }}
        onBlur={() => setDraft(null)}
      />
    </div>
  );
}
