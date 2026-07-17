import { composeRefs, cx } from "../core/index.ts";
import { useRef, useState, type ChangeEvent, type ComponentPropsWithRef, type DragEvent, type ReactNode } from "react";

export interface DropzoneRejection {
  file: File;
  reason: "type" | "size" | "count";
}

export interface DropzoneProps
  extends Omit<ComponentPropsWithRef<"input">, "type" | "value" | "defaultValue" | "children"> {
  /** Zone headline; defaults to "Drag & drop or browse". */
  prompt?: ReactNode;
  /** Constraints line under the prompt (formats, size limits). */
  hint?: ReactNode;
  /** Per-file limit in bytes. */
  maxSize?: number;
  /** Cap on the total number of files (with `multiple`). */
  maxFiles?: number;
  onFilesChange?: (files: File[]) => void;
  onReject?: (rejections: DropzoneRejection[]) => void;
}

const KB = 1024;

function formatSize(bytes: number): string {
  if (bytes < KB) return `${bytes} B`;
  if (bytes < KB * KB) return `${parseFloat((bytes / KB).toFixed(1))} KB`;
  return `${parseFloat((bytes / KB / KB).toFixed(1))} MB`;
}

/** Mirror of the picker's accept matching, for drops (which bypass it). */
function accepts(file: File, accept: string): boolean {
  const specs = accept
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (specs.length === 0) return true;
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return specs.some((spec) =>
    spec.startsWith(".") ? name.endsWith(spec) : spec.endsWith("/*") ? type.startsWith(spec.slice(0, -1)) : type === spec,
  );
}

/**
 * Drag-and-drop file picker around a real <input type="file">: drops and
 * picker selections merge into the input via DataTransfer, so the files
 * submit with the form natively (give it a `name`). Selections accumulate
 * when `multiple`; each file row has a remove button.
 */
export function Dropzone({
  prompt,
  hint,
  maxSize,
  maxFiles,
  onFilesChange,
  onReject,
  className,
  style,
  ref,
  multiple,
  accept,
  disabled,
  onChange,
  ...rest
}: DropzoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dragDepth, setDragDepth] = useState(0);

  /** Mirror the accumulated list into the real input for form submission. */
  const commit = (next: File[]) => {
    setFiles(next);
    const dt = new DataTransfer();
    for (const f of next) dt.items.add(f);
    if (inputRef.current) inputRef.current.files = dt.files;
    onFilesChange?.(next);
  };

  const add = (incoming: File[]) => {
    if (disabled) return;
    const limit = maxFiles ?? Infinity;
    const rejected: DropzoneRejection[] = [];
    const next = multiple ? [...files] : [];

    for (const file of multiple ? incoming : incoming.slice(0, 1)) {
      if (next.some((f) => f.name === file.name && f.size === file.size && f.lastModified === file.lastModified)) {
        continue;
      }
      if (accept && !accepts(file, accept)) {
        rejected.push({ file, reason: "type" });
      } else if (maxSize != null && file.size > maxSize) {
        rejected.push({ file, reason: "size" });
      } else if (next.length >= limit) {
        rejected.push({ file, reason: "count" });
      } else {
        next.push(file);
      }
    }

    commit(next);
    if (rejected.length === 0) {
      setError(null);
    } else {
      const why: Record<DropzoneRejection["reason"], string> = {
        type: "not an accepted type",
        size: `over ${formatSize(maxSize ?? 0)}`,
        count: "too many files",
      };
      setError(rejected.map((r) => `${r.file.name} — ${why[r.reason]}`).join(" · "));
      onReject?.(rejected);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    add([...(e.target.files ?? [])]);
    onChange?.(e);
  };

  const dragUsable = (e: DragEvent) => !disabled && e.dataTransfer.types.includes("Files");

  return (
    <div className={cx("sb-dropzone", className)} style={style} data-dragover={dragDepth > 0 || undefined}>
      <label
        className="sb-dropzone__zone"
        onDragEnter={(e) => {
          if (!dragUsable(e)) return;
          e.preventDefault();
          setDragDepth((d) => d + 1);
        }}
        onDragOver={(e) => {
          if (dragUsable(e)) e.preventDefault();
        }}
        onDragLeave={() => setDragDepth((d) => Math.max(0, d - 1))}
        onDrop={(e) => {
          e.preventDefault();
          setDragDepth(0);
          add([...e.dataTransfer.files]);
        }}
      >
        <input
          {...rest}
          ref={composeRefs<HTMLInputElement>(ref, inputRef)}
          type="file"
          className="sb-dropzone__input"
          multiple={multiple}
          accept={accept}
          disabled={disabled}
          onChange={handleChange}
        />
        <span className="sb-dropzone__icon" aria-hidden="true">
          <svg
            viewBox="0 0 24 24"
            width="24"
            height="24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <path d="m17 8-5-5-5 5" />
            <path d="M12 3v12" />
          </svg>
        </span>
        <span className="sb-dropzone__title">
          {prompt ?? (
            <>
              Drag &amp; drop or <span className="sb-dropzone__browse">browse</span>
            </>
          )}
        </span>
        {hint && <span className="sb-dropzone__hint">{hint}</span>}
      </label>
      {error && (
        <p className="sb-dropzone__error" role="alert">
          {error}
        </p>
      )}
      {files.length > 0 && (
        <ul className="sb-dropzone__list">
          {files.map((file, i) => (
            <li key={`${file.name}-${file.size}-${file.lastModified}`} className="sb-dropzone__file">
              <span className="sb-dropzone__name">{file.name}</span>
              <span className="sb-dropzone__size">{formatSize(file.size)}</span>
              <button
                type="button"
                className="sb-dropzone__remove"
                aria-label={`Remove ${file.name}`}
                onClick={() => {
                  commit(files.filter((_, index) => index !== i));
                  setError(null);
                }}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
