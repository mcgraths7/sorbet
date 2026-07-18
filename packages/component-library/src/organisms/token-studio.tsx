import {
  checkColors,
  presets as builtinPresets,
  SEMANTIC_COLOR_NAMES,
  scales,
  type Failure,
  type Mode,
  type SemanticColors,
} from "@sorbet/design-system/tokens";
import { useCallback, useEffect, useState } from "react";

import { Badge, Button, ColorInput, Input, Select, Slider } from "../atoms/index.ts";
import { cx, type ThemeMode } from "../core/index.ts";
import { Cluster } from "../layout/index.ts";
import { Accordion, AccordionItem, Field, Menu, MenuItem, Tab, TabList, TabPanel, Tabs } from "../molecules/index.ts";

import { Drawer, DrawerBody, DrawerFooter, DrawerHeader } from "./drawer.tsx";

// ---------------------------------------------------------------------------
// Token catalog. Names come from the design-system's TS source of truth, so
// new tokens show up here without edits (colors, scales, misc dimensions).

interface TokenDef {
  /** Custom-property suffix: `primary`, `space-4`, `duration-fast`, … */
  name: string;
  kind: "color" | "scrub" | "text";
  /** Colors and shadows differ per mode; everything else is static. */
  perMode: boolean;
  min?: number;
  max?: number;
  step?: number;
}

interface Section {
  id: string;
  label: string;
  tokens: TokenDef[];
}

const color = (name: string): TokenDef => ({ name, kind: "color", perMode: true });
const scrub = (name: string, min: number, max: number, step: number): TokenDef => ({
  name,
  kind: "scrub",
  perMode: false,
  min,
  max,
  step,
});
const text = (name: string, perMode = false): TokenDef => ({ name, kind: "text", perMode });

const isChart = (n: string) => n.startsWith("chart-");
const isBrand = (n: string) => /^(primary|secondary|accent|link|on-(primary|secondary|accent))/.test(n);
const isStatus = (n: string) => /^(success|warning|danger|info|on-(success|warning|danger|info))/.test(n);

const COLOR_SECTIONS: Section[] = [
  { id: "brand", label: "Brand", tokens: SEMANTIC_COLOR_NAMES.filter((n) => !isChart(n) && isBrand(n)).map(color) },
  {
    id: "surfaces",
    label: "Surfaces & text",
    tokens: SEMANTIC_COLOR_NAMES.filter((n) => !isChart(n) && !isBrand(n) && !isStatus(n)).map(color),
  },
  { id: "status", label: "Status", tokens: SEMANTIC_COLOR_NAMES.filter(isStatus).map(color) },
  { id: "charts", label: "Charts", tokens: SEMANTIC_COLOR_NAMES.filter(isChart).map(color) },
];

const TABS: { id: string; label: string; sections: Section[] }[] = [
  { id: "colors", label: "Colors", sections: COLOR_SECTIONS },
  {
    id: "type",
    label: "Type",
    sections: [
      { id: "families", label: "Families", tokens: ["font-sans", "font-display", "font-mono"].map((n) => text(n)) },
      { id: "sizes", label: "Sizes", tokens: Object.keys(scales.fontSize).map((k) => text(`text-${k}`)) },
      { id: "weights", label: "Weights", tokens: Object.keys(scales.fontWeight).map((k) => scrub(`weight-${k}`, 300, 900, 25)) },
      { id: "leading", label: "Line height", tokens: Object.keys(scales.lineHeight).map((k) => scrub(`leading-${k}`, 1, 2, 0.05)) },
      { id: "tracking", label: "Tracking", tokens: Object.keys(scales.tracking).map((k) => text(`tracking-${k}`)) },
    ],
  },
  {
    id: "layout",
    label: "Layout",
    sections: [
      { id: "space", label: "Spacing", tokens: Object.keys(scales.space).map((k) => scrub(`space-${k}`, 0, 12, 0.125)) },
      { id: "radius", label: "Radius", tokens: ["xs", "sm", "md", "lg", "xl"].map((k) => scrub(`radius-${k}`, 0, 3, 0.0625)) },
      { id: "dims", label: "Dimensions", tokens: Object.keys(scales.misc).map((k) => scrub(k, 0, 40, 0.25)) },
      { id: "z", label: "Z-index", tokens: Object.keys(scales.zIndex).map((k) => scrub(k, 0, 2000, 50)) },
    ],
  },
  {
    id: "effects",
    label: "Effects",
    sections: [
      { id: "shadows", label: "Shadows", tokens: ["xs", "sm", "md", "lg", "xl"].map((k) => text(`shadow-${k}`, true)) },
      { id: "durations", label: "Durations", tokens: ["fast", "base", "slow", "slower"].map((k) => scrub(`duration-${k}`, 0, 1000, 10)) },
      { id: "easings", label: "Easings", tokens: ["out", "in-out", "spring"].map((k) => text(`ease-${k}`)) },
    ],
  },
];

const ALL_TOKENS = TABS.flatMap((t) => t.sections.flatMap((s) => s.tokens));

// ---------------------------------------------------------------------------
// Override storage: three buckets, mirrored into a managed <style> element
// whose blocks are mode-guarded — so light and dark edits stay independent
// and the sheet doubles as the exported override file.

type Buckets = { static: Record<string, string>; light: Record<string, string>; dark: Record<string, string> };

const STORAGE_KEY = "sb-token-studio";
const STYLE_ID = "sb-token-studio-overrides";

const emptyBuckets = (): Buckets => ({ static: {}, light: {}, dark: {} });

function loadBuckets(): Buckets {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return { ...emptyBuckets(), ...JSON.parse(raw) };
    }
  } catch {
    /* corrupted storage — start fresh */
  }
  return emptyBuckets();
}

function block(selector: string, map: Record<string, string>, indent = ""): string | null {
  const entries = Object.entries(map);
  if (entries.length === 0) {
    return null;
  }
  const body = entries.map(([k, v]) => `${indent}  --sb-${k}: ${v};`).join("\n");
  return `${indent}${selector} {\n${body}\n${indent}}`;
}

function overridesCss(b: Buckets): string {
  const darkBlock = block(':root:not([data-theme="light"])', b.dark, "  ");
  const lightBlock = block(':root:not([data-theme="dark"])', b.light, "  ");
  return [
    block(":root", b.static),
    block(':root[data-theme="light"]', b.light),
    lightBlock && `@media (prefers-color-scheme: light) {\n${lightBlock}\n}`,
    block(':root[data-theme="dark"]', b.dark),
    darkBlock && `@media (prefers-color-scheme: dark) {\n${darkBlock}\n}`,
  ]
    .filter(Boolean)
    .join("\n\n");
}

function resolvedMode(): Mode {
  const set = document.documentElement.dataset.theme;
  if (set === "dark" || set === "light") {
    return set;
  }
  return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

const NUMERIC = /^(-?\d*\.?\d+)([a-z%]*)$/;

// ---------------------------------------------------------------------------

function TokenRow({
  def,
  value,
  dirty,
  onSet,
  onReset,
}: {
  def: TokenDef;
  value: string;
  dirty: boolean;
  onSet: (value: string) => void;
  onReset: () => void;
}) {
  const parsed = def.kind === "scrub" ? NUMERIC.exec(value) : null;
  const scrubbable = parsed !== null && Number(parsed[1]) <= (def.max ?? Infinity) * 4;

  const control =
    def.kind === "color" ? (
      <ColorInput value={value} onValueChange={onSet} pickerLabel={def.name} />
    ) : scrubbable && parsed ? (
      <>
        <Slider
          aria-label={def.name}
          min={def.min}
          max={def.max}
          step={def.step}
          value={Number(parsed[1])}
          onChange={(e) => onSet(`${e.target.value}${parsed[2]}`)}
        />
        <Input
          size="sm"
          className="sb-token-studio__value"
          aria-label={`${def.name} (value)`}
          value={value}
          onChange={(e) => onSet(e.target.value)}
        />
      </>
    ) : (
      <Input
        size="sm"
        className="sb-token-studio__value"
        aria-label={def.name}
        value={value}
        onChange={(e) => onSet(e.target.value)}
      />
    );

  return (
    <div className={cx("sb-token-studio__row", scrubbable && "sb-token-studio__row--wide")} data-dirty={dirty || undefined}>
      <Cluster gap={1} nowrap className="sb-token-studio__label">
        <code className="sb-token-studio__name">{def.name}</code>
        {dirty && (
          <Button variant="ghost" size="sm" iconOnly aria-label={`Reset ${def.name}`} onClick={onReset}>
            ↺
          </Button>
        )}
      </Cluster>
      <div className="sb-token-studio__control">{control}</div>
    </div>
  );
}

export interface TokenStudioPreset {
  name: string;
  label?: string;
}

export interface TokenStudioProps {
  open: boolean;
  onClose: () => void;
  /** Selectable theme presets; defaults to the design system's built-ins. */
  presets?: TokenStudioPreset[];
  /** Active preset name. With `onPresetChange`, shows the preset selector. */
  preset?: string;
  /** The app applies the swap (e.g. point the theme <link> at the preset). */
  onPresetChange?: (name: string) => void;
  /** Color-mode choice. With `onThemeModeChange`, shows the mode toggle. */
  themeMode?: ThemeMode;
  /** The app applies the mode (e.g. wire to useTheme's `set`). */
  onThemeModeChange?: (mode: ThemeMode) => void;
}

const BUILTIN_PRESETS: TokenStudioPreset[] = Object.values(builtinPresets).map((p) => ({
  name: p.name,
  label: p.label,
}));

/**
 * Live token editor (dev tool): a modeless drawer that overrides `--sb-*`
 * custom properties in real time, re-runs the WCAG contrast contract on
 * every color edit, and exports the overrides as a drop-in CSS file or a
 * JSON token map. Overrides persist in localStorage across reloads.
 */
export function TokenStudio({
  open,
  onClose,
  presets = BUILTIN_PRESETS,
  preset,
  onPresetChange,
  themeMode,
  onThemeModeChange,
}: TokenStudioProps) {
  const [buckets, setBuckets] = useState<Buckets>(loadBuckets);
  const [mode, setMode] = useState<Mode>("light");
  const [baseline, setBaseline] = useState<Record<string, string>>({});
  const [failures, setFailures] = useState<Failure[]>([]);
  const [copied, setCopied] = useState(false);

  // Mirror overrides into the managed sheet + persist.
  useEffect(() => {
    let sheet = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
    if (!sheet) {
      sheet = document.createElement("style");
      sheet.id = STYLE_ID;
      document.head.append(sheet);
    }
    sheet.textContent = overridesCss(buckets);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(buckets));
  }, [buckets]);

  // Track the resolved mode (explicit data-theme or system preference).
  useEffect(() => {
    const update = () => setMode(resolvedMode());
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    const media = matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", update);
    document.addEventListener("sb:theme", update);
    return () => {
      observer.disconnect();
      media.removeEventListener("change", update);
      document.removeEventListener("sb:theme", update);
    };
  }, []);

  // Capture pre-override values (sheet briefly detached so getComputedStyle
  // sees the theme's own values).
  const captureBaseline = useCallback(() => {
    const sheet = document.getElementById(STYLE_ID);
    const saved = sheet?.textContent ?? "";
    if (sheet) {
      sheet.textContent = "";
    }
    const styles = getComputedStyle(document.documentElement);
    const base: Record<string, string> = {};
    for (const def of ALL_TOKENS) {
      base[def.name] = styles.getPropertyValue(`--sb-${def.name}`).trim();
    }
    if (sheet) {
      sheet.textContent = saved;
    }
    setBaseline(base);
  }, []);

  // Re-capture when the mode flips…
  useEffect(() => {
    if (open) {
      captureBaseline();
    }
  }, [open, mode, captureBaseline]);

  // …and when a stylesheet finishes loading (a preset swap replaces the
  // theme <link>; load doesn't bubble, so listen in the capture phase).
  useEffect(() => {
    if (!open) {
      return;
    }
    const onLoad = (e: Event) => {
      if ((e.target as Element | null)?.tagName === "LINK") {
        captureBaseline();
      }
    };
    document.addEventListener("load", onLoad, true);
    return () => document.removeEventListener("load", onLoad, true);
  }, [open, captureBaseline]);

  // The build gate, live: re-check the WCAG contract for the active mode.
  useEffect(() => {
    if (!open) {
      return;
    }
    const styles = getComputedStyle(document.documentElement);
    const colors = Object.fromEntries(
      SEMANTIC_COLOR_NAMES.map((n) => [n, styles.getPropertyValue(`--sb-${n}`).trim()]),
    ) as SemanticColors;
    setFailures(checkColors("studio", mode, colors));
  }, [open, mode, buckets, baseline]);

  const bucketFor = (def: TokenDef) => (def.perMode ? mode : "static");
  const valueOf = (def: TokenDef) => buckets[bucketFor(def)][def.name] ?? baseline[def.name] ?? "";
  const isDirty = (def: TokenDef) => def.name in buckets[bucketFor(def)];
  const isDirtyAnywhere = (def: TokenDef) =>
    def.perMode ? def.name in buckets.light || def.name in buckets.dark : def.name in buckets.static;

  const setToken = (def: TokenDef, value: string) => {
    const bucket = bucketFor(def);
    setBuckets((b) => ({ ...b, [bucket]: { ...b[bucket], [def.name]: value } }));
  };
  const resetToken = (def: TokenDef) => {
    const bucket = bucketFor(def);
    setBuckets((b) => {
      const next = { ...b[bucket] };
      delete next[def.name];
      return { ...b, [bucket]: next };
    });
  };

  const dirtyCount = (sections: Section[]) =>
    sections.reduce((sum, s) => sum + s.tokens.filter(isDirtyAnywhere).length, 0);
  const totalDirty = dirtyCount(TABS.flatMap((t) => t.sections));

  const exportCss = () => `/* Sorbet token overrides — generated by Token Studio */\n\n${overridesCss(buckets)}\n`;
  const exportJson = () => JSON.stringify(buckets, null, 2);

  const copyExport = async(kind: "css" | "json") => {
    await navigator.clipboard.writeText(kind === "css" ? exportCss() : exportJson());
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };
  const downloadExport = (kind: "css" | "json") => {
    const blob = new Blob([kind === "css" ? exportCss() : exportJson()], {
      type: kind === "css" ? "text/css" : "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = kind === "css" ? "sorbet-overrides.css" : "sorbet-tokens.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderRows = (tokens: TokenDef[]) => (
    <div className="sb-token-studio__rows">
      {tokens.map((def) => (
        <TokenRow
          key={def.name}
          def={def}
          value={valueOf(def)}
          dirty={isDirty(def)}
          onSet={(v) => setToken(def, v)}
          onReset={() => resetToken(def)}
        />
      ))}
    </div>
  );

  return (
    <Drawer open={open} onClose={onClose} modeless className="sb-token-studio" aria-label="Token Studio">
      <DrawerHeader onClose={onClose}>
        <Cluster gap={2} nowrap>
          <strong>Token Studio</strong>
          <Badge>{mode}</Badge>
        </Cluster>
      </DrawerHeader>
      <DrawerBody>
        {((preset !== undefined && onPresetChange) || (themeMode !== undefined && onThemeModeChange)) && (
          <div className="sb-token-studio__toolbar">
            {preset !== undefined && onPresetChange && (
              <Field label="Preset" inline>
                <Select size="sm" value={preset} onChange={(e) => onPresetChange(e.target.value)}>
                  {presets.map((p) => (
                    <option key={p.name} value={p.name}>
                      {p.label ?? p.name}
                    </option>
                  ))}
                </Select>
              </Field>
            )}
            {themeMode !== undefined && onThemeModeChange && (
              <div className="sb-field sb-field--inline">
                <span className="sb-label">Mode</span>
                <Tabs pills value={themeMode} onValueChange={(v) => onThemeModeChange(v as ThemeMode)}>
                  <TabList aria-label="Color mode" role="group">
                    {(["light", "system", "dark"] as const).map((m) => (
                      <Tab key={m} value={m} role="button" aria-selected={themeMode === m}>
                        {m === "system" ? "Auto" : m === "light" ? "Light" : "Dark"}
                      </Tab>
                    ))}
                  </TabList>
                </Tabs>
              </div>
            )}
          </div>
        )}
        <Tabs defaultValue="colors">
          <TabList>
            {TABS.map((tab) => (
              <Tab key={tab.id} value={tab.id}>
                {tab.label}
                {dirtyCount(tab.sections) > 0 && <Badge tone="primary">{dirtyCount(tab.sections)}</Badge>}
              </Tab>
            ))}
          </TabList>
          {TABS.map((tab) => (
            <TabPanel key={tab.id} value={tab.id}>
              {tab.id === "colors" ? (
                <Accordion exclusive={false}>
                  {tab.sections.map((section, i) => (
                    <AccordionItem key={section.id} summary={section.label} defaultOpen={i === 0}>
                      {renderRows(section.tokens)}
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : (
                tab.sections.map((section) => (
                  <div key={section.id}>
                    <h4 className="sb-token-studio__heading">{section.label}</h4>
                    {renderRows(section.tokens)}
                  </div>
                ))
              )}
            </TabPanel>
          ))}
        </Tabs>
      </DrawerBody>
      <DrawerFooter>
        <div className="sb-token-studio__report">
          {failures.length === 0 ? (
            <Badge tone="success">WCAG {mode} · all passing</Badge>
          ) : (
            <details>
              <summary>
                <Badge tone="danger">
                  {failures.length} contrast failure{failures.length > 1 ? "s" : ""}
                </Badge>
              </summary>
              <ul className="sb-token-studio__failures">
                {failures.map((f) => (
                  <li key={`${f.fg}-${f.bg}`}>
                    {f.fg} on {f.bg} — {f.actual.toFixed(2)} (needs {f.min})
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
        {totalDirty > 0 && (
          <Button variant="ghost" size="sm" onClick={() => setBuckets(emptyBuckets())}>
            Reset all
          </Button>
        )}
        <Menu
          trigger={
            <Button size="sm" disabled={totalDirty === 0}>
              {copied ? "Copied ✓" : "Export"}
            </Button>
          }
          alignEnd
        >
          <MenuItem onSelect={() => void copyExport("css")}>Copy CSS</MenuItem>
          <MenuItem onSelect={() => void copyExport("json")}>Copy JSON</MenuItem>
          <MenuItem onSelect={() => downloadExport("css")}>Download CSS</MenuItem>
          <MenuItem onSelect={() => downloadExport("json")}>Download JSON</MenuItem>
        </Menu>
      </DrawerFooter>
    </Drawer>
  );
}
