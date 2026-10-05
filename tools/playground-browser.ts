/**
 * Shared by the two hand-run browser tools, `tools/shots.ts` (the screenshot
 * comparer) and `tools/measure-edges.ts` (the edge measurer): build the
 * playground, serve its `dist/` from a throwaway local server, and open it in
 * headless Chromium under one preset and one mode.
 *
 * Neither tool runs in CI, and nothing in `pnpm build` or `pnpm test` imports
 * this file. The browser comes from Playwright's own cache, or from
 * `PLAYWRIGHT_BROWSERS_PATH` when that is set; `pnpm browsers:install`
 * downloads the headless shell the pinned `playwright` version expects.
 *
 * Everything that could make two runs of the same tree differ is pinned here,
 * because the comparer reads any difference as a change to the stylesheet: the
 * viewport, the device scale, the time zone and locale, the clock (the
 * calendar demos render "today"), the colour scheme the OS reports, and
 * animations (Playwright's `animations: "disabled"` at capture).
 */

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { createServer, type Server } from "node:http";
import { extname, join, normalize } from "node:path";

import { chromium, type Browser, type Page } from "playwright";

export const ROOT = new URL("..", import.meta.url).pathname.replace(/\/$/, "");

/** The presets whose theme files are frozen (`FROZEN_PRESETS` in check-golden.ts), then sorbet. */
export const FROZEN_PRESETS = ["ocean", "forest", "noir", "midnight"] as const;
export const ALL_PRESETS = [...FROZEN_PRESETS, "sorbet"] as const;
export type PresetName = (typeof ALL_PRESETS)[number];
export const MODES = ["light", "dark"] as const;
export type Mode = (typeof MODES)[number];

/** A fixed instant for `Date`, so "today" in the calendar demos is the same day on every run. */
export const FIXED_TIME = new Date("2026-10-05T12:00:00Z");

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".woff2": "font/woff2",
  ".json": "application/json",
  ".ico": "image/x-icon",
};

const run = (cmd: string, args: string[], cwd: string) => {
  execFileSync(cmd, args, { cwd, stdio: ["ignore", "inherit", "inherit"] });
};

/**
 * Build the packages the playground imports (their `dist/`), then the
 * playground itself, in the tree at `root`. `pnpm build` is the repo's own
 * build, so the gates it runs (contrast, golden files, stylelint) run here too.
 */
export function buildPlayground(root: string = ROOT): void {
  run("pnpm", ["build"], root);
  run("pnpm", ["--filter", "playground", "build"], root);
}

/** Serve a built playground on a free loopback port. */
export async function servePlayground(root: string = ROOT): Promise<{ url: string; close: () => Promise<void> }> {
  const dist = join(root, "apps", "playground", "dist");
  if (!existsSync(join(dist, "index.html"))) {
    throw new Error(`${dist}/index.html does not exist: build the playground first (drop --no-build)`);
  }
  const server: Server = createServer((req, res) => {
    const path = normalize(decodeURIComponent((req.url ?? "/").split("?")[0]!)).replace(/^(\.\.[/\\])+/, "");
    let file = join(dist, path);
    if (!file.startsWith(dist) || !existsSync(file) || statSync(file).isDirectory()) {
      file = join(dist, "index.html");
    }
    res.writeHead(200, { "content-type": MIME[extname(file)] ?? "application/octet-stream", "cache-control": "no-store" });
    res.end(readFileSync(file));
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (address === null || typeof address === "string") {
    throw new Error("the playground server has no port");
  }
  return {
    url: `http://127.0.0.1:${address.port}/`,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  };
}

export async function launch(): Promise<Browser> {
  try {
    return await chromium.launch();
  } catch(error) {
    const hint = "No Chromium for this playwright version: run `pnpm browsers:install`, or set PLAYWRIGHT_BROWSERS_PATH to a directory that has one.";
    throw new Error(`${hint}\n${(error as Error).message.split("\n")[0]}`, { cause: error });
  }
}

/**
 * Open the playground under `preset` and `mode`, at a fixed viewport, and wait
 * until the preset's theme file has loaded and the fonts are ready. The preset
 * and mode are written to localStorage before the first script runs, so the
 * first paint is already the right one.
 */
export async function openPlayground(
  browser: Browser,
  url: string,
  preset: PresetName,
  mode: Mode,
  viewport: { width: number; height: number },
  deviceScaleFactor = 1,
  { coarse = false }: { coarse?: boolean } = {},
): Promise<Page> {
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor,
    colorScheme: mode,
    reducedMotion: "reduce",
    timezoneId: "UTC",
    locale: "en-US",
    // A touch screen: Chromium then matches (pointer: coarse) and (hover: none).
    hasTouch: coarse,
  });
  const page = await context.newPage();
  await page.clock.setFixedTime(FIXED_TIME);
  await page.addInitScript(({ preset, mode }) => {
    localStorage.setItem("playground-preset", preset);
    localStorage.setItem("sb-theme", mode);
  }, { preset, mode });
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForFunction(({ preset, mode }) => {
    const link = document.getElementById("preset-css") as HTMLLinkElement | null;
    return Boolean(link?.sheet) && link!.href.includes(preset) && document.documentElement.dataset.theme === mode;
  }, { preset, mode });
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  await page.waitForLoadState("networkidle");
  return page;
}

/** The commit the tree at `root` is on, with "+dirty" when its working tree has changes. */
export function describeTree(root: string = ROOT): string {
  try {
    const head = execFileSync("git", ["rev-parse", "--short", "HEAD"], { cwd: root, encoding: "utf8" }).trim();
    const dirty = execFileSync("git", ["status", "--porcelain"], { cwd: root, encoding: "utf8" }).trim() !== "";
    return dirty ? `${head}+dirty` : head;
  } catch {
    return "not a git checkout";
  }
}
