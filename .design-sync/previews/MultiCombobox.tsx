import { useEffect, useRef } from "react";
import { MultiCombobox, type ComboboxOption } from "@sorbet/component-library";

// Same technique as Combobox — no open prop, ref forwards to the real text
// input, and the input's own onClick opens the listbox. A mount-time .click()
// fires that real handler.
function useOpenOnMount() {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    ref.current?.click();
  }, []);
  return ref;
}

const amenities: ComboboxOption[] = [
  { value: "wifi", label: "Wifi", group: "Included" },
  { value: "kitchen", label: "Full kitchen", group: "Included" },
  { value: "parking", label: "Free parking", group: "Included" },
  { value: "pool", label: "Pool", group: "Popular" },
  { value: "hot-tub", label: "Hot tub", group: "Popular" },
  { value: "pet-friendly", label: "Pet friendly", description: "Dogs & cats welcome", group: "Popular" },
  { value: "workspace", label: "Dedicated workspace", group: "Popular" },
];

export function Default() {
  const ref = useOpenOnMount();
  return (
    <div style={{ width: 320 }}>
      <MultiCombobox
        ref={ref}
        options={amenities}
        defaultValue={["wifi", "kitchen"]}
        placeholder="Add amenities…"
        listLabel="Amenities"
        aria-label="Listing amenities"
      />
    </div>
  );
}

export function ManySelected() {
  const ref = useOpenOnMount();
  return (
    <div style={{ width: 320 }}>
      <MultiCombobox
        ref={ref}
        options={amenities}
        defaultValue={["wifi", "kitchen", "parking", "pool", "hot-tub"]}
        listLabel="Amenities"
        aria-label="Listing amenities"
      />
    </div>
  );
}

export function Disabled() {
  return (
    <div style={{ width: 320 }}>
      <MultiCombobox
        options={amenities}
        defaultValue={["wifi", "kitchen"]}
        disabled
        listLabel="Amenities"
        aria-label="Listing amenities, disabled"
      />
    </div>
  );
}
