import { Button, Field, Input, Modal, ModalBody, ModalFooter, ModalHeader, Text } from "@sorbet/component-library";

// Modal wraps a native <dialog> opened via showModal() — passing a static
// `open` prop drives the real mount effect (dialog.showModal()), so this is
// the actual dialog chrome/backdrop, not a mocked-up look-alike. A real open
// modal renders in the top layer over the whole viewport, so it's expected to
// escape the card grid — see learnings for the cardMode:"single" flag.

export function Default() {
  return (
    <Modal open onClose={() => {}} aria-labelledby="invite-title">
      <ModalHeader onClose={() => {}}>
        <Text id="invite-title" weight="semibold" size="lg">
          Invite teammates
        </Text>
      </ModalHeader>
      <ModalBody>
        <Field label="Email address" hint="They'll get an email with a link to join.">
          <Input type="email" placeholder="jordan@acme.com" />
        </Field>
      </ModalBody>
      <ModalFooter>
        <Button variant="ghost">Cancel</Button>
        <Button variant="primary">Send invite</Button>
      </ModalFooter>
    </Modal>
  );
}

export function Small() {
  return (
    <Modal open onClose={() => {}} size="sm" aria-labelledby="signout-title">
      <ModalHeader onClose={() => {}}>
        <Text id="signout-title" weight="semibold" size="lg">
          Sign out?
        </Text>
      </ModalHeader>
      <ModalBody>
        <Text tone="muted">You'll need to sign back in to access your dashboards.</Text>
      </ModalBody>
      <ModalFooter>
        <Button variant="ghost">Cancel</Button>
        <Button variant="danger">Sign out</Button>
      </ModalFooter>
    </Modal>
  );
}

export function Large() {
  return (
    <Modal open onClose={() => {}} size="lg" aria-labelledby="settings-title">
      <ModalHeader onClose={() => {}}>
        <Text id="settings-title" weight="semibold" size="lg">
          Project settings
        </Text>
      </ModalHeader>
      <ModalBody>
        <Field label="Project name">
          <Input defaultValue="Meal Kit — Ops Dashboard" />
        </Field>
        <Field label="Description" hint="Shown to teammates on the project list.">
          <Input defaultValue="Internal ops tooling for weekly box fulfillment." />
        </Field>
      </ModalBody>
      <ModalFooter>
        <Button variant="ghost">Discard</Button>
        <Button variant="primary">Save changes</Button>
      </ModalFooter>
    </Modal>
  );
}
