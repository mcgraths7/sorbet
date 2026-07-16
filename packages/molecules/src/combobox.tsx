import { composeRefs, cx, type Size } from "@sorbet/core";
import {
  Fragment,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type AriaAttributes,
  type KeyboardEvent,
  type Ref,
  type ToggleEvent,
} from "react";

export interface ComboboxOption {
  value: string;
  label: string;
  /** Secondary line under the label. */
  description?: string;
  /** Options sharing a group render under a heading. */
  group?: string;
  disabled?: boolean;
}

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
  filter?: (option: ComboboxOption, query: string) => boolean;
  /** Accessible name for the popup list. */
  listLabel?: string;
  id?: string;
  className?: string;
  ref?: Ref<HTMLInputElement>;
  "aria-describedby"?: string;
  "aria-invalid"?: AriaAttributes["aria-invalid"];
  "aria-label"?: string;
}

const GAP = 6;
const EDGE = 8;
const PANEL_MAX = 288; // matches max-block-size in _combobox.scss

/**
 * Single-select autocomplete following the WAI-ARIA combobox pattern (list
 * autocomplete with aria-activedescendant — focus never leaves the input).
 * The popup rides the Popover API: top layer + light dismiss for free.
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

  const [open, setOpen] = useState(false);
  /** Text being typed; null = not editing, display the selected label. */
  const [query, setQuery] = useState<string | null>(null);
  const [highlighted, setHighlighted] = useState(0);

  const controlRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const filtered = useMemo(() => {
    const q = (query ?? "").trim();
    if (q === "") return options;
    const match = filter ?? ((o: ComboboxOption, text: string) => o.label.toLowerCase().includes(text.toLowerCase()));
    return options.filter((o) => match(o, q));
  }, [options, query, filter]);

  const firstEnabled = useCallback(
    (from = 0, dir: 1 | -1 = 1) => {
      for (let step = 0; step < filtered.length; step++) {
        const i = (from + dir * step + filtered.length * (step + 1)) % filtered.length;
        if (!filtered[i]?.disabled) return i;
      }
      return -1;
    },
    [filtered],
  );

  // --- open/close via the Popover API --------------------------------------
  useEffect(() => {
    const panel = panelRef.current;
    const control = controlRef.current;
    if (!panel || !control) return;
    if (open && !panel.matches(":popover-open")) {
      panel.showPopover();
      const r = control.getBoundingClientRect();
      panel.style.minInlineSize = `${r.width}px`;
      panel.style.maxInlineSize = `${Math.max(r.width, 240)}px`;
      let left = Math.min(Math.max(r.left, EDGE), window.innerWidth - r.width - EDGE);
      let top = r.bottom + GAP;
      if (top + Math.min(panel.scrollHeight, PANEL_MAX) > window.innerHeight - EDGE) {
        top = Math.max(r.top - Math.min(panel.scrollHeight, PANEL_MAX) - GAP, EDGE);
      }
      panel.style.left = `${left}px`;
      panel.style.top = `${top}px`;
    } else if (!open && panel.matches(":popover-open")) {
      panel.hidePopover();
    }
  }, [open]);

  // Light dismiss (click away) closes the popover natively; sync state.
  const onPanelToggle = (e: ToggleEvent<HTMLDivElement>) => {
    if (e.newState === "closed" && open) {
      setOpen(false);
      setQuery(null);
    }
  };

  // Reset the highlight when the user types (not on open — openList already
  // highlights the current selection there).
  useEffect(() => {
    if (open && query !== null) setHighlighted(firstEnabled(0));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  // Manual popovers don't light-dismiss; close on any press outside the
  // control or the panel.
  useEffect(() => {
    if (!open) return;
    const onDocPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (!controlRef.current?.contains(target) && !panelRef.current?.contains(target)) {
        setOpen(false);
        setQuery(null);
      }
    };
    document.addEventListener("pointerdown", onDocPointerDown);
    return () => document.removeEventListener("pointerdown", onDocPointerDown);
  }, [open]);

  // Keep the highlighted option in view.
  useEffect(() => {
    if (open && highlighted >= 0) {
      document.getElementById(optionId(highlighted))?.scrollIntoView({ block: "nearest" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlighted, open]);

  const openList = () => {
    if (disabled || open) return;
    setOpen(true);
    const selectedIdx = filtered.findIndex((o) => o.value === selectedValue);
    setHighlighted(selectedIdx >= 0 ? selectedIdx : firstEnabled(0));
  };

  const closeList = (revert = true) => {
    setOpen(false);
    if (revert) setQuery(null);
  };

  const select = (option: ComboboxOption) => {
    if (option.disabled) return;
    if (value === undefined) setInternal(option.value);
    onValueChange?.(option.value, option);
    setQuery(null);
    setOpen(false);
    inputRef.current?.focus();
  };

  const clear = () => {
    if (value === undefined) setInternal(null);
    onValueChange?.(null, null);
    setQuery(null);
    inputRef.current?.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (!open) openList();
        else setHighlighted((h) => firstEnabled(h + 1, 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        if (!open) openList();
        else setHighlighted((h) => firstEnabled(h - 1, -1));
        break;
      case "Enter":
        if (open) {
          e.preventDefault();
          const option = filtered[highlighted];
          if (option) select(option);
        }
        break;
      case "Escape":
        if (open) {
          e.preventDefault();
          closeList();
        } else if (clearable && selectedValue != null) {
          clear();
        }
        break;
      case "Tab":
        if (open) closeList();
        break;
      case "Home":
      case "End":
        break; // caret movement stays native
    }
  };

  const displayValue = query ?? selectedOption?.label ?? "";

  // Render list: options interleaved with group headings.
  let lastGroup: string | undefined;

  return (
    <div className={cx("sb-combobox", className)}>
      <div className="sb-combobox__control" ref={controlRef}>
        <input
          id={inputId}
          ref={composeRefs(ref, inputRef)}
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
            setQuery(e.target.value);
            if (!open) setOpen(true);
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
            onClick={() => (open ? closeList() : (inputRef.current?.focus(), openList()))}
          >
            <i className="sb-combobox__chevron" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div
        id={listboxId}
        ref={panelRef}
        popover="manual"
        role="listbox"
        aria-label={listLabel}
        className="sb-combobox__panel"
        onToggle={onPanelToggle}
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
