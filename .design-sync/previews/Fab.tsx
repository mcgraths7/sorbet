import { Fab, Icon, PlusIcon } from "@sorbet/component-library";

export function Default() {
  return (
    <div style={{ height: 160 }}>
      <Fab aria-label="Compose new order">
        <Icon size="lg">
          <PlusIcon />
        </Icon>
      </Fab>
    </div>
  );
}
