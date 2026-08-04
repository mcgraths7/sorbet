import { Button, Modal, ModalBody, ModalFooter, ModalHeader, Text } from "@sorbet/component-library";

// ModalHeader only makes sense inside an open Modal, so each card composes
// the full dialog. This card's focus is the header row itself: the title
// slot plus the wired × close button (rendered only when `onClose` is given).

export function Default() {
  return (
    <Modal open onClose={() => {}} aria-labelledby="header-default-title">
      <ModalHeader onClose={() => {}}>
        <Text id="header-default-title" weight="semibold" size="lg">
          Upgrade to Pro
        </Text>
      </ModalHeader>
      <ModalBody>
        <Text tone="muted">Unlock unlimited boards, priority support, and custom domains.</Text>
      </ModalBody>
      <ModalFooter>
        <Button variant="ghost">Not now</Button>
        <Button variant="primary">Upgrade</Button>
      </ModalFooter>
    </Modal>
  );
}

export function NoCloseButton() {
  return (
    <Modal open onClose={() => {}} size="sm" static aria-labelledby="header-nocloseX-title">
      <ModalHeader>
        <Text id="header-nocloseX-title" weight="semibold" size="lg">
          Processing payment…
        </Text>
      </ModalHeader>
      <ModalBody>
        <Text tone="muted">This can take up to a minute. Please don't close this window.</Text>
      </ModalBody>
    </Modal>
  );
}

export function CustomLabel() {
  return (
    <Modal open onClose={() => {}} aria-labelledby="header-customlabel-title">
      <ModalHeader onClose={() => {}} closeLabel="Dismiss recipe details">
        <Text id="header-customlabel-title" weight="semibold" size="lg">
          Roasted Tomato Basil Soup
        </Text>
      </ModalHeader>
      <ModalBody>
        <Text tone="muted">A weeknight staple: 25 minutes, one pot, freezes well for later.</Text>
      </ModalBody>
      <ModalFooter>
        <Button variant="ghost">Close</Button>
        <Button variant="primary">Add to this week's box</Button>
      </ModalFooter>
    </Modal>
  );
}
