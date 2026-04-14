# overline-zebar-fork

> **Personal fork** of [`mushfikurr/overline-zebar`](https://github.com/mushfikurr/overline-zebar), a topbar for [Zebar](https://github.com/glzr-io/zebar) designed to pair with [GlazeWM](https://github.com/glzr-io/glazewm).

## Acknowledgements

All the heavy lifting was done by **[@mushfikurr](https://github.com/mushfikurr)**: monorepo architecture, topbar design, system stats widget, script launcher, config widget and all the original code. Thanks for releasing such a polished project.

This repository exists only to collect the **local customizations** I make on my own setup. It does not aim to compete with the original: if you're looking for overline-zebar, install that. If you find my version interesting, feel free to take it as inspiration.

> ⚠️ The upstream repo does not declare a license (`license: null`). In the absence of a license, "all rights reserved" applies to the original author. This fork is maintained for personal use; before redistributing derived artifacts, contact the original author for clarification.

## What changes compared to upstream

| Area | Change |
|------|--------|
| `widgets/main/src/components/media/Media.tsx` | Added two dedicated **Skip Back** / **Skip Forward** buttons on the sides of the media chip; play/pause stays on the chip, the original `Shift/Ctrl/Alt+Click` shortcuts are preserved. |

The rest of the code is identical to upstream as of the fork point.

---

## Table of contents

- [Requirements](#requirements)
- [Quick install (local pack)](#quick-install-local-pack)
- [Project structure](#project-structure)
- [Development workflow](#development-workflow)
- [How the Zebar integration works](#how-the-zebar-integration-works)
- [Rollback](#rollback)
- [Troubleshooting](#troubleshooting)

---

## Requirements

- **Windows** (Zebar is cross-platform, but this README documents the Windows setup)
- **[GlazeWM](https://github.com/glzr-io/glazewm)** installed
- **[Zebar](https://github.com/glzr-io/zebar)** installed (Scoop / winget / official installer)
- **Node.js** ≥ 20
- **pnpm** — the repo enforces pnpm via `preinstall`. If you don't want to install it globally, you can use `corepack pnpm <cmd>` after running `corepack prepare pnpm@latest --activate` at least once.

## Quick install (local pack)

Zebar looks for **custom packs** in `~/.glzr/zebar/*/zpack.json`. The pack ID matches the `name` field of `zpack.json`.

```sh
# 1. Clone the fork inside Zebar's config folder
git clone https://github.com/Lerma4/overline-zebar-fork.git "$HOME/.glzr/zebar/overline-fork"
cd "$HOME/.glzr/zebar/overline-fork"

# 2. Install dependencies (use corepack if you don't have pnpm globally)
corepack prepare pnpm@latest --activate
corepack pnpm install

# 3. Build all widgets
corepack pnpm --filter "@overline-zebar/*" build
```

Then register the pack in your Zebar `settings.json` (`~/.glzr/zebar/settings.json`):

```json
{
  "$schema": "https://github.com/glzr-io/zebar/raw/v3.3.1/resources/settings-schema.json",
  "startupConfigs": [
    { "pack": "overline-fork", "widget": "main", "preset": "default" }
  ]
}
```

Restart Zebar (tray → Exit, then reopen). The bar should appear automatically on startup.

> The `pack` value must match the `name` field of the fork's `zpack.json` (`overline-fork`). It is not an `author.name` string like marketplace packs.

### Coexistence with the marketplace pack

If you already installed `mushfikurr.overline-zebar` from the Zebar marketplace (it lives in `%APPDATA%\zebar\downloads\`), the fork and the original **coexist without conflicts**, because they live in different locations and have distinct pack IDs. In `startupConfigs` you can choose which one to use.

## Project structure

pnpm monorepo:

```
overline-zebar-fork/
├─ zpack.json              # pack manifest: widgets, presets, privileges
├─ packages/
│  ├─ config/              # shared settings management
│  ├─ ui/                  # React component library (Chip, etc.)
│  ├─ tailwind/            # shared Tailwind config
│  └─ typescript/          # base tsconfig
└─ widgets/
   ├─ main/                # main topbar (the modified file lives here)
   ├─ system-stats/        # hover stats panel
   ├─ script-launcher/     # custom script launcher
   └─ config-widget/       # configuration GUI
```

Each widget builds into `widgets/<name>/dist/` and Zebar loads `dist/index.html` as a webview.

## Development workflow

### Edit → build → reload

1. **Edit** sources in `widgets/<widget>/src/`.
2. **Build** only the modified widget (faster than building the whole monorepo):

   ```sh
   cd widgets/main
   corepack pnpm build
   ```

3. **Reload** Zebar — from the tray, Exit and reopen, or toggle the widget from the Settings UI. If after the reload you still see the old version, clear the webview cache:

   ```sh
   rm -rf "$APPDATA/zebar/webview-cache"
   ```

### Incremental build (watch)

For a single widget:

```sh
cd widgets/main
corepack pnpm build:watch
```

This way every save regenerates `dist/`. You still need to reload the widget in Zebar (the webview does not do direct HMR on the `dist` filesystem).

### Lint & format

```sh
corepack pnpm lint
corepack pnpm format
```

## How the Zebar integration works

Zebar scans two types of packs:

- **Custom pack**: `~/.glzr/zebar/*/zpack.json` — the ID is the `name` field of `zpack.json` (e.g. `overline-fork`).
- **Marketplace pack**: `%APPDATA%\zebar\downloads\<author>.<name>@<version>\zpack.json` — the ID is `<author>.<name>` from the marketplace metadata.

Each widget described in `zpack.json` specifies:
- `htmlPath` → webview entry point (typically `./widgets/<name>/dist/index.html`)
- `presets[]` → position/size/monitor
- `privileges.shellCommands[]` → whitelist of shell commands invokable via the `glazewm` provider

In code, a widget consumes system data via the `zebar` npm package:

```ts
import * as zebar from 'zebar';

const providers = zebar.createProviderGroup({
  glazewm: { type: 'glazewm' },
  cpu: { type: 'cpu' },
  media: { type: 'media' },
  // ...
});

providers.onOutput(() => {
  // live state in providers.outputMap
});
```

## Rollback

To go back to the marketplace pack (or disable the fork entirely):

```sh
# Option A: restore the backup of your settings.json (if you made one)
cp ~/.glzr/zebar/settings.json.bak ~/.glzr/zebar/settings.json

# Option B: edit settings.json and set pack to "mushfikurr.overline-zebar"
# (requires the marketplace pack to be installed)

# Remove the fork (the marketplace pack is left untouched)
rm -rf ~/.glzr/zebar/overline-fork
```

Restart Zebar and you're back to the previous state.

## Troubleshooting

**Error in `errors.log`: `No widget pack found for 'overline-fork'`**
Check that:
- the folder is exactly at `~/.glzr/zebar/overline-fork/`
- `zpack.json` exists in that folder
- `zpack.json` has `"name": "overline-fork"` (same value as the `pack` field in `settings.json`)
- every referenced widget has `dist/index.html` (you must have run `pnpm build` at least once)

**`pnpm` is not recognized**
If you installed pnpm via corepack but it is not on PATH, use `corepack pnpm <cmd>` or install it globally with Scoop: `scoop install pnpm`.

**Build seems stuck on `script-launcher`**
Go directly into the widget and run a targeted build:

```sh
cd widgets/script-launcher
corepack pnpm build
```

Then re-run the build for the whole monorepo.

**You still see the old version after reload**
Clear the webview cache:

```sh
rm -rf "$APPDATA/zebar/webview-cache"
```

## Credits

- **Upstream**: [mushfikurr/overline-zebar](https://github.com/mushfikurr/overline-zebar) — topbar, system widgets, config UI, script launcher.
- **Platform**: [glzr-io/zebar](https://github.com/glzr-io/zebar) — cross-platform desktop widget framework.
- **Window manager**: [glzr-io/glazewm](https://github.com/glzr-io/glazewm).
