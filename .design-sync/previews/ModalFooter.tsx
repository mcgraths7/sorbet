import { Button, Modal, ModalBody, ModalFooter, ModalHeader, Text } from "@sorbet/component-library";

// ModalFooter only makes sense inside an open Modal, so each card composes
// the full dialog. This card's focus is the footer action row itself.

export function Default() {
  return (
    <Modal open onClose={() => {}} aria-labelledby="footer-default-title">
      <ModalHeader onClose={() => {}}>
        <Text id="footer-default-title" weight="semibold" size="lg">
          Discard draft?
        </Text>
      </ModalHeader>
      <ModalBody>
        <Text tone="muted">Your changes to this newsletter draft haven't been saved.</Text>
      </ModalBody>
      <ModalFooter>
        <Button variant="ghost">Keep editing</Button>
        <Button variant="danger">Discard</Button>
      </ModalFooter>
    </Modal>
  );
}

export function ThreeActions() {
  return (
    <Modal open onClose={() => {}} aria-labelledby="footer-three-title">
      <ModalHeader onClose={() => {}}>
        <Text id="footer-three-title" weight="semibold" size="lg">
          Unsaved changes
        </Text>
      </ModalHeader>
      <ModalBody>
        <Text tone="muted">Save your changes to this recipe before switching collections?</Text>
      </ModalBody>
      <ModalFooter>
        <Button variant="ghost">Cancel</Button>
        <Button variant="outline">Don't save</Button>
        <Button variant="primary">Save</Button>
      </ModalFooter>
    </Modal>
  );
}
