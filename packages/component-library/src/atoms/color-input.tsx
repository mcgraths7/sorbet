import { contrast } from "@sorbet/design-system/tokens";
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type AriaAttributes,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ToggleEvent,
} from "react";

import { cx } from "../core/index.ts";

import { clamp, formatHex, hexToHsv, hsvToRgb, parseHex, rgbToHsv, type Hsv } from "./color-core.ts";
import { Input } from "./input.tsx";

interface EyeDropperResult {
  sRGBHex: string;
}
interface EyeDropperCtor {
  new (): { open: () => Promise<EyeDropperResult> };
}
declare global {
  interface Window {
    EyeDropper?: EyeDropperCtor;
  }
}

const GAP = 6;
const EDGE = 8;

const DEFAULT_SWATCHES = [
  "#e11d48",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#3b82f6",
  "#6366f1",
  "#a855f7",
  "#ec4899",
  "#111827",
  "#6b7280",
  "#ffffff",
];

export interface ColorInputProps {
  /** Current value (controlled). #rgb/#rrggbb/#rrggbbaa all parse. */
  value?: string;
  defaultValue?: string;
  /** Fires with a normalized hex on every change — #rrggbb, or #rrggbbaa when
   *  `alpha` is on and the color is translucent. */
  onValueChange?: (hex: string) => void;
  disabled?: boolean;
  /** Show the opacity slider and emit 8-digit hex when translucent. */
  alpha?: boolean;
  /** Preset swatches shown under the picker. */
  swatches?: string[];
  /** Offer the native eyedropper where the browser supports it (default true). */
  eyedropper?: boolean;
  /** Accessible name for the control ("Pick color"). */
  pickerLabel?: string;
  id?: string;
  className?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: AriaAttributes["aria-invalid"];
}

/**
 * Color field: a swatch that opens an in-app picker (saturation/brightness
 * square + hue slider, optional opacity, RGB inputs, an editable hex, the
 * native eyedropper, and preset swatches) beside a hex text field. Working
 * state is HSV so dragging through black/white keeps the hue; every edit path
 * reconciles to the same hex the field shows.
 */
export function ColorInput({
  value,
  defaultValue,
  onValueChange,
  disabled,
  alpha = false,
  swatches = DEFAULT_SWATCHES,
  eyedropper = true,
  pickerLabel = "Pick color",
  id,
  className,
  ...aria
}: ColorInputProps) {
  const autoId = useId();
  const inputId = id ?? `${autoId}-hex`;
  const panelId = `${autoId}-panel`;

  const [internal, setInternal] = useState(defaultValue ?? "#000000");
  const current = value ?? internal;
  /** In-progress hex text that isn't valid yet; null = mirror the value. */
  const [draft, setDraft] = useState<string | null>(null);

  // Working HSV + alpha — the picker's source of truth while open.
  const [hsv, setHsv] = useState<Hsv>(() => hexToHsv(current).hsv);
  const [alphaVal, setAlphaVal] = useState(() => hexToHsv(current).a);
  const [recents, setRecents] = useState<string[]>([]);

  const [open, setOpen] = useState(false);
  const controlRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const areaRef = useRef<HTMLDivElement | null>(null);

  const [hasEyeDropper, setHasEyeDropper] = useState(false);
  useEffect(() => {
    setHasEyeDropper(eyedropper && typeof window !== "undefined" && "EyeDropper" in window);
  }, [eyedropper]);

  const commit = (hex: string) => {
    if (value === undefined) {
      setInternal(hex);
    }
    onValueChange?.(hex);
  };

  // Push HSV changes out as hex (the swatch, hex + RGB fields all read `current`).
  const applyHsv = (nextHsv: Hsv, nextAlpha = alphaVal) => {
    setHsv(nextHsv);
    setAlphaVal(nextAlpha);
    setDraft(null);
    commit(formatHex(hsvToRgb(nextHsv), nextAlpha, alpha));
  };

  // Adopt an external hex (typed, eyedropped, swatch) into the working state.
  const applyHex = (hex: string) => {
    const parsed = parseHex(hex);
    if (!parsed) {
      return;
    }
    setHsv(rgbToHsv(parsed));
    setAlphaVal(parsed.a);
    setDraft(null);
    commit(formatHex(parsed, parsed.a, alpha));
  };

  const rgb = useMemo(() => parseHex(current) ?? { r: 0, g: 0, b: 0, a: 1 }, [current]);
  const opaqueHex = formatHex(rgb, 1, false);
  const thumbRing = contrast(opaqueHex, "#ffffff") >= contrast(opaqueHex, "#000000") ? "#ffffff" : "#000000";

  // ---- popover lifecycle (mirrors the other fixed popovers) ----------------
  const openPicker = () => {
    if (disabled) {
      return;
    }
    const { hsv: h, a } = hexToHsv(current);
    setHsv(h);
    setAlphaVal(a);
    setOpen(true);
  };
  const closePicker = () => {
    setOpen(false);
    if (parseHex(current)) {
      setRecents((r) => [current, ...r.filter((c) => c !== current)].slice(0, 8));
    }
  };

  useEffect(() => {
    const panel = panelRef.current;
    const control = controlRef.current;
    if (!panel || !control) {
      return;
    }
    if (open && !panel.matches(":popover-open")) {
      panel.showPopover();
      const r = control.getBoundingClientRect();
      const left = Math.min(Math.max(r.left, EDGE), Math.max(EDGE, window.innerWidth - panel.offsetWidth - EDGE));
      let top = r.bottom + GAP;
      if (top + panel.offsetHeight > window.innerHeight - EDGE) {
        top = Math.max(r.top - panel.offsetHeight - GAP, EDGE);
      }
      panel.style.left = `${left}px`;
      panel.style.top = `${top}px`;
    } else if (!open && panel.matches(":popover-open")) {
      panel.hidePopover();
    }
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onPointerDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!controlRef.current?.contains(t) && !panelRef.current?.contains(t)) {
        closePicker();
      }
    };
    const onScroll = (e: Event) => {
      if (!panelRef.current?.contains(e.target as Node)) {
        closePicker();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("scroll", onScroll, { capture: true, passive: true });
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("scroll", onScroll, { capture: true });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // ---- saturation/brightness square ----------------------------------------
  const pointFromEvent = (clientX: number, clientY: number) => {
    const el = areaRef.current;
    if (!el) {
      return;
    }
    const r = el.getBoundingClientRect();
    const s = clamp((clientX - r.left) / r.width, 0, 1) * 100;
    const v = (1 - clamp((clientY - r.top) / r.height, 0, 1)) * 100;
    applyHsv({ ...hsv, s, v });
  };
  const onAreaPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    areaRef.current?.setPointerCapture(e.pointerId);
    pointFromEvent(e.clientX, e.clientY);
  };
  const onAreaPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.buttons === 1) {
      pointFromEvent(e.clientX, e.clientY);
    }
  };
  const onAreaKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 10 : 1;
    let { s, v } = hsv;
    switch (e.key) {
      case "ArrowLeft":
        s -= step;
        break;
      case "ArrowRight":
        s += step;
        break;
      case "ArrowUp":
        v += step;
        break;
      case "ArrowDown":
        v -= step;
        break;
      default:
        return;
    }
    e.preventDefault();
    applyHsv({ ...hsv, s: clamp(s, 0, 100), v: clamp(v, 0, 100) });
  };

  const setChannel = (key: "r" | "g" | "b", raw: string) => {
    if (raw === "") {
      return;
    }
    const n = clamp(Math.round(Number(raw)), 0, 255);
    if (Number.isNaN(n)) {
      return;
    }
    applyHsv(rgbToHsv({ ...rgb, [key]: n }), alphaVal);
  };

  const openEyeDropper = async() => {
    try {
      const result = await new window.EyeDropper!().open();
      applyHex(result.sRGBHex);
    } catch {
      // user dismissed the eyedropper — nothing to do
    }
  };

  const areaStyle = {
    "--hue": `hsl(${hsv.h} 100% 50%)`,
    "--thumb-x": `${hsv.s}%`,
    "--thumb-y": `${100 - hsv.v}%`,
    "--thumb-ring": thumbRing,
  } as CSSProperties;

  return (
    <div className={cx("sb-color-input", className)}>
      <div className="sb-color-input__control" ref={controlRef}>
        <button
          type="button"
          className="sb-color-input__swatch"
          style={{ "--swatch": current } as CSSProperties}
          aria-label={pickerLabel}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={panelId}
          disabled={disabled}
          onClick={() => (open ? closePicker() : openPicker())}
        />
        <Input
          size="sm"
          id={inputId}
          className="sb-color-input__hex"
          aria-label={`${pickerLabel} (hex)`}
          aria-describedby={aria["aria-describedby"]}
          aria-invalid={aria["aria-invalid"]}
          spellCheck={false}
          value={draft ?? current}
          disabled={disabled}
          onChange={(e) => {
            const text = e.target.value;
            if (parseHex(text)) {
              applyHex(text.startsWith("#") ? text : `#${text}`);
            } else {
              setDraft(text);
            }
          }}
          onBlur={() => setDraft(null)}
        />
      </div>

      <div
        id={panelId}
        ref={panelRef}
        popover="manual"
        role="dialog"
        aria-label={pickerLabel}
        className="sb-color-input__panel"
        onToggle={(e: ToggleEvent<HTMLDivElement>) => e.newState === "closed" && open && setOpen(false)}
      >
        <div
          ref={areaRef}
          className="sb-color-input__area"
          style={areaStyle}
          role="slider"
          tabIndex={disabled ? -1 : 0}
          aria-label="Saturation and brightness"
          aria-valuetext={`Saturation ${Math.round(hsv.s)}%, brightness ${Math.round(hsv.v)}%`}
          onPointerDown={onAreaPointerDown}
          onPointerMove={onAreaPointerMove}
          onKeyDown={onAreaKeyDown}
        >
          <span className="sb-color-input__area-thumb" />
        </div>

        <div className="sb-color-input__sliders">
          {hasEyeDropper && (
            <button type="button" className="sb-color-input__eyedropper" aria-label="Pick from screen" onClick={openEyeDropper}>
              <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                <path
                  d="M10.5 2.5a1.6 1.6 0 0 1 2.3 2.3l-1 1 .8.8-1 1-.8-.8-4.2 4.2c-.2.2-.4.3-.7.4l-2.3.6.6-2.3c.1-.3.2-.5.4-.7l4.2-4.2-.8-.8 1-1 .8.8 1-1Z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}
          <div className="sb-color-input__tracks">
            <input
              type="range"
              className="sb-color-input__hue"
              min={0}
              max={360}
              value={Math.round(hsv.h)}
              aria-label="Hue"
              disabled={disabled}
              onChange={(e) => applyHsv({ ...hsv, h: Number(e.target.value) })}
            />
            {alpha && (
              <input
                type="range"
                className="sb-color-input__alpha"
                style={{ "--alpha-color": opaqueHex } as CSSProperties}
                min={0}
                max={100}
                value={Math.round(alphaVal * 100)}
                aria-label="Opacity"
                disabled={disabled}
                onChange={(e) => applyHsv(hsv, Number(e.target.value) / 100)}
              />
            )}
          </div>
        </div>

        <div className="sb-color-input__fields">
          {(["r", "g", "b"] as const).map((key) => (
            <label key={key} className="sb-color-input__field">
              <span className="sb-color-input__field-label">{key.toUpperCase()}</span>
              <Input
                size="sm"
                type="number"
                min={0}
                max={255}
                inputMode="numeric"
                value={rgb[key]}
                disabled={disabled}
                onChange={(e) => setChannel(key, e.target.value)}
              />
            </label>
          ))}
          <label className="sb-color-input__field sb-color-input__field--hex">
            <span className="sb-color-input__field-label">Hex</span>
            <Input
              size="sm"
              spellCheck={false}
              value={draft ?? current}
              disabled={disabled}
              onChange={(e) => {
                const text = e.target.value;
                if (parseHex(text)) {
                  applyHex(text.startsWith("#") ? text : `#${text}`);
                } else {
                  setDraft(text);
                }
              }}
              onBlur={() => setDraft(null)}
            />
          </label>
        </div>

        {(swatches.length > 0 || recents.length > 0) && (
          <div className="sb-color-input__swatches" role="group" aria-label="Swatches">
            {[...recents, ...swatches.filter((s) => !recents.includes(s))].slice(0, 12).map((sw) => (
              <button
                key={sw}
                type="button"
                className="sb-color-input__swatch-chip"
                style={{ "--swatch": sw } as CSSProperties}
                aria-label={sw}
                aria-pressed={sw.toLowerCase() === current.toLowerCase()}
                onClick={() => applyHex(sw)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
