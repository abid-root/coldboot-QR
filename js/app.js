const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];

let qr;
let currentType = 'url';
let logoData = '';
let sessionCodes = [];
let size = 300;

const templates = [
  { title: 'Website Link', cat: 'Business', type: 'url', text: 'Drive traffic to any landing page.', data: 'https://qryx.app' },
  { title: 'Business Card', cat: 'Business', type: 'vcard', text: 'Share contact details instantly.', data: 'Jane Doe' },
  { title: 'Wi‑Fi Access', cat: 'Wi‑Fi', type: 'wifi', text: 'Share Wi‑Fi credentials with one scan.', data: 'QRYX_Office' },
  { title: 'Restaurant Menu', cat: 'Restaurant', type: 'url', text: 'Open a digital menu instantly.', data: 'https://restaurant.example/menu' },
  { title: 'Event Ticket', cat: 'Event', type: 'event', text: 'Share event info and check-in links.', data: 'Product Launch' },
  { title: 'Product Label', cat: 'Product', type: 'url', text: 'Link manuals, warranty and product info.', data: 'https://product.example' },
  { title: 'Email Contact', cat: 'Business', type: 'email', text: 'Let customers email in one scan.', data: 'support@example.com' },
  { title: 'Location Pin', cat: 'Business', type: 'location', text: 'Open map coordinates.', data: '23.8103,90.4125' },
];

const fieldConfig = {
  url: [{ id: 'url', label: 'Website URL', value: 'https://www.example.com', type: 'url' }],
  text: [{ id: 'text', label: 'Text', value: 'Hello from QRYX', type: 'textarea' }],
  wifi: [
    { id: 'ssid', label: 'Network Name', value: 'QRYX_Office' },
    { id: 'password', label: 'Password', value: 'qryx1234' },
    { id: 'encryption', label: 'Encryption', value: 'WPA' },
  ],
  email: [
    { id: 'email', label: 'Email Address', value: 'hello@example.com', type: 'email' },
    { id: 'subject', label: 'Subject', value: 'Hello' },
    { id: 'body', label: 'Body', value: 'I want to contact you.' },
  ],
  phone: [{ id: 'phone', label: 'Phone Number', value: '+880123456789' }],
  sms: [
    { id: 'smsPhone', label: 'Phone Number', value: '+880123456789' },
    { id: 'smsText', label: 'Message', value: 'Hello' },
  ],
  vcard: [
    { id: 'name', label: 'Full Name', value: 'Jane Doe' },
    { id: 'org', label: 'Company', value: 'QRYX Studio' },
    { id: 'vphone', label: 'Phone', value: '+880123456789' },
    { id: 'vemail', label: 'Email', value: 'jane@example.com' },
    { id: 'website', label: 'Website', value: 'https://example.com' },
  ],
  location: [
    { id: 'lat', label: 'Latitude', value: '23.8103' },
    { id: 'lng', label: 'Longitude', value: '90.4125' },
  ],
};

function toast(message) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2200);
}

function getFieldValue(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}

function buildPayload() {
  switch (currentType) {
    case 'url': return getFieldValue('url') || 'https://www.example.com';
    case 'text': return getFieldValue('text') || 'Hello from QRYX';
    case 'wifi': return `WIFI:T:${getFieldValue('encryption') || 'WPA'};S:${getFieldValue('ssid')};P:${getFieldValue('password')};;`;
    case 'email': return `mailto:${getFieldValue('email')}?subject=${encodeURIComponent(getFieldValue('subject'))}&body=${encodeURIComponent(getFieldValue('body'))}`;
    case 'phone': return `tel:${getFieldValue('phone')}`;
    case 'sms': return `SMSTO:${getFieldValue('smsPhone')}:${getFieldValue('smsText')}`;
    case 'vcard': return `BEGIN:VCARD\nVERSION:3.0\nFN:${getFieldValue('name')}\nORG:${getFieldValue('org')}\nTEL:${getFieldValue('vphone')}\nEMAIL:${getFieldValue('vemail')}\nURL:${getFieldValue('website')}\nEND:VCARD`;
    case 'location': return `geo:${getFieldValue('lat')},${getFieldValue('lng')}`;
    default: return 'https://www.example.com';
  }
}

function renderFields() {
  const wrap = $('#contentFields');
  wrap.innerHTML = '';
  const fields = fieldConfig[currentType] || fieldConfig.url;
  fields.forEach(field => {
    const label = document.createElement('label');
    label.textContent = field.label;
    const input = document.createElement(field.type === 'textarea' ? 'textarea' : 'input');
    input.id = field.id;
    input.className = 'input';
    if (field.type && field.type !== 'textarea') input.type = field.type;
    input.value = field.value || '';
    input.addEventListener('input', updateQR);
    wrap.append(label, input);
  });
}

function selectedValue(choice) {
  const active = $(`[data-choice="${choice}"] .selected`);
  return active ? active.dataset.value : 'square';
}

function getOptions() {
  const dotsType = selectedValue('style') || 'square';
  const eyeType = selectedValue('eye') || 'square';

  const dark = $('#darkColor')?.value || '#111111';
  const accent = $('#accentColor')?.value || '#635BFF';
  const light = $('#lightColor')?.value || '#ffffff';

  const qrMargin = Number($('#qrMargin')?.value || 8);
  const logoGap = Number($('#logoGap')?.value || 8);
  const logoSize = Number($('#logoSize')?.value || 22) / 100;
  const gradientDeg = Number($('#gradientAngle')?.value || 0);
  const gradientRad = gradientDeg * Math.PI / 180;

  const useGradient = $('#gradientToggle') ? $('#gradientToggle').checked : true;
  const transparentBg = $('#transparentBg') ? $('#transparentBg').checked : false;
  const syncEyes = $('#syncEyeColors') ? $('#syncEyeColors').checked : true;

  const eyeOuter = syncEyes ? dark : ($('#eyeOuterColor')?.value || dark);
  const eyeInner = syncEyes ? accent : ($('#eyeInnerColor')?.value || accent);

  const dotsOptions = { type: dotsType };

  if (useGradient) {
    dotsOptions.gradient = {
      type: 'linear',
      rotation: gradientRad,
      colorStops: [
        { offset: 0, color: dark },
        { offset: 1, color: accent }
      ]
    };
  } else {
    dotsOptions.color = dark;
  }

  return {
    width: size,
    height: size,
    type: 'svg',
    data: buildPayload(),
    image: logoData || undefined,
    margin: qrMargin,
    qrOptions: {
      errorCorrectionLevel: $('#errorLevel')?.value || 'H'
    },
    imageOptions: {
      crossOrigin: 'anonymous',
      margin: logoGap,
      imageSize: logoSize,
      hideBackgroundDots: true
    },
    dotsOptions,
    cornersSquareOptions: {
      type: eyeType === 'dot' ? 'dot' : eyeType,
      color: eyeOuter
    },
    cornersDotOptions: {
      type: eyeType === 'dot' ? 'dot' : 'square',
      color: eyeInner
    },
    backgroundOptions: {
      color: transparentBg ? 'transparent' : light
    }
  };
}

// === QRYX USEFUL DESIGN HELPERS START ===
function setToolText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function applyUsefulDesignPreview() {
  const margin = Number($('#qrMargin')?.value || 8);
  const logoSize = Number($('#logoSize')?.value || 22);
  const logoGap = Number($('#logoGap')?.value || 8);
  const angle = Number($('#gradientAngle')?.value || 0);
  const transparentBg = $('#transparentBg') ? $('#transparentBg').checked : false;
  const light = $('#lightColor')?.value || '#ffffff';

  setToolText('qrMarginValue', margin);
  setToolText('logoSizeValue', `${logoSize}%`);
  setToolText('logoGapValue', logoGap);
  setToolText('gradientAngleValue', `${angle}°`);

  document.documentElement.style.setProperty('--qryx-qr-bg-preview', transparentBg ? 'transparent' : light);
}

function bindUsefulDesignTools() {
  ['qrMargin','logoSize','logoGap','gradientAngle','eyeOuterColor','eyeInnerColor'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', updateQR);
  });

  ['gradientToggle','transparentBg','syncEyeColors'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('change', updateQR);
  });
}
// === QRYX USEFUL DESIGN HELPERS END ===

function initQR() {
  const target = $('#qrCanvas');
  target.innerHTML = '';
  if (!window.QRCodeStyling) {
    target.innerHTML = '<p style="max-width:260px;text-align:center;color:var(--muted)">QR library failed to load. Connect internet or host the library locally.</p>';
    return;
  }
  qr = new QRCodeStyling(getOptions());
  qr.append(target);
  applyUsefulDesignPreview();}

function updateQR() {
  if (!qr) return initQR();

  qr.update(getOptions());
  applyUsefulDesignPreview();

  const chip = $('.scan-chip');
  if (chip && chip.childNodes[2]) {
    chip.childNodes[2].nodeValue = ` ${$('#frameText')?.value || 'Scan to preview'} `;
  }
}

function download(ext) {
  if (!qr) return;
  const name = ($('#fileName')?.value || 'qryx-qr-code').replace(/[^a-z0-9-_]/gi, '-').toLowerCase();
  qr.download({ name, extension: ext });
}

function setPage(page) {
  $$('.page').forEach(p => p.classList.toggle('active', p.id === `page-${page}`));
  $$('[data-page]').forEach(b => b.classList.toggle('active', b.dataset.page === page));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function setTheme(mode) {
  document.documentElement.dataset.theme = mode;
  $('#themeToggle').textContent = mode === 'dark' ? '☀' : '☾';
}

function toggleTheme() {
  setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
}

function renderTemplates() {
  const grid = $('#templateGrid');
  const q = ($('#templateSearch')?.value || '').toLowerCase();
  const cat = $('#categoryFilter')?.value || 'All Categories';
  grid.innerHTML = '';
  templates.filter(t => (cat === 'All Categories' || t.cat === cat) && (`${t.title} ${t.text}`.toLowerCase().includes(q))).forEach(t => {
    const card = document.createElement('article');
    card.className = 'template-card';
    card.innerHTML = `<div class="template-thumb"><div class="mini-qr"></div></div><h3>${t.title}</h3><p>${t.text}</p><button class="primary" type="button">Use Template</button>`;
    card.querySelector('button').addEventListener('click', () => {
      currentType = t.type === 'event' ? 'text' : t.type;
      setPage('create');
      $$('#typeGrid button').forEach(b => b.classList.toggle('selected', b.dataset.type === currentType));
      renderFields();
      const first = $('#contentFields input, #contentFields textarea');
      if (first) first.value = t.data;
      updateQR();
    });
    grid.appendChild(card);
    if (window.QRCodeStyling) new QRCodeStyling({ width: 96, height: 96, data: t.data, margin: 2, dotsOptions: { color: '#111', type: 'dots' }, backgroundOptions: { color: '#ffffff' } }).append(card.querySelector('.mini-qr'));
  });
}

async function addSessionCode() {
  if (!qr) return;
  try {
    const raw = await qr.getRawData('png');
    const url = URL.createObjectURL(raw);
    sessionCodes.unshift({ img: url, type: currentType, data: buildPayload(), time: new Date().toLocaleTimeString() });
    renderCodes();
    toast('Added to session list. Not saved permanently.');
  } catch { toast('Could not create preview.'); }
}

function renderCodes() {
  const list = $('#codesList');
  list.innerHTML = '';
  if (!sessionCodes.length) {
    list.innerHTML = '<div class="empty-state"><b>No QR codes in this session.</b><span>Add your current QR to see it here. This list clears after refresh.</span></div>';
    return;
  }
  sessionCodes.forEach((c, i) => {
    const row = document.createElement('div');
    row.className = 'code-row';
    row.innerHTML = `<img src="${c.img}" alt="QR preview"><div><b>${c.type.toUpperCase()} QR</b><br><small>${c.data.slice(0, 90)}</small></div><span class="meta-extra">${c.time}</span><button class="ghost-btn" type="button">Remove</button>`;
    row.querySelector('button').addEventListener('click', () => { sessionCodes.splice(i, 1); renderCodes(); });
    list.appendChild(row);
  });
}

function bind() {
  $$('[data-page]').forEach(btn => btn.addEventListener('click', () => setPage(btn.dataset.page)));
  $$('.panel-tabs button').forEach(btn => btn.addEventListener('click', () => {
    $$('.panel-tabs button').forEach(b => b.classList.remove('active'));
    $$('.editor-tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    $(`#editor-${btn.dataset.editorTab}`).classList.add('active');
  }));
  $$('#typeGrid button').forEach(btn => btn.addEventListener('click', () => {
    currentType = btn.dataset.type;
    $$('#typeGrid button').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    renderFields();
    updateQR();
  }));
  $$('[data-choice] button').forEach(btn => btn.addEventListener('click', () => {
    $$(`[data-choice="${btn.parentElement.dataset.choice}"] button`).forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    updateQR();
  }));
  $$('.color-preset').forEach(b => b.addEventListener('click', () => { $('#darkColor').value = b.dataset.c1; $('#accentColor').value = b.dataset.c2; updateQR(); }));
  ['darkColor','accentColor','lightColor','errorLevel','fileName','frameText','sizeRange','qrMargin','logoSize','logoGap','qrRadius','qrShadow'].forEach(id => {
    const el = $(`#${id}`);
    if (!el) return;

    el.addEventListener('input', () => {
      if (id === 'sizeRange') size = Number($('#sizeRange').value);
      updateQR();
    });
  });

  ['gradientToggle','transparentBg'].forEach(id => {
    const el = $(`#${id}`);
    if (!el) return;
    el.addEventListener('change', updateQR);
  });
  $('#sizeMinus').addEventListener('click', () => { size = Math.max(160, size - 20); $('#sizeRange').value = size; updateQR(); });
  $('#sizePlus').addEventListener('click', () => { size = Math.min(380, size + 20); $('#sizeRange').value = size; updateQR(); });
  $('#logoUpload').addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { logoData = reader.result; updateQR(); };
    reader.readAsDataURL(file);
  });
  $('#removeLogo').addEventListener('click', () => { logoData = ''; $('#logoUpload').value = ''; updateQR(); });
  $('#downloadPng').addEventListener('click', () => download('png'));
  $('#downloadSvg').addEventListener('click', () => download('svg'));
  $('#quickDownload').addEventListener('click', () => download('png'));
  $('#themeToggle').addEventListener('click', toggleTheme);
  $('#themeToggle2').addEventListener('click', toggleTheme);
  $('#focusInput').addEventListener('click', () => $('#contentFields input, #contentFields textarea')?.focus());
  $('#resetBtn').addEventListener('click', () => location.reload());
  $('#templateSearch').addEventListener('input', renderTemplates);
  $('#categoryFilter').addEventListener('change', renderTemplates);
  $('#saveSessionCode').addEventListener('click', addSessionCode);
  $('#clearSession').addEventListener('click', () => { sessionCodes = []; renderCodes(); });
}

renderFields();
bind();
bindUsefulDesignTools();initQR();
renderTemplates();
renderCodes();
setTheme('light');
