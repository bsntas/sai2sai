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
4. Scrolls appropriately (article into view for same-volume nav; top otherwise)
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

## Adding articles to a volume

Edit `js/data.js`: populate the relevant `VNN_ITEMS` array and ensure the matching `VOLUMES` entry references it via `items: VNN_ITEMS`. The TOC, contributors view, and PDF sidebar populate automatically — no other code changes needed.

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
