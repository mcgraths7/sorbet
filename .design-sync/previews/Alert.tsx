import { Alert, CheckIcon } from "@sorbet/component-library";

export function Tones() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <Alert tone="info" title="Scheduled maintenance">
        We're upgrading our payment infrastructure tonight from 11pm–1am ET. Checkout may be briefly
        unavailable.
      </Alert>
      <Alert tone="success" title="Payment received" icon={<CheckIcon />}>
        Your invoice #4821 for $1,240.00 has been paid in full.
      </Alert>
      <Alert tone="warning" title="Card expiring soon">
        The card ending in 4242 on your account expires at the end of this month. Update it to avoid a
        lapse in service.
      </Alert>
      <Alert tone="danger" title="Sync failed">
        We couldn't reach your Shopify store. Check your API credentials and try syncing again.
      </Alert>
    </div>
  );
}

export function Dismissible() {
  return (
    <Alert tone="info" title="New: saved filters" onDismiss={() => {}}>
      You can now save any table filter as a view from the toolbar.
    </Alert>
  );
}
