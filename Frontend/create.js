
/* ── State ─────────────────────────────── */
let currentStep = 1;
const TOTAL_STEPS = 5;
const formData = {
  fullName: '', dob: '', pob: '', height: '', complexion: '',
  religion: '', caste: '', subCaste: '', manglik: '', maritalStatus: 'Never Married',
  education: '', college: '', occupation: '', company: '', income: '',
  fatherName: '', fatherOcc: '', motherName: '', motherOcc: '',
  brothers: '', sisters: '', familyType: '', familyValues: '',
  phone: '', email: '', address: '',
  symbol: 'ॐ', template: 1,
  presetPhoto: '',              
  confidentialFields: [],
};

// Payment token (set after successful Razorpay payment)
let paymentToken = '';

/* ── Template Catalogue (mirrors backend) ─ */
const ALL_TEMPLATES = [
  { id:1,  name:'Classic Ivory',   price:0,  tier:'free',     desc:'Timeless black & white'           },
  { id:2,  name:'Warm Minimal',    price:0,  tier:'free',     desc:'Clean gray minimalist'             },
  { id:3,  name:'Saffron Sunrise', price:21, tier:'basic',    desc:'Vibrant saffron & warm tones'      },
  { id:4,  name:'Rose Garden',     price:21, tier:'basic',    desc:'Elegant rose & feminine accents'   },
  { id:5,  name:'Maroon Royal',    price:51, tier:'standard', desc:'Rich maroon with gold borders'     },
  { id:6,  name:'Navy Prestige',   price:51, tier:'standard', desc:'Formal navy with gold accents'     },
  { id:7,  name:'Heritage Grand',  price:99, tier:'premium',  desc:'Ornate mandala-inspired luxury'    },
  { id:8,  name:'Emerald Luxe',    price:99, tier:'premium',  desc:'Rich forest green with gold trim'  },
  { id:9,  name:'Indigo Opulent',  price:99, tier:'premium',  desc:'Contemporary art-deco indigo'      },
  { id:10, name:'Midnight Bloom',  price:99, tier:'premium',  desc:'Dramatic dark blue with rose gold' },
];
const SYMBOLS = [
  { sym: '🕉', label: 'OM',           unicode: 'ॐ',          type: 'emoji' },
  { sym: '🪔', label: 'Diya',         unicode: '🪔',          type: 'emoji' },
  { sym: '✝', label: 'Cross',         unicode: '✝',           type: 'emoji' },
  { sym: '☪', label: 'Crescent',      unicode: '☪',           type: 'emoji' },
  { sym: '✡', label: 'Star of David', unicode: '✡',           type: 'emoji' },
  { sym: '☸', label: 'Dharmachakra',  unicode: '☸',           type: 'emoji' },
  { sym: '🔱', label: 'Trishul',       unicode: '🔱',          type: 'emoji' },
  { sym: '🕊', label: 'Dove',          unicode: '🕊',          type: 'emoji' },
];

/* ── Confidential Helper ──────────────────── */
function isConf(key) {
  return formData.confidentialFields.includes(key);
}

function toggleConfidential(key) {
  const idx = formData.confidentialFields.indexOf(key);
  if (idx === -1) {
    formData.confidentialFields.push(key);
  } else {
    formData.confidentialFields.splice(idx, 1);
  }
  renderStep();
}

function confBtn(key) {
  const on = isConf(key);
  return `<button type="button"
    class="conf-toggle ${on ? 'active' : ''}"
    onclick="toggleConfidential('${key}')"
    title="${on ? 'Click to un-mark confidential' : 'Mark as Confidential / Skip'}"
  >${on ? '🔓 Show' : '🔒 Skip'}</button>`;
}

function fieldWrap(key, labelHtml, inputHtml) {
  const on = isConf(key);
  return `
    <div class="form-field-wrap ${on ? 'field-confidential' : ''}">
      <div class="flex items-center justify-between mb-1">
        <label class="form-label mb-0">${labelHtml}</label>
        ${confBtn(key)}
      </div>
      ${on
        ? `<div class="conf-placeholder">🔒 Will appear as "Confidential" in biodata</div>`
        : inputHtml
      }
    </div>
  `;
}

/* ── Step Templates ───────────────────────── */
const STEPS = {
  1: () => `
    <div class="max-w-xl">
      <h2 class="font-['Cormorant_Garamond'] text-3xl font-bold text-[#f5f0ea] mb-2">Personal Details</h2>
      <p class="font-['DM_Sans'] text-sm text-[#8a7b72] mb-8">Fill in your details — use the 🔒 Skip button on any field you want to keep private.</p>

      <div class="space-y-5">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${fieldWrap('fullName', 'Full Name *',
            `<input class="form-input" type="text" placeholder="e.g. Arjun Sharma" data-key="fullName" value="${formData.fullName}" />`
          )}
          ${fieldWrap('maritalStatus', 'Marital Status',
            `<select class="form-input" data-key="maritalStatus">
              <option ${formData.maritalStatus==='Never Married'?'selected':''}>Never Married</option>
              <option ${formData.maritalStatus==='Divorced'?'selected':''}>Divorced</option>
              <option ${formData.maritalStatus==='Widowed'?'selected':''}>Widowed</option>
            </select>`
          )}
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${fieldWrap('dob', 'Date of Birth',
            `<input class="form-input" type="date" data-key="dob" value="${formData.dob}" />`
          )}
          ${fieldWrap('pob', 'Place of Birth',
            `<input class="form-input" type="text" placeholder="e.g. New Delhi" data-key="pob" value="${formData.pob}" />`
          )}
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          ${fieldWrap('height', 'Height',
            `<select class="form-input" data-key="height">
              <option value="" ${!formData.height?'selected':''}>Select</option>
              ${["4'8\"","4'10\"","5'0\"","5'1\"","5'2\"","5'3\"","5'4\"","5'5\"","5'6\"","5'7\"","5'8\"","5'9\"","5'10\"","5'11\"","6'0\"","6'1\"","6'2\"","6'3\""]
                .map(h=>`<option ${formData.height===h?'selected':''}>${h}</option>`).join('')}
            </select>`
          )}
          ${fieldWrap('complexion', 'Complexion',
            `<select class="form-input" data-key="complexion">
              <option value="" ${!formData.complexion?'selected':''}>Select</option>
              ${['Very Fair','Fair','Wheatish','Wheatish Brown','Dark']
                .map(c=>`<option ${formData.complexion===c?'selected':''}>${c}</option>`).join('')}
            </select>`
          )}
          ${fieldWrap('manglik', 'Manglik',
            `<select class="form-input" data-key="manglik">
              <option value="" ${!formData.manglik?'selected':''}>Select</option>
              ${['No','Yes','Partial','Not Known']
                .map(m=>`<option ${formData.manglik===m?'selected':''}>${m}</option>`).join('')}
            </select>`
          )}
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${fieldWrap('religion', 'Religion',
            `<select class="form-input" data-key="religion">
              <option value="" ${!formData.religion?'selected':''}>Select Religion</option>
              ${['Hindu','Muslim','Christian','Sikh','Jain','Buddhist','Parsi','Jewish','Other']
                .map(r=>`<option ${formData.religion===r?'selected':''}>${r}</option>`).join('')}
            </select>`
          )}
          ${fieldWrap('caste', 'Caste / Community',
            `<input class="form-input" type="text" placeholder="e.g. Brahmin, Kayastha" data-key="caste" value="${formData.caste}" />`
          )}
        </div>

        ${fieldWrap('subCaste', 'Sub-Caste / Gotra',
          `<input class="form-input" type="text" placeholder="e.g. Kashyap, Bharadwaj" data-key="subCaste" value="${formData.subCaste}" />`
        )}
      </div>

      <div class="flex justify-end mt-10">
        <button onclick="nextStep()" class="hero-cta-primary font-['DM_Sans'] text-sm tracking-wider px-8 py-3 flex items-center gap-2">
          Next: Professional Info →
        </button>
      </div>
    </div>
  `,

  2: () => `
    <div class="max-w-xl">
      <h2 class="font-['Cormorant_Garamond'] text-3xl font-bold text-[#f5f0ea] mb-2">Professional Info</h2>
      <p class="font-['DM_Sans'] text-sm text-[#8a7b72] mb-8">Your education and career details. Use 🔒 Skip for any field you prefer private.</p>

      <div class="space-y-5">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${fieldWrap('education', 'Highest Education',
            `<select class="form-input" data-key="education">
              <option value="" ${!formData.education?'selected':''}>Select</option>
              ${['10th / SSC','12th / HSC','Diploma','B.Tech / B.E.','B.Sc','B.Com','B.A.','MBA','M.Tech / M.E.','M.Sc','M.A.','M.Com','BDS','MBBS','MD / MS','Ph.D','CA / CS','LLB / LLM','Other']
                .map(e=>`<option ${formData.education===e?'selected':''}>${e}</option>`).join('')}
            </select>`
          )}
          ${fieldWrap('college', 'College / University',
            `<input class="form-input" type="text" placeholder="e.g. IIT Delhi, Mumbai University" data-key="college" value="${formData.college}" />`
          )}
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${fieldWrap('occupation', 'Occupation / Job Title',
            `<input class="form-input" type="text" placeholder="e.g. Software Engineer" data-key="occupation" value="${formData.occupation}" />`
          )}
          ${fieldWrap('company', 'Company / Organisation',
            `<input class="form-input" type="text" placeholder="e.g. Google India Pvt Ltd" data-key="company" value="${formData.company}" />`
          )}
        </div>

        ${fieldWrap('income', 'Annual Income',
          `<select class="form-input" data-key="income">
            <option value="" ${!formData.income?'selected':''}>Select Range</option>
            ${['Below ₹2 LPA','₹2–5 LPA','₹5–10 LPA','₹10–15 LPA','₹15–25 LPA','₹25–50 LPA','₹50+ LPA','Not Disclosed']
              .map(i=>`<option ${formData.income===i?'selected':''}>${i}</option>`).join('')}
          </select>`
        )}
      </div>

      <div class="flex justify-between mt-10">
        <button onclick="prevStep()" class="hero-cta-secondary font-['DM_Sans'] text-sm tracking-wider px-8 py-3">← Back</button>
        <button onclick="nextStep()" class="hero-cta-primary font-['DM_Sans'] text-sm tracking-wider px-8 py-3 flex items-center gap-2">
          Next: Family Details →
        </button>
      </div>
    </div>
  `,

  3: () => `
    <div class="max-w-xl">
      <h2 class="font-['Cormorant_Garamond'] text-3xl font-bold text-[#f5f0ea] mb-2">Family Details</h2>
      <p class="font-['DM_Sans'] text-sm text-[#8a7b72] mb-8">Family background for your biodata. Skip anything you'd prefer to keep private.</p>

      <div class="space-y-5">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${fieldWrap('fatherName', "Father's Name",
            `<input class="form-input" type="text" placeholder="e.g. Shri Rajesh Sharma" data-key="fatherName" value="${formData.fatherName}" />`
          )}
          ${fieldWrap('fatherOcc', "Father's Occupation",
            `<input class="form-input" type="text" placeholder="e.g. Retired Bank Manager" data-key="fatherOcc" value="${formData.fatherOcc}" />`
          )}
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${fieldWrap('motherName', "Mother's Name",
            `<input class="form-input" type="text" placeholder="e.g. Smt. Sunita Sharma" data-key="motherName" value="${formData.motherName}" />`
          )}
          ${fieldWrap('motherOcc', "Mother's Occupation",
            `<input class="form-input" type="text" placeholder="e.g. Homemaker" data-key="motherOcc" value="${formData.motherOcc}" />`
          )}
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${fieldWrap('brothers', 'Brothers',
            `<select class="form-input" data-key="brothers">
              <option value="" ${!formData.brothers?'selected':''}>Select</option>
              ${['None','1 (Married)','1 (Unmarried)','2 (Both Married)','2 (Both Unmarried)','2 (1 Married, 1 Unmarried)','3+']
                .map(b=>`<option ${formData.brothers===b?'selected':''}>${b}</option>`).join('')}
            </select>`
          )}
          ${fieldWrap('sisters', 'Sisters',
            `<select class="form-input" data-key="sisters">
              <option value="" ${!formData.sisters?'selected':''}>Select</option>
              ${['None','1 (Married)','1 (Unmarried)','2 (Both Married)','2 (Both Unmarried)','2 (1 Married, 1 Unmarried)','3+']
                .map(s=>`<option ${formData.sisters===s?'selected':''}>${s}</option>`).join('')}
            </select>`
          )}
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="form-label">Family Type</label>
            <div class="flex gap-3">
              ${['Nuclear','Joint'].map(ft => `
                <div class="radio-option flex-1 ${formData.familyType===ft?'selected':''}" onclick="selectRadio('familyType','${ft}',this)">
                  <div class="radio-dot"></div>
                  <span class="font-['DM_Sans'] text-sm text-[#f5f0ea]">${ft}</span>
                </div>
              `).join('')}
            </div>
          </div>
          <div>
            <label class="form-label">Family Values</label>
            <div class="flex gap-3">
              ${['Traditional','Moderate','Liberal'].map(fv => `
                <div class="radio-option flex-1 ${formData.familyValues===fv?'selected':''}" onclick="selectRadio('familyValues','${fv}',this)">
                  <div class="radio-dot"></div>
                  <span class="font-['DM_Sans'] text-xs text-[#f5f0ea]">${fv}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>

      <div class="flex justify-between mt-10">
        <button onclick="prevStep()" class="hero-cta-secondary font-['DM_Sans'] text-sm tracking-wider px-8 py-3">← Back</button>
        <button onclick="nextStep()" class="hero-cta-primary font-['DM_Sans'] text-sm tracking-wider px-8 py-3 flex items-center gap-2">
          Next: Contact & Photo →
        </button>
      </div>
    </div>
  `,

  4: () => `
    <div class="max-w-xl">
      <h2 class="font-['Cormorant_Garamond'] text-3xl font-bold text-[#f5f0ea] mb-2">Contact & Photo</h2>
      <p class="font-['DM_Sans'] text-sm text-[#8a7b72] mb-8">Your contact info. Skip fields you'd prefer not to share.</p>

      <div class="space-y-5">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${fieldWrap('phone', 'Phone Number',
            `<input class="form-input" type="tel" placeholder="+91 98765 43210" data-key="phone" value="${formData.phone}" />`
          )}
          ${fieldWrap('email', 'Email Address',
            `<input class="form-input" type="email" placeholder="your@email.com" data-key="email" value="${formData.email}" />`
          )}
        </div>

        ${fieldWrap('address', 'Residential Address',
          `<textarea class="form-input" rows="3" placeholder="House/Flat No., Street, City, State – PIN" data-key="address" style="resize:none;">${formData.address}</textarea>`
        )}

        <div>
          <label class="form-label">Religious Symbol</label>
          <div class="grid grid-cols-4 md:grid-cols-8 gap-3 mt-2">
            ${SYMBOLS.map(s => `
              <button class="symbol-btn ${formData.symbol===s.unicode?'selected':''}"
                onclick="selectSymbol('${s.unicode}',this)" title="${s.label}">
                ${s.sym}
              </button>
            `).join('')}
          </div>
        </div>

        <div>
          <label class="form-label">Your Photo</label>
          <div class="photo-upload-zone" onclick="triggerUpload()" id="photoZone">
            <div id="photoPreviewWrap">
              <div class="text-4xl mb-3">📷</div>
              <p class="font-['DM_Sans'] text-sm text-[#8a7b72]">Click to upload your photo</p>
              <p class="font-['DM_Sans'] text-xs text-[#5a4f47] mt-1">JPG, PNG — max 5MB</p>
            </div>
          </div>
          <input type="file" id="photoInput" accept="image/*" class="hidden" onchange="handlePhotoUpload(event)" />
        </div>
      </div>

      <div class="flex justify-between mt-10">
        <button onclick="prevStep()" class="hero-cta-secondary font-['DM_Sans'] text-sm tracking-wider px-8 py-3">← Back</button>
        <button onclick="nextStep()" class="hero-cta-primary font-['DM_Sans'] text-sm tracking-wider px-8 py-3 flex items-center gap-2">
          Next: Template & Style →
        </button>
      </div>
    </div>
  `,

  5: () => `
    <div class="max-w-3xl">
      <h2 class="font-['Cormorant_Garamond'] text-3xl font-bold text-[#f5f0ea] mb-2">Template & Style</h2>
      <p class="font-['DM_Sans'] text-sm text-[#8a7b72] mb-8">
        Choose your design. Free templates download instantly. Paid templates show a preview watermark — 
        pay once to download a clean, professional PDF.
      </p>

      <!-- Tier filter tabs -->
      <div class="flex gap-2 flex-wrap mb-6">
        ${[
          {key:'all',    label:'All Templates'},
          {key:'free',   label:'Free'},
          {key:'basic',  label:'₹21'},
          {key:'standard',label:'₹51'},
          {key:'premium', label:'₹99 Premium'},
        ].map(tab => `
          <button class="tier-tab ${tab.key==='all'?'active':''}" data-tier="${tab.key}"
            onclick="filterTemplates('${tab.key}', this)">
            ${tab.label}
          </button>
        `).join('')}
      </div>

      <!-- Template grid -->
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" id="tplGrid">
        ${buildTemplateCards()}
      </div>

      <!-- Confidential summary -->
      ${formData.confidentialFields.length > 0 ? `
        <div class="mt-6 p-4 rounded-lg border border-[#3a2f28] bg-[#1a1410]">
          <p class="font-['DM_Sans'] text-xs text-[#8a7b72]">
            🔒 <strong class="text-[#d4a853]">${formData.confidentialFields.length} field(s)</strong> will appear as "Confidential" in your biodata:
            <span class="text-[#6a5f57]">${formData.confidentialFields.join(', ')}</span>
          </p>
        </div>
      ` : ''}

      <div class="flex justify-between mt-8">
        <button onclick="prevStep()" class="hero-cta-secondary font-['DM_Sans'] text-sm tracking-wider px-8 py-3">← Back</button>
        <button onclick="handleDownload()" id="downloadBtn"
          class="hero-cta-primary font-['DM_Sans'] text-sm tracking-wider px-8 py-3 flex items-center gap-2">
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
          </svg>
          ${getDownloadBtnLabel()}
        </button>
      </div>
    </div>
  `
};

/* ── Template Card Builder ─────────────────── */
function buildTemplateCards(filterTier = 'all') {
  const list = filterTier === 'all'
    ? ALL_TEMPLATES
    : ALL_TEMPLATES.filter(t => t.tier === filterTier);

  return list.map(t => {
    const isFree     = t.price === 0;
    const isSelected = formData.template === t.id;
    const tierColors = {
      free:     'bg-green-900/60 text-green-300',
      basic:    'bg-yellow-900/60 text-yellow-300',
      standard: 'bg-blue-900/60 text-blue-300',
      premium:  'bg-purple-900/60 text-purple-300',
    };
    const tierLabel = {
      free: 'FREE', basic: '₹21', standard: '₹51', premium: '₹99'
    };

    return `
      <div class="template-card-v2 ${isSelected ? 'selected' : ''} cursor-pointer"
        data-tier="${t.tier}" onclick="selectTemplateV2(${t.id}, this)">

        <!-- Mini preview -->
        <div class="tpl-mini-preview tpl-${t.id} relative overflow-hidden" style="aspect-ratio:3/4;">
          <!-- Watermark badge for paid -->
          ${!isFree ? `
            <div class="watermark-badge">
              <span>👁 Preview</span>
            </div>
          ` : ''}
          <!-- Decorative art -->
          <div class="tpl-preview-art" style="width:70%; padding: 8px 0;">
            <div class="tpl-symbol">${t.symbol}</div>
            <div class="tpl-line tpl-line-md mt-2"></div>
            <div class="tpl-divider my-1"></div>
            <div class="tpl-line tpl-line-lg"></div>
            <div class="tpl-line tpl-line-sm"></div>
            <div class="tpl-line tpl-line-md"></div>
          </div>
          <!-- Price badge -->
          <div class="absolute top-2 right-2">
            <span class="text-xs font-bold px-2 py-0.5 rounded-full ${tierColors[t.tier]}">${tierLabel[t.tier]}</span>
          </div>
        </div>

        <!-- Info row -->
        <div class="template-info py-2 px-1">
          <h3 class="font-['DM_Sans'] text-xs font-semibold text-[#f5f0ea] truncate">${t.name}</h3>
          <p class="font-['DM_Sans'] text-[10px] text-[#6a5f57] truncate">${t.desc}</p>
        </div>
      </div>
    `;
  }).join('');
}

function filterTemplates(tier, btn) {
  document.querySelectorAll('.tier-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  const grid = document.getElementById('tplGrid');
  if (grid) grid.innerHTML = buildTemplateCards(tier === 'all' ? 'all' : tier);
}

function selectTemplateV2(id, el) {
  formData.template = id;
  document.querySelectorAll('.template-card-v2').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  const btn = document.getElementById('downloadBtn');
  if (btn) btn.innerHTML = `
    <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
      <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
    </svg>
    ${getDownloadBtnLabel()}
  `;
}

function getDownloadBtnLabel() {
  const tpl = ALL_TEMPLATES.find(t => t.id === formData.template);
  if (!tpl) return 'Download Biodata';
  if (tpl.price === 0) return 'Download Free';
  return `Buy & Download ₹${tpl.price}`;
}

/* ── Navigation ────────────────────────────── */
function goToStep(step) { currentStep = step; renderStep(); }
function nextStep()     { if (currentStep < TOTAL_STEPS) { currentStep++; renderStep(); } }
function prevStep()     { if (currentStep > 1)           { currentStep--; renderStep(); } }

function renderStep() {
  document.querySelectorAll('.wizard-step').forEach(el => {
    const s = parseInt(el.dataset.step);
    el.classList.toggle('active', s === currentStep);
    el.classList.toggle('done',   s < currentStep);
  });
  const pct = (currentStep / TOTAL_STEPS) * 100;
  const bar = document.getElementById('progressBar');
  const lbl = document.getElementById('progressLabel');
  if (bar) bar.style.width = pct + '%';
  if (lbl) lbl.textContent = `Step ${currentStep} of ${TOTAL_STEPS}`;

  const area = document.getElementById('formArea');
  if (area) {
    area.innerHTML = STEPS[currentStep]();
    area.scrollTop = 0;
    area.querySelectorAll('[data-key]').forEach(el => {
      const key = el.dataset.key;
      el.addEventListener('input',  () => { formData[key] = el.value; updatePreview(); });
      el.addEventListener('change', () => { formData[key] = el.value; updatePreview(); });
    });
  }
}

/* ── Other Handlers (unchanged) ─────────────── */
function selectRadio(key, value, el) {
  formData[key] = value;
  const parent = el.closest('.flex');
  if (parent) parent.querySelectorAll('.radio-option').forEach(r => r.classList.remove('selected'));
  el.classList.add('selected');
  updatePreview();
}

function selectSymbol(unicode, el) {
  formData.symbol = unicode;
  document.querySelectorAll('.symbol-btn').forEach(b => b.classList.remove('selected'));
  el.classList.add('selected');
  const sym = document.getElementById('previewSymbol');
  if (sym) sym.textContent = unicode;
}

function triggerUpload() { document.getElementById('photoInput')?.click(); }

function handlePhotoUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const wrap = document.getElementById('photoPreviewWrap');
    if (wrap) wrap.innerHTML = `<img src="${e.target.result}" style="max-height:160px;border-radius:8px;margin:auto;" alt="photo" />`;
    const previewPhoto = document.getElementById('previewPhoto');
    if (previewPhoto) previewPhoto.innerHTML = `<img src="${e.target.result}" style="width:100%;height:100%;object-fit:cover;" alt="" />`;
  };
  reader.readAsDataURL(file);
}
//preview function 
function updatePreview() {
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val || '—'; };
  set('pvName',     formData.fullName);
  set('pvDob',      formData.dob);
  set('pvPob',      formData.pob);
  set('pvHeight',   formData.height);
  set('pvReligion', formData.religion);
  set('pvCaste',    formData.caste);
  set('pvEdu',      [formData.education, formData.college].filter(Boolean).join(', '));
  set('pvOcc',      [formData.occupation, formData.company].filter(Boolean).join(' @ '));
  set('pvIncome',   formData.income);
  set('pvFather',   [formData.fatherName, formData.fatherOcc].filter(Boolean).join(' — '));
  set('pvMother',   [formData.motherName, formData.motherOcc].filter(Boolean).join(' — '));
  set('pvSiblings', [
    formData.brothers ? `Bros: ${formData.brothers}` : '',
    formData.sisters  ? `Sisters: ${formData.sisters}` : '',
  ].filter(Boolean).join(', '));
  set('pvPhone',   formData.phone);
  set('pvEmail',   formData.email);
  set('pvAddress', formData.address);
  const sym = document.getElementById('previewSymbol');
  if (sym) sym.textContent = formData.symbol;
}

/* ── Download Handler ───────────────────────── */
async function handleDownload() {
  const tpl = ALL_TEMPLATES.find(t => t.id === formData.template);
  if (!tpl) return;

  if (tpl.price === 0) {
    await downloadBiodata();
  } else {
    await initiatePayment(tpl);
  }
}

async function downloadBiodata(token = '') {
  const btn = document.getElementById('downloadBtn');
  const origText = btn ? btn.innerHTML : '';
  if (btn) btn.innerHTML = '⏳ Generating PDF...';

  try {
    const payload = {
      ...formData,
      confidentialFields: [...formData.confidentialFields],
      token: token || paymentToken,
    };
    const res = await fetch('http://127.0.0.1:8000/download', {
      method:  'POST',
      headers: {'Content-Type': 'application/json'},
      body:    JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `HTTP ${res.status}`);
    }
    const blob = await res.blob();
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `Biodata_${(formData.fullName || 'VivahSaathi').replace(/\s+/g, '_')}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    alert(`Download failed: ${err.message}`);
  } finally {
    if (btn) btn.innerHTML = origText;
  }
}

/* ── Razorpay Payment Flow ──────────────────── */
async function initiatePayment(tpl) {
  // Load Razorpay script dynamically if not present
  if (!window.Razorpay) {
    await loadScript('https://checkout.razorpay.com/v1/checkout.js');
  }

  let order;
  try {
    const res = await fetch('http://127.0.0.1:8000/create-order', {
      method:  'POST',
      headers: {'Content-Type': 'application/json'},
      body:    JSON.stringify({template_id: tpl.id, amount: tpl.price * 100}),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `HTTP ${res.status}`);
    }
    order = await res.json();
  } catch (err) {
    alert(`Could not create payment order: ${err.message}`);
    return;
  }

  const options = {
    key:          order.key_id,
    amount:       order.amount,
    currency:     'INR',
    name:         'VivahSaathi',
    description:  `${tpl.name} Biodata Template`,
    order_id:     order.order_id,
    prefill: {
      name:  formData.fullName  || '',
      email: formData.email     || '',
      contact: formData.phone   || '',
    },
    theme: { color: '#d4a853' },

    handler: async function (response) {
      // Verify payment on backend
      try {
        const vRes = await fetch('http://127.0.0.1:8000/verify-payment', {
          method:  'POST',
          headers: {'Content-Type': 'application/json'},
          body:    JSON.stringify({
            order_id:    response.razorpay_order_id,
            payment_id:  response.razorpay_payment_id,
            signature:   response.razorpay_signature,
            template_id: tpl.id,
          }),
        });
        if (!vRes.ok) throw new Error('Payment verification failed');
        const data   = await vRes.json();
        paymentToken = data.token;
        // Trigger the clean download
        await downloadBiodata(paymentToken);
      } catch (err) {
        alert(`Payment verification error: ${err.message}`);
      }
    },

    modal: {
      ondismiss: function() {
        console.log('Payment modal closed');
      }
    },
  };

  const rzp = new window.Razorpay(options);
  rzp.on('payment.failed', function(response) {
    alert(`Payment failed: ${response.error.description}`);
  });
  rzp.open();
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s   = document.createElement('script');
    s.src     = src;
    s.onload  = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

/* ── Init ──────────────────────────────────── */
const urlParams = new URLSearchParams(window.location.search);
const tplId     = parseInt(urlParams.get('template'));
if (tplId && ALL_TEMPLATES.find(t => t.id === tplId)) formData.template = tplId;

renderStep();
