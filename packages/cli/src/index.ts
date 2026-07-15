#!/usr/bin/env node
/**
 * sorbet — generate and grow a Sorbet design system.
 *
 *   sorbet create <dir> --preset ocean     scaffold a project with a preset
 *   sorbet theme <preset> [--out file]     emit one preset's theme CSS
 *   sorbet component <Name> --level atom   add a component stub
 *   sorbet presets                         list presets with swatches
 *   sorbet contrast                        run the WCAG AA report
 *
 * No dependencies: parseArgs + styleText from node:util.
 */

import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { parseArgs, styleText } from "node:util";
import { contrast, DEFAULT_PRESET, hexToRgb, PRESET_NAMES, presets, RULES, themeCss, type Mode, type PresetName } from "@sorbet/tokens";
import { behaviorTs, componentScss, starterIndexHtml, starterPackageJson, starterReadme } from "./templates.ts";

// dist/index.js lives at packages/cli/dist → three levels up is the monorepo root.
const monorepoRoot = join(import.meta.dirname, "..", "..", "..");
// Inert template files shipped with the CLI (never executed in place).
const scaffoldDir = join(import.meta.dirname, "..", "scaffold");

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: {
    preset: { type: "string", short: "p" },
    name: { type: "string", short: "n" },
    out: { type: "string", short: "o" },
    level: { type: "string", short: "l", default: "atom" },
    behavior: { type: "boolean", short: "b", default: false },
    help: { type: "boolean", short: "h", default: false },
  },
});

const [command, arg] = positionals;

const ok = (msg: string) => console.log(`${styleText("green", "✓")} ${msg}`);
const fail = (msg: string): never => {
  console.error(`${styleText("red", "✗")} ${msg}`);
  process.exit(1);
};

function swatch(hex: string): string {
  const { r, g, b } = hexToRgb(hex);
  return `\x1b[48;2;${r};${g};${b}m  \x1b[0m`;
}

function assertPreset(name: string): PresetName {
  if (!(PRESET_NAMES as string[]).includes(name)) {
    fail(`Unknown preset "${name}". Available: ${PRESET_NAMES.join(", ")}`);
  }
  return name as PresetName;
}

function help(): void {
  console.log(`
${styleText("bold", "sorbet")} — generate and grow a Sorbet design system

${styleText("bold", "Usage")}
  sorbet create <dir> [--preset <name>] [--name <brand>]
  sorbet theme <preset> [--out <file>]
  sorbet component <Name> [--level atom|molecule|organism] [--behavior]
  sorbet presets
  sorbet contrast

${styleText("bold", "Presets")}
  ${PRESET_NAMES.join(", ")}   (default: ${DEFAULT_PRESET})
`);
}

async function cmdPresets(): Promise<void> {
  console.log();
  for (const preset of Object.values(presets)) {
    const c = preset.colors.light;
    const chips = [c.primary, c.secondary, c.accent, c.bg, c.text].map(swatch).join("");
    console.log(`  ${chips}  ${styleText("bold", preset.name.padEnd(10))} ${styleText("dim", preset.tagline)}`);
  }
  console.log(styleText("dim", `\n  every preset ships light + dark, WCAG AA verified\n`));
}

async function cmdTheme(): Promise<void> {
  if (!arg) fail("Usage: sorbet theme <preset> [--out file]");
  const preset = assertPreset(arg!);
  const css = themeCss(presets[preset]);
  if (values.out) {
    await writeFile(values.out, css);
    ok(`wrote ${values.out}`);
  } else {
    process.stdout.write(css);
  }
}

async function cmdCreate(): Promise<void> {
  if (!arg) fail("Usage: sorbet create <dir> [--preset <name>] [--name <brand>]");
  const target = resolve(arg!);
  if (existsSync(target)) fail(`${target} already exists`);

  const preset = assertPreset(values.preset ?? DEFAULT_PRESET);
  const name = values.name ?? basename(target);
  const brand = name.charAt(0).toUpperCase() + name.slice(1);

  console.log(`\nScaffolding ${styleText("bold", brand)} with the ${styleText("cyan", preset)} preset…\n`);

  // The code is yours: token engine, Sass, and behaviors are copied in from
  // the workspace packages, not depended on. The scaffold is standalone.
  const dirs: Array<[from: string, to: string]> = [
    ["packages/tokens/src", "src/tokens"],
    ["packages/styles/src", "src/styles"],
    ["packages/behaviors/src", "src/scripts"],
  ];
  for (const [from, to] of dirs) {
    await cp(join(monorepoRoot, from), join(target, to), { recursive: true });
    ok(to);
  }

  // Standalone build/report scripts + tsconfigs (relative imports, no @sorbet deps).
  await cp(join(scaffoldDir, "tools"), join(target, "src", "tools"), { recursive: true });
  for (const file of ["tsconfig.base.json", "tsconfig.node.json", "tsconfig.browser.json"]) {
    await cp(join(scaffoldDir, file), join(target, file));
  }
  ok("src/tools + tsconfigs");

  // Prebuilt assets so the starter renders before the first build.
  await mkdir(join(target, "public"), { recursive: true });
  await cp(join(monorepoRoot, "packages", "styles", "dist", "themes"), join(target, "public", "themes"), { recursive: true });
  await cp(join(monorepoRoot, "packages", "styles", "dist", "css"), join(target, "public", "css"), { recursive: true });
  await cp(join(monorepoRoot, "packages", "behaviors", "dist"), join(target, "public", "ds"), { recursive: true });
  ok("public/ (prebuilt css, themes, behaviors)");

  const darkByDefault = presets[preset].defaultMode === "dark";
  await writeFile(join(target, "package.json"), starterPackageJson(name));
  await writeFile(join(target, "public", "index.html"), starterIndexHtml(brand, preset, darkByDefault));
  await writeFile(join(target, "README.md"), starterReadme(brand, preset));
  ok("package.json, public/index.html, README.md");

  console.log(`
${styleText("bold", "Next:")}
  cd ${arg}
  npm install
  npm run dev       ${styleText("dim", "# serve public/")}
  npm run build     ${styleText("dim", "# after editing src/tokens or src/styles")}
`);
}

async function cmdComponent(): Promise<void> {
  if (!arg) fail("Usage: sorbet component <Name> [--level atom|molecule|organism] [--behavior]");
  const level = values.level!;
  if (!["atom", "molecule", "organism"].includes(level)) {
    fail(`--level must be atom, molecule, or organism (got "${level}")`);
  }

  const kebab = arg!
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-");
  const pascal = kebab.replace(/(^|-)(\w)/g, (_, __, ch: string) => ch.toUpperCase());
  const stylesDir = join(process.cwd(), "src", "styles");
  if (!existsSync(stylesDir)) fail("Run inside a Sorbet project (src/styles not found)");

  const partial = join(stylesDir, `${level}s`, `_${kebab}.scss`);
  if (existsSync(partial)) fail(`${partial} already exists`);
  await writeFile(partial, componentScss(kebab, level));
  ok(`src/styles/${level}s/_${kebab}.scss`);

  // Register in the matching cascade-layer block of index.scss.
  const indexPath = join(stylesDir, "index.scss");
  const index = await readFile(indexPath, "utf8");
  const marker = `@layer sb.${level}s {`;
  const start = index.indexOf(marker);
  if (start === -1) {
    console.log(styleText("yellow", `! add \`@include meta.load-css("${level}s/${kebab}");\` to index.scss yourself`));
  } else {
    const end = index.indexOf("\n}", start);
    const updated = `${index.slice(0, end)}\n  @include meta.load-css("${level}s/${kebab}");${index.slice(end)}`;
    await writeFile(indexPath, updated);
    ok(`registered in index.scss (@layer sb.${level}s)`);
  }

  if (values.behavior) {
    const behaviorPath = join(process.cwd(), "src", "scripts", `${kebab}.ts`);
    if (existsSync(behaviorPath)) fail(`${behaviorPath} already exists`);
    await writeFile(behaviorPath, behaviorTs(pascal));
    ok(`src/scripts/${kebab}.ts — export it from src/scripts/index.ts`);
  }
}

async function cmdContrast(): Promise<void> {
  let failures = 0;
  const opaque = (v: string) => /^#[0-9a-f]{6}$/i.test(v);
  for (const preset of Object.values(presets)) {
    console.log(styleText("bold", `\n${preset.label} — ${preset.tagline}`));
    for (const mode of ["light", "dark"] as Mode[]) {
      const colors = preset.colors[mode];
      const rows: string[] = [];
      for (const rule of RULES) {
        const fg = colors[rule.fg];
        const bg = colors[rule.bg];
        if (!opaque(fg) || !opaque(bg)) continue;
        const ratio = contrast(fg, bg);
        if (ratio < rule.min) {
          failures++;
          rows.push(styleText("red", `    ✗ ${rule.fg} on ${rule.bg}: ${ratio.toFixed(2)} < ${rule.min}`));
        }
      }
      console.log(
        `  ${mode.padEnd(5)} ${rows.length === 0 ? styleText("green", `all ${RULES.length} pairings pass`) : styleText("red", `${rows.length} failing`)}`,
      );
      for (const row of rows) console.log(row);
    }
  }
  if (failures > 0) {
    console.error(styleText("red", `\n✗ ${failures} contrast failure(s)`));
    process.exit(1);
  }
  console.log(styleText("green", "\n✓ WCAG AA contract holds for every preset in both modes"));
}

if (values.help || !command) {
  help();
} else {
  switch (command) {
    case "presets":
      await cmdPresets();
      break;
    case "theme":
      await cmdTheme();
      break;
    case "create":
      await cmdCreate();
      break;
    case "component":
      await cmdComponent();
      break;
    case "contrast":
      await cmdContrast();
      break;
    default:
      fail(`Unknown command "${command}". Try: sorbet --help`);
  }
}
