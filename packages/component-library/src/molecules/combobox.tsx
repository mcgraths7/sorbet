import { Fragment, useId, useMemo, useState, type AriaAttributes, type KeyboardEvent, type Ref } from "react";

import { composeRefs, cx, type Size } from "../core/index.ts";

import { firstEnabledIn, useComboboxCore, type ComboboxFilter, type ComboboxOption } from "./combobox-core.ts";

export type { ComboboxFilter, ComboboxOption };

export interface ComboboxProps {
  options: ComboboxOption[];
  /** Controlled selected value (null = none). */
  value?: string | null;
  /** Uncontrolled initial value. */
  defaultValue?: string | null;
  onValueChange?: (value: string | null, option: ComboboxOption | null) => void;
  placeholder?: string;
  size?: Size;
  invalid?: boolean;
  disabled?: boolean;
  /** Show the × affordance when something is selected (default true). */
  clearable?: boolean;
  /** Posts the selected value with forms via a hidden input. */
  name?: string;
  emptyMessage?: string;
  /** Custom match; default is case-insensitive substring on the label. */
  filter?: ComboboxFilter;
  /** Accessible name for the popup list. */
  listLabel?: string;
  id?: string;
  className?: string;
  ref?: Ref<HTMLInputElement>;
  "aria-describedby"?: string;
  "aria-invalid"?: AriaAttributes["aria-invalid"];
  "aria-label"?: string;
}

/**
 * Single-select autocomplete following the WAI-ARIA combobox pattern (list
 * autocomplete with aria-activedescendant — focus never leaves the input).
 * The popup rides the Popover API: top layer + outside dismiss.
 * Composes with Field, which wires the label and descriptions onto the input.
 */
export function Combobox({
  options,
  value,
  defaultValue = null,
  onValueChange,
  placeholder,
  size = "md",
  invalid,
  disabled,
  clearable = true,
  name,
  emptyMessage = "No matches",
  filter,
  listLabel = "Options",
  id,
  className,
  ref,
  ...aria
}: ComboboxProps) {
  const autoId = useId();
  const inputId = id ?? `${autoId}-input`;
  const listboxId = `${autoId}-listbox`;
  const optionId = (index: number) => `${autoId}-opt-${index}`;

  const [internal, setInternal] = useState<string | null>(defaultValue);
  const selectedValue = value !== undefined ? value : internal;
  const selectedOption = useMemo(
    () => options.find((o) => o.value === selectedValue) ?? null,
    [options, selectedValue],
  );

  const core = useComboboxCore(options, filter, optionId);
  const { open, query, setQuery, highlighted, setHighlighted, filtered, firstEnabled } = core;

  const openList = () => {
    if (disabled) {
      return;
    }
    core.openList(filtered.findIndex((o) => o.value === selectedValue));
  };

  const select = (option: ComboboxOption) => {
    if (option.disabled) {
      return;
    }
    if (value === undefined) {
      setInternal(option.value);
    }
    onValueChange?.(option.value, option);
    setQuery(null);
    core.closeList();
    core.inputRef.current?.focus();
  };

  const clear = () => {
    if (value === undefined) {
      setInternal(null);
    }
    onValueChange?.(null, null);
    setQuery(null);
    core.inputRef.current?.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (!open) {
          openList();
        } else {
          setHighlighted((h) => firstEnabled(h + 1, 1));
        }
        break;
      case "ArrowUp":
        e.preventDefault();
        if (!open) {
          openList();
        } else {
          setHighlighted((h) => firstEnabled(h - 1, -1));
        }
        break;
      case "Enter":
        if (open) {
          e.preventDefault();
          const option = filtered[highlighted];
          if (option) {
            select(option);
          }
        }
        break;
      case "Escape":
        if (open) {
          e.preventDefault();
          core.closeList();
        } else if (clearable && selectedValue != null) {
          clear();
        }
        break;
      case "Tab":
        if (open) {
          core.closeList();
        }
        break;
    }
  };

  const displayValue = query ?? selectedOption?.label ?? "";
  let lastGroup: string | undefined;

  return (
    <div className={cx("sb-combobox", className)}>
      <div className="sb-combobox__control" ref={core.controlRef}>
        <input
          id={inputId}
          ref={composeRefs(ref, core.inputRef)}
          className={cx("sb-input", size !== "md" && `sb-input--${size}`)}
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={open && highlighted >= 0 && filtered[highlighted] ? optionId(highlighted) : undefined}
          aria-invalid={aria["aria-invalid"] ?? (invalid || undefined)}
          aria-describedby={aria["aria-describedby"]}
          aria-label={aria["aria-label"]}
          autoComplete="off"
          spellCheck={false}
          placeholder={placeholder}
          disabled={disabled}
          value={displayValue}
          onChange={(e) => {
            const text = e.target.value;
            setQuery(text);
            // Highlight is event-time state: compute it from the new query
            // now rather than waiting for an effect to catch up.
            const idx = firstEnabledIn(core.filterFor(text));
            if (!open) {
              core.openList(idx);
            } else {
              setHighlighted(idx);
            }
          }}
          onClick={openList}
          onKeyDown={onKeyDown}
        />
        <div className="sb-combobox__affordances">
          {clearable && selectedValue != null && !disabled && (
            <button
              type="button"
              className="sb-combobox__button"
              aria-label="Clear selection"
              onPointerDown={(e) => e.preventDefault()}
              onClick={clear}
            >
              ×
            </button>
          )}
          <button
            type="button"
            className="sb-combobox__button"
            aria-label={open ? "Close options" : "Show options"}
            tabIndex={-1}
            disabled={disabled}
            onPointerDown={(e) => e.preventDefault()}
            onClick={() => (open ? core.closeList() : (core.inputRef.current?.focus(), openList()))}
          >
            <i className="sb-combobox__chevron" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div
        id={listboxId}
        ref={core.panelRef}
        popover="manual"
        role="listbox"
        aria-label={listLabel}
        className="sb-combobox__panel"
        onToggle={core.onPanelToggle}
      >
        {filtered.length === 0 && <div className="sb-combobox__empty">{emptyMessage}</div>}
        {filtered.map((option, i) => {
          const heading =
            option.group && option.group !== lastGroup ? (
              <div className="sb-combobox__heading" role="presentation" key={`h-${option.group}`}>
                {option.group}
              </div>
            ) : null;
          lastGroup = option.group;
          return (
            <Fragment key={option.value}>
              {heading}
              <div
                id={optionId(i)}
                role="option"
                aria-selected={option.value === selectedValue}
                aria-disabled={option.disabled || undefined}
                data-highlighted={i === highlighted || undefined}
                className="sb-combobox__option"
                onPointerEnter={() => !option.disabled && setHighlighted(i)}
                onPointerDown={(e) => e.preventDefault()}
                onClick={() => select(option)}
              >
                <span className="sb-combobox__option-label">
                  {option.label}
                  {option.description && <span className="sb-combobox__option-desc">{option.description}</span>}
                </span>
              </div>
            </Fragment>
          );
        })}
      </div>

      {name && <input type="hidden" name={name} value={selectedValue ?? ""} />}
    </div>
  );
}
