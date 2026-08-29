function viewContributors(){
  const vol = volByNum(S.vol) || [...VOLUMES].reverse().find(v=>v.items.length>0);

  if(!vol || !vol.items.length){
    return `<div class="wrap fade" style="padding:70px 0;text-align:center;color:var(--soft)">
      <div style="font-size:52px;color:var(--kumkum);opacity:.35;margin-bottom:18px;font-family:'Tiro Devanagari Hindi',serif">ॐ</div>
      <h2 style="font-family:'Tiro Devanagari Hindi',serif;color:var(--ink);margin:0 0 12px">योगदानकर्ता विवरण उपलब्ध छैन</h2>
      <p style="max-width:38ch;margin:0 auto;font-size:16px">यस अङ्कको रचना–सूची अझै थपिएको छैन।</p>
      <button class="btn" style="margin-top:24px" onclick="go('shelf')">${icon('arrow-left')} अङ्कहरूमा फर्कनुहोस्</button>
    </div>`;
  }

  const m = byAuthor(vol.items);
  const names = sortedNames(m);
  if(S.authorIdx>=names.length) S.authorIdx=0;
  const curName = names[S.authorIdx];
  const pieces = m[curName]||[];

  const azList = names.map((n,i)=>`
    <li><button class="azi" aria-current="${i===S.authorIdx}" onclick="selectAuthor(${i})">
      <span style="min-width:0"><span class="nm">${n}</span><span class="ct"> · ${deva(m[n].length)}</span></span>
      <span class="pl">${m[n][0].place}</span>
    </button></li>`).join('');

  const beads = pieces.map(p=>`
    <button class="bead" onclick="go('volume',{vol:${vol.vol},itemId:${vol.items.indexOf(p)}})">
      ${chip(p.genre)}
      <div class="bt">${p.title}</div>
      <div class="bm">वर्ष ${vol.volD} · अङ्क ${deva(vol.vol)} · पृष्ठ ${deva(p.page)} · खोल्नुहोस् ${icon('arrow-right')}</div>
    </button>`).join('');

  return `<div class="wrap fade">
  <div class="back-bar">
    <button class="back" onclick="go('volume',{vol:${vol.vol}})">${icon('arrow-left')} वर्ष ${vol.volD} अङ्कमा फर्कनुहोस्</button>
  </div>
  <div class="contrib">
    <aside class="az">
      <h2 class="deva-display">योगदानकर्ता</h2>
      <p class="hint">वर्ष ${vol.volD} · अङ्क ${deva(vol.vol)} का ${deva(names.length)} स्रष्टा। नाम छान्नुहोस् — तिनका सबै रचना मालाको धागोमा उनिएर देखिन्छन्।</p>
      <ul class="az-list">${azList}</ul>
    </aside>
    <section class="mala" aria-live="polite">
      <h3 class="who">${curName}</h3>
      <p class="who-pl">${pieces[0]?.place||''}</p>
      <p class="who-n">${deva(pieces.length)} रचना</p>
      <div class="thread">${beads}</div>
    </section>
  </div>
  </div>`;
}
