import { Chip } from "../atoms/index.ts";
import { composeRefs, cx, type Size } from "../core/index.ts";
import { Fragment, useId, useMemo, useState, type AriaAttributes, type KeyboardEvent, type Ref } from "react";
import { firstEnabledIn, useComboboxCore, type ComboboxFilter, type ComboboxOption } from "./combobox-core.ts";

export interface MultiComboboxProps {
  options: ComboboxOption[];
  /** Controlled selected values. */
  value?: string[];
  /** Uncontrolled initial values. */
  defaultValue?: string[];
  onValueChange?: (values: string[], changed: ComboboxOption | null) => void;
  placeholder?: string;
  size?: Size;
  invalid?: boolean;
  disabled?: boolean;
  /** Show the × clear-all affordance when anything is selected (default true). */
  clearable?: boolean;
  /** Posts one hidden input per selected value (array-style form posts). */
  name?: string;
  emptyMessage?: string;
  filter?: ComboboxFilter;
  listLabel?: string;
  id?: string;
  className?: string;
  ref?: Ref<HTMLInputElement>;
  "aria-describedby"?: string;
  "aria-invalid"?: AriaAttributes["aria-invalid"];
  "aria-label"?: string;
}

/**
 * Multi-select combobox: selections render as removable chips inside the
 * control, the popup stays open while toggling (aria-multiselectable), and
 * Backspace on an empty query removes the last chip. Same ARIA pattern as
 * Combobox — focus never leaves the text input.
 */
export function MultiCombobox({
  options,
  value,
  defaultValue = [],
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
}: MultiComboboxProps) {
  const autoId = useId();
  const inputId = id ?? `${autoId}-input`;
  const listboxId = `${autoId}-listbox`;
  const optionId = (index: number) => `${autoId}-opt-${index}`;

  const [internal, setInternal] = useState<string[]>(defaultValue);
  const values = value !== undefined ? value : internal;
  const selectedOptions = useMemo(
    () => values.map((v) => options.find((o) => o.value === v)).filter((o): o is ComboboxOption => o != null),
    [options, values],
  );

  const core = useComboboxCore(options, filter, optionId);
  const { open, query, setQuery, highlighted, setHighlighted, filtered, firstEnabled } = core;

  const commit = (next: string[], changed: ComboboxOption | null) => {
    if (value === undefined) setInternal(next);
    onValueChange?.(next, changed);
  };

  const toggle = (option: ComboboxOption) => {
    if (option.disabled) return;
    const next = values.includes(option.value)
      ? values.filter((v) => v !== option.value)
      : [...values, option.value];
    commit(next, option);
    // Stay open for serial picking; show the full list again.
    setQuery(null);
    setHighlighted(Math.max(options.indexOf(option), 0));
    core.inputRef.current?.focus();
  };

  const removeLast = () => {
    const last = selectedOptions[selectedOptions.length - 1];
    if (last) commit(values.slice(0, -1), last);
  };

  const clearAll = () => {
    commit([], null);
    setQuery(null);
    core.inputRef.current?.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (!open) core.openList();
        else setHighlighted((h) => firstEnabled(h + 1, 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        if (!open) core.openList();
        else setHighlighted((h) => firstEnabled(h - 1, -1));
        break;
      case "Enter":
        if (open) {
          e.preventDefault();
          const option = filtered[highlighted];
          if (option) toggle(option);
        }
        break;
      case "Backspace":
        if ((query ?? "") === "" && values.length > 0) removeLast();
        break;
      case "Escape":
        if (open) {
          e.preventDefault();
          core.closeList();
        }
        break;
      case "Tab":
        if (open) core.closeList();
        break;
    }
  };

  let lastGroup: string | undefined;

  return (
    <div className={cx("sb-combobox", "sb-combobox--multi", className)}>
      <div className="sb-combobox__control" ref={core.controlRef}>
        <div
          className={cx("sb-combobox__field", size !== "md" && `sb-combobox__field--${size}`)}
          data-invalid={invalid || undefined}
          data-disabled={disabled || undefined}
          onPointerDown={(e) => {
            // Clicking the frame (not a chip) focuses the input and opens.
            if (e.target === e.currentTarget && !disabled) {
              e.preventDefault();
              core.inputRef.current?.focus();
              core.openList();
            }
          }}
        >
          {selectedOptions.map((option) => (
            <Chip key={option.value} onRemove={() => !disabled && toggle(option)} removeLabel={`Remove ${option.label}`}>
              {option.label}
            </Chip>
          ))}
          <input
            id={inputId}
            ref={composeRefs(ref, core.inputRef)}
            role="combobox"
            aria-expanded={open}
            aria-controls={listboxId}
            aria-autocomplete="list"
            aria-activedescendant={
              open && highlighted >= 0 && filtered[highlighted] ? optionId(highlighted) : undefined
            }
            aria-invalid={aria["aria-invalid"] ?? (invalid || undefined)}
            aria-describedby={aria["aria-describedby"]}
            aria-label={aria["aria-label"]}
            autoComplete="off"
            spellCheck={false}
            placeholder={values.length === 0 ? placeholder : undefined}
            disabled={disabled}
            value={query ?? ""}
            onChange={(e) => {
              const text = e.target.value;
              setQuery(text);
              const idx = firstEnabledIn(core.filterFor(text));
              if (!open) core.openList(idx);
              else setHighlighted(idx);
            }}
            onClick={() => core.openList()}
            onKeyDown={onKeyDown}
          />
        </div>
        <div className="sb-combobox__affordances">
          {clearable && values.length > 0 && !disabled && (
            <button
              type="button"
              className="sb-combobox__button"
              aria-label="Clear all selections"
              onPointerDown={(e) => e.preventDefault()}
              onClick={clearAll}
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
            onClick={() => (open ? core.closeList() : (core.inputRef.current?.focus(), core.openList()))}
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
        aria-multiselectable="true"
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
                aria-selected={values.includes(option.value)}
                aria-disabled={option.disabled || undefined}
                data-highlighted={i === highlighted || undefined}
                className="sb-combobox__option"
                onPointerEnter={() => !option.disabled && setHighlighted(i)}
                onPointerDown={(e) => e.preventDefault()}
                onClick={() => toggle(option)}
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

      {name && values.map((v) => <input key={v} type="hidden" name={name} value={v} />)}
    </div>
  );
}
