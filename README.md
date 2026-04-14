# overline-zebar-fork

> **Fork personale** di [`mushfikurr/overline-zebar`](https://github.com/mushfikurr/overline-zebar), una topbar per [Zebar](https://github.com/glzr-io/zebar) pensata per accoppiarsi a [GlazeWM](https://github.com/glzr-io/glazewm).

## Ringraziamenti

Tutto il lavoro pesante è stato fatto da **[@mushfikurr](https://github.com/mushfikurr)**: architettura monorepo, design della topbar, widget di system stats, script launcher, config widget e tutto il codice originale. Grazie per avere reso pubblico un progetto così curato.

Questo repository esiste solo per raccogliere le **personalizzazioni locali** che faccio sul mio setup. Non vuole competere con l'originale: se cerchi overline-zebar, installa quello. Se la mia versione ti interessa, sentiti libero di prenderla come ispirazione.

> ⚠️ Il repo originale non dichiara una licenza (`license: null`). In assenza di licenza, si applica "all rights reserved" per l'autore originale. Questo fork è mantenuto a uso personale; prima di redistribuire artefatti derivati contatta l'autore originale per chiarezza.

## Cosa cambia rispetto all'upstream

| Area | Modifica |
|------|----------|
| `widgets/main/src/components/media/Media.tsx` | Aggiunti due pulsanti dedicati **Skip Back** / **Skip Forward** ai lati della chip media; il play/pause resta sulla chip, gli shortcut `Shift/Ctrl/Alt+Click` originali sono preservati. |

Il resto del codice è identico all'upstream al momento del fork.

---

## Sommario

- [Requisiti](#requisiti)
- [Installazione rapida (pack locale)](#installazione-rapida-pack-locale)
- [Struttura del progetto](#struttura-del-progetto)
- [Workflow di sviluppo](#workflow-di-sviluppo)
- [Come funziona l'integrazione con Zebar](#come-funziona-lintegrazione-con-zebar)
- [Rollback](#rollback)
- [Troubleshooting](#troubleshooting)

---

## Requisiti

- **Windows** (Zebar è cross-platform ma questo README documenta il setup Windows)
- **[GlazeWM](https://github.com/glzr-io/glazewm)** installato
- **[Zebar](https://github.com/glzr-io/zebar)** installato (Scoop / winget / installer ufficiale)
- **Node.js** ≥ 20
- **pnpm** — il repo enforce pnpm via `preinstall`. Se non vuoi installarlo globalmente puoi usare `corepack pnpm <cmd>` dopo aver fatto almeno una volta `corepack prepare pnpm@latest --activate`.

## Installazione rapida (pack locale)

Zebar cerca i **pack custom** in `~/.glzr/zebar/*/zpack.json`. L'ID del pack corrisponde al campo `name` di `zpack.json`.

```sh
# 1. Clona il fork dentro la cartella di config di Zebar
git clone https://github.com/Lerma4/overline-zebar-fork.git "$HOME/.glzr/zebar/overline-fork"
cd "$HOME/.glzr/zebar/overline-fork"

# 2. Installa le dipendenze (usa corepack se non hai pnpm globale)
corepack prepare pnpm@latest --activate
corepack pnpm install

# 3. Builda tutti i widget
corepack pnpm --filter "@overline-zebar/*" build
```

Poi registra il pack nel tuo `settings.json` di Zebar (`~/.glzr/zebar/settings.json`):

```json
{
  "$schema": "https://github.com/glzr-io/zebar/raw/v3.3.1/resources/settings-schema.json",
  "startupConfigs": [
    { "pack": "overline-fork", "widget": "main", "preset": "default" }
  ]
}
```

Riavvia Zebar (tray → Exit, poi riapri). La barra dovrebbe apparire automaticamente all'avvio.

> Il valore di `pack` deve coincidere con il campo `name` di `zpack.json` del fork (`overline-fork`). Non è una stringa `autore.nome` come per i pack marketplace.

### Coesistenza con il pack marketplace

Se hai già installato `mushfikurr.overline-zebar` dal marketplace Zebar (si trova in `%APPDATA%\zebar\downloads\`), il fork e l'originale **coesistono senza conflitti**, perché risiedono in posizioni diverse e hanno ID di pack distinti. In `startupConfigs` puoi scegliere quale usare.

## Struttura del progetto

Monorepo pnpm:

```
overline-zebar-fork/
├─ zpack.json              # manifest pack: widget, preset, privileges
├─ packages/
│  ├─ config/              # gestione settings condivisi
│  ├─ ui/                  # React component library (Chip, ecc.)
│  ├─ tailwind/            # config Tailwind condivisa
│  └─ typescript/          # tsconfig base
└─ widgets/
   ├─ main/                # topbar principale (il file modificato sta qui)
   ├─ system-stats/        # pannello statistiche hover
   ├─ script-launcher/     # launcher script custom
   └─ config-widget/       # GUI di configurazione
```

Ogni widget builda in `widgets/<nome>/dist/` e Zebar carica `dist/index.html` come webview.

## Workflow di sviluppo

### Modifica → build → reload

1. **Edit** dei sorgenti in `widgets/<widget>/src/`.
2. **Build** del solo widget modificato (più veloce che buildare tutto il monorepo):

   ```sh
   cd widgets/main
   corepack pnpm build
   ```

3. **Reload** di Zebar — dalla tray fai Exit e riapri, oppure toggle del widget dalla Settings UI. Se dopo il reload vedi ancora la versione vecchia, svuota la webview cache:

   ```sh
   rm -rf "$APPDATA/zebar/webview-cache"
   ```

### Build incrementale (watch)

Per il singolo widget:

```sh
cd widgets/main
corepack pnpm build:watch
```

Così ogni save rigenera `dist/`. Devi comunque ricaricare il widget in Zebar (la webview non fa HMR diretto sul filesystem di `dist`).

### Lint & format

```sh
corepack pnpm lint
corepack pnpm format
```

## Come funziona l'integrazione con Zebar

Zebar scansiona due tipi di pack:

- **Custom pack**: `~/.glzr/zebar/*/zpack.json` — l'ID è il campo `name` di `zpack.json` (es. `overline-fork`).
- **Marketplace pack**: `%APPDATA%\zebar\downloads\<autore>.<nome>@<version>\zpack.json` — l'ID è `<autore>.<nome>` dai metadata del marketplace.

Ogni widget descritto in `zpack.json` specifica:
- `htmlPath` → punto d'ingresso della webview (tipicamente `./widgets/<nome>/dist/index.html`)
- `presets[]` → posizione/dimensione/monitor
- `privileges.shellCommands[]` → whitelist dei comandi shell invocabili via `glazewm` provider

In codice, un widget consuma dati di sistema via il package npm `zebar`:

```ts
import * as zebar from 'zebar';

const providers = zebar.createProviderGroup({
  glazewm: { type: 'glazewm' },
  cpu: { type: 'cpu' },
  media: { type: 'media' },
  // ...
});

providers.onOutput(() => {
  // state live in providers.outputMap
});
```

## Rollback

Per tornare al pack marketplace (o disabilitare del tutto il fork):

```sh
# Opzione A: ripristina il backup del tuo settings.json (se ne hai fatto uno)
cp ~/.glzr/zebar/settings.json.bak ~/.glzr/zebar/settings.json

# Opzione B: edita settings.json e metti come pack "mushfikurr.overline-zebar"
# (richiede che il pack marketplace sia installato)

# Rimuovi il fork (il pack marketplace non viene toccato)
rm -rf ~/.glzr/zebar/overline-fork
```

Riavvia Zebar e sei tornato allo stato precedente.

## Troubleshooting

**Errore in `errors.log`: `No widget pack found for 'overline-fork'`**
Controlla che:
- la cartella sia esattamente in `~/.glzr/zebar/overline-fork/`
- esista `zpack.json` in quella cartella
- `zpack.json` abbia `"name": "overline-fork"` (stesso valore del campo `pack` in `settings.json`)
- ogni widget referenziato abbia `dist/index.html` (serve aver fatto `pnpm build` almeno una volta)

**`pnpm` non è riconosciuto**
Se hai installato pnpm via corepack ma non è sul PATH, usa `corepack pnpm <cmd>` oppure installalo globalmente con Scoop: `scoop install pnpm`.

**Build che sembra bloccata su `script-launcher`**
Entra direttamente nel widget e fai la build mirata:

```sh
cd widgets/script-launcher
corepack pnpm build
```

Poi rilancia il build dell'intero monorepo.

**Vedi ancora la versione vecchia dopo il reload**
Svuota la webview cache:

```sh
rm -rf "$APPDATA/zebar/webview-cache"
```

## Crediti

- **Upstream**: [mushfikurr/overline-zebar](https://github.com/mushfikurr/overline-zebar) — topbar, widget di sistema, config UI, script launcher.
- **Piattaforma**: [glzr-io/zebar](https://github.com/glzr-io/zebar) — framework per widget desktop cross-platform.
- **Window manager**: [glzr-io/glazewm](https://github.com/glzr-io/glazewm).
