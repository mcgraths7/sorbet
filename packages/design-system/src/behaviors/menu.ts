/**
 * Dropdown menu on the Popover API. The platform gives us top-layer
 * rendering, light dismiss and Escape for free; this adds anchor
 * positioning and arrow-key navigation.
 *
 *   <button data-sb="menu" popovertarget="user-menu">Account</button>
 *   <div class="sb-menu" id="user-menu" popover>
 *     <button class="sb-menu__item">Profile</button>…
 *   </div>
 */

const GAP = 6;
const EDGE = 8;

export class Menu {
  #trigger: HTMLElement;
  #panel: HTMLElement;

  constructor(trigger: HTMLElement) {
    const targetId = trigger.getAttribute("popovertarget");
    const panel = targetId ? document.getElementById(targetId) : null;
    if (!panel) throw new Error("Menu trigger needs popovertarget pointing at a panel");

    this.#trigger = trigger;
    this.#panel = panel;
    trigger.setAttribute("aria-haspopup", "menu");

    // The panel is position:fixed and can't track its trigger through page
    // scroll — dismiss instead (scrolling inside the panel is exempt;
    // scroll doesn't bubble, so listen in the capture phase).
    const onScroll = (e: Event) => {
      if (this.#panel.contains(e.target as Node)) return;
      this.#panel.hidePopover();
    };

    panel.addEventListener("toggle", (e) => {
      const open = (e as ToggleEvent).newState === "open";
      trigger.setAttribute("aria-expanded", String(open));
      if (open) {
        this.#position();
        this.#items()[0]?.focus();
        document.addEventListener("scroll", onScroll, { capture: true, passive: true });
      } else {
        document.removeEventListener("scroll", onScroll, { capture: true });
      }
    });

    panel.addEventListener("keydown", (e) => this.#onKeydown(e));
    panel.addEventListener("click", (e) => {
      if ((e.target as HTMLElement).closest(".sb-menu__item")) this.#close();
    });
  }

  #items(): HTMLElement[] {
    return [...this.#panel.querySelectorAll<HTMLElement>(".sb-menu__item:not(:disabled)")];
  }

  #close(): void {
    this.#panel.hidePopover();
    this.#trigger.focus();
  }

  #position(): void {
    const r = this.#trigger.getBoundingClientRect();
    const panel = this.#panel;
    const alignEnd = this.#trigger.hasAttribute("data-align-end");

    let left = alignEnd ? r.right - panel.offsetWidth : r.left;
    left = Math.min(Math.max(left, EDGE), window.innerWidth - panel.offsetWidth - EDGE);

    let top = r.bottom + GAP;
    if (top + panel.offsetHeight > window.innerHeight - EDGE) {
      top = Math.max(r.top - panel.offsetHeight - GAP, EDGE);
    }

    panel.style.left = `${left}px`;
    panel.style.top = `${top}px`;
  }

  #onKeydown(e: KeyboardEvent): void {
    const items = this.#items();
    const current = items.indexOf(document.activeElement as HTMLElement);
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        items[(current + 1) % items.length]?.focus();
        break;
      case "ArrowUp":
        e.preventDefault();
        items[current <= 0 ? items.length - 1 : current - 1]?.focus();
        break;
      case "Home":
        e.preventDefault();
        items[0]?.focus();
        break;
      case "End":
        e.preventDefault();
        items[items.length - 1]?.focus();
        break;
      case "Tab":
        // Menus don't tab-trap; close and let focus move on.
        this.#panel.hidePopover();
        break;
    }
  }
}
