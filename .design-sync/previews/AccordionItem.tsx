import { Accordion, AccordionItem } from "@sorbet/component-library";

// AccordionItem only makes sense inside its Accordion group — this composes
// the full parent, same as the Accordion.tsx preview, since that's the only
// honest way to render it.

export function Default() {
  return (
    <Accordion name="faq-item">
      <AccordionItem summary="Can I pause or skip a week?" defaultOpen>
        Yes — pause or skip any upcoming delivery from your account up to 5 days before it ships. No fees,
        no phone calls.
      </AccordionItem>
      <AccordionItem summary="What if an ingredient arrives damaged?">
        Send us a photo within 48 hours and we'll credit your account or reship the item, whichever you
        prefer.
      </AccordionItem>
      <AccordionItem summary="Can I change my delivery day?">
        Update your delivery day anytime from Account settings — it takes effect on your next order.
      </AccordionItem>
    </Accordion>
  );
}

export function Nested() {
  return (
    <Accordion exclusive={false}>
      <AccordionItem summary="Order #48213 — packed" defaultOpen>
        Packed at 6:42am from the Somerville facility, 3 items, cold-chain verified.
      </AccordionItem>
      <AccordionItem summary="Order #48213 — out for delivery" defaultOpen>
        Left the facility at 9:15am with driver route B-12, estimated arrival 2–4pm.
      </AccordionItem>
    </Accordion>
  );
}
