import { Split, SplitAside, SplitMain, Text } from "@sorbet/component-library";

const asideBox = {
  background: "var(--sb-surface-raised)",
  border: "1px solid var(--sb-border)",
  borderRadius: "var(--sb-radius-md)",
  padding: 16,
} as const;

const mainBox = {
  background: "var(--sb-primary-subtle)",
  border: "1px solid var(--sb-border)",
  borderRadius: "var(--sb-radius-md)",
  padding: 16,
} as const;

/** Default aside width (16rem), sidebar-and-content that stacks when narrow. */
export function Default() {
  return (
    <Split>
      <SplitAside>
        <div style={asideBox}>
          <Text weight="semibold">Sidebar</Text>
        </div>
      </SplitAside>
      <SplitMain>
        <div style={mainBox}>
          <Text>Main content takes the remaining space.</Text>
        </div>
      </SplitMain>
    </Split>
  );
}

/** asideRight reverses the pair, aside on the trailing side. */
export function AsideRight() {
  return (
    <Split asideRight>
      <SplitAside>
        <div style={asideBox}>
          <Text weight="semibold">Sidebar (right)</Text>
        </div>
      </SplitAside>
      <SplitMain>
        <div style={mainBox}>
          <Text>Main content is now on the left.</Text>
        </div>
      </SplitMain>
    </Split>
  );
}

/** A much wider aside via the `aside` prop. */
export function WideAside() {
  return (
    <Split aside="24rem">
      <SplitAside>
        <div style={asideBox}>
          <Text weight="semibold">aside=&quot;24rem&quot;</Text>
        </div>
      </SplitAside>
      <SplitMain>
        <div style={mainBox}>
          <Text>The main column shrinks to make room.</Text>
        </div>
      </SplitMain>
    </Split>
  );
}
