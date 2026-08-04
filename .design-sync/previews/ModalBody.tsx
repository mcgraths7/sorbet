import { Button, Field, Input, Modal, ModalBody, ModalFooter, ModalHeader, Text } from "@sorbet/component-library";

// ModalBody only makes sense inside an open Modal, so each card composes the
// full dialog. This card's focus is the scrollable content area itself.

export function Default() {
  return (
    <Modal open onClose={() => {}} aria-labelledby="body-default-title">
      <ModalHeader onClose={() => {}}>
        <Text id="body-default-title" weight="semibold" size="lg">
          Shipping address
        </Text>
      </ModalHeader>
      <ModalBody>
        <Field label="Street address">
          <Input defaultValue="482 Willow Creek Rd" />
        </Field>
        <Field label="City">
          <Input defaultValue="Asheville" />
        </Field>
      </ModalBody>
      <ModalFooter>
        <Button variant="ghost">Cancel</Button>
        <Button variant="primary">Save address</Button>
      </ModalFooter>
    </Modal>
  );
}

export function LongContent() {
  return (
    <Modal open onClose={() => {}} aria-labelledby="body-long-title">
      <ModalHeader onClose={() => {}}>
        <Text id="body-long-title" weight="semibold" size="lg">
          Terms of service
        </Text>
      </ModalHeader>
      <ModalBody>
        <Text tone="muted">
          By continuing, you agree to our delivery windows, substitution policy for out-of-stock
          ingredients, and weekly billing schedule.
        </Text>
        <Text tone="muted">
          Boxes ship every Tuesday and Friday. You can pause, skip, or cancel a delivery up until
          48 hours before your scheduled ship date — after that, the box is already packed and
          can't be changed.
        </Text>
        <Text tone="muted">
          If an ingredient is unavailable, we substitute with an equivalent of the same or greater
          value and note the swap in your delivery email.
        </Text>
      </ModalBody>
      <ModalFooter>
        <Button variant="ghost">Decline</Button>
        <Button variant="primary">I agree</Button>
      </ModalFooter>
    </Modal>
  );
}
