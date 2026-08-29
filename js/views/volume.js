function viewVolume(){
  const vol = volByNum(S.vol) || VOLUMES[VOLUMES.length-1];
  const items = vol.items;
  const hasArticles = items.length>0;

  const coloHtml = vol.editors ? `<div class="colophon">
      <div class="colo-row"><span class="colo-key">मिति</span><span class="colo-val">${vol.date} — ${vol.bday}</span></div>
      <div class="colo-row"><span class="colo-key">कार्यकारी सम्पादक</span><span class="colo-val">${vol.editors}</span></div>
      ${vol.publishers?`<div class="colo-row"><span class="colo-key">प्रकाशक</span><span class="colo-val">${vol.publishers}</span></div>`:''}
      ${vol.patrons?`<div class="colo-row"><span class="colo-key">संरक्षक</span><span class="colo-val">${vol.patrons}</span></div>`:''}
      ${vol.coverDesigner?`<div class="colo-row"><span class="colo-key">आवरण डिजाइन</span><span class="colo-val">${vol.coverDesigner}</span></div>`:''}
      ${vol.layoutDesigner?`<div class="colo-row"><span class="colo-key">लेआउट डिजाइन</span><span class="colo-val">${vol.layoutDesigner}</span></div>`:''}
      ${vol.web?`<div class="colo-row"><span class="colo-key">वेब संयोजक</span><span class="colo-val">${vol.web}</span></div>`:''}
      ${vol.price?`<div class="colo-row"><span class="colo-key">मूल्य</span><span class="colo-val">${vol.price}</span></div>`:''}
    </div>` : '';

  if(hasArticles){
    const m = byAuthor(items);
    const pieceCount = items.filter(x=>!x.front).length;
    const contribCount = Object.keys(m).length;
    const it = items[S.itemId] || items[0];
    const prev = S.itemId>0 ? items[S.itemId-1] : null;
    const next = S.itemId<items.length-1 ? items[S.itemId+1] : null;

    const tocList = items.map((x,i)=>`
      <li><button class="ti" aria-current="${i===S.itemId}" onclick="go('volume',{vol:${vol.vol},itemId:${i}})">
        <span class="pg">${x.front?'•':deva(x.page)}</span>
        <span>
          <span class="cw">${chip(x.genre)}<span class="tt">${x.title}</span></span>
          ${!x.front?`<span class="au">${x.author}${x.place?' — '+x.place:''}</span>`:''}
        </span>
      </button></li>`).join('');

    const volHash = `#v${vol.vol}`;
    const artHash = `#v${vol.vol}/a${S.itemId}`;
    const artContent = `<div class="art-head">
        <span class="art-pg">पृष्ठ ${deva(it.page)}</span>
        ${chip(it.genre)}
        <h1 class="art-title">${it.title}${!it.front?`<a href="${artHash}" class="art-perma" onclick="copyPermalink(event,'${artHash}')" title="रचनाको पर्मालिङ्क">${icon('link')}</a>`:''}</h1>
        ${!it.front?`<div class="art-by"><b>${it.author}</b></div><div class="art-place">${it.place}</div>`:''}
      </div>
      <div class="pdf-view">
        <div class="pdf-icon">${icon('file-pdf')}</div>
        <p class="pdf-note">यो रचना मूल अङ्कको <b>पृष्ठ ${deva(it.page)}</b> बाट सुरु हुन्छ। पूरा पाठ पढ्न PDF रिडरमा खोल्नुहोस्।</p>
        <button class="pdfbtn" onclick="go('pdf',{vol:${vol.vol},pdfPage:${it.page+(vol.pageOffset||0)}})">PDF रिडरमा खोल्नुहोस् — पृष्ठ ${deva(it.page)} ${icon('arrow-right')}</button>
      </div>
      <div class="art-nav">
        <button class="art-navbtn" ${prev?'':'disabled'} onclick="go('volume',{vol:${vol.vol},itemId:${S.itemId-1}})">
          ${icon('chevron-left')}<span class="ant">${prev?prev.title:''}</span>
        </button>
        <button class="art-navbtn next" ${next?'':'disabled'} onclick="go('volume',{vol:${vol.vol},itemId:${S.itemId+1}})">
          <span class="ant">${next?next.title:''}</span>${icon('chevron-right')}
        </button>
      </div>`;

    return `<div class="wrap fade">
    <div class="back-bar"><button class="back" onclick="go('shelf')">${icon('arrow-left')} सबै अङ्क</button></div>
    <div class="reader">
      <aside class="toc">
        <div class="toc-head">
          <div class="nm-wrap">
            <div class="yr deva-display">${vol.name}</div>
            <a href="${volHash}" class="perma" onclick="copyPermalink(event,'${volHash}')" title="यस अङ्कको पर्मालिङ्क">${icon('link')}</a>
          </div>
          <div class="vr">वर्ष ${vol.volD} · अङ्क ${deva(vol.vol)} · ${vol.year}</div>
          <div class="meta">${deva(pieceCount)} रचना · ${deva(contribCount)} योगदानकर्ता${vol.pages?` · ${deva(vol.pages)} पृष्ठ`:''}</div>
        </div>
        <div class="toc-actions">
          <button class="pdfbtn" style="font-size:13px;padding:8px 16px" onclick="go('pdf',{vol:${vol.vol},pdfPage:1})">PDF पढ्नुहोस् ${icon('arrow-right')}</button>
        </div>
        <div class="toc-list-section">
          <div class="toc-label">अनुक्रमणिका</div>
          <ul class="toc-list">${tocList}</ul>
        </div>
      </aside>
      <article class="page" aria-live="polite">${artContent}</article>
      ${coloHtml ? `<div class="reader-colo">${coloHtml}</div>` : ''}
    </div>
    </div>`;
  }

  /* ── No article data yet ── */
  const ph = placeholderSrc(vol);
  return `<div class="wrap fade">
  <div class="back-bar"><button class="back" onclick="go('shelf')">${icon('arrow-left')} सबै अङ्क</button></div>
  <div class="no-articles">
    <div class="na-cover">${coverImg(vol,`style="width:100%;display:block;border:1px solid var(--line);box-shadow:0 8px 20px -12px rgba(26,42,58,.40)"`)}</div>
    <div class="na-body">
      <div class="na-label">वर्ष ${vol.volD} · अङ्क ${deva(vol.vol)} · ${vol.date}</div>
      <h2 class="deva-display">${vol.name}${vol.centenary?'<span class="badge badge-centenary" style="font-size:14px">शताब्दी</span>':''}</h2>
      <p class="na-label" style="margin-top:2px">${vol.bday}</p>
      <p class="na-desc">भगवान् श्री सत्य साई बाबाका भक्तहरूका रचनाहरूको वार्षिक स्मारिका — साईदेखि साईसम्म, पुट्टपर्ती।</p>
      <div class="btn-row">
        <button class="pdfbtn" onclick="go('pdf',{vol:${vol.vol},pdfPage:1})">PDF पढ्नुहोस् ${icon('arrow-right')}</button>
      </div>
      ${coloHtml}
      <div class="na-soon">
        <span class="om deva-display">ॐ</span>
        <div class="na-soon-text">
          <h3>अनुक्रमणिका शीघ्र</h3>
          <p>यस अङ्कका रचनाहरूको सूची र योगदानकर्ताहरूको विवरण छिट्टै थपिनेछ।</p>
        </div>
      </div>
    </div>
  </div>
  </div>`;
}
