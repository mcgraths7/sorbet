import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { Button, Heading, Text } from "../atoms/index.ts";
import { Stack } from "../layout/index.ts";

import { Modal, ModalBody, ModalFooter } from "./modal.tsx";

export interface AlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  /** Body text; ignored when `children` is given. */
  description?: ReactNode;
  /** Custom body, replacing `description`. */
  children?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Confirm intent — `danger` reddens the button and focuses Cancel instead. */
  tone?: "primary" | "danger";
  onConfirm?: () => void;
  onCancel?: () => void;
}

/**
 * A focused confirmation modal (role="alertdialog") over the native `<dialog>`.
 * Confirm fires `onConfirm`; the Cancel button, Escape, and the backdrop all
 * fire `onCancel` — each exactly once, and all close via `onOpenChange`.
 */
export function AlertDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "primary",
  onConfirm,
  onCancel,
}: AlertDialogProps) {
  const id = useId();
  const titleId = `${id}-title`;
  const descId = `${id}-desc`;
  const confirmRef = useRef<HTMLButtonElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  // A button click routes through the native close, so record the intent and
  // fire the callback once, in the single close handler.
  const confirmed = useRef(false);

  // Focus the safe default: Cancel for a destructive action, Confirm otherwise.
  useEffect(() => {
    if (open) {
      (tone === "danger" ? cancelRef : confirmRef).current?.focus();
    }
  }, [open, tone]);

  // Fires once per close (native `close` event), whatever triggered it.
  const handleClose = () => {
    if (confirmed.current) {
      onConfirm?.();
    } else {
      onCancel?.();
    }
    confirmed.current = false;
    onOpenChange(false);
  };

  const requestClose = (didConfirm: boolean) => {
    confirmed.current = didConfirm;
    onOpenChange(false); // closes the dialog → handleClose runs the callback
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      size="sm"
      role="alertdialog"
      aria-labelledby={titleId}
      aria-describedby={description != null && children == null ? descId : undefined}
    >
      <ModalBody>
        <Stack gap={2}>
          <Heading level={2} size="lg" id={titleId}>
            {title}
          </Heading>
          {children ?? (description != null && (
            <Text id={descId} tone="muted">
              {description}
            </Text>
          ))}
        </Stack>
      </ModalBody>
      <ModalFooter>
        <Button ref={cancelRef} variant="ghost" onClick={() => requestClose(false)}>
          {cancelLabel}
        </Button>
        <Button
          ref={confirmRef}
          variant={tone === "danger" ? "danger" : "primary"}
          onClick={() => requestClose(true)}
        >
          {confirmLabel}
        </Button>
      </ModalFooter>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Imperative confirm — `const confirm = useConfirm(); if (await confirm({…}))`.

export interface ConfirmOptions {
  title: ReactNode;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "primary" | "danger";
}

interface ConfirmContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function useConfirm(): ConfirmContextValue["confirm"] {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error("useConfirm must be used inside <ConfirmProvider>");
  }
  return ctx.confirm;
}

/** Renders one shared AlertDialog and hands out a promise-returning `confirm`. */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  // Kept during the close animation so the content doesn't blank out mid-exit.
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback(
    (opts: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        resolveRef.current = resolve;
        setOptions(opts);
        setOpen(true);
      }),
    [],
  );

  const settle = useCallback((result: boolean) => {
    resolveRef.current?.(result);
    resolveRef.current = null;
  }, []);

  const value = useMemo(() => ({ confirm }), [confirm]);

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      <AlertDialog
        open={open}
        onOpenChange={setOpen}
        onConfirm={() => settle(true)}
        onCancel={() => settle(false)}
        title={options?.title ?? ""}
        description={options?.description}
        confirmLabel={options?.confirmLabel}
        cancelLabel={options?.cancelLabel}
        tone={options?.tone}
      />
    </ConfirmContext.Provider>
  );
}
