import { Button, CloseIcon, Icon, Tooltip } from "@sorbet/component-library";

export function OnButton() {
  return (
    <Tooltip content="Saves your current draft without publishing it">
      <Button autoFocus variant="secondary">
        Save draft
      </Button>
    </Tooltip>
  );
}

export function OnIconButton() {
  return (
    <Tooltip content="Dismiss this notification">
      <Button variant="ghost" iconOnly aria-label="Dismiss notification">
        <Icon size="sm">
          <CloseIcon />
        </Icon>
      </Button>
    </Tooltip>
  );
}

export function OnInlineText() {
  return (
    <p style={{ margin: 0 }}>
      Orders ship in{" "}
      <Tooltip content="Coordinated Universal Time — matches your account setting">
        <span tabIndex={0} style={{ textDecoration: "underline dotted", cursor: "help" }}>
          UTC
        </span>
      </Tooltip>{" "}
      business hours.
    </p>
  );
}
