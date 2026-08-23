# साई देखि साई सम्म · sai2sai

वार्षिक स्मारिका — भगवान् श्री सत्य साई बाबाका भक्तहरूका कविता, अनुभव, लेख अनि नियात्राको संग्रह।  
Annual commemorative collection of poetry, personal experiences, essays, and travel writing by devotees of Bhagawan Sri Sathya Sai Baba. Published from Puttaparthi since 2016.

**Live site:** [bsntas.github.io/sai2sai](https://bsntas.github.io/sai2sai)

---

## What this is

A single-page web archive of all ten volumes of the *Sai Dekhi Sai Samma* (साई देखि साई सम्म) annual publication. Volumes 1 (2016) and 6 (2021) have full article indexes; the rest link to their PDFs.

Four main views:
- **Shelf** (`#shelf`) — featured latest volume + grid of all volumes
- **Volume** (`#v1`, `#v1/a3`) — article TOC and reader panel with PDF access
- **Contributors** (`#contrib/all`) — cross-volume author search and article listing
- **Journey** (`#journey`) — decade retrospective of the publication's history

## Tech

- Single `index.html` — no build step, no dependencies to install
- PDF rendering via [PDF.js](https://mozilla.github.io/pdf.js/) (loaded lazily from CDN)
- Fonts from Google Fonts (Tiro Devanagari Hindi, Noto Serif Devanagari, Fraunces)
- Hash-based URL routing (`#v1`, `#v1/a3`, `#contrib/1`, `#pdf/1/p9`) for deep links
- Deployed via GitHub Pages

## Running locally

```bash
# any static file server works
npx serve .
# or
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

## Adding a new volume

1. Add the cover image to `covers/vNN.jpg`
2. Add the PDF to `pdfs/vNN.pdf`
3. In `index.html`, add a new entry to the `VOLUMES` array:

```js
{vol:11, volD:"११", year:"२०२६", yearEn:2026,
 date:"२३ नोभेम्बर २०२६", bday:"१०१औं जन्मजयन्ती",
 name:"ओम् ...",
 cover:"covers/v11.jpg", pdf:"pdfs/v11.pdf",
 pages:null, items:[]}
```

## Adding article data for a volume

Define a `VNN_ITEMS` array (copy the shape from `V1_ITEMS` or `V6_ITEMS`) and reference it in the `VOLUMES` entry:

```js
const V11_ITEMS = [
  {genre:"सम्पादकीय", title:"सम्पादकीय", author:"सम्पादक मण्डल", place:"", page:5, front:true},
  {genre:"अनुभव", title:"...", author:"...", place:"...", page:9},
  // …
];
```

Then set `items: V11_ITEMS` (and add `editors`, `publishers`, `patrons`, `web`, `price` fields) in the volume entry. The full article index, contributors view, and PDF TOC sidebar all populate automatically.

## Genre types

| Nepali | Meaning |
|---|---|
| सम्पादकीय | Editorial |
| प्रकाशकीय | Publisher's note |
| लेख | Essay / article |
| कविता | Poetry |
| अनुभव | Personal experience |
| चिन्तन | Reflection |
| नियात्रा | Travel writing |
| अन्तर्वार्ता | Interview |
