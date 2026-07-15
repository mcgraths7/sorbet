/**
 * WAI-ARIA tabs: roving tabindex, arrow-key navigation, automatic
 * activation. Markup contract is in molecules/_tabs.scss.
 */

let uid = 0;

export class Tabs {
  #tabs: HTMLElement[];
  #panels: HTMLElement[];

  constructor(root: HTMLElement) {
    this.#tabs = [...root.querySelectorAll<HTMLElement>('[role="tab"]')];
    this.#panels = [...root.querySelectorAll<HTMLElement>('[role="tabpanel"]')];

    this.#tabs.forEach((tab, i) => {
      const panel = this.#panels[i];
      if (panel) {
        tab.id ||= `sb-tab-${++uid}`;
        panel.id ||= `sb-panel-${uid}`;
        tab.setAttribute("aria-controls", panel.id);
        panel.setAttribute("aria-labelledby", tab.id);
      }
      tab.addEventListener("click", () => this.select(i));
    });

    const list = root.querySelector<HTMLElement>('[role="tablist"]');
    list?.addEventListener("keydown", (e) => this.#onKeydown(e));

    const initial = Math.max(0, this.#tabs.findIndex((t) => t.getAttribute("aria-selected") === "true"));
    this.select(initial, { focus: false });
  }

  select(index: number, { focus = true } = {}): void {
    this.#tabs.forEach((tab, i) => {
      const selected = i === index;
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
      const panel = this.#panels[i];
      if (panel) panel.hidden = !selected;
    });
    if (focus) this.#tabs[index]?.focus();
  }

  #onKeydown(e: KeyboardEvent): void {
    const current = this.#tabs.indexOf(e.target as HTMLElement);
    if (current === -1) return;
    const last = this.#tabs.length - 1;
    let next: number;
    switch (e.key) {
      case "ArrowRight":
      case "ArrowDown":
        next = current === last ? 0 : current + 1;
        break;
      case "ArrowLeft":
      case "ArrowUp":
        next = current === 0 ? last : current - 1;
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = last;
        break;
      default:
        return;
    }
    e.preventDefault();
    this.select(next);
  }
}
