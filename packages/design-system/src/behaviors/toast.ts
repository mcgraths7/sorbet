/**
 * Toast notifications. One polite live region per page; toasts announce
 * themselves, time out (unless sticky), and can be dismissed.
 *
 *   toast("Saved");
 *   toast("Deploy failed", { tone: "danger", title: "Error", duration: 0 });
 *
 * A toast with a tone leads with that status's icon and a word for screen
 * readers ("Error: "), so its status never rests on colour alone: the same
 * slot the React toast renders (legibility-spec.md L186, L194 (b)).
 */

type Tone = "success" | "warning" | "danger" | "info";

export interface ToastOptions {
  title?: string;
  tone?: Tone;
  /** With a tone: replaces the hidden word, e.g. for another language. */
  statusLabel?: string;
  /** ms before auto-dismiss; 0 keeps the toast until dismissed */
  duration?: number;
}

// The four status glyphs and words, as the component library's `atoms/icons.tsx`
// has them: the behaviors take no dependency, so this is a copy, and
// packages/component-library/tools/test-status.ts holds the two equal.
const STATUS_PATHS: Record<Tone, string> = {
  success:
    "M1 12A11 11 0 1 0 23 12A11 11 0 1 0 1 12Z" +
    "M6.581 13.419L9.581 16.419A1.3 1.3 0 0 0 11.455 16.382L17.455 9.882A1.3 1.3 0 0 0 15.545 8.118L10.462 13.624L8.419 11.581A1.3 1.3 0 0 0 6.581 13.419Z",
  warning:
    "M12.868 2.303L23.068 20.103A1 1 0 0 1 22.2 21.6L1.8 21.6A1 1 0 0 1 0.932 20.103L11.132 2.303A1 1 0 0 1 12.868 2.303Z" +
    "M10.7 9.3A1.3 1.3 0 0 1 13.3 9.3V13.9A1.3 1.3 0 0 1 10.7 13.9Z" +
    "M10.39 17.2A1.61 1.61 0 1 0 13.61 17.2A1.61 1.61 0 1 0 10.39 17.2Z",
  danger:
    "M8.1 0.8L15.9 0.8A1 1 0 0 1 16.607 1.093L22.907 7.393A1 1 0 0 1 23.2 8.1L23.2 15.9A1 1 0 0 1 22.907 16.607" +
    "L16.607 22.907A1 1 0 0 1 15.9 23.2L8.1 23.2A1 1 0 0 1 7.393 22.907L1.093 16.607A1 1 0 0 1 0.8 15.9L0.8 8.1" +
    "A1 1 0 0 1 1.093 7.393L7.393 1.093A1 1 0 0 1 8.1 0.8Z" +
    "M12 10.162L14.281 7.881A1.3 1.3 0 0 1 16.119 9.719L13.838 12L16.119 14.281A1.3 1.3 0 0 1 14.281 16.119L12 13.838" +
    "L9.719 16.119A1.3 1.3 0 0 1 7.881 14.281L10.162 12L7.881 9.719A1.3 1.3 0 0 1 9.719 7.881Z",
  info:
    "M6.5 1H17.5A5.5 5.5 0 0 1 23 6.5V17.5A5.5 5.5 0 0 1 17.5 23H6.5A5.5 5.5 0 0 1 1 17.5V6.5A5.5 5.5 0 0 1 6.5 1Z" +
    "M10.39 7.6A1.61 1.61 0 1 0 13.61 7.6A1.61 1.61 0 1 0 10.39 7.6Z" +
    "M10.7 11A1.3 1.3 0 0 1 13.3 11V17A1.3 1.3 0 0 1 10.7 17Z",
};
const STATUS_WORDS: Record<Tone, string> = { success: "Success", warning: "Warning", danger: "Error", info: "Information" };
const SVG = "http://www.w3.org/2000/svg";

/** The status slot: the glyph, then the visually hidden word, in one positioned span (L186). */
function statusMark(tone: Tone, statusLabel: string | undefined): HTMLElement {
  const slot = document.createElement("span");
  slot.className = "sb-status sb-toast__icon";
  const svg = document.createElementNS(SVG, "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  svg.setAttribute("class", `sb-status-icon sb-status-icon--${tone}`);
  const path = document.createElementNS(SVG, "path");
  path.setAttribute("fill", "currentColor");
  path.setAttribute("fill-rule", "evenodd");
  path.setAttribute("d", STATUS_PATHS[tone]);
  svg.append(path);
  const word = document.createElement("span");
  word.className = "u-visually-hidden";
  word.textContent = `${statusLabel?.trim() || STATUS_WORDS[tone]}: `;
  slot.append(svg, word);
  return slot;
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

export function toast(message: string, { title, tone, statusLabel, duration = 5000 }: ToastOptions = {}): () => void {
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

  if (tone && Object.hasOwn(STATUS_PATHS, tone)) {
    el.append(statusMark(tone, statusLabel));
  }
  el.append(content, dismissButton);
  region().append(el);

  let timer: ReturnType<typeof setTimeout> | undefined;

  const dismiss = () => {
    clearTimeout(timer);
    if (!el.isConnected || el.hasAttribute("data-leaving")) {
      return;
    }
    el.setAttribute("data-leaving", "");
    el.addEventListener("transitionend", () => el.remove(), { once: true });
    // Fallback removal in case transitions are disabled (reduced motion).
    setTimeout(() => el.remove(), 400);
  };

  dismissButton.addEventListener("click", dismiss);
  if (duration > 0) {
    timer = setTimeout(dismiss, duration);
  }

  return dismiss;
}
