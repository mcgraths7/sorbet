/**
 * Declarative dismissal for alerts, chips, banners:
 *
 *   <div class="sb-alert" role="status">
 *     …<button class="sb-alert__dismiss" data-sb-dismiss aria-label="Dismiss">×</button>
 *   </div>
 *
 * The button removes its closest dismissible ancestor.
 */

const DISMISSIBLE = "[data-sb-dismissible], .sb-alert, .sb-chip, .sb-toast";

export function initDismiss(root: ParentNode = document): void {
  root.addEventListener("click", (e) => {
    const button = (e.target as HTMLElement).closest?.("[data-sb-dismiss]");
    button?.closest(DISMISSIBLE)?.remove();
  });
}
