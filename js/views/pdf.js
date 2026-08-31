function viewPdfReader(){
  const vol = volByNum(S.vol) || VOLUMES[VOLUMES.length-1];
  const items = vol.items.filter(x=>!x.front);

  // Build author filter options
  const authors = [...new Set(items.map(x=>x.author))].sort((a,b)=>a.localeCompare(b,'hi'));
  const filterOpts = `<option value="">— सबै योगदानकर्ता —</option>`
    + authors.map(a=>`<option value="${a}">${a}</option>`).join('');

  // Build sidebar TOC (id="ptoc-{page}")
  let tocRows = '';
  // Build drawer TOC (id="dtoc-{page}")
  let drawerRows = '';
  const _pgOffset = vol.pageOffset||0;
  if(items.length){
    const genres = [...new Set(items.map(x=>x.genre))];
    genres.forEach(g => {
      tocRows += `<li class="pdf-tg">${g}</li>`;
      drawerRows += `<li class="pdf-tg">${g}</li>`;
      items.filter(x=>x.genre===g).forEach(it => {
        const row = (idPrefix) => `<li><button class="pdf-ti" id="${idPrefix}-${it.page}" data-pg="${it.page}"
          onclick="${idPrefix==='dtoc'?'pdfDrawerJump':'pdfJump'}(${it.page+_pgOffset})" oncontextmenu="return false">
          <div class="pdf-ti-body">
            <div class="pdf-ti-title">${it.title}</div>
            <div class="pdf-ti-auth">${it.author}${it.place?' · '+it.place:''}</div>
          </div>
          <span class="pdf-ti-pg">${deva(it.page)}</span>
        </button></li>`;
        tocRows += row('ptoc');
        drawerRows += row('dtoc');
      });
    });
  } else {
    const empty = `<li style="padding:18px 16px;font-size:14px;color:var(--soft)">
      यस अङ्कको विषय–सूची अझै थपिएको छैन।<br>पृष्ठ नेभिगेसन प्रयोग गर्नुहोस्।</li>`;
    tocRows = empty; drawerRows = empty;
  }

  const hasToc = items.length > 0;

  return `<div class="pdf-layout" id="pdf-layout">
    <nav class="pdf-sidebar" aria-label="अनुक्रमणिका">
      <div class="pdf-sb-head">
        <p class="pdf-sb-title deva-display">${vol.name}</p>
        <p class="pdf-sb-sub">वर्ष ${vol.volD} · अङ्क ${deva(vol.vol)} · ${vol.year}</p>
      </div>
      ${hasToc?`<div class="pdf-sb-filter">
        <select onchange="pdfFilterAuthor(this.value)" aria-label="लेखक अनुसार खोज्नुहोस्">${filterOpts}</select>
      </div>`:''}
      <ul class="pdf-toc" id="pdf-toc">${tocRows}</ul>
    </nav>

    <div class="pdf-main">
      <div class="pdf-bar">
        <button class="pdf-back" onclick="_pdfBack()">${icon('arrow-left')} ${S.pdfFrom&&S.pdfFrom.view==='allContributors'?'योगदानकर्ता':'अङ्क विवरण'}</button>
        <div class="pdf-crumb" id="pcrumb"></div>
        <div class="pdf-zoom">
          <button class="pdf-zbtn" id="pzout" onclick="pdfZoomOut()" title="सानो (−)">${icon('minus')}</button>
          <span class="pdf-zlabel" id="pzlbl">—</span>
          <button class="pdf-zbtn" id="pzin" onclick="pdfZoomIn()" title="ठूलो (+)">${icon('plus')}</button>
          <button class="pdf-zbtn pdf-fitbtn" onclick="pdfFit()" title="पृष्ठमा मिलाउनुहोस्">${icon('expand')} FIT</button>
        </div>
        <div class="pdf-sep" aria-hidden="true"></div>
        <button class="pdf-sbtoggle" onclick="pdfToggleSidebar()" title="अनुक्रमणिका देखाउनुहोस्/लुकाउनुहोस्">${icon('menu')} अनुक्रम</button>
        <button class="pdf-fullbtn" id="pfullbtn" onclick="pdfToggleFullpage()" title="पूर्ण पर्दा (F)">${icon('expand')}</button>
      </div>
      <div class="pdf-progress"><div class="pdf-progress-bar" id="pprogress"></div></div>
      <div class="pdf-canvas-outer">
        <button class="pdf-sidenav" id="pside-prev" onclick="pdfPrev()" disabled title="अघिल्लो पृष्ठ (←)" aria-label="अघिल्लो पृष्ठ">${icon('chevron-left')}</button>
        <div class="pdf-canvas-area" id="pca" oncontextmenu="return false">
          <div class="pdf-loading" id="ploading">
            <div class="pdf-spinner"></div>
            <span>पीडीएफ लोड हुँदैछ…</span>
          </div>
          <div class="pdf-flip-stage" id="pfstage">
            <div class="pdf-page-wrap" id="ppwrap" style="display:none">
              <canvas id="pcanvas" oncontextmenu="return false"></canvas>
            </div>
            <div class="pdf-page-wrap" id="ppwrap2" style="display:none">
              <canvas id="pcanvas2" oncontextmenu="return false"></canvas>
            </div>
          </div>
        </div>
        <button class="pdf-sidenav" id="pside-next" onclick="pdfNext()" disabled title="अर्को पृष्ठ (→)" aria-label="अर्को पृष्ठ">${icon('chevron-right')}</button>
      </div>
      <div class="pdf-bottom-bar">
        <button class="pdf-pgbtn" id="pprev" onclick="pdfPrev()" disabled title="अघिल्लो पृष्ठ (←)">${icon('chevron-left')}</button>
        <input class="pdf-pginput" id="ppg" type="number" min="1" value="1"
          onchange="pdfJump(+this.value)" onkeydown="if(event.key==='Enter')pdfJump(+this.value)"
          aria-label="पृष्ठ सङ्ख्या">
        <span class="pdf-pgtotal">/ <span id="ptotal">—</span></span>
        <button class="pdf-pgbtn" id="pnext" onclick="pdfNext()" disabled title="अर्को पृष्ठ (→)">${icon('chevron-right')}</button>
        <span class="pdf-bb-hint">← → तीर कुञ्जीहरू प्रयोग गर्नुहोस्</span>
      </div>
    </div>
  </div>

  <!-- Float nav (fullpage mode) -->
  <div class="pdf-float-nav" id="pdf-float-nav">
    <button class="pfn-btn" id="pfn-prev" onclick="pdfPrev()" disabled title="अघिल्लो पृष्ठ">${icon('chevron-left')}</button>
    <input class="pfn-input" id="pfn-pg" type="number" min="1" value="1"
      onchange="pdfJump(+this.value)" onkeydown="if(event.key==='Enter')pdfJump(+this.value)"
      aria-label="पृष्ठ सङ्ख्या">
    <span class="pfn-of">/ <span id="pfn-total">—</span></span>
    <button class="pfn-btn" id="pfn-next" onclick="pdfNext()" disabled title="अर्को पृष्ठ">${icon('chevron-right')}</button>
    <div class="pfn-sep"></div>
    <button class="pfn-btn pfn-zm" id="pfn-zout" onclick="pdfZoomOut()" title="सानो (−)">${icon('minus')}</button>
    <button class="pfn-btn pfn-zm" id="pfn-zin" onclick="pdfZoomIn()" title="ठूलो (+)">${icon('plus')}</button>
    <button class="pfn-fit" onclick="pdfFit()" title="पृष्ठ अनुसार">${icon('expand')} FIT</button>
    ${hasToc?`<div class="pfn-sep"></div><button class="pfn-toc-btn" id="pfn-toc-btn" onclick="pdfFullpageTocToggle()" title="अनुक्रमणिका लुकाउनुहोस्">${icon('menu')}<span class="pfn-toc-label"> लुकाउनुहोस्</span></button>`:''}
    <div class="pfn-sep"></div>
    <button class="pfn-exit" onclick="pdfToggleFullpage()" title="बाहिर निस्कनुहोस् (Esc)">${icon('x')}</button>
  </div>

  <!-- Slide-in TOC drawer (fullpage mode) -->
  <div class="pdf-toc-drawer" id="pdf-toc-drawer" aria-label="अनुक्रमणिका">
    <div class="pdf-drawer-head">
      <p class="pdf-drawer-title">${vol.name} — अनुक्रमणिका</p>
      <button class="pdf-drawer-close" onclick="pdfDrawerClose()" aria-label="बन्द गर्नुहोस्">${icon('x')}</button>
    </div>
    <ul class="pdf-toc" id="pdf-dtoc">${drawerRows}</ul>
  </div>
  <div class="pdf-drawer-overlay" id="pdf-drawer-overlay" onclick="pdfDrawerClose()"></div>`;
}

/* ── PDF.js loader (lazy, once) ── */
function _loadPdfJs(cb){
  if(window.pdfjsLib){ cb(); return; }
  const s=document.createElement('script');
  s.src='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
  s.onload=()=>{
    pdfjsLib.GlobalWorkerOptions.workerSrc=
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    cb();
  };
  s.onerror=()=>_pdfError('PDF.js लोड हुन सकेन।');
  document.head.appendChild(s);
}

function _initPdfReader(){
  const vol=volByNum(S.vol)||VOLUMES[VOLUMES.length-1];
  if(!vol.pdf) return;
  // Restore sidebar collapsed state
  if(_pdfSidebarHidden){
    const layout=document.getElementById('pdf-layout');
    if(layout) layout.classList.add('sb-hidden');
  }
  // Touch swipe: left=next, right=prev
  const pca=document.getElementById('pca');
  if(pca){
    let _tx=0,_ty=0;
    pca.addEventListener('touchstart',e=>{_tx=e.touches[0].clientX;_ty=e.touches[0].clientY;},{passive:true});
    pca.addEventListener('touchend',e=>{
      const dx=e.changedTouches[0].clientX-_tx;
      const dy=e.changedTouches[0].clientY-_ty;
      if(Math.abs(dx)>Math.abs(dy)&&Math.abs(dx)>60){dx<0?pdfNext():pdfPrev();}
    },{passive:true});
  }
  _loadPdfJs(()=>{
    // Re-use already-loaded doc for same volume
    if(_pdfForVol===vol.vol && _pdf){
      _pdfApplyTotal(); _pdfNoAnim=true; _renderPage(S.pdfPage||1); return;
    }
    // Fetch as ArrayBuffer so the real URL never appears in browser UI
    fetch(vol.pdf)
      .then(r=>{ if(!r.ok) throw new Error('fetch failed'); return r.arrayBuffer(); })
      .then(buf=>pdfjsLib.getDocument({data:buf}).promise)
      .then(doc=>{
        _pdf=doc; _pdfTotal=doc.numPages; _pdfForVol=vol.vol;
        _pdfApplyTotal();
        _pdfCanvas='a'; _pdfNoAnim=true;
        _renderPage(S.pdfPage||1);
      })
      .catch(()=>_pdfError('यो अङ्कको PDF हाल उपलब्ध छैन।'));
  });
}

function _pdfApplyTotal(){
  const el=document.getElementById('ptotal');
  if(el) el.textContent=deva(_pdfTotal);
  const fel=document.getElementById('pfn-total');
  if(fel) fel.textContent=deva(_pdfTotal);
  const fip=document.getElementById('pfn-pg');
  if(fip) fip.max=_pdfTotal;
  const sip=document.getElementById('ppg');
  if(sip) sip.max=_pdfTotal;
}

function _pdfError(msg){
  const el=document.getElementById('ploading');
  if(el) el.innerHTML=`<div class="pdf-err"><div class="ei">⚠</div>${msg}</div>`;
}

function _renderPage(num){
  if(!_pdf) return;
  if(_pdfRendering){ _pdfPending=num; return; }
  num=Math.max(1,Math.min(num,_pdfTotal));

  // Determine animation direction before updating S.pdfPage
  const prevNum=S.pdfPage;
  const doAnim=!_pdfNoAnim && _pdfTotal>0 && prevNum>0 && num!==prevNum;
  const dir=num>=prevNum?'fwd':'bwd';
  _pdfNoAnim=false;

  S.pdfPage=num;
  const pg=document.getElementById('ppg');
  const pb=document.getElementById('pprev');
  const nb=document.getElementById('pnext');
  if(pg) pg.value=num;
  if(pb) pb.disabled=num<=1;
  if(nb) nb.disabled=num>=_pdfTotal;
  const fpg=document.getElementById('pfn-pg');
  const fpb=document.getElementById('pfn-prev');
  const fnb=document.getElementById('pfn-next');
  if(fpg) fpg.value=num;
  if(fpb) fpb.disabled=num<=1;
  if(fnb) fnb.disabled=num>=_pdfTotal;
  const spb=document.getElementById('pside-prev');
  const snb=document.getElementById('pside-next');
  if(spb) spb.disabled=num<=1;
  if(snb) snb.disabled=num>=_pdfTotal;
  _pdfRendering=true;

  // Double-buffer: render new page to the inactive canvas
  const nextCv=doAnim?(_pdfCanvas==='a'?'b':'a'):_pdfCanvas;
  const canvasId=nextCv==='a'?'pcanvas':'pcanvas2';
  const wrapId  =nextCv==='a'?'ppwrap' :'ppwrap2';
  const oldWrapId=_pdfCanvas==='a'?'ppwrap':'ppwrap2';

  _pdf.getPage(num).then(page=>{
    // Compute scale
    const area=document.getElementById('pca');
    let sc=typeof _pdfZoom==='number'?_pdfZoom:1.5;
    if(_pdfZoom==='fit'&&area){
      const cs=getComputedStyle(area);
      const aw=area.clientWidth-parseFloat(cs.paddingLeft)-parseFloat(cs.paddingRight);
      const ah=area.clientHeight-parseFloat(cs.paddingTop)-parseFloat(cs.paddingBottom);
      const vp0=page.getViewport({scale:1});
      sc=Math.min(aw/vp0.width, ah/vp0.height, 2.5);
    }
    const vp=page.getViewport({scale:sc});
    // Render at device pixel ratio for crisp text on high-DPI screens
    const dpr=Math.min(window.devicePixelRatio||1,3);
    const vpHi=page.getViewport({scale:sc*dpr});
    const canvas=document.getElementById(canvasId);
    const wrap=document.getElementById(wrapId);
    const load=document.getElementById('ploading');
    if(!canvas){_pdfRendering=false;return;}
    canvas.width=vpHi.width; canvas.height=vpHi.height;
    canvas.style.width=vp.width+'px'; canvas.style.height=vp.height+'px';
    if(load) load.style.display='none';
    const zlbl=document.getElementById('pzlbl');
    if(zlbl) zlbl.textContent=Math.round(sc*100)+'%';
    page.render({canvasContext:canvas.getContext('2d'),viewport:vpHi}).promise.then(()=>{
      const ca=document.getElementById('pca');
      if(ca) ca.scrollTop=0;
      if(doAnim && wrap){
        // Cancel any in-progress animation cleanly
        if(_pdfAnimCleanup){ _pdfAnimCleanup(); _pdfAnimCleanup=null; }
        const oldWrap=document.getElementById(oldWrapId);
        if(oldWrap){
          const exitCls='pdf-turn-exit-'+dir;
          const exitAnim='pdf-exit-'+dir;
          // New page sits flat underneath; old page folds away to reveal it
          wrap.style.display='';
          wrap.style.zIndex='1';
          oldWrap.style.zIndex='2';
          void oldWrap.offsetWidth;
          oldWrap.classList.add(exitCls);
          if(ca) ca.style.overflow='hidden';
          let cancelled=false;
          _pdfAnimCleanup=()=>{
            cancelled=true;
            oldWrap.classList.remove(exitCls);
            oldWrap.style.display='none';
            oldWrap.style.zIndex='';
            wrap.style.display='';
            wrap.style.zIndex='';
            if(ca) ca.style.overflow='';
            _pdfAnimCleanup=null;
          };
          const onExitEnd=(e)=>{
            if(e.animationName!==exitAnim) return;
            oldWrap.removeEventListener('animationend',onExitEnd);
            if(cancelled) return;
            oldWrap.classList.remove(exitCls);
            oldWrap.style.display='none';
            oldWrap.style.zIndex='';
            wrap.style.zIndex='';
            if(ca) ca.style.overflow='';
            _pdfAnimCleanup=null;
          };
          oldWrap.addEventListener('animationend',onExitEnd);
        }
        _pdfCanvas=nextCv;
      } else {
        // No animation: just show new canvas, hide old if switching
        if(nextCv!==_pdfCanvas){
          const oldWrap=document.getElementById(oldWrapId);
          if(oldWrap) oldWrap.style.display='none';
        }
        if(wrap){ wrap.style.display=''; wrap.style.opacity='1'; }
        _pdfCanvas=nextCv;
      }
      const prog=document.getElementById('pprogress');
      if(prog&&_pdfTotal>0) prog.style.width=(num/_pdfTotal*100)+'%';
      _pdfRendering=false;
      if(_pdfPending!==null){const p=_pdfPending;_pdfPending=null;_renderPage(p);}
      _tocHighlight(num);
    });
  });
}

function _scrollTocEl(el, containerId){
  const container=document.getElementById(containerId);
  if(!el||!container) return;
  const eRect=el.getBoundingClientRect();
  const cRect=container.getBoundingClientRect();
  if(eRect.top<cRect.top||eRect.bottom>cRect.bottom){
    container.scrollTop+=eRect.top-cRect.top-(cRect.height-eRect.height)/2;
  }
}

function _tocHighlight(pageNum){
  const vol=volByNum(S.vol);
  if(!vol||!vol.items.length) return;
  const items=vol.items.filter(x=>!x.front);
  const offset=vol.pageOffset||0;
  let cur=null;
  for(let i=items.length-1;i>=0;i--){ if(items[i].page+offset<=pageNum){cur=items[i];break;} }
  const crumb=document.getElementById('pcrumb');
  if(crumb) crumb.innerHTML=cur
    ?`<span class="pdf-crumb-genre">${cur.genre}</span>${cur.title}`:'';
  document.querySelectorAll('.pdf-ti').forEach(el=>el.setAttribute('aria-current','false'));
  if(cur){
    const el=document.getElementById(`ptoc-${cur.page}`);
    if(el){ el.setAttribute('aria-current','true'); _scrollTocEl(el,'pdf-toc'); }
    const del=document.getElementById(`dtoc-${cur.page}`);
    if(del){
      del.setAttribute('aria-current','true');
      if(_pdfDrawerOpen) _scrollTocEl(del,'pdf-dtoc');
    }
  }
}

/* ── Public PDF controls ── */
function _pdfBack(){
  const f = S.pdfFrom;
  if(f && f.view==='allContributors') go('allContributors',{authorIdx:f.authorIdx});
  else if(f && f.view==='contributors') go('contributors',{vol:f.vol,authorIdx:f.authorIdx});
  else go('volume',{vol:S.vol});
}
function pdfJump(n){ if(!isNaN(n)) _renderPage(n); }
function pdfPrev(){ if(S.pdfPage>1) _renderPage(S.pdfPage-1); }
function pdfNext(){ if(S.pdfPage<_pdfTotal) _renderPage(S.pdfPage+1); }
function _updateZoomBtns(){
  const atMin=typeof _pdfZoom==='number'&&_pdfZoom<=.4;
  const atMax=typeof _pdfZoom==='number'&&_pdfZoom>=3;
  ['pzout','pfn-zout'].forEach(id=>{const b=document.getElementById(id);if(b)b.disabled=atMin;});
  ['pzin','pfn-zin'].forEach(id=>{const b=document.getElementById(id);if(b)b.disabled=atMax;});
}
function pdfZoomIn(){ _pdfZoom=typeof _pdfZoom==='number'?Math.min(_pdfZoom+.2,3):1.7; _updateZoomBtns(); _pdfNoAnim=true; _renderPage(S.pdfPage); }
function pdfZoomOut(){ _pdfZoom=typeof _pdfZoom==='number'?Math.max(_pdfZoom-.2,.4):1.0; _updateZoomBtns(); _pdfNoAnim=true; _renderPage(S.pdfPage); }
function pdfFit(){ _pdfZoom='fit'; _updateZoomBtns(); _pdfNoAnim=true; _renderPage(S.pdfPage); }
function pdfToggleSidebar(){
  _pdfSidebarHidden=!_pdfSidebarHidden;
  const layout=document.getElementById('pdf-layout');
  if(layout) layout.classList.toggle('sb-hidden',_pdfSidebarHidden);
  if(_pdfZoom==='fit') setTimeout(()=>{_pdfNoAnim=true;_renderPage(S.pdfPage);},50);
}

function pdfToggleFullpage(){
  _pdfFullpage=!_pdfFullpage;
  const layout=document.getElementById('pdf-layout');
  if(layout) layout.classList.toggle('fullpage',_pdfFullpage);
  // Always restore TOC to visible when entering or leaving fullpage
  _pdfSidebarHidden=false;
  if(layout) layout.classList.remove('sb-hidden');
  const btn=document.getElementById('pfn-toc-btn');
  if(btn){const lbl=btn.querySelector('.pfn-toc-label');
    btn.title='अनुक्रमणिका लुकाउनुहोस्';if(lbl)lbl.textContent=' लुकाउनुहोस्';}
  const nav=document.getElementById('pdf-float-nav');
  if(nav) nav.classList.toggle('visible',_pdfFullpage);
  const fbtn=document.getElementById('pfullbtn');
  if(fbtn){ fbtn.title=_pdfFullpage?'सामान्य दृश्य (F)':'पूर्ण पर्दा (F)'; fbtn.innerHTML=icon(_pdfFullpage?'compress':'expand'); }
  document.body.style.overflow=_pdfFullpage?'hidden':'';
  if(_pdfFullpage){ _pdfZoom='fit'; setTimeout(()=>_renderPage(S.pdfPage),50); }
  else _renderPage(S.pdfPage);
}
function pdfFullpageTocToggle(){
  if(window.innerWidth>800){
    _pdfSidebarHidden=!_pdfSidebarHidden;
    const layout=document.getElementById('pdf-layout');
    if(layout) layout.classList.toggle('sb-hidden',_pdfSidebarHidden);
    const btn=document.getElementById('pfn-toc-btn');
    if(btn){
      const lbl=btn.querySelector('.pfn-toc-label');
      if(_pdfSidebarHidden){
        btn.title='अनुक्रमणिका देखाउनुहोस्';
        if(lbl) lbl.textContent=' अनुक्रम';
      } else {
        btn.title='अनुक्रमणिका लुकाउनुहोस्';
        if(lbl) lbl.textContent=' लुकाउनुहोस्';
      }
    }
    if(_pdfZoom==='fit') setTimeout(()=>{_pdfNoAnim=true;_renderPage(S.pdfPage);},50);
  } else {
    pdfToggleDrawer();
  }
}
function pdfDrawerOpen(){
  _pdfDrawerOpen=true;
  const d=document.getElementById('pdf-toc-drawer');
  const o=document.getElementById('pdf-drawer-overlay');
  if(d) d.classList.add('open');
  if(o) o.classList.add('open');
  // Scroll current article into view (centred so user can see items above/below)
  setTimeout(()=>{
    const active=d&&d.querySelector('.pdf-ti[aria-current="true"]');
    if(active) active.scrollIntoView({block:'center',behavior:'smooth'});
  },50);
}
function pdfDrawerClose(){
  _pdfDrawerOpen=false;
  const d=document.getElementById('pdf-toc-drawer');
  const o=document.getElementById('pdf-drawer-overlay');
  if(d) d.classList.remove('open');
  if(o) o.classList.remove('open');
}
function pdfToggleDrawer(){ _pdfDrawerOpen?pdfDrawerClose():pdfDrawerOpen(); }
function pdfDrawerJump(n){ pdfDrawerClose(); pdfJump(n); }

function pdfFilterAuthor(author){
  const items=document.querySelectorAll('.pdf-ti');
  items.forEach(btn=>{
    const li=btn.closest('li');
    if(!li) return;
    if(!author){ li.style.display=''; return; }
    const auth=btn.querySelector('.pdf-ti-auth');
    li.style.display=(auth&&auth.textContent.startsWith(author))?'':'none';
  });
  // Also hide/show genre group headers
  document.querySelectorAll('.pdf-tg').forEach(tg=>{
    const next=tg.nextElementSibling;
    // show group label if at least one sibling li is visible
    let el=tg.nextElementSibling, vis=false;
    while(el&&!el.classList.contains('pdf-tg')){
      if(el.style.display!=='none') vis=true;
      el=el.nextElementSibling;
    }
    tg.style.display=vis?'':'none';
  });
}
