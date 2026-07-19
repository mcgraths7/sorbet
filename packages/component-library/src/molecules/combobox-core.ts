/**
 * Shared machinery for Combobox and MultiCombobox: filtering, highlight
 * management, and the listbox popover (via the shared usePopover lifecycle).
 * Internal — the components own selection semantics and keyboard wiring.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { usePopover } from "../core/index.ts";

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

export function useComboboxCore(
  options: ComboboxOption[],
  filter: ComboboxFilter | undefined,
  optionId: (index: number) => string,
) {
  const [open, setOpen] = useState(false);
  /** Text being typed; null = not editing. */
  const [query, setQuery] = useState<string | null>(null);
  const [highlighted, setHighlighted] = useState(0);

  const inputRef = useRef<HTMLInputElement | null>(null);
  // Listbox popover: match the control's width (min), grow to 240px of content.
  const { anchorRef, panelRef, popoverProps } = usePopover({
    open,
    onDismiss: () => {
      setOpen(false);
      setQuery(null);
    },
    matchWidth: true,
    widthFloor: 240,
  });

  /** Pure filter — components use it to compute event-time state (e.g. the
   * highlight for a query that hasn't rendered yet). */
  const filterFor = useCallback(
    (rawQuery: string | null) => {
      const q = (rawQuery ?? "").trim();
      if (q === "") {
        return options;
      }
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
        if (!filtered[i]?.disabled) {
          return i;
        }
      }
      return -1;
    },
    [filtered],
  );

  // Keep the highlighted option in view.
  useEffect(() => {
    if (open && highlighted >= 0) {
      document.getElementById(optionId(highlighted))?.scrollIntoView({ block: "nearest" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlighted, open]);

  const openList = (initialHighlight?: number) => {
    if (open) {
      return;
    }
    setOpen(true);
    setHighlighted(initialHighlight != null && initialHighlight >= 0 ? initialHighlight : firstEnabled(0));
  };

  const closeList = (revert = true) => {
    setOpen(false);
    if (revert) {
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
    controlRef: anchorRef,
    inputRef,
    panelRef,
    openList,
    closeList,
    onPanelToggle: popoverProps.onToggle,
  };
}
