/**
 * Shared machinery for Combobox and MultiCombobox: filtering, the popover
 * listbox lifecycle (position, outside dismiss), and highlight management.
 * Internal — the components own selection semantics and keyboard wiring.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ToggleEvent } from "react";

export interface ComboboxOption {
  value: string;
  label: string;
  /** Secondary line under the label. */
  description?: string;
  /** Options sharing a group render under a heading. */
  group?: string;
  disabled?: boolean;
}

export type ComboboxFilter = (option: ComboboxOption, query: string) => boolean;

/** Index of the first selectable option in a list (-1 when none). */
export function firstEnabledIn(list: ComboboxOption[]): number {
  return list.findIndex((o) => !o.disabled);
}

const GAP = 6;
const EDGE = 8;
const PANEL_MAX = 288; // matches max-block-size in _combobox.scss

export function useComboboxCore(
  options: ComboboxOption[],
  filter: ComboboxFilter | undefined,
  optionId: (index: number) => string,
) {
  const [open, setOpen] = useState(false);
  /** Text being typed; null = not editing. */
  const [query, setQuery] = useState<string | null>(null);
  const [highlighted, setHighlighted] = useState(0);

  const controlRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  /** Pure filter — components use it to compute event-time state (e.g. the
   * highlight for a query that hasn't rendered yet). */
  const filterFor = useCallback(
    (rawQuery: string | null) => {
      const q = (rawQuery ?? "").trim();
      if (q === "") return options;
      const match =
        filter ?? ((o: ComboboxOption, text: string) => o.label.toLowerCase().includes(text.toLowerCase()));
      return options.filter((o) => match(o, q));
    },
    [options, filter],
  );

  const filtered = useMemo(() => filterFor(query), [filterFor, query]);

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

  // Show/hide the popover and anchor it to the control.
  useEffect(() => {
    const panel = panelRef.current;
    const control = controlRef.current;
    if (!panel || !control) return;
    if (open && !panel.matches(":popover-open")) {
      panel.showPopover();
      const r = control.getBoundingClientRect();
      panel.style.minInlineSize = `${r.width}px`;
      panel.style.maxInlineSize = `${Math.max(r.width, 240)}px`;
      const left = Math.min(Math.max(r.left, EDGE), window.innerWidth - r.width - EDGE);
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

  // Manual popovers don't light-dismiss; close on any press outside.
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

  // The panel is position:fixed, so it can't track its anchor through page
  // scroll — dismiss instead. Scrolling *inside* the options list is exempt
  // (scroll doesn't bubble; listen in the capture phase).
  useEffect(() => {
    if (!open) return;
    const onScroll = (e: Event) => {
      if (panelRef.current?.contains(e.target as Node)) return;
      setOpen(false);
      setQuery(null);
    };
    document.addEventListener("scroll", onScroll, { capture: true, passive: true });
    return () => document.removeEventListener("scroll", onScroll, { capture: true });
  }, [open]);

  // Keep the highlighted option in view.
  useEffect(() => {
    if (open && highlighted >= 0) {
      document.getElementById(optionId(highlighted))?.scrollIntoView({ block: "nearest" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlighted, open]);

  const openList = (initialHighlight?: number) => {
    if (open) return;
    setOpen(true);
    setHighlighted(initialHighlight != null && initialHighlight >= 0 ? initialHighlight : firstEnabled(0));
  };

  const closeList = (revert = true) => {
    setOpen(false);
    if (revert) setQuery(null);
  };

  // Safety net if anything else closes the popover.
  const onPanelToggle = (e: ToggleEvent<HTMLDivElement>) => {
    if (e.newState === "closed" && open) {
      setOpen(false);
      setQuery(null);
    }
  };

  return {
    open,
    query,
    setQuery,
    highlighted,
    setHighlighted,
    filtered,
    filterFor,
    firstEnabled,
    controlRef,
    inputRef,
    panelRef,
    openList,
    closeList,
    onPanelToggle,
  };
}
