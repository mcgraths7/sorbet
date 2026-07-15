/**
 * File templates for `sorbet create` and `sorbet component`.
 */

import type { PresetName } from "@sorbet/tokens";

export function starterPackageJson(name: string): string {
  return `${JSON.stringify(
    {
      name,
      version: "0.1.0",
      private: true,
      type: "module",
      scripts: {
        build: "npm run build:tokens && npm run build:css && npm run build:js",
        "build:tokens": "node src/tools/build-tokens.ts public/themes",
        "build:css": "sass src/styles/index.scss:public/css/sorbet.css --style=expanded --no-source-map",
        "build:js": "tsc -p tsconfig.browser.json",
        "watch:css": "sass --watch src/styles/index.scss:public/css/sorbet.css",
        "check:contrast": "node src/tools/check-contrast.ts",
        dev: "npx -y serve public",
      },
      devDependencies: {
        "@types/node": "^26.0.0",
        sass: "^1.83.0",
        typescript: "^5.8.0",
      },
    },
    null,
    2,
  )}\n`;
}

export function starterIndexHtml(brand: string, preset: PresetName, darkByDefault: boolean): string {
  return `<!doctype html>
<html lang="en"${darkByDefault ? ` data-theme="dark"` : ""}>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${brand}</title>
  <link rel="stylesheet" href="./themes/${preset}.css" id="theme-css">
  <link rel="stylesheet" href="./css/sorbet.css">
</head>
<body>
  <header class="sb-navbar">
    <div class="sb-navbar__inner sb-container">
      <a class="sb-navbar__brand" href="/">${brand}</a>
      <nav class="sb-navbar__nav" aria-label="Main">
        <a href="#" aria-current="page">Home</a>
        <a href="#">Docs</a>
      </nav>
      <div class="sb-navbar__actions">
        <button class="sb-button sb-button--ghost sb-button--icon" id="theme-toggle"
                aria-label="Toggle dark mode" data-tooltip="Toggle dark mode">◐</button>
        <button class="sb-button" id="hello">Get started</button>
      </div>
    </div>
  </header>

  <main class="sb-container" style="padding-block: var(--sb-space-16)">
    <div class="sb-stack sb-stack--gap-6 sb-stack--center" style="text-align: center">
      <span class="sb-badge sb-badge--primary">v0.1.0</span>
      <h1>${brand}</h1>
      <p class="sb-lead">Your design system is alive. Edit <code>src/styles</code>, run
        <code>npm run build</code>, and make it yours.</p>
      <div class="sb-cluster sb-cluster--center">
        <button class="sb-button sb-button--lg" id="cta">Do something fun</button>
        <a class="sb-button sb-button--lg sb-button--outline" href="#">Read the docs</a>
      </div>
    </div>
  </main>

  <script type="module">
    import { init, getTheme, toast } from "./ds/index.js";
    init();
    document.getElementById("theme-toggle").addEventListener("click", () => getTheme().toggle());
    for (const id of ["hello", "cta"]) {
      document.getElementById(id).addEventListener("click", () =>
        toast("Hello from ${brand}!", { tone: "success", title: "It works" }));
    }
  </script>
</body>
</html>
`;
}

export function starterReadme(brand: string, preset: PresetName): string {
  return `# ${brand}

A design system scaffolded with [Sorbet](https://github.com/sorbet-ds) using the **${preset}** preset.
The code is yours now — tokens, Sass, and behaviors all live in this repo.

## Quick start

\`\`\`sh
npm install
npm run build     # tokens → CSS themes, Sass → css, TS → js
npm run dev       # serve public/ locally
\`\`\`

## Where things live

| Path | What it is |
| --- | --- |
| \`src/tokens/\` | TypeScript source of truth: ramps, presets, scales, WCAG rules |
| \`src/styles/\` | Sass library (atomic design: layout → atoms → molecules → organisms) |
| \`src/scripts/\` | Dependency-free behaviors (theme, tabs, modal, menu, toast…) |
| \`public/themes/\` | Generated theme CSS — one file per preset, light + dark each |
| \`public/index.html\` | Starter page wired to the ${preset} theme |

## Make it yours

- **Change brand colors**: edit your preset in \`src/tokens/presets.ts\`, then
  \`npm run build\`. Contrast is re-verified on every build — a palette that
  fails WCAG AA fails the build.
- **New component**: \`npx sorbet component Rating --level atom\`
- **Switch preset**: point the \`theme-css\` link at another file in \`public/themes/\`.
`;
}

export function componentScss(name: string, level: string): string {
  return `@use "../abstracts" as *;

// ${level}: ${name}
// Values come from tokens only — clr(), space(), fs(), radius(), shadow()…
.sb-${name} {
  display: flex;
  align-items: center;
  gap: space(2);
}
`;
}

export function behaviorTs(pascal: string): string {
  return `/**
 * ${pascal} behavior. Wire it in init() or instantiate directly:
 *   new ${pascal}(document.querySelector('[data-sb="${pascal.toLowerCase()}"]')!)
 */

export class ${pascal} {
  #root: HTMLElement;

  constructor(root: HTMLElement) {
    this.#root = root;
    // TODO: wire events, manage ARIA state.
  }
}
`;
}
