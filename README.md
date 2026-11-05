# StegArena

StegArena documents side-channel negotiation and secret transfer between LLM agents in isolated KVM virtual machines. The AI4Collaboration website and downloadable report are written in English.

The website presents the experimental setup, ten model pairings, three complete transfers, session observations, and reproduction details. Visitors can filter pairings, switch themes, use the mobile menu, expand sections, and download the report and results.

## Local development

Use Node.js 22 or later. Run these commands from the project directory:

```bash
mkdir -p .work/tmp
TMPDIR="$PWD/.work/tmp" npm ci --cache .work/npm-cache
npm run dev
```

The local address is `http://127.0.0.1:4173`.

## Build and test

```bash
npm run build
TMPDIR="$PWD/.work/tmp" npm test
```

The build writes the site to `dist/`. An explicit file list selects the page, fonts, licenses, and research material. Relative asset paths support both a domain root and a project subdirectory.

Playwright and axe-core check data, filters, saved themes, keyboard controls, section links, downloads, responsive layout, and accessibility. Tests use installed Google Chrome on macOS and Playwright Chromium in CI. Test artifacts and tool caches are stored in `.work/`.

## Files and sources

| File | Purpose |
| --- | --- |
| `index.html` | Page text, tables, navigation, and metadata |
| `style.css` | Fonts, themes, responsive layout, and print styles |
| `theme.js` | Apply the saved theme during page loading |
| `app.js` | Theme controls, menu, result filters, and section links |
| `stegarena-report.md` | Complete English translation of the supplied research report |
| `results.json` | Ten pairing results and resource totals for eleven archived runs |
| `scripts/build.mjs` | Static publication file list |
| `tests/site.spec.mjs` | Tests in a real browser |

In `results.json`, `hit_minutes` uses the hit times supplied by the report. A `null` value marks a run record. `wall_seconds` preserves the reported durations, including both values for s1. The confirmed set is s3, x1, and x5. `reported_payload_bytes` uses the report's 71-byte payload measurement.

## Deployment

The public domain is `stegarena.com`. Cloudflare DNS points the domain to `ai4collaboration.github.io`, and GitHub Pages serves the site with HTTPS.

The workflow in `.github/workflows/pages.yml` installs dependencies, builds the site, runs browser tests, and publishes `dist/` after updates to `master`. GitHub Pages uses the custom domain `stegarena.com` and the workflow build type. The root `.nojekyll` file also supports direct static hosting.

## Fonts and design

The page follows the colors, typography, section structure, and interaction standards of Eval Hacking Atlas. Barlow and IBM Plex Mono are hosted with the site. Their SIL Open Font License 1.1 texts are included in `assets/Barlow-OFL.txt` and `assets/IBM-Plex-Mono-OFL.txt`.

The original Academic Pages template assets retain their MIT license. The current website uses the root static entry point and the publication file list in `dist/`.
