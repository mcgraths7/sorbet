import { Button } from "@sorbet/component-library/atoms";
import { Cluster, Stack } from "@sorbet/component-library/layout";
import { Alert, useToast } from "@sorbet/component-library/molecules";
import { useConfirm } from "@sorbet/component-library/organisms";

import type { DemoMeta } from "./types.ts";

export function AlertsToastsDemo() {
  const toast = useToast();
  const confirm = useConfirm();
  return (
    <>
      <Stack gap={3}>
        <Alert tone="success" title="Deployed" onDismiss={() => toast("Alert dismissed")}>
          Build 214 is live in production.
        </Alert>
        <Alert tone="danger" title="Payment failed" role="alert">
          We couldn't charge your card.
        </Alert>
      </Stack>
      <Cluster>
        <Button variant="soft" onClick={() => toast("All changes saved.", { tone: "success" })}>
          Success toast
        </Button>
        <Button
          variant="soft"
          onClick={() => toast("I stay until dismissed.", { title: "Sticky", tone: "info", duration: 0 })}
        >
          Sticky toast
        </Button>
        <Button
          variant="danger"
          onClick={async() => {
            const ok = await confirm({
              title: "Delete account?",
              description: "This permanently removes your account and all its data. This can't be undone.",
              confirmLabel: "Delete account",
              tone: "danger",
            });
            toast(ok ? "Account deleted." : "Cancelled — nothing was removed.", { tone: ok ? "danger" : "info" });
          }}
        >
          Delete account…
        </Button>
      </Cluster>
    </>
  );
}

AlertsToastsDemo.demo = { title: "Alerts & toasts", layer: "molecules", order: 30 } satisfies DemoMeta;
