function viewShelf(){
  const latest = VOLUMES[VOLUMES.length-1];
  const latestItems = latest.items;
  const latestPieces = latestItems.filter(x=>!x.front).length;
  const latestContribs = Object.keys(byAuthor(latestItems)).length;

  const featStats = latestItems.length > 0
    ? `${deva(latestPieces)} रचना · ${deva(latestContribs)} योगदानकर्ता · ${latest.pages?deva(latest.pages)+' पृष्ठ':'—'}`
    : `${latest.date} · ${latest.bday}`;

  const gridCards = VOLUMES.slice().reverse().map(vol=>{
    const isLatest = vol.vol===latest.vol;
    const ph = placeholderSrc(vol);
    return `<button class="vol-card" onclick="go('volume',{vol:${vol.vol}})" title="${vol.name} · वर्ष ${vol.volD} (${vol.year})">
      <div class="vol-thumb">
        <img src="${vol.cover}" alt="वर्ष ${vol.volD}" loading="lazy" onerror="this.onerror=null;this.src='${ph}'" style="width:100%;height:100%;object-fit:cover;display:block"/>
        ${isLatest?`<div class="vol-sticker" style="background:var(--kumkum);color:#fff">नवीनतम</div>`:''}
        ${vol.centenary?`<div class="vol-sticker-c" style="background:var(--gold);color:#fff">शताब्दी</div>`:''}
      </div>
      <div class="vol-info-chip">
        <div class="vi-num">${vol.name}</div>
        <div class="vi-year">वर्ष ${vol.volD} · ${vol.year}</div>
      </div>
    </button>`;
  }).join('');

  return `<div class="wrap fade">
  <section class="shelf-hero">
    <p class="kicker">वार्षिक स्मारिका · भगवान् श्री सत्य साई बाबाका भक्तहरूद्वारा</p>
    <h1 class="deva-display">साईदेखि साईसम्म</h1>
    <p class="lead">कविता, अनुभव, लेख अनि नियात्रा — एकै ठाउँमा। वर्ष २०१६ देखि प्रकाशित सबै ${deva(VOLUMES.length)} अङ्कहरू यहाँ संग्रहीत छन्।</p>
  </section>

  <section style="padding-bottom:44px">
    <p class="section-label">नवीनतम अङ्क</p>
    <div class="feat-card">
      <div>${coverImg(latest,'class="cov"')}</div>
      <div>
        <div class="vol-label">वर्ष ${latest.volD} · अङ्क ${deva(latest.vol)} · ${latest.date}</div>
        <h2 class="deva-display">${latest.name}${latest.centenary?'<span class="badge badge-centenary">शताब्दी</span>':''}</h2>
        <p class="stats">${featStats}</p>
        <div class="btn-row">
          <button class="btn" onclick="go('volume',{vol:${latest.vol}})">अङ्क खोल्नुहोस् ${icon('arrow-right')}</button>
          <button class="btn-outline" onclick="go('pdf',{vol:${latest.vol},pdfPage:1})">PDF पढ्नुहोस्</button>
        </div>
      </div>
    </div>
  </section>

  <section class="vols-section">
    <p class="section-label">सबै अङ्कहरू — वर्ष १ देखि ${deva(VOLUMES.length)} सम्म</p>
    <div class="vols-grid">${gridCards}</div>
  </section>
  </div>`;
}
