"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

import { cx, type Tone } from "../core/index.ts";

export interface ToastOptions {
  title?: ReactNode;
  tone?: Tone;
  /** ms before auto-dismiss; 0 keeps the toast until dismissed. */
  duration?: number;
}

interface ToastRecord extends ToastOptions {
  id: number;
  message: ReactNode;
  leaving?: boolean;
}

interface ToastContextValue {
  toast: (message: ReactNode, options?: ToastOptions) => () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

/** Whether we have hydrated never changes after it flips, so there is nothing
 *  to subscribe to. Module-level so the reference stays stable across renders. */
const subscribeNever = () => () => {};

export function useToast(): ToastContextValue["toast"] {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used inside <ToastProvider>");
  }
  return ctx.toast;
}

const LEAVE_MS = 250;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((all) => all.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
    setTimeout(() => setToasts((all) => all.filter((t) => t.id !== id)), LEAVE_MS + 100);
  }, []);

  const toast = useCallback(
    (message: ReactNode, { title, tone, duration = 5000 }: ToastOptions = {}) => {
      const id = nextId.current++;
      setToasts((all) => [...all, { id, message, title, tone, duration }]);
      if (duration > 0) {
        setTimeout(() => dismiss(id), duration);
      }
      return () => dismiss(id);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ toast }), [toast]);

  // The portal needs document.body, which does not exist while server
  // rendering — and "use client" does not exempt a component from that, since
  // the server still renders it for the initial HTML. Waiting for mount is
  // also honest about the content: a toast is raised by interaction, so there
  // is never one to render on the server.
  //
  // useSyncExternalStore is how React answers "have I hydrated yet": it uses
  // the server snapshot for the hydrating render and the client one after, so
  // markup matches and the portal appears in the same commit. A bare
  // `typeof document !== "undefined"` would be true on the client's very first
  // render and mismatch; setting state in an effect would cost a second render.
  const mounted = useSyncExternalStore(subscribeNever, () => true, () => false);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {mounted &&
        createPortal(
          <div className="sb-toast-region" role="region" aria-live="polite" aria-label="Notifications">
            {toasts.map((t) => (
              <div
                key={t.id}
                className={cx("sb-toast", t.tone && `sb-toast--${t.tone}`)}
                data-leaving={t.leaving || undefined}
              >
                <div>
                  {t.title && <p className="sb-toast__title">{t.title}</p>}
                  <p className="sb-toast__body">{t.message}</p>
                </div>
                <button
                  type="button"
                  className="sb-toast__dismiss sb-close"
                  aria-label="Dismiss notification"
                  onClick={() => dismiss(t.id)}
                />
              </div>
            ))}
          </div>,
          document.body,
        )}
    </ToastContext.Provider>
  );
}
