import { useEffect } from "react";
import { ToastProvider, useToast } from "@sorbet/component-library";

// ToastProvider has no visual output of its own — it's context + an
// aria-live region portaled to document.body (like ThemeProvider was).
// To demonstrate its real output, each demo nests its own ToastProvider and
// calls the real useToast() imperative API in a mount effect, so an actual
// <div class="sb-toast"> renders through the component's genuine code path
// rather than being faked.

function OrderConfirmedDemo() {
  const toast = useToast();
  useEffect(() => {
    toast("Your order will arrive Thursday between 9am–12pm.", { title: "Order confirmed", tone: "success" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <div style={{ width: 320, minBlockSize: 80 }} />;
}

/** A single success toast, fired for real via useToast() on mount. */
export function Default() {
  return (
    <ToastProvider>
      <OrderConfirmedDemo />
    </ToastProvider>
  );
}

function StackedDemo() {
  const toast = useToast();
  useEffect(() => {
    toast("Only 2 servings left for the salmon bowl this week.", { title: "Low stock", tone: "warning" });
    toast("We couldn't charge your card ending 4242.", { title: "Payment failed", tone: "danger" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <div style={{ width: 320, minBlockSize: 160 }} />;
}

/** Two toasts stacked (different tones), demonstrating the region's layout. */
export function Stacked() {
  return (
    <ToastProvider>
      <StackedDemo />
    </ToastProvider>
  );
}
