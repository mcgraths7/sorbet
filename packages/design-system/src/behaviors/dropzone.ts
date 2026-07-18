/**
 * Drag-and-drop upload zone over a real <input type="file">. Drops and
 * picker selections are merged into the input via DataTransfer, so the
 * files submit with the form exactly as if the picker alone had chosen
 * them. Validation runs on both paths: the input's `accept`, plus
 * `data-max-size` (bytes per file) and `data-max-files` on the root.
 *
 *   <div class="sb-dropzone" data-sb="dropzone" data-max-size="1048576" data-max-files="3">
 *     <label class="sb-dropzone__zone">
 *       <input class="sb-dropzone__input" type="file" multiple accept="image/*">…
 *     </label>
 *     <p class="sb-dropzone__error" role="alert" hidden></p>
 *     <ul class="sb-dropzone__list"></ul>
 *   </div>
 */

export interface DropzoneRejection {
  file: File;
  reason: "type" | "size" | "count";
}

const KB = 1024;

function formatSize(bytes: number): string {
  if (bytes < KB) {
    return `${bytes} B`;
  }
  if (bytes < KB * KB) {
    return `${parseFloat((bytes / KB).toFixed(1))} KB`;
  }
  return `${parseFloat((bytes / KB / KB).toFixed(1))} MB`;
}

/** Mirror of the picker's accept matching, for drops (which bypass it). */
function accepts(file: File, accept: string): boolean {
  const specs = accept
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (specs.length === 0) {
    return true;
  }
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return specs.some((spec) =>
    spec.startsWith(".") ? name.endsWith(spec) : spec.endsWith("/*") ? type.startsWith(spec.slice(0, -1)) : type === spec,
  );
}

export class Dropzone {
  #root: HTMLElement;
  #input: HTMLInputElement;
  #list: HTMLUListElement;
  #error: HTMLElement | null;
  /** Accumulated selection — input.files mirrors this. */
  #known: File[] = [];
  #depth = 0;
  #syncing = false;

  constructor(root: HTMLElement) {
    const input = root.querySelector<HTMLInputElement>('input[type="file"]');
    if (!input) {
      throw new Error("Dropzone needs an <input type=file> inside");
    }

    this.#root = root;
    this.#input = input;
    this.#error = root.querySelector(".sb-dropzone__error");

    let list = root.querySelector<HTMLUListElement>(".sb-dropzone__list");
    if (!list) {
      list = document.createElement("ul");
      list.className = "sb-dropzone__list";
      root.append(list);
    }
    this.#list = list;

    const zone = root.querySelector<HTMLElement>(".sb-dropzone__zone") ?? root;
    zone.addEventListener("dragenter", (e) => {
      if (!this.#usable(e)) {
        return;
      }
      e.preventDefault();
      this.#depth++;
      root.dataset.dragover = "true";
    });
    zone.addEventListener("dragover", (e) => {
      if (!this.#usable(e)) {
        return;
      }
      e.preventDefault();
    });
    zone.addEventListener("dragleave", () => {
      if (--this.#depth <= 0) {
        this.#clearDrag();
      }
    });
    zone.addEventListener("drop", (e) => {
      e.preventDefault();
      this.#clearDrag();
      if (!this.#input.disabled) {
        this.#add([...(e.dataTransfer?.files ?? [])]);
      }
    });

    // Picker selections replace input.files natively; merge them back in.
    input.addEventListener("change", () => {
      if (this.#syncing) {
        return;
      }
      this.#add([...(input.files ?? [])]);
    });

    this.#list.addEventListener("click", (e) => {
      const button = (e.target as HTMLElement).closest<HTMLElement>(".sb-dropzone__remove");
      if (!button) {
        return;
      }
      const index = Number(button.dataset.index);
      this.#commit(this.#known.filter((_, i) => i !== index));
      this.#clearError();
    });
  }

  get files(): File[] {
    return [...this.#known];
  }

  #usable(e: DragEvent): boolean {
    return !this.#input.disabled && (e.dataTransfer?.types.includes("Files") ?? false);
  }

  #clearDrag(): void {
    this.#depth = 0;
    delete this.#root.dataset.dragover;
  }

  #add(incoming: File[]): void {
    const maxSize = Number(this.#root.dataset.maxSize) || Infinity;
    const maxFiles = Number(this.#root.dataset.maxFiles) || Infinity;
    const accept = this.#input.accept;
    const rejected: DropzoneRejection[] = [];
    const next = this.#input.multiple ? [...this.#known] : [];

    for (const file of this.#input.multiple ? incoming : incoming.slice(0, 1)) {
      if (next.some((f) => f.name === file.name && f.size === file.size && f.lastModified === file.lastModified)) {
        continue;
      }
      if (!accepts(file, accept)) {
        rejected.push({ file, reason: "type" });
      } else if (file.size > maxSize) {
        rejected.push({ file, reason: "size" });
      } else if (next.length >= maxFiles) {
        rejected.push({ file, reason: "count" });
      } else {
        next.push(file);
      }
    }

    this.#commit(next);
    if (rejected.length === 0) {
      this.#clearError();
    } else if (this.#error) {
      const why: Record<DropzoneRejection["reason"], string> = {
        type: "not an accepted type",
        size: `over ${formatSize(maxSize)}`,
        count: "too many files",
      };
      this.#error.textContent = rejected.map((r) => `${r.file.name} — ${why[r.reason]}`).join(" · ");
      this.#error.hidden = false;
    }
  }

  #commit(next: File[]): void {
    this.#known = next;
    const dt = new DataTransfer();
    for (const f of next) {
      dt.items.add(f);
    }
    this.#input.files = dt.files;
    this.#render();
    this.#syncing = true;
    this.#input.dispatchEvent(new Event("change", { bubbles: true }));
    this.#syncing = false;
  }

  #render(): void {
    this.#list.replaceChildren(
      ...this.#known.map((file, i) => {
        const li = document.createElement("li");
        li.className = "sb-dropzone__file";
        const name = document.createElement("span");
        name.className = "sb-dropzone__name";
        name.textContent = file.name;
        const size = document.createElement("span");
        size.className = "sb-dropzone__size";
        size.textContent = formatSize(file.size);
        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "sb-dropzone__remove";
        remove.dataset.index = String(i);
        remove.setAttribute("aria-label", `Remove ${file.name}`);
        remove.textContent = "✕";
        li.append(name, size, remove);
        return li;
      }),
    );
  }

  #clearError(): void {
    if (this.#error) {
      this.#error.hidden = true;
      this.#error.textContent = "";
    }
  }
}
