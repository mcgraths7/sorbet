import { Accordion, AccordionItem } from "@sorbet/component-library";

export function Default() {
  return (
    <Accordion name="faq">
      <AccordionItem summary="What's your return policy?" defaultOpen>
        We accept returns within 30 days of delivery, no questions asked. Items must be unused and in their
        original packaging — we'll email a prepaid shipping label as soon as you start the return.
      </AccordionItem>
      <AccordionItem summary="How long does shipping take?">
        Standard shipping arrives in 3–5 business days. Orders placed before 2pm ET ship the same day, and
        you'll get a tracking link by email the moment your package leaves the warehouse.
      </AccordionItem>
      <AccordionItem summary="Do you ship internationally?">
        Yes — we currently ship to Canada, the UK, and most of the EU. Duties and taxes are calculated at
        checkout so there are no surprises when the package arrives.
      </AccordionItem>
    </Accordion>
  );
}

export function IndependentSections() {
  return (
    <Accordion exclusive={false}>
      <AccordionItem summary="Shipping address" defaultOpen>
        Morgan Lee — 221 Baker St, Apt 4B, Boston, MA 02118
      </AccordionItem>
      <AccordionItem summary="Payment method" defaultOpen>
        Visa ending in 4242, billed to the same address.
      </AccordionItem>
      <AccordionItem summary="Delivery notes">Leave the package with the doorman if no one answers.</AccordionItem>
    </Accordion>
  );
}
