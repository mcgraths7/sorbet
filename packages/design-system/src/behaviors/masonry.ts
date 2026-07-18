/**
 * Masonry balancer. Upgrades .sb-masonry from the multi-column fallback to a
 * balanced grid that preserves DOM order: each item spans enough 2px rows to
 * cover its measured height plus the gap. ResizeObserver keeps spans honest
 * through image loads, content changes, and container resizes; a
 * MutationObserver adopts added/removed items.
 *
 * Stands down entirely when the browser has native CSS masonry.
 *
 *   <div class="sb-masonry" data-sb="masonry"> …items… </div>
 */

export function supportsNativeMasonry(): boolean {
  return typeof CSS !== "undefined" && CSS.supports("grid-template-rows", "masonry");
}

export class Masonry {
  #container: HTMLElement;
  #resizeObserver: ResizeObserver | undefined;
  #mutationObserver: MutationObserver | undefined;

  constructor(container: HTMLElement) {
    this.#container = container;
    if (supportsNativeMasonry()) {
      return;
    }

    container.classList.add("sb-masonry--balanced");

    this.#resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        this.#span(entry.target as HTMLElement);
      }
    });
    // Span synchronously first — no unbalanced first frame, no reliance on
    // the observer's initial delivery timing.
    for (const child of container.children) {
      if (child instanceof HTMLElement) {
        this.#span(child);
      }
      this.#resizeObserver.observe(child);
    }

    this.#mutationObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node instanceof HTMLElement) {
            this.#resizeObserver!.observe(node);
            this.#span(node);
          }
        }
        for (const node of mutation.removedNodes) {
          if (node instanceof HTMLElement) {
            this.#resizeObserver!.unobserve(node);
          }
        }
      }
    });
    this.#mutationObserver.observe(container, { childList: true });
  }

  #span(item: HTMLElement): void {
    const rowHeight = 2; // matches grid-auto-rows in _masonry.scss
    const gap = parseFloat(getComputedStyle(this.#container).columnGap) || 0;
    const height = item.getBoundingClientRect().height;
    item.style.gridRowEnd = `span ${Math.max(1, Math.ceil((height + gap) / rowHeight))}`;
  }

  destroy(): void {
    this.#resizeObserver?.disconnect();
    this.#mutationObserver?.disconnect();
    this.#container.classList.remove("sb-masonry--balanced");
    for (const child of this.#container.children) {
      if (child instanceof HTMLElement) {
        child.style.gridRowEnd = "";
      }
    }
  }
}
