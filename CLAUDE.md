# CLAUDE.md — sai2sai codebase guide

Single HTML file SPA. No build tooling. Edit `index.html` directly.

## Architecture

Everything lives in `index.html`:

```
<style>          CSS (custom properties, component styles, responsive)
<header>         Sticky nav (अङ्कहरू / योगदानकर्ता / यात्रा tabs)
<main id="app">  Replaced entirely on each navigation
<footer>
<script>         Data + state + routing + views + PDF engine
```

### State

```js
let S = {view, vol, itemId, authorIdx, showColophon, pdfPage};
```

`view` is one of: `'shelf'` | `'volume'` | `'contributors'` | `'allContributors'` | `'journey'` | `'pdf'`

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
- `#contrib/all` → cross-volume contributors list
- `#contrib/all/i5` → cross-volume contributors, author at index 5
- `#journey` → journey/history page
- `#pdf/1/p9` → PDF reader, volume 1, page 9

`_parseHash()` and `_stateHash()` convert between hash strings and state.  
`popstate` listener handles browser back/forward.

### Views

| Function | Renders |
|---|---|
| `viewShelf()` | Grid of all volumes + featured card |
| `viewVolume()` | TOC sidebar + article reader panel |
| `viewContributors()` | Per-volume author list + their works |
| `viewAllContributors()` | Cross-volume author search + detail panel |
| `viewJourney()` | Magazine history / decade retrospective |
| `viewPdfReader()` | PDF.js canvas + sidebar TOC + float nav |

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

PDF.js is loaded lazily on first PDF view. State:
- `_pdf` — pdfjsLib document
- `_pdfZoom` — `'fit'` | number (scale factor)
- `_pdfRendering` — prevents concurrent renders
- `_pdfPending` — queued page number if render in progress

Key functions: `_initPdfReader()`, `_renderPage(num)`, `_tocHighlight(pageNum)`.

Fullpage mode: `position:fixed; inset:0; z-index:300` via `.fullpage` class on `.pdf-layout`. Always opens at `fit` zoom.

### Helpers

- `deva(n)` — converts ASCII digits to Devanagari (0→०, 1→१, …)
- `chip(genre)` — returns genre badge `<span>`
- `coverImg(vol, attrs)` — `<img>` with inline SVG placeholder fallback
- `placeholderSrc(vol)` — generates an SVG data URI cover placeholder
- `byAuthor(items)` — groups items by author name
- `copyPermalink(e, hash)` — copies full URL to clipboard; shows ✓ briefly

## Adding articles to a volume

See README.md. After adding `VNN_ITEMS`, the TOC, contributors view, and PDF sidebar populate automatically — no other code changes needed.

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
