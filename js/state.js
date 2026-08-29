/* ════════════════════════════════════════════════════
   STATE
   ════════════════════════════════════════════════════ */
let S = {view:'shelf', vol:10, itemId:0, authorIdx:0, showColophon:false, pdfPage:1, pdfFrom:null};

/* PDF.js runtime state (lives outside S — heavy objects, not serialisable) */
let _pdf=null, _pdfRendering=false, _pdfPending=null;
let _pdfZoom='fit', _pdfTotal=0, _pdfForVol=null;
let _pdfFullpage=false, _pdfDrawerOpen=false, _pdfSidebarHidden=false;
/* page-turn double-buffer: 'a'=#ppwrap/#pcanvas, 'b'=#ppwrap2/#pcanvas2 */
let _pdfCanvas='a', _pdfNoAnim=false;
let _pdfAnimCleanup=null; // pending animation cleanup fn

/* ════════════════════════════════════════════════════
   ROUTING
   ════════════════════════════════════════════════════ */
function go(view, params){
  const prevView = S.view, prevVol = S.vol;
  // Remove PDF keyboard listener when leaving pdf view; restore body scroll
  if(S.view==='pdf' && view!=='pdf'){
    document.removeEventListener('keydown',_pdfKey);
    document.body.style.overflow='';
    if(_pdfAnimCleanup){ _pdfAnimCleanup(); _pdfAnimCleanup=null; }
  }
  Object.assign(S, {view}, params||{});
  if(view==='shelf') S.showColophon=false;
  if(view==='volume'){
    if(!('itemId' in (params||{}))) S.itemId=0;
    S.showColophon=false;
  }
  if(view==='pdf'){
    if(prevView !== 'pdf') S.pdfFrom = {view:prevView, vol:prevVol, authorIdx:S.authorIdx};
    if(!('pdfPage' in (params||{}))) S.pdfPage=1;
    _pdfFullpage=false; _pdfDrawerOpen=false;
    document.addEventListener('keydown',_pdfKey);
    window.scrollTo({top:0, behavior:'instant'});
  }
  if(view==='contributors'){
    const vol = volByNum(S.vol);
    if(vol && vol.items.length){
      const m = byAuthor(vol.items);
      const names = sortedNames(m);
      if(S.authorIdx >= names.length) S.authorIdx=0;
    }
  }
  if(view==='allContributors'){
    const m = allByAuthor();
    const names = sortedNames(m);
    if(S.authorIdx >= names.length) S.authorIdx=0;
  }
  _updateNav();
  render();
  if(view!=='pdf'){
    if(view==='volume' && prevView==='volume' && S.vol===prevVol){
      // next/prev within same volume: scroll article into view
      const art = document.querySelector('article.page');
      if(art) art.scrollIntoView({behavior:'smooth', block:'start'});
    } else {
      window.scrollTo({top:0, behavior:'smooth'});
    }
  }
  if(view==='contributors'||view==='allContributors'){
    setTimeout(()=>_scrollListToActive('smooth'), 0);
  }
  const h = _stateHash();
  if(location.hash !== h) history.pushState(null,'',h);
}

function goContrib(){
  // Find the most recent volume with article data
  const vol = [...VOLUMES].reverse().find(v=>v.items.length>0) || VOLUMES[VOLUMES.length-1];
  go('contributors',{vol:vol.vol, authorIdx:0});
}

function selectAuthor(idx){
  S.authorIdx = idx;
  render();
  const h = _stateHash();
  if(location.hash !== h) history.pushState(null,'',h);
  // restore list scroll so the active item stays in view after innerHTML reset
  _scrollListToActive('instant');
}

/* Scroll the sidebar list so the active author button is in view.
   Called with 'instant' on click (no jarring animation) and 'smooth' on
   URL/back-forward navigation where the list may open mid-way. */
function _scrollListToActive(behavior){
  const activeBtn=document.querySelector('.azi[aria-current="true"]');
  if(activeBtn) activeBtn.scrollIntoView({block:'nearest',behavior:behavior||'smooth'});
}

/* Full contrib scroll: list + mobile panel. Used only on URL navigation. */
function _scrollActiveContrib(){
  _scrollListToActive('smooth');
  if(window.innerWidth<=960){
    const panel=document.querySelector('.mala,.cpro-panel');
    if(panel) panel.scrollIntoView({behavior:'smooth',block:'start'});
  }
}

function _updateNav(){
  const activeView = (S.view==='shelf'||S.view==='volume'||S.view==='pdf') ? 'shelf' :
                     S.view==='journey' ? 'journey' :
                     S.view==='contact' ? 'contact' : 'allContributors';
  document.querySelectorAll('.nav-tab').forEach(btn=>{
    if(btn.dataset.view===activeView) btn.setAttribute('aria-current','true');
    else btn.removeAttribute('aria-current');
  });
}

/* ════════════════════════════════════════════════════
   HASH ROUTING
   ════════════════════════════════════════════════════ */
function _stateHash(){
  const v = S.vol;
  if(S.view==='shelf') return '#shelf';
  if(S.view==='volume') return S.itemId>0 ? `#v${v}/a${S.itemId}` : `#v${v}`;
  if(S.view==='contributors') return S.authorIdx>0 ? `#contrib/${v}/i${S.authorIdx}` : `#contrib/${v}`;
  if(S.view==='pdf') return S.pdfPage>1 ? `#pdf/${v}/p${S.pdfPage}` : `#pdf/${v}`;
  if(S.view==='allContributors') return S.authorIdx>0 ? `#contributors/i${S.authorIdx}` : '#contributors';
  if(S.view==='journey') return '#journey';
  if(S.view==='contact') return '#contact';
  return '#shelf';
}

function _parseHash(){
  const h = decodeURIComponent(location.hash.replace(/^#/,''));
  if(!h || h==='shelf') return {view:'shelf'};
  const parts = h.split('/');
  if(parts[0].match(/^v\d+$/)){
    const vol = parseInt(parts[0].slice(1));
    if(parts[1] && parts[1].match(/^a\d+$/))
      return {view:'volume', vol, itemId:parseInt(parts[1].slice(1))};
    return {view:'volume', vol};
  }
  if(parts[0]==='contrib'){
    const vol = parseInt(parts[1]);
    if(!isNaN(vol)){
      const authorIdx = parts[2]&&parts[2].match(/^i\d+$/) ? parseInt(parts[2].slice(1)) : 0;
      return {view:'contributors', vol, authorIdx};
    }
    return {view:'contributors'};
  }
  if(parts[0]==='pdf'){
    const vol = parseInt(parts[1]);
    const pdfPage = parts[2]&&parts[2].match(/^p\d+$/) ? parseInt(parts[2].slice(1)) : 1;
    return {view:'pdf', vol, pdfPage};
  }
  if(parts[0]==='contributors'){
    const authorIdx = parts[1]&&parts[1].match(/^i\d+$/) ? parseInt(parts[1].slice(1)) : 0;
    return {view:'allContributors', authorIdx};
  }
  if(parts[0]==='journey') return {view:'journey'};
  if(parts[0]==='contact') return {view:'contact'};
  return {view:'shelf'};
}

/* ════════════════════════════════════════════════════
   PERMALINK COPY
   ════════════════════════════════════════════════════ */
async function copyPermalink(e, hash){
  e.preventDefault();
  const url = location.origin + location.pathname + hash;
  const btn = e.currentTarget;
  try {
    await navigator.clipboard.writeText(url);
    const orig = btn.innerHTML;
    btn.innerHTML = icon('check');
    btn.classList.add('perma-copied');
    setTimeout(()=>{ btn.innerHTML=orig; btn.classList.remove('perma-copied'); }, 1600);
  } catch(_){}
}
function _volKey(e){
  if(e.target.tagName==='INPUT'||e.target.tagName==='SELECT'||e.target.tagName==='TEXTAREA') return;
  const items=(volByNum(S.vol)||{}).items||[];
  if(!items.length) return;
  if(e.key==='ArrowLeft'&&S.itemId>0){e.preventDefault();go('volume',{vol:S.vol,itemId:S.itemId-1});}
  else if(e.key==='ArrowRight'&&S.itemId<items.length-1){e.preventDefault();go('volume',{vol:S.vol,itemId:S.itemId+1});}
}

function _pdfKey(e){
  if(['ArrowLeft','ArrowUp','PageUp'].includes(e.key)){ e.preventDefault(); pdfPrev(); }
  if(['ArrowRight','ArrowDown','PageDown'].includes(e.key)){ e.preventDefault(); pdfNext(); }
  if(e.key==='Home'){ e.preventDefault(); pdfJump(1); }
  if(e.key==='End'){ e.preventDefault(); pdfJump(_pdfTotal); }
  if(e.key==='Escape'){
    e.preventDefault();
    if(_pdfDrawerOpen){ pdfDrawerClose(); }
    else if(_pdfFullpage){ pdfToggleFullpage(); }
  }
  if(e.key==='f'||e.key==='F'){ e.preventDefault(); pdfToggleFullpage(); }
}

/* ════════════════════════════════════════════════════
   RENDER
   ════════════════════════════════════════════════════ */
function render(){
  document.getElementById('app').innerHTML =
    S.view==='shelf' ? viewShelf() :
    S.view==='volume' ? viewVolume() :
    S.view==='pdf' ? viewPdfReader() :
    S.view==='journey' ? viewJourney() :
    S.view==='contact' ? viewContact() :
    S.view==='allContributors' ? viewAllContributors() :
    viewContributors();
  if(S.view==='pdf'){ setTimeout(_initPdfReader, 0); document.body.classList.add('in-pdf'); }
  else document.body.classList.remove('in-pdf');
}

/* ════════════════════════════════════════════════════
   INIT — hash routing
   ════════════════════════════════════════════════════ */
function _applyParsed(parsed){
  const prev = S.view;
  if(prev==='pdf' && parsed.view!=='pdf'){
    document.removeEventListener('keydown',_pdfKey);
    document.body.style.overflow='';
    document.body.classList.remove('in-pdf');
  }
  if(parsed.view==='pdf' && prev!=='pdf'){
    _pdfFullpage=false; _pdfDrawerOpen=false;
    document.addEventListener('keydown',_pdfKey);
    window.scrollTo({top:0, behavior:'instant'});
    document.body.classList.add('in-pdf');
  }
  if(prev==='volume' && parsed.view!=='volume') document.removeEventListener('keydown',_volKey);
  if(parsed.view==='volume' && prev!=='volume') document.addEventListener('keydown',_volKey);
  if(parsed.view==='volume' && !('itemId' in parsed)) parsed.itemId=0;
  if(parsed.view==='shelf') parsed.showColophon=false;
  Object.assign(S, parsed);
  _updateNav();
  render();
  if(parsed.view==='volume'){
    const art = document.querySelector('article.page');
    if(art) art.scrollIntoView({behavior:'smooth', block:'start'});
    else window.scrollTo({top:0, behavior:'smooth'});
  } else if(parsed.view!=='pdf'){
    window.scrollTo({top:0, behavior:'smooth'});
  }
  if(parsed.view==='contributors'||parsed.view==='allContributors'){
    setTimeout(_scrollActiveContrib, 0);
  }
}

window.addEventListener('popstate', function(){ _applyParsed(_parseHash()); });

function _initFromHash(){
  const parsed = _parseHash();
  _applyParsed(parsed);
  history.replaceState(null,'',_stateHash());
}

_initFromHash();
