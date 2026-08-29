/* ════════════════════════════════════════════════════
   HELPERS
   ════════════════════════════════════════════════════ */
const D = ['०','१','२','३','४','५','६','७','८','९'];
function deva(n){ return String(n).replace(/\d/g,d=>D[+d]); }

function chip(g){
  return `<span class="chip g-${g}">${g}</span>`;
}

function volByNum(n){ return VOLUMES.find(v=>v.vol===n); }

function byAuthor(items){
  const m={};
  items.filter(x=>!x.front).forEach(x=>{
    if(!m[x.author]) m[x.author]=[];
    m[x.author].push(x);
  });
  return m;
}

function sortedNames(m){
  return Object.keys(m).sort((a,b)=>a.localeCompare(b,'ne'));
}

/* Variant spellings → canonical display name.
   Key = variant as it appears in data; value = canonical to display. */
const NAME_CANON = {
  // अ
  "अजनिश राई":              "अजनीश राई",
  "आशिष विसुन्के":          "आशिश बिशुन्के",
  // उ
  "उमङ्ग कटुवाल क्षेत्री": "उमङ्ग कटुवाल छेत्री",
  // ए
  "एचआर भट्टराई":           "एच.आर. भट्टराई",
  // क
  "कमल भट्टुराई":           "कमल भट्टराई",
  "किरण स्याङदेन":          "किरण स्याङ्देन",
  "कुन्दनराज राई":          "कुन्दन राज राई",
  "कृष्ण सिंह मोक्तान":    "कृष्णसिंह मोक्तान",
  // ट/ड
  "टि.आर. शर्मा":           "टी.आर. शर्मा",
  "टिआर शर्मा":             "टी.आर. शर्मा",
  "डि.आर. गुरुङ":           "डी.आर. गुरुङ",
  // द/ब
  "देवी भूजेल":             "सुश्री देवी भूजेल",
  // न
  "निमेश सुब्बा":           "निमेष सुब्बा",
  // ब/प
  "बद्ध पाखरिन":            "बुद्ध पाख्रिन",
  "बुद्ध पाखरिन":           "बुद्ध पाख्रिन",
  "बसन्त प्रधान":           "वसन्त प्रधान",
  "बसन्त शर्मा":            "वसन्त शर्मा",
  // म
  "मणि कुमार दर्नाल":       "मणिकुमार (कमल) दर्नाल",
  "मनोहर भुजेल":            "मनोहर भूजेल",
  // प
  "प्रशान्त राई":           "डा. प्रशान्त राई",
  "डॉ. प्रशान्त राई":      "डा. प्रशान्त राई",
  "प्रियङ्का प्रधान":       "प्रियंका प्रधान",
  "प्रकाश शर्मा":           "प्रकाश शर्मा (सुबेदी)",
  // र
  "रोहण 'राज'":             "रोहण राज",
  // स
  "सफल प्रधान":             "सफलमणि प्रधान",
  "सफल मणि प्रधान":         "सफलमणि प्रधान",
  "सविता सङ्कल्प":          "सबिता थापा 'सङ्कल्प'",
  'सुवास छेत्री "भावुक"':   "सुवास छेत्री 'भावुक'",
  "सुवास भण्डारी":          "सुबास भण्डारी",
  "सोम बहादुर लिम्बू":      "सोमबहादुर लिम्बू",
  "श्रीमती कला भट्टुराई":   "कला भट्टराई",
  "शिव राई":                "शिव राई (खमवाली)",
  // ह
  "हरि शर्मा":              "हरि शर्मा पराजुली",
  "हरि शर्मा (पराजुली)":    "हरि शर्मा पराजुली",
  // अ (with title)
  "अमीर ठटाल":              "डा. अमीर दर्जी (ठटाल)",
  // व
  "विजय मङ्गर":             "विजय कुमार मङ्गर",
};

function _canon(name){ return NAME_CANON[name] || name; }

function allByAuthor(){
  const m={};
  VOLUMES.forEach(vol=>{
    vol.items.filter(x=>!x.front && x.author).forEach(x=>{
      const key=_canon(x.author);
      if(!m[key]) m[key]=[];
      m[key].push({...x, _vol:vol});
    });
  });
  return m;
}

function placeholderSrc(vol){
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 450">
<rect width="300" height="450" fill="#FCF8EE"/>
<rect x="8" y="8" width="284" height="434" fill="none" stroke="#DBCFB2" stroke-width="1.5"/>
<rect x="14" y="14" width="272" height="422" fill="none" stroke="#A9812F" stroke-width="0.6" stroke-dasharray="5,4"/>
<text x="150" y="178" text-anchor="middle" font-size="80" font-family="serif" fill="#C1362B" opacity="0.45">ॐ</text>
<text x="150" y="238" text-anchor="middle" font-size="17" font-family="serif" fill="#241F1A" opacity="0.65">${vol.name}</text>
<text x="150" y="272" text-anchor="middle" font-size="13" font-family="serif" fill="#A9812F">वर्ष ${vol.volD} · ${vol.year}</text>
<text x="150" y="305" text-anchor="middle" font-size="11" font-family="serif" fill="#6B6155">साईदेखि साईसम्म</text>
<text x="150" y="428" text-anchor="middle" font-size="10" font-family="sans-serif" fill="#C8BBA4">sai2sai.in</text>
</svg>`;
  return 'data:image/svg+xml,' + encodeURIComponent(svg);
}

function coverImg(vol, attrs){
  const ph = placeholderSrc(vol);
  return `<img src="${vol.cover}" alt="${vol.name} · वर्ष ${vol.volD}" ${attrs||''} onerror="this.onerror=null;this.src='${ph}'"/>`;
}

/* ════════════════════════════════════════════════════
   SVG ICONS
   ════════════════════════════════════════════════════ */
const ICONS={
'arrow-left':`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5"/><polyline points="12 19 5 12 12 5"/></svg>`,
'arrow-right':`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><polyline points="12 5 19 12 12 19"/></svg>`,
'chevron-left':`<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>`,
'chevron-right':`<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>`,
'chevron-up':`<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="18 15 12 9 6 15"/></svg>`,
'chevron-down':`<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>`,
'minus':`<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
'plus':`<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
'expand':`<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>`,
'compress':`<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="10" y1="14" x2="3" y2="21"/><line x1="21" y1="3" x2="14" y2="10"/></svg>`,
'menu':`<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>`,
'x':`<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
'file-pdf':`<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`,
'link':`<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`,
'check':`<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>`,
};
function icon(n){ return ICONS[n]||''; }
