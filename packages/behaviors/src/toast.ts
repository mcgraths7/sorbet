/**
 * Toast notifications. One polite live region per page; toasts announce
 * themselves, time out (unless sticky), and can be dismissed.
 *
 *   toast("Saved");
 *   toast("Deploy failed", { tone: "danger", title: "Error", duration: 0 });
 */

export interface ToastOptions {
  title?: string;
  tone?: "success" | "warning" | "danger" | "info";
  /** ms before auto-dismiss; 0 keeps the toast until dismissed */
  duration?: number;
}

function region(): HTMLElement {
  let el = document.querySelector<HTMLElement>(".sb-toast-region");
  if (!el) {
    el = document.createElement("div");
    el.className = "sb-toast-region";
    el.setAttribute("role", "region");
    el.setAttribute("aria-live", "polite");
    el.setAttribute("aria-label", "Notifications");
    document.body.append(el);
  }
  return el;
}

export function toast(message: string, { title, tone, duration = 5000 }: ToastOptions = {}): () => void {
  const el = document.createElement("div");
  el.className = `sb-toast${tone ? ` sb-toast--${tone}` : ""}`;

  const content = document.createElement("div");
  if (title) {
    const heading = document.createElement("p");
    heading.className = "sb-toast__title";
    heading.textContent = title;
    content.append(heading);
  }
  const body = document.createElement("p");
  body.className = "sb-toast__body";
  body.textContent = message;
  content.append(body);

  const dismissButton = document.createElement("button");
  dismissButton.type = "button";
  dismissButton.className = "sb-toast__dismiss";
  dismissButton.setAttribute("aria-label", "Dismiss notification");
  dismissButton.textContent = "×";

  el.append(content, dismissButton);
  region().append(el);

  let timer: ReturnType<typeof setTimeout> | undefined;

  const dismiss = () => {
    clearTimeout(timer);
    if (!el.isConnected || el.hasAttribute("data-leaving")) return;
    el.setAttribute("data-leaving", "");
    el.addEventListener("transitionend", () => el.remove(), { once: true });
    // Fallback removal in case transitions are disabled (reduced motion).
    setTimeout(() => el.remove(), 400);
  };

  dismissButton.addEventListener("click", dismiss);
  if (duration > 0) timer = setTimeout(dismiss, duration);

  return dismiss;
}
