# AGENTS.md

Guide for AI agents (Claude Code, Copilot, etc.) working on this repository.

## Project context

Personal fork of [`mushfikurr/overline-zebar`](https://github.com/mushfikurr/overline-zebar): a topbar for [Zebar](https://github.com/glzr-io/zebar) paired with [GlazeWM](https://github.com/glzr-io/glazewm). The fork exists to collect local customizations, not to compete with upstream — keep changes targeted and document them in the README ("What changes compared to upstream" table).

## Stack & requirements

- **pnpm** monorepo (enforced via `preinstall: only-allow pnpm`). Use `corepack pnpm <cmd>` if pnpm isn't global.
- Node ≥ 20, TypeScript 5, React 18, Vite 5, Tailwind 3, Framer Motion.
- React Compiler (`babel-plugin-react-compiler`) is enabled on the widgets — avoid manual optimizations like `useMemo`/`useCallback` that become redundant.
- pnpm catalog (`pnpm-workspace.yaml`) centralizes versions of `react`, `react-dom`, `zebar`, `tailwindcss`, `postcss`. When bumping any of these, edit the `catalog:` block, not the individual `package.json` files.

## Commands

From the repo root:

```sh
pnpm install                                    # install (requires pnpm)
pnpm build                                      # build all widgets (filter @overline-zebar/*)
pnpm lint                                       # eslint across the repo
pnpm lint:fix
pnpm format                                     # prettier --write
pnpm check-format
```

For a single widget (**much faster** than the full build):

```sh
cd widgets/main          # or system-stats, script-launcher, config-widget
pnpm build
pnpm build:watch         # regenerates dist/ on every save
pnpm dev                 # vite dev server (NOT used by the real Zebar integration)
pnpm lint
```

There are no unit tests in the repo — don't invent any.

## Architecture

### Monorepo

```
zpack.json                 # Zebar manifest: widgets, presets, shell privileges
packages/
  config/                  # shared settings (schema + helpers)
  ui/                      # React library (Chip, etc.) consumed by the widgets
  tailwind/                # shared Tailwind preset
  typescript/              # base tsconfig
widgets/
  main/                    # main topbar (the most modified one in the fork)
  system-stats/            # CPU/RAM/network hover panel
  script-launcher/         # custom script launcher
  config-widget/           # configuration GUI
  example-widget/          # reference template
```

Each widget is an independent Vite project that emits `widgets/<name>/dist/index.html`. Zebar loads that file as a webview — **there is no live HMR**: after a build you have to reload the widget from the Zebar tray.

### Zebar integration

- `zpack.json` declares the widgets, the `presets` (position/size/monitor) and the `privileges.shellCommands` (regex whitelist of commands the widget can invoke through the `glazewm` provider).
- Widgets consume live data (GlazeWM, CPU, media, network, battery…) via the `zebar` npm package:
  ```ts
  import * as zebar from 'zebar';
  const providers = zebar.createProviderGroup({ glazewm: { type: 'glazewm' }, media: { type: 'media' } });
  providers.onOutput(() => { /* read providers.outputMap */ });
  ```
- Zebar discovers the pack as a **custom pack** if it lives in `~/.glzr/zebar/<dir>/zpack.json`; the pack ID is the `name` field of `zpack.json`. Before debugging runtime behavior, verify both the repo copy and the deployed copy under `~/.glzr/zebar/`, because they can diverge.
- The `transparent: true` flag and `dockToEdge` in the manifest affect layout/compositing: if you touch CSS that alters the background, verify the actual rendering inside Zebar.

### Widget-to-package dependencies

Widgets declare `@overline-zebar/ui`, `@overline-zebar/config`, `@overline-zebar/tailwind` as `workspace:*`. Changes in `packages/ui` propagate to every widget that consumes it — after editing `ui`, rebuild the affected widgets.

## Fork working conventions

- **Minimize drift from upstream.** If a change touches files it doesn't need to, drop it: every modified file complicates future merges from `mushfikurr/overline-zebar`.
- **Update the "What changes compared to upstream" table** in the README every time you add/remove a customization.
- **Commit style**: look at `git log` — existing commits are concise, in English, imperative ("Fork: add media skip buttons", "Rename WeatherThreshold type…"). Follow the same style.
- **Don't add licenses, CI or tooling** that upstream lacks without an explicit reason — upstream has no declared license ("all rights reserved"); this fork is for personal use.
- **Documentation language is English.** Both `README.md` and this file are written in English; keep new docs consistent.

## Quick troubleshooting

- Widget doesn't appear after a build → restart Zebar from the tray; if it persists, clear `$APPDATA/zebar/webview-cache`.
- Widget still shows old behavior after a successful local build → make sure Zebar is actually loading the pack you edited under `~/.glzr/zebar/`; a separate deployed copy can lag behind the repo.
- Monorepo build hangs → build the problematic widget from inside its folder, then re-run the full build.
- `preinstall` fails → you're not using pnpm; activate corepack (`corepack prepare pnpm@latest --activate`).
