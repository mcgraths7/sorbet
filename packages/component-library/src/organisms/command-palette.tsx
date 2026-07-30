import {
  Fragment,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";

import { Kbd } from "../atoms/index.ts";
import { cx, useControllableState } from "../core/index.ts";

import { Modal } from "./modal.tsx";

export interface CommandItem {
  id: string;
  label: string;
  /** Secondary line under the label. */
  description?: string;
  /** Leading glyph (an icon element or emoji). */
  icon?: ReactNode;
  /** Shortcut hint tokens, each rendered as a <Kbd> (e.g. ["⌘", "K"]). */
  shortcut?: string[];
  /** Items sharing a group render under a heading, in first-seen order. */
  group?: string;
  /** Extra search terms beyond the label. */
  keywords?: string[];
  disabled?: boolean;
  onSelect: () => void;
}

export interface CommandPaletteProps {
  commands: CommandItem[];
  /** Controlled open state. */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Global toggle hotkey; "mod+k" = ⌘K on macOS, Ctrl+K elsewhere. null disables. */
  hotkey?: string | null;
  placeholder?: string;
  emptyMessage?: string;
  /** Accessible name for the dialog + listbox. */
  label?: string;
  className?: string;
}

const SearchIcon = (
  <svg className="sb-command__search-icon" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
    <circle cx="9" cy="9" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
    <line x1="13.5" y1="13.5" x2="17.5" y2="17.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

function isMacPlatform(): boolean {
  if (typeof navigator === "undefined") {
    return false;
  }
  return /mac|iphone|ipad/i.test(navigator.platform || navigator.userAgent);
}

function matchHotkey(e: KeyboardEvent | globalThis.KeyboardEvent, hotkey: string, isMac: boolean): boolean {
  const parts = hotkey.toLowerCase().split("+").map((s) => s.trim());
  const key = parts[parts.length - 1];
  if ((e.key || "").toLowerCase() !== key) {
    return false;
  }
  const wantMod = parts.includes("mod");
  if (wantMod && !(isMac ? e.metaKey : e.ctrlKey)) {
    return false;
  }
  if (parts.includes("shift") !== e.shiftKey) {
    return false;
  }
  if (parts.includes("alt") !== e.altKey) {
    return false;
  }
  return true;
}

const firstEnabled = (list: CommandItem[]): number => list.findIndex((c) => !c.disabled);

/**
 * A ⌘K command palette: a centered Modal over a filterable, grouped list of
 * actions, keyboard-first (arrows move, Enter runs, Esc closes). Registers a
 * global toggle hotkey by default. Works controlled (`open`/`onOpenChange`) or
 * uncontrolled. Follows the combobox ARIA pattern — the input keeps focus and
 * points at the active option via `aria-activedescendant`.
 */
export function CommandPalette({
  commands,
  open,
  defaultOpen,
  onOpenChange,
  hotkey = "mod+k",
  placeholder = "Type a command or search…",
  emptyMessage = "No results",
  label = "Command palette",
  className,
}: CommandPaletteProps) {
  const baseId = useId();
  const listId = `${baseId}-list`;
  const optionId = (i: number) => `${baseId}-opt-${i}`;
  const inputRef = useRef<HTMLInputElement>(null);

  const [isOpen, setOpen] = useControllableState<boolean>(open, defaultOpen ?? false, onOpenChange);
  const [query, setQuery] = useState("");
  const [highlighted, setHighlighted] = useState(0);

  const isMac = useMemo(() => isMacPlatform(), []);

  const filterCommands = useCallback(
    (raw: string) => {
      const q = raw.trim().toLowerCase();
      if (!q) {
        return commands;
      }
      return commands.filter(
        (c) =>
          c.label.toLowerCase().includes(q) ||
          c.group?.toLowerCase().includes(q) ||
          c.keywords?.some((k) => k.toLowerCase().includes(q)),
      );
    },
    [commands],
  );
  const filtered = useMemo(() => filterCommands(query), [filterCommands, query]);

  // Next selectable index in a direction, wrapping and skipping disabled.
  const step = (from: number, dir: 1 | -1) => {
    const n = filtered.length;
    for (let s = 1; s <= n; s++) {
      const i = (((from + dir * s) % n) + n) % n;
      if (!filtered[i]?.disabled) {
        return i;
      }
    }
    return -1;
  };

  // Global hotkey — toggles from anywhere. `isOpen` is a dep so the closure
  // always sees the current state; re-subscribing a keydown listener is cheap.
  useEffect(() => {
    if (!hotkey) {
      return;
    }
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (matchHotkey(e, hotkey, isMac)) {
        e.preventDefault();
        setOpen(!isOpen);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [hotkey, isMac, isOpen, setOpen]);

  // Fresh search each time it opens. This is React's "adjust state when a prop
  // changes" pattern — done during render (not in an effect) so the reset is
  // applied in the same pass that opens the palette, with no extra paint.
  const [prevOpen, setPrevOpen] = useState(isOpen);
  if (isOpen !== prevOpen) {
    setPrevOpen(isOpen);
    if (isOpen) {
      setQuery("");
      setHighlighted(firstEnabled(commands));
    }
  }

  // Focus is a DOM side effect, so it stays here (belt-and-suspenders with the
  // dialog's own autofocus).
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isOpen]);

  // Keep the active option in view — but when it's the topmost item, scroll the
  // list fully to the top so its group heading isn't clipped above it.
  useEffect(() => {
    if (!isOpen || highlighted < 0) {
      return;
    }
    const el = document.getElementById(optionId(highlighted));
    const listEl = el?.closest<HTMLElement>(".sb-command__list");
    if (!el || !listEl) {
      return;
    }
    if (highlighted === firstEnabled(filtered)) {
      listEl.scrollTop = 0;
    } else {
      el.scrollIntoView({ block: "nearest" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlighted, isOpen]);

  const run = (item: CommandItem) => {
    if (item.disabled) {
      return;
    }
    setOpen(false);
    item.onSelect();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlighted((h) => step(h, 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlighted((h) => step(h, -1));
        break;
      case "Home":
        e.preventDefault();
        setHighlighted(firstEnabled(filtered));
        break;
      case "End":
        e.preventDefault();
        setHighlighted(step(0, -1));
        break;
      case "Enter": {
        const item = filtered[highlighted];
        if (item) {
          e.preventDefault();
          run(item);
        }
        break;
      }
    }
  };

  const modKey = isMac ? "⌘" : "Ctrl";

  return (
    <Modal open={isOpen} onClose={() => setOpen(false)} aria-label={label} className={cx("sb-command", className)}>
      <div className="sb-command__search">
        {SearchIcon}
        <input
          ref={inputRef}
          className="sb-command__input"
          type="text"
          role="combobox"
          aria-expanded
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={highlighted >= 0 && filtered[highlighted] ? optionId(highlighted) : undefined}
          aria-label={label}
          autoComplete="off"
          spellCheck={false}
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            const v = e.target.value;
            setQuery(v);
            setHighlighted(firstEnabled(filterCommands(v)));
          }}
          onKeyDown={onKeyDown}
        />
      </div>

      <ul id={listId} role="listbox" aria-label={label} className="sb-command__list">
        {filtered.length === 0 && (
          <li className="sb-command__empty" role="presentation">
            {emptyMessage}
          </li>
        )}
        {filtered.map((item, i) => {
          // Compare against the previous item rather than carrying a mutable
          // accumulator across the map — same headings, no render-scoped state.
          const heading =
            item.group && item.group !== filtered[i - 1]?.group ? (
              <li className="sb-command__heading" role="presentation" key={`h-${item.group}`}>
                {item.group}
              </li>
            ) : null;
          return (
            <Fragment key={item.id}>
              {heading}
              <li
                id={optionId(i)}
                role="option"
                aria-selected={i === highlighted}
                aria-disabled={item.disabled || undefined}
                data-highlighted={i === highlighted || undefined}
                className="sb-command__option"
                onPointerMove={() => !item.disabled && setHighlighted(i)}
                onPointerDown={(e) => e.preventDefault()}
                onClick={() => run(item)}
              >
                {item.icon != null && (
                  <span className="sb-command__icon" aria-hidden="true">
                    {item.icon}
                  </span>
                )}
                <span className="sb-command__label">
                  {item.label}
                  {item.description && <span className="sb-command__desc">{item.description}</span>}
                </span>
                {item.shortcut && item.shortcut.length > 0 && (
                  <span className="sb-command__shortcut">
                    {item.shortcut.map((k, ki) => (
                      <Kbd key={ki}>{k}</Kbd>
                    ))}
                  </span>
                )}
              </li>
            </Fragment>
          );
        })}
      </ul>

      <div className="sb-command__footer" aria-hidden="true">
        <span>
          <Kbd>↑</Kbd>
          <Kbd>↓</Kbd> navigate
        </span>
        <span>
          <Kbd>↵</Kbd> select
        </span>
        <span>
          <Kbd>esc</Kbd> close
        </span>
        <span className="sb-command__footer-hint">
          <Kbd>{modKey}</Kbd>
          <Kbd>K</Kbd>
        </span>
      </div>
    </Modal>
  );
}
