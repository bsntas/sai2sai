const CONTACT_ENDPOINT = 'https://formspree.io/f/xljedpre';

function viewContact(){
  const a = Math.floor(Math.random()*8)+2;
  const b = Math.floor(Math.random()*8)+1;
  const ans = a + b;
  return `<div class="wrap fade">
  <div class="contact-wrap">
    <div class="contact-hero">
      <p class="kicker">सम्पर्क</p>
      <h1>हामीसँग सम्पर्क<br>गर्नुहोस्</h1>
      <p class="lead">लेख, कविता, अनुभव वा अन्य सन्देश पठाउनुहोस्। हामी यथासक्य छिटो जवाफ दिने प्रयास गर्नेछौं।</p>
    </div>
    <div class="contact-card" id="cf-wrap">
      <form id="cf" onsubmit="submitContact(event,${ans})" novalidate>
        <input type="text" name="_honey" style="display:none;position:absolute;left:-9999px" tabindex="-1" autocomplete="off" aria-hidden="true">
        <div class="cf-field">
          <label class="cf-label" for="cf-subj">विषय<span class="cf-req">*</span></label>
          <input class="cf-inp" type="text" id="cf-subj" name="subject" required
            placeholder="लेखको शीर्षक वा सन्देशको विषय">
        </div>
        <div class="cf-field">
          <label class="cf-label" for="cf-body">सन्देश<span class="cf-req">*</span></label>
          <textarea class="cf-ta" id="cf-body" name="message" required
            placeholder="यहाँ आफ्नो सन्देश लेख्नुहोस्…"></textarea>
        </div>
        <div class="cf-field">
          <label class="cf-label" for="cf-email">तपाईंको इमेल<span class="cf-req">*</span></label>
          <input class="cf-inp" type="email" id="cf-email" name="email" required
            placeholder="your@email.com" autocomplete="email">
          <p class="cf-hint">हामी यही इमेलमा जवाफ दिनेछौं।</p>
        </div>
        <div class="cf-field">
          <label class="cf-label">स्प्याम जाँच<span class="cf-req">*</span></label>
          <div class="cf-math">
            <span class="cf-math-q">${deva(a)} + ${deva(b)} = ?</span>
            <input class="cf-inp" type="number" name="_math" id="cf-math" required
              placeholder="उत्तर" min="1" max="25" inputmode="numeric">
          </div>
        </div>
        <div id="cf-err" class="cf-err" hidden></div>
        <button type="submit" class="btn cf-submit" id="cf-btn">पठाउनुहोस् →</button>
        <div class="cf-note">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          तपाईंको सन्देश सम्पादक मण्डलसम्म पुग्नेछ। प्रकाशनसम्बन्धी जुनसुकै कुरा जान्न चाहनुभए पनि सम्पर्क गर्नुहोस्।
        </div>
      </form>
    </div>
  </div>
</div>`;
}

async function submitContact(e, expectedAns){
  e.preventDefault();
  const form = e.target;
  const errEl = document.getElementById('cf-err');
  const btn   = document.getElementById('cf-btn');

  // Honeypot: bots fill hidden field, humans leave it empty
  if(form._honey && form._honey.value) return;

  // Math CAPTCHA
  const mathVal = parseInt(form._math.value, 10);
  if(isNaN(mathVal) || mathVal !== expectedAns){
    errEl.textContent = 'स्प्याम जाँच गलत छ। कृपया पुनः प्रयास गर्नुहोस्।';
    errEl.hidden = false;
    form._math.focus();
    return;
  }

  errEl.hidden = true;
  btn.disabled = true;
  btn.textContent = 'पठाउँदै…';

  const data = new FormData();
  data.append('email', form.email.value.trim());
  data.append('_subject', 'sai2sai.in — ' + form.subject.value.trim());
  data.append('subject', form.subject.value.trim());
  data.append('message', form.message.value.trim());

  try {
    const res = await fetch(CONTACT_ENDPOINT, {
      method: 'POST', body: data, headers: {'Accept': 'application/json'}
    });
    if(res.ok){
      document.getElementById('cf-wrap').innerHTML = `
        <div class="cf-success">
          <div class="cf-success-icon">🙏</div>
          <h2>धन्यवाद!</h2>
          <p>तपाईंको सन्देश सफलतापूर्वक पठाइयो। हामी छिटै जवाफ दिनेछौं।</p>
          <button class="btn" onclick="go('shelf')">गृहपृष्ठमा फर्कनुहोस्</button>
        </div>`;
    } else {
      const json = await res.json().catch(()=>({}));
      throw new Error((json.errors||[]).map(x=>x.message).join(', ') || 'submit failed');
    }
  } catch(_){
    errEl.textContent = 'सन्देश पठाउन सकिएन। कृपया केही समयपछि पुनः प्रयास गर्नुहोस्।';
    errEl.hidden = false;
    btn.disabled = false;
    btn.textContent = 'पठाउनुहोस् →';
  }
}
