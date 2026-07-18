/**
 * Tooltips from a data attribute, rendered as a manual popover in the top
 * layer. Shows on hover and on keyboard focus; wires aria-describedby so
 * screen readers get the same text.
 *
 *   <button class="sb-button sb-button--icon" aria-label="Settings"
 *           data-tooltip="Settings">⚙︎</button>
 */

const GAP = 8;
let panel: HTMLDivElement | undefined;
let shownFor: HTMLElement | undefined;

function getPanel(): HTMLDivElement {
  if (!panel) {
    panel = document.createElement("div");
    panel.className = "sb-tooltip";
    panel.id = "sb-tooltip";
    panel.setAttribute("role", "tooltip");
    panel.popover = "manual";
    document.body.append(panel);
  }
  return panel;
}

function show(target: HTMLElement): void {
  const text = target.dataset.tooltip;
  if (!text) {
    return;
  }
  const tip = getPanel();
  tip.textContent = text;
  shownFor = target;
  target.setAttribute("aria-describedby", tip.id);
  tip.showPopover();

  const r = target.getBoundingClientRect();
  let left = r.left + r.width / 2 - tip.offsetWidth / 2;
  left = Math.min(Math.max(left, GAP), window.innerWidth - tip.offsetWidth - GAP);
  let top = r.top - tip.offsetHeight - GAP;
  if (top < GAP) {
    top = r.bottom + GAP;
  }
  tip.style.left = `${left}px`;
  tip.style.top = `${top}px`;
}

function hide(): void {
  shownFor?.removeAttribute("aria-describedby");
  shownFor = undefined;
  panel?.hidePopover();
}

export function initTooltips(root: ParentNode = document): void {
  const target = (e: Event) => (e.target as HTMLElement).closest?.<HTMLElement>("[data-tooltip]");

  root.addEventListener("mouseover", (e) => {
    const t = target(e);
    if (t && t !== shownFor) {
      show(t);
    }
  });
  root.addEventListener("mouseout", (e) => {
    if (target(e)) {
      hide();
    }
  });
  root.addEventListener("focusin", (e) => {
    const t = target(e);
    if (t) {
      show(t);
    }
  });
  root.addEventListener("focusout", (e) => {
    if (target(e)) {
      hide();
    }
  });
  root.addEventListener("keydown", (e) => {
    if ((e as KeyboardEvent).key === "Escape") {
      hide();
    }
  });
}
