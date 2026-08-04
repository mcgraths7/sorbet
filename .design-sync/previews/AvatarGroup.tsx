import { Avatar, AvatarGroup } from "@sorbet/component-library";

export function Default() {
  return (
    <AvatarGroup>
      <Avatar>AL</Avatar>
      <Avatar>GH</Avatar>
      <Avatar>MK</Avatar>
      <Avatar>+3</Avatar>
    </AvatarGroup>
  );
}

export function Large() {
  return (
    <AvatarGroup>
      <Avatar size="lg">JD</Avatar>
      <Avatar size="lg">RS</Avatar>
      <Avatar size="lg">TW</Avatar>
    </AvatarGroup>
  );
}
