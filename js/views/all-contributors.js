function selectAllAuthor(idx){
  S.authorIdx=idx;
  render();
  const h=_stateHash();
  if(location.hash!==h) history.pushState(null,'',h);
  _scrollListToActive('instant');
}

function filterContribSearch(q){
  const query=(q||'').trim().toLowerCase();
  let anyVisible=false;
  document.querySelectorAll('.azi[data-cname]').forEach(btn=>{
    const nm=btn.dataset.cname.toLowerCase();
    const hide=query && !nm.includes(query);
    btn.style.display=hide?'none':'';
    if(!hide) anyVisible=true;
  });
  const empty=document.getElementById('caz-empty');
  if(empty) empty.style.display=(query&&!anyVisible)?'':'none';
}

function viewAllContributors(){
  const m=allByAuthor();
  const names=sortedNames(m);
  if(!names.length){
    return `<div class="wrap fade" style="padding:70px 0;text-align:center;color:var(--soft)">
      <div style="font-size:52px;color:var(--kumkum);opacity:.35;margin-bottom:18px;font-family:'Tiro Devanagari Hindi',serif">ॐ</div>
      <h2 style="font-family:'Tiro Devanagari Hindi',serif;color:var(--ink);margin:0 0 12px">योगदानकर्ता विवरण उपलब्ध छैन</h2>
      <button class="btn" style="margin-top:24px" onclick="go('shelf')">${icon('arrow-left')} अङ्कहरूमा फर्कनुहोस्</button>
    </div>`;
  }

  if(S.authorIdx>=names.length) S.authorIdx=0;
  const curName=names[S.authorIdx];
  const pieces=m[curName]||[];

  // most recent volume cover for profile photo
  const recentVol=pieces[pieces.length-1]._vol;
  const ph=placeholderSrc(recentVol);

  // collect unique volumes this author appeared in
  const uniqueVolNums=[...new Set(pieces.map(p=>p._vol.vol))];
  const totalVols=uniqueVolNums.length;

  // most recent place (from most recent article)
  const recentPlace=pieces[pieces.length-1].place||'';
  // all unique places (show up to 2)
  const allPlaces=[...new Set(pieces.map(p=>p.place).filter(Boolean))];
  const placeDisplay=allPlaces.slice(0,2).join(' · ')+(allPlaces.length>2?' · …':'');

  // group articles by volume (most recent first)
  const byVol={};
  pieces.forEach(p=>{
    const k=p._vol.vol;
    if(!byVol[k]) byVol[k]=[];
    byVol[k].push(p);
  });
  const volKeys=Object.keys(byVol).map(Number).sort((a,b)=>b-a);

  const volGroups=volKeys.map(vn=>{
    const vol=byVol[vn][0]._vol;
    const beads=byVol[vn].map(p=>{
      const pdfPg=p.page+(vol.pageOffset||0);
      return `<button class="bead" onclick="go('pdf',{vol:${vol.vol},pdfPage:${pdfPg}})">
        ${chip(p.genre)}
        <div class="bt">${p.title}</div>
        <div class="bm">पृष्ठ ${deva(p.page)} · PDF मा खोल्नुहोस् ${icon('arrow-right')}</div>
      </button>`;
    }).join('');
    return `<div class="vol-grp">
      <div class="vol-grp-hd"><span class="vgn">${vol.name}</span> वर्ष ${vol.volD} · ${vol.year}</div>
      <div class="vol-thread">${beads}</div>
    </div>`;
  }).join('');

  const azList=names.map((n,i)=>{
    const arts=m[n];
    const vols=new Set(arts.map(a=>a._vol.vol)).size;
    return `<li><button class="azi" data-cname="${n.replace(/"/g,'&quot;')}" aria-current="${i===S.authorIdx}" onclick="selectAllAuthor(${i})">
      <span style="min-width:0"><span class="nm">${n}</span><span class="ct"> · ${deva(arts.length)}</span></span>
      <span class="pl">${vols>1?deva(vols)+' अङ्क':arts[0].place||''}</span>
    </button></li>`;
  }).join('');

  const totalPieces=names.reduce((s,n)=>s+m[n].length,0);

  return `<div class="wrap fade">
  <div class="contrib">
    <aside class="az">
      <h2 class="deva-display">योगदानकर्ता</h2>
      <p class="hint">${deva(VOLUMES.length)} अङ्कमा ${deva(names.length)} स्रष्टाका ${deva(totalPieces)} रचना। नाम छान्नुहोस्।</p>
      <input class="caz-search" type="search" placeholder="नाम खोज्नुहोस्…" aria-label="योगदानकर्ता खोज्नुहोस्"
        oninput="filterContribSearch(this.value)" autocomplete="off">
      <ul class="az-list" id="caz-list">${azList}</ul>
      <div class="caz-empty" id="caz-empty" style="display:none">कुनै नाम फेला परेन।</div>
    </aside>
    <section class="cpro-panel" aria-live="polite">
      <div class="cpro-head">
        <div class="cpro-cover">
          <img src="${recentVol.cover}" alt="${recentVol.name}" onerror="this.onerror=null;this.src='${ph}'" title="नवीनतम योगदान: वर्ष ${recentVol.volD} · ${recentVol.name}">
        </div>
        <div class="cpro-meta">
          <h3 class="cpro-name">${curName}</h3>
          ${placeDisplay?`<p class="cpro-pl">${placeDisplay}</p>`:''}
          <p class="cpro-stat">${deva(pieces.length)} रचना · ${deva(totalVols)} अङ्क</p>
        </div>
      </div>
      ${volGroups}
    </section>
  </div>
  </div>`;
}
