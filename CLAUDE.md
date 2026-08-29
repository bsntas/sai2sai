# CLAUDE.md — sai2sai codebase guide

Modular SPA. No build tooling. Files are plain `<script src>` and `<link rel="stylesheet">` — no bundler, no modules.

## File layout

```
index.html              HTML shell: head, header, main#app, footer, <script> tags
css/
  styles.css            All CSS: custom properties, component styles, responsive
js/
  data.js               VOLUMES array + per-volume item arrays (V1_ITEMS … V10_ITEMS)
  helpers.js            Pure utility functions (deva, chip, coverImg, byAuthor, icon, …)
  state.js              State (S), router (go), render(), hash routing, keyboard handlers
  views/
    shelf.js            viewShelf() — home grid of all volumes
    volume.js           viewVolume() — TOC sidebar + article reader
    contributors.js     viewContributors() — per-volume author list
    all-contributors.js viewAllContributors() — cross-volume author search
    journey.js          viewJourney() — magazine history / decade retrospective
    pdf.js              viewPdfReader() + entire PDF.js engine
    contact.js          viewContact() + submitContact()
logo/
  sai2sai.png           Original full-size logo
  sai2sai-opt.svg       Optimised SVG logo (used in header)
  icon-192.png          192×192 icon for web manifest + favicon
  icon-512.png          512×512 icon for web manifest
  icon-maskable.png     512×512 maskable icon (logo centred with safe-zone padding on #FDF8F2)
v1/ … v10/
  index.html            Per-volume social share pages (OG + JSON-LD → redirect to /#vN)
covers/
  v01.jpg … v10.jpg     Volume cover images (2:3 aspect ratio)
pdfs/
  v01.pdf … v10.pdf     Full volume PDFs
site.webmanifest        PWA manifest (name, icons, theme_color)
sw.js                   Service worker — cache-first for static assets, network-first for HTML
robots.txt              Crawler directive + sitemap pointer
sitemap.xml             All indexable URLs (root + /v1/ … /v10/)
```

### Load order (critical)

`index.html` loads scripts in this exact order — each depends on what precedes it:

1. `js/data.js` — defines `VOLUMES`, `V1_ITEMS`, …
2. `js/helpers.js` — uses `VOLUMES`
3. `js/views/*.js` — use `VOLUMES`, helpers, and each other
4. `js/state.js` — uses everything above; calls `_initFromHash()` at the very end

All functions are **global** (classic scripts, not ES modules) because HTML templates use inline `onclick="go(...)"` handlers.

### State

```js
let S = {view, vol, itemId, authorIdx, showColophon, pdfPage, pdfFrom};
```

`view` is one of: `'shelf'` | `'volume'` | `'contributors'` | `'allContributors'` | `'journey'` | `'pdf'` | `'contact'`

### Routing

`go(view, params)` — the single navigation function. It:
1. Tears down PDF listener if leaving PDF view
2. Merges params into `S`
3. Calls `render()`
4. Scrolls to top on view change; scrolls article into view only when navigating to a non-first article (`itemId > 0`) within the same volume
5. Pushes `history.pushState` with the new hash

Hash format:
- `#shelf` → home
- `#v1` → volume 1
- `#v1/a3` → volume 1, article at index 3
- `#contrib/1` → contributors for volume 1
- `#contrib/1/i2` → contributors, author at index 2
- `#contributors` → cross-volume contributors list
- `#contributors/i5` → cross-volume contributors, author at index 5
- `#journey` → journey/history page
- `#contact` → contact page
- `#pdf/1/p9` → PDF reader, volume 1, page 9

`_parseHash()` and `_stateHash()` convert between hash strings and state.  
`popstate` listener handles browser back/forward.

### Views

| File | Function | Renders |
|---|---|---|
| `views/shelf.js` | `viewShelf()` | Grid of all volumes + featured card |
| `views/volume.js` | `viewVolume()` | TOC sidebar + article reader panel |
| `views/contributors.js` | `viewContributors()` | Per-volume author list + their works |
| `views/all-contributors.js` | `viewAllContributors()` | Cross-volume author search + detail panel |
| `views/journey.js` | `viewJourney()` | Magazine history / decade retrospective |
| `views/pdf.js` | `viewPdfReader()` | PDF.js canvas + sidebar TOC + float nav |
| `views/contact.js` | `viewContact()` | Contact form |

### Data

```js
const VOLUMES = [{vol, volD, year, yearEn, date, bday, name, cover, pdf, pages, items, ...}, ...]
```

`items` is an array of article objects:
```js
{genre, title, author, place, page, front?}
```

`front:true` marks editorial/publisher pieces (excluded from contributor counts).

`V1_ITEMS` and `V6_ITEMS` are the populated article lists. Other volumes have `items:[]`.

### PDF engine

Entirely in `js/views/pdf.js`. PDF.js is loaded lazily on first PDF view. Runtime state lives in `js/state.js` (alongside `S`) because `go()` reads and resets it when entering/leaving the PDF view:

- `_pdf` — pdfjsLib document
- `_pdfZoom` — `'fit'` | number (scale factor)
- `_pdfRendering` — prevents concurrent renders
- `_pdfPending` — queued page number if render in progress

Key functions: `_initPdfReader()`, `_renderPage(num)`, `_tocHighlight(pageNum)`.

Fullpage mode: `position:fixed; inset:0; z-index:300` via `.fullpage` class on `.pdf-layout`. Always opens at `fit` zoom.

### Helpers (`js/helpers.js`)

- `deva(n)` — converts ASCII digits to Devanagari (0→०, 1→१, …)
- `chip(genre)` — returns genre badge `<span>`
- `coverImg(vol, attrs)` — `<img>` with inline SVG placeholder fallback
- `placeholderSrc(vol)` — generates an SVG data URI cover placeholder
- `byAuthor(items)` — groups items by author name
- `icon(n)` — returns SVG icon markup by name

`copyPermalink(e, hash)` lives in `js/state.js` (copies full URL to clipboard; shows ✓ briefly).

### Service worker (`sw.js`)

Cache-first strategy for all static assets (JS, CSS, images). HTML shell (`/`, `/index.html`) uses network-first so content updates land immediately. Registered on page load via an inline `<script>` at the bottom of `index.html`. Cache is versioned via the `CACHE` constant — increment it to force all clients to re-fetch after a major asset change.

### PWA / mobile

- `site.webmanifest` — name, short_name, icons (192, 512, maskable), theme_color
- `logo/icon-192.png` and `logo/icon-512.png` — generated from the original PNG at standard sizes
- `logo/icon-maskable.png` — logo centred in safe zone on `#FDF8F2` background for Android adaptive icons
- `<meta name="apple-mobile-web-app-title" content="sai2sai">` — short iOS home screen label

### SEO / social sharing

**For in-app navigation** use hash URLs (`/#v1`). **For sharing externally** (WhatsApp, Facebook, Telegram) use the per-volume share pages (`/v1/`, `/v2/`, …). Each share page:
- Carries volume-specific `og:title`, `og:description`, `og:image` (cover photo), `og:locale: ne_NP`, and `twitter:card: summary_large_image`
- Includes Book JSON-LD structured data with `datePublished`, `image`, and publisher
- Instantly redirects real users to `/#vN` via `<meta http-equiv="refresh">` and `location.replace()`

The root `index.html` has WebSite + Organization JSON-LD with `sameAs` social links.

`sitemap.xml` lists root + all 10 share pages. Submit to Google Search Console after deploy.

## Adding articles to a volume

Edit `js/data.js`: populate the relevant `VNN_ITEMS` array and ensure the matching `VOLUMES` entry references it via `items: VNN_ITEMS`. The TOC, contributors view, and PDF sidebar populate automatically — no other code changes needed.

When adding a new volume (vol 11+), also:
- Add `v11/index.html` share page with OG + JSON-LD tags and redirect to `/#v11`
- Add the URL to `sitemap.xml`
- Update the `og:image` in `index.html` to point to the new latest cover
- Add `covers/v11.jpg` and `pdfs/v11.pdf`
- Regenerate `logo/icon-192.png` / `icon-512.png` only if the logo changes

## Covers and PDFs

- `covers/vNN.jpg` — cover image (2:3 aspect ratio recommended)
- `pdfs/vNN.pdf` — full volume PDF

Missing covers fall back to an SVG placeholder that shows the volume name and year. Missing PDFs show an error message inside the reader.

## Common pitfalls

- **Do not** use `location.hash = '#...'` — use `history.pushState` to avoid triggering `hashchange` during navigation.
- **Do not** add `vol.web` or other optional fields to the colophon template unconditionally — check truthiness first (`${vol.web ? ... : ''}`).
- The `placeholderSrc` SVG is embedded as a data URI inside an `onerror` attribute — keep it short and avoid `"` double quotes inside (use single or encode them).
- PDF sidebar TOC IDs use `ptoc-{page}` and `dtoc-{page}` prefixes to distinguish the main sidebar from the fullpage drawer.
- The Journey nav tab uses two spans (`.nav-journey-label` for desktop, `.nav-journey-short` for mobile ≤640px). The short span is hidden by CSS (`.nav-journey-short{display:none}`) and revealed by the media query — do **not** add an inline `style="display:none"` to it as that would override the media query.
- `.nav-journey-short` default hidden state lives in the regular CSS block (not inside the media query) so inline styles can never accidentally shadow it.
- PDF runtime state (`_pdf`, `_pdfRendering`, etc.) is declared in `js/state.js`, not `js/views/pdf.js`, because `go()` in state.js directly reads and resets those vars when entering/leaving PDF view.
- Volume scroll: `article.page` is only scrolled into view when `itemId > 0`. Opening a volume at `itemId=0` always scrolls to top so the volume header and PDF button remain visible (on mobile the TOC stacks above the article).
- Service worker cache version (`CACHE = 'sai2sai-v1'` in `sw.js`): increment the version string after any major static asset change to force clients to re-fetch.
- Share pages (`v1/` … `v10/`) are for external sharing only — internal navigation always uses `go('volume', {vol:N})` which produces `/#vN` hash URLs.
