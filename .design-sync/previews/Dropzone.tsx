import { Dropzone } from "@sorbet/component-library";
import { useEffect, useRef } from "react";

/** A real File with a spoofed `size`, so the preview doesn't have to allocate
 * megabytes of actual bytes to demonstrate size-based validation/formatting. */
function fakeFile(name: string, type: string, size: number): File {
  const file = new File([new Uint8Array(1)], name, { type });
  Object.defineProperty(file, "size", { value: size });
  return file;
}

// Dropzone keeps its file list purely as internal state — there's no
// controlled `value` prop to seed it with. It does forward `ref` straight to
// the real <input type="file">, though, so we build real File objects,
// assign them to the input via DataTransfer, and dispatch a genuine "change"
// event — the same event the browser fires after a native picker selection —
// so the component's own onChange/add() validation logic runs for real.
function useSeedFiles(files: File[]) {
  const ref = useRef<HTMLInputElement>(null);
  // Seeding is a one-shot on mount. Callers build the array inline, so it's a
  // new identity every render — captured once here rather than tracked as a
  // dependency, which would re-seed the input on every render instead.
  const seed = useRef(files);
  useEffect(() => {
    const input = ref.current;
    if (!input) {
      return;
    }
    const dt = new DataTransfer();
    for (const file of seed.current) {
      dt.items.add(file);
    }
    input.files = dt.files;
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }, []);
  return ref;
}

export function Default() {
  return (
    <Dropzone
      multiple
      accept="image/*"
      prompt="Drag & drop meal photos"
      hint="PNG or JPG, up to 5 MB each"
      style={{ width: 320 }}
    />
  );
}

export function Uploaded() {
  const ref = useSeedFiles([
    fakeFile("pantry-inventory.xlsx", "application/vnd.ms-excel", 48_200),
    fakeFile("week-32-menu-plan.pdf", "application/pdf", 212_500),
    fakeFile("delivery-photo.jpg", "image/jpeg", 1_640_000),
  ]);
  return <Dropzone ref={ref} multiple hint="Any file type, up to 5 MB each" style={{ width: 320 }} />;
}

export function Rejected() {
  const ref = useSeedFiles([fakeFile("quarterly-report.pdf", "application/pdf", 9_000_000)]);
  return (
    <Dropzone
      ref={ref}
      accept=".pdf,.csv,.xlsx"
      maxSize={5_000_000}
      hint="PDF, CSV or XLSX, up to 5 MB"
      style={{ width: 320 }}
    />
  );
}
