import { Cluster, Frame, Masonry } from "@sorbet/component-library/layout";
import { Card } from "@sorbet/component-library/molecules";

import type { Demo } from "./types.ts";

interface Shot {
  emoji: string;
  caption: string;
  ratio: string;
  from: string;
  to: string;
  likes: number;
}

const SHOTS: Shot[] = [
  { emoji: "🍓", caption: "Raspberry ripple", ratio: "3 / 4", from: "primary", to: "accent", likes: 128 },
  { emoji: "🌊", caption: "Sea foam", ratio: "1", from: "secondary", to: "info", likes: 64 },
  { emoji: "🍋", caption: "Lemon zest", ratio: "4 / 3", from: "warning", to: "accent", likes: 291 },
  { emoji: "🌿", caption: "New growth", ratio: "2 / 3", from: "success", to: "secondary", likes: 87 },
  { emoji: "🍇", caption: "Grape crush", ratio: "1", from: "accent", to: "primary", likes: 156 },
  { emoji: "🌅", caption: "Golden hour", ratio: "16 / 9", from: "warning", to: "danger", likes: 342 },
  { emoji: "🫐", caption: "Blueberry dusk", ratio: "3 / 4", from: "info", to: "accent", likes: 73 },
  { emoji: "🍑", caption: "Peach fuzz", ratio: "4 / 5", from: "danger", to: "warning", likes: 210 },
  { emoji: "🥝", caption: "Kiwi cross-section", ratio: "1", from: "success", to: "warning", likes: 45 },
  { emoji: "🍒", caption: "Cherry on top", ratio: "2 / 3", from: "primary", to: "danger", likes: 388 },
  { emoji: "🌌", caption: "Night swim", ratio: "16 / 9", from: "info", to: "primary", likes: 99 },
  { emoji: "🍊", caption: "Citrus study", ratio: "4 / 3", from: "warning", to: "primary", likes: 167 },
];

function MasonryTile({ shot }: { shot: Shot }) {
  return (
    <Card variant="flat">
      <Frame ratio={shot.ratio}>
        <div
          style={{
            inlineSize: "100%",
            blockSize: "100%",
            display: "grid",
            placeItems: "center",
            fontSize: "2.5rem",
            background: `linear-gradient(135deg, var(--sb-${shot.from}-subtle), var(--sb-${shot.to}-subtle))`,
          }}
        >
          {shot.emoji}
        </div>
      </Frame>
      <div style={{ padding: "var(--sb-space-3)" }}>
        <Cluster justify="between" gap={2}>
          <span className="u-text-sm">{shot.caption}</span>
          <span className="u-text-xs u-text-muted u-tabular">♥ {shot.likes}</span>
        </Cluster>
      </div>
    </Card>
  );
}

export function MasonryDemo() {
  return (
    <>
      <p className="u-text-muted">
        DOM order preserved, heights measured, images tracked — no third-party library. Where the browser has native
        CSS masonry, the balancer stands down.
      </p>
      <Masonry min="10rem" gap={3}>
        {SHOTS.map((shot) => (
          <MasonryTile key={shot.caption} shot={shot} />
        ))}
      </Masonry>
    </>
  );
}

export const demo: Demo = {
  title: "Masonry",
  layer: "layout",
  order: 20,
  anchor: "masonry",
  Component: MasonryDemo,
};
