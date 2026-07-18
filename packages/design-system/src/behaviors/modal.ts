/**
 * Native <dialog> wiring. The platform provides focus trapping, Escape,
 * ::backdrop and top-layer stacking; this adds declarative triggers and
 * light dismiss (click on the backdrop closes).
 *
 *   <button data-sb-open="confirm">Delete…</button>
 *   <dialog class="sb-modal" id="confirm" data-sb="modal">
 *     …<button data-sb-close>Cancel</button>…
 *   </dialog>
 */

export function openModal(id: string): HTMLDialogElement | null {
  const dialog = document.getElementById(id);
  if (dialog instanceof HTMLDialogElement) {
    dialog.showModal();
    return dialog;
  }
  return null;
}

export function initModals(root: ParentNode = document): void {
  for (const trigger of root.querySelectorAll<HTMLElement>("[data-sb-open]")) {
    if (trigger.dataset.sbReady) {
      continue;
    }
    trigger.dataset.sbReady = "true";
    trigger.addEventListener("click", () => openModal(trigger.dataset.sbOpen!));
  }

  for (const dialog of root.querySelectorAll<HTMLDialogElement>('dialog[data-sb="modal"]')) {
    if (dialog.dataset.sbReady) {
      continue;
    }
    dialog.dataset.sbReady = "true";

    dialog.addEventListener("click", (e) => {
      // A click that lands on the <dialog> itself (not its children) is a
      // backdrop click, unless opted out with data-static.
      if (e.target === dialog && !dialog.hasAttribute("data-static")) {
        dialog.close();
      }
    });

    for (const closer of dialog.querySelectorAll<HTMLElement>("[data-sb-close]")) {
      closer.addEventListener("click", () => dialog.close());
    }
  }
}
