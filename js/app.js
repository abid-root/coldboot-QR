const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];

let qr;
let currentType = 'url';
let logoData = '';
let sessionCodes = [];
let size = Number($('#sizeRange')?.value || 300);

const templates = [
  { title: 'Website Link', cat: 'Business', type: 'url', text: 'Drive traffic to any landing page.', data: 'https://flowsync.app' },
  { title: 'Business Card', cat: 'Business', type: 'vcard', text: 'Share contact details instantly.', data: 'Jane Doe' },
  { title: 'Wi-Fi Access', cat: 'Wi-Fi', type: 'wifi', text: 'Share Wi-Fi credentials with one scan.', data: 'FlowSync_Office' },
  { title: 'Restaurant Menu', cat: 'Restaurant', type: 'url', text: 'Open a digital menu instantly.', data: 'https://restaurant.example/menu' },
  { title: 'Event Ticket', cat: 'Event', type: 'event', text: 'Share event info and check-in links.', data: 'Product Launch' },
  { title: 'Product Label', cat: 'Product', type: 'url', text: 'Link manuals, warranty and product info.', data: 'https://product.example' },
  { title: 'Email Contact', cat: 'Business', type: 'email', text: 'Let customers email in one scan.', data: 'support@example.com' },
  { title: 'Location Pin', cat: 'Business', type: 'location', text: 'Open map coordinates.', data: '23.8103,90.4125' },
];

const fieldConfig = {
  url: [{ id: 'url', label: 'Website URL', value: 'https://www.example.com', type: 'url' }],
  text: [{ id: 'text', label: 'Text', value: 'Hello from FlowSync', type: 'textarea' }],
  wifi: [
    { id: 'ssid', label: 'Network Name', value: 'FlowSync_Office' },
    { id: 'password', label: 'Password', value: 'flowsync1234' },
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
    { id: 'org', label: 'Company', value: 'FlowSync Studio' },
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
    case 'text': return getFieldValue('text') || 'Hello from FlowSync';
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
  if (!wrap) return;

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

function escapeSvg(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;');
}

function makeSafeLogo(dataUrl, visiblePct, safeZonePct) {
  if (!dataUrl) return undefined;

  const safeTotal = Math.max(visiblePct, visiblePct + safeZonePct * 2);
  const logoPx = Math.max(8, Math.min(196, 200 * (visiblePct / safeTotal)));
  const pad = (200 - logoPx) / 2;

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <image href="${escapeSvg(dataUrl)}" x="${pad}" y="${pad}" width="${logoPx}" height="${logoPx}" preserveAspectRatio="xMidYMid meet"/>
</svg>`;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function getOptions() {
  const dotsType = selectedValue('style') || 'square';
  const eyeType = selectedValue('eye') || 'square';

  const solidColor = $('#darkColor')?.value || '#111111';
  const secondColor = $('#accentColor')?.value || solidColor;
  const bgColor = $('#lightColor')?.value || '#ffffff';

  const useGradient = $('#gradientToggle')?.checked || false;
  const transparentBg = $('#transparentBg')?.checked || false;

  const qrMargin = Number($('#qrMargin')?.value || 10);
  const logoSizePct = Number($('#logoSize')?.value || 20);
  const logoSafeZone = Number($('#logoGap')?.value || 5);
  const gradientDeg = Number($('#gradientAngle')?.value || 0);
  const gradientRad = gradientDeg * Math.PI / 180;

  const eyeOuter = $('#eyeOuterColor')?.value || solidColor;
  const eyeInner = $('#eyeInnerColor')?.value || secondColor;

  const dotsOptions = { type: dotsType };

  if (useGradient) {
    dotsOptions.gradient = {
      type: 'linear',
      rotation: gradientRad,
      colorStops: [
        { offset: 0, color: solidColor },
        { offset: 1, color: secondColor }
      ]
    };
  } else {
    dotsOptions.color = solidColor;
  }

  const safeLogoTotal = Math.min(0.48, (logoSizePct + logoSafeZone * 2) / 100);
  const logoImage = typeof makeSafeLogo === 'function'
    ? makeSafeLogo(logoData, logoSizePct, logoSafeZone)
    : (logoData || undefined);

  return {
    width: size,
    height: size,
    type: 'svg',
    data: buildPayload(),
    image: logoImage,
    margin: qrMargin,
    qrOptions: {
      errorCorrectionLevel: $('#errorLevel')?.value || 'H'
    },
    imageOptions: {
      crossOrigin: 'anonymous',
      margin: 0,
      imageSize: safeLogoTotal,
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
      color: transparentBg ? 'transparent' : bgColor
    }
  };
}

function setToolText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function syncEyeInputs() {
  const outer = $('#eyeOuterColor');
  const inner = $('#eyeInnerColor');

  if (outer) outer.disabled = false;
  if (inner) inner.disabled = false;

  document.documentElement.classList.remove('eye-sync-on');
}

function applyUsefulDesignPreview() {
  const margin = Number($('#qrMargin')?.value || 10);
  const logoSize = Number($('#logoSize')?.value || 20);
  const logoGap = Number($('#logoGap')?.value || 5);
  const angle = Number($('#gradientAngle')?.value || 0);
  const transparentBg = $('#transparentBg')?.checked || false;
  const bgColor = $('#lightColor')?.value || '#ffffff';

  setToolText('qrMarginValue', margin);
  setToolText('logoSizeValue', `${logoSize}%`);
  setToolText('logoGapValue', logoGap);
  setToolText('gradientAngleValue', `${angle}°`);

  document.documentElement.style.setProperty('--flowsync-qr-bg-preview', transparentBg ? 'transparent' : bgColor);
  syncEyeInputs();
}

function renderQR() {
  const target = $('#qrCanvas');
  if (!target) return;

  target.innerHTML = '';

  if (!window.QRCodeStyling) {
    target.innerHTML = '<p style="max-width:260px;text-align:center;color:var(--muted)">QR library failed to load. Connect internet or host the library locally.</p>';
    return;
  }

  qr = new QRCodeStyling(getOptions());
  qr.append(target);
  applyUsefulDesignPreview();
  updateScanChipText();
}

function renderQR() {
  const target = $('#qrCanvas');
  if (!target) return;

  target.innerHTML = '';

  if (!window.QRCodeStyling) {
    target.innerHTML = '<p style="max-width:260px;text-align:center;color:var(--muted)">QR library failed to load. Connect internet or host the library locally.</p>';
    return;
  }

  qr = new QRCodeStyling(getOptions());
  qr.append(target);

  if (typeof applyUsefulDesignPreview === 'function') {
    applyUsefulDesignPreview();
  }

  updateScanChipText();
}

function initQR() {
  renderQR();
}

function updateScanChipText() {
  const chip = $('.scan-chip');
  if (!chip) return;

  const textNode = [...chip.childNodes].find(n => n.nodeType === Node.TEXT_NODE && n.nodeValue.trim());
  if (textNode) {
    textNode.nodeValue = ` ${$('#frameText')?.value || 'Scan to preview'} `;
  }
}

function updateQR() {
  renderQR();
}

function download(ext) {
  if (!qr) return;
  const name = ($('#fileName')?.value || 'flowsync-qr-code').replace(/[^a-z0-9-_]/gi, '-').toLowerCase();
  qr.download({ name, extension: ext });
}

function setPage(page) {
  $$('.page').forEach(p => p.classList.toggle('active', p.id === `page-${page}`));
  $$('[data-page]').forEach(b => b.classList.toggle('active', b.dataset.page === page));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function setTheme(mode) {
  document.documentElement.dataset.theme = mode;
  const mainToggle = $('#themeToggle');
  const secondToggle = $('#themeToggle2');
  const favicon = $('#themeFavicon');

  if (mainToggle) mainToggle.textContent = mode === 'dark' ? '☀' : '☾';
  if (secondToggle) secondToggle.textContent = mode === 'dark' ? 'Switch to Light' : 'Switch to Dark';
  if (favicon) favicon.href = mode === 'dark' ? 'assets/common/blackone.webp' : 'assets/common/whiteone.webp';
}

function toggleTheme() {
  setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
}

function renderTemplates() {
  const grid = $('#templateGrid');
  if (!grid) return;

  const q = ($('#templateSearch')?.value || '').toLowerCase();
  const cat = $('#categoryFilter')?.value || 'All Categories';

  grid.innerHTML = '';

  templates
    .filter(t => (cat === 'All Categories' || t.cat === cat) && (`${t.title} ${t.text}`.toLowerCase().includes(q)))
    .forEach(t => {
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

      if (window.QRCodeStyling) {
        new QRCodeStyling({
          width: 96,
          height: 96,
          data: t.data,
          margin: 2,
          dotsOptions: { color: '#111111', type: 'dots' },
          backgroundOptions: { color: '#ffffff' }
        }).append(card.querySelector('.mini-qr'));
      }
    });
}

async function addSessionCode() {
  if (!qr) return;

  try {
    const raw = await qr.getRawData('png');
    const url = URL.createObjectURL(raw);

    sessionCodes.unshift({
      img: url,
      type: currentType,
      data: buildPayload(),
      time: new Date().toLocaleTimeString()
    });

    renderCodes();
    toast('Added to session list. Not saved permanently.');
  } catch {
    toast('Could not create preview.');
  }
}

function renderCodes() {
  const list = $('#codesList');
  if (!list) return;

  list.innerHTML = '';

  if (!sessionCodes.length) {
    list.innerHTML = '<div class="empty-state"><b>No QR codes in this session.</b><span>Add your current QR to see it here. This list clears after refresh.</span></div>';
    return;
  }

  sessionCodes.forEach((c, i) => {
    const row = document.createElement('div');
    row.className = 'code-row';
    row.innerHTML = `<img src="${c.img}" alt="QR preview"><div><b>${c.type.toUpperCase()} QR</b><br><small>${c.data.slice(0, 90)}</small></div><span class="meta-extra">${c.time}</span><button class="ghost-btn" type="button">Remove</button>`;

    row.querySelector('button').addEventListener('click', () => {
      sessionCodes.splice(i, 1);
      renderCodes();
    });

    list.appendChild(row);
  });
}

function bind() {
  $$('[data-page]').forEach(btn => {
    btn.addEventListener('click', () => setPage(btn.dataset.page));
  });

  $$('.panel-tabs button').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.panel-tabs button').forEach(b => b.classList.remove('active'));
      $$('.editor-tab').forEach(t => t.classList.remove('active'));
      btn.classList.add('active');
      $(`#editor-${btn.dataset.editorTab}`)?.classList.add('active');
    });
  });

  $$('#typeGrid button').forEach(btn => {
    btn.addEventListener('click', () => {
      currentType = btn.dataset.type;
      $$('#typeGrid button').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      renderFields();
      updateQR();
    });
  });

  $$('[data-choice] button').forEach(btn => {
    btn.addEventListener('click', () => {
      $$(`[data-choice="${btn.parentElement.dataset.choice}"] button`).forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      updateQR();
    });
  });

  const liveInputIds = [
    'darkColor',
    'accentColor',
    'lightColor',
    'errorLevel',
    'fileName',
    'frameText',
    'sizeRange',
    'qrMargin',
    'logoSize',
    'logoGap',
    'gradientAngle',
    'eyeOuterColor',
    'eyeInnerColor'
  ];

  liveInputIds.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;

    el.addEventListener('input', () => {
      if (id === 'sizeRange') size = Number(el.value);
      updateQR();
    });
  });

  ['gradientToggle', 'transparentBg'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;

    el.addEventListener('change', () => {
      updateQR();
    });
  });

  const qxColorUIState = () => {
    const gradientOn = $('#gradientToggle')?.checked || false;

    const secondPicker = $('#accentColor');
    const angleSlider = $('#gradientAngle');

    if (secondPicker) secondPicker.disabled = !gradientOn;
    if (angleSlider) angleSlider.disabled = !gradientOn;

    document.documentElement.classList.toggle('gradient-off', !gradientOn);
  };

  $('#gradientToggle')?.addEventListener('change', qxColorUIState);

  $$('.color-preset').forEach(btn => {
    btn.addEventListener('click', () => {
      const c1 = btn.dataset.c1 || '#111111';
      const c2 = btn.dataset.c2 || c1;
      const mode = btn.dataset.mode || 'solid';

      if ($('#darkColor')) $('#darkColor').value = c1;
      if ($('#accentColor')) $('#accentColor').value = c2;

      const gradientToggle = $('#gradientToggle');
      if (gradientToggle) {
        gradientToggle.checked = mode === 'gradient';
      }

      qxColorUIState();
      updateQR();
    });
  });

  qxColorUIState();
  $('#sizeMinus')?.addEventListener('click', () => {
    size = Math.max(160, size - 20);
    if ($('#sizeRange')) $('#sizeRange').value = size;
    updateQR();
  });

  $('#sizePlus')?.addEventListener('click', () => {
    size = Math.min(380, size + 20);
    if ($('#sizeRange')) $('#sizeRange').value = size;
    updateQR();
  });

  $('#logoUpload')?.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      logoData = reader.result;
      updateQR();
    };
    reader.readAsDataURL(file);
  });

  $('#removeLogo')?.addEventListener('click', () => {
    logoData = '';
    if ($('#logoUpload')) $('#logoUpload').value = '';
    updateQR();
  });

  $('#downloadPng')?.addEventListener('click', () => download('png'));
  $('#downloadSvg')?.addEventListener('click', () => download('svg'));
  $('#quickDownload')?.addEventListener('click', () => download('png'));

  $('#themeToggle')?.addEventListener('click', toggleTheme);
  $('#themeToggle2')?.addEventListener('click', toggleTheme);

  $('#focusInput')?.addEventListener('click', () => {
    $('#contentFields input, #contentFields textarea')?.focus();
  });

  $('#resetBtn')?.addEventListener('click', () => location.reload());

  $('#templateSearch')?.addEventListener('input', renderTemplates);
  $('#categoryFilter')?.addEventListener('change', renderTemplates);

  $('#saveSessionCode')?.addEventListener('click', addSessionCode);
  $('#clearSession')?.addEventListener('click', () => {
    sessionCodes = [];
    renderCodes();
  });
}

renderFields();
bind();
initQR();
renderTemplates();
renderCodes();
setTheme(document.documentElement.dataset.theme || 'light');


// === FlowSync ACTIVE COLOR PRESET START ===
function qxNormalizeColor(value) {
  return String(value || '').trim().toLowerCase();
}

function qxUpdateActiveColorPreset() {
  const currentMain = qxNormalizeColor($('#darkColor')?.value);
  const currentSecond = qxNormalizeColor($('#accentColor')?.value);
  const gradientOn = $('#gradientToggle')?.checked || false;

  $$('.color-preset').forEach(btn => {
    const c1 = qxNormalizeColor(btn.dataset.c1);
    const c2 = qxNormalizeColor(btn.dataset.c2);
    const mode = btn.dataset.mode || 'solid';

    const isActive =
      c1 === currentMain &&
      c2 === currentSecond &&
      ((mode === 'gradient') === gradientOn);

    btn.classList.toggle('selected-preset', isActive);
    btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });
}

function qxBindActiveColorPresetUI() {
  $$('.color-preset').forEach(btn => {
    if (btn.dataset.qxActiveBound === '1') return;
    btn.dataset.qxActiveBound = '1';

    btn.addEventListener('click', () => {
      setTimeout(qxUpdateActiveColorPreset, 0);
    });
  });

  ['darkColor', 'accentColor', 'lightColor', 'gradientToggle'].forEach(id => {
    const el = document.getElementById(id);
    if (!el || el.dataset.qxActiveInputBound === '1') return;

    el.dataset.qxActiveInputBound = '1';
    el.addEventListener('input', qxUpdateActiveColorPreset);
    el.addEventListener('change', qxUpdateActiveColorPreset);
  });

  qxUpdateActiveColorPreset();
}

qxBindActiveColorPresetUI();
// === FlowSync ACTIVE COLOR PRESET END ===
// FlowSync_FORCE_EYE_COLOR_ENABLE
document.addEventListener('DOMContentLoaded', () => {
  const outer = document.getElementById('eyeOuterColor');
  const inner = document.getElementById('eyeInnerColor');

  if (outer) outer.disabled = false;
  if (inner) inner.disabled = false;

  document.documentElement.classList.remove('eye-sync-on');
});
// FlowSync_MANUAL_EYE_COLOR_FORCE
function qxBindManualEyeColorForce() {
  const outer = document.getElementById('eyeOuterColor');
  const inner = document.getElementById('eyeInnerColor');

  if (outer) outer.disabled = false;
  if (inner) inner.disabled = false;

  document.documentElement.classList.remove('eye-sync-on');

  ['eyeOuterColor', 'eyeInnerColor'].forEach(id => {
    const el = document.getElementById(id);
    if (!el || el.dataset.qxEyeBound === '1') return;

    el.dataset.qxEyeBound = '1';

    el.addEventListener('input', () => {
      el.disabled = false;
      updateQR();
    });

    el.addEventListener('change', () => {
      el.disabled = false;
      updateQR();
    });
  });
}

qxBindManualEyeColorForce();
document.addEventListener('DOMContentLoaded', qxBindManualEyeColorForce);


// === FlowSync AUTO EYE COLOR SYNC START ===
function qxAutoSyncEyeColors() {
  const qr = document.getElementById('darkColor');
  const grad = document.getElementById('accentColor');
  const outer = document.getElementById('eyeOuterColor');
  const inner = document.getElementById('eyeInnerColor');
  const gradientToggle = document.getElementById('gradientToggle');

  if (!qr || !outer || !inner) return;

  const qrColor = qr.value || '#111111';
  const gradColor = grad ? grad.value : qrColor;
  const gradientOn = gradientToggle ? gradientToggle.checked : false;

  outer.disabled = false;
  inner.disabled = false;

  outer.value = qrColor;
  inner.value = gradientOn ? gradColor : qrColor;

  document.documentElement.classList.remove('eye-sync-on');

  if (typeof updateQR === 'function') {
    updateQR();
  }
}

function qxBindAutoEyeColorSync() {
  const qr = document.getElementById('darkColor');
  const grad = document.getElementById('accentColor');
  const gradientToggle = document.getElementById('gradientToggle');

  [qr, grad, gradientToggle].forEach(el => {
    if (!el || el.dataset.qxEyeAutoBound === '1') return;

    el.dataset.qxEyeAutoBound = '1';
    el.addEventListener('input', qxAutoSyncEyeColors);
    el.addEventListener('change', qxAutoSyncEyeColors);
  });

  document.querySelectorAll('.color-preset').forEach(btn => {
    if (btn.dataset.qxEyePresetBound === '1') return;

    btn.dataset.qxEyePresetBound = '1';
    btn.addEventListener('click', () => {
      setTimeout(qxAutoSyncEyeColors, 0);
    });
  });
}

qxBindAutoEyeColorSync();
document.addEventListener('DOMContentLoaded', qxBindAutoEyeColorSync);
// === FlowSync AUTO EYE COLOR SYNC END ===