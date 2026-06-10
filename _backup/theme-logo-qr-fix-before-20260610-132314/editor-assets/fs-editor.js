(function(){
  const themeKey = "flowsync_template_theme";

  function ready(fn){
    if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn);
    else fn();
  }

  ready(function(){
    const card = document.getElementById("card");
    const editor = document.querySelector(".editor");
    const preview = document.querySelector(".preview-wrap");
    const qrBox = document.getElementById("qrBox");
    const qrImage = document.getElementById("qrImage");

    installQrBridge();

    if(!card || !editor || !preview || !qrBox || !qrImage) return;

    document.body.classList.add("fsx-template-editor");

    let qrUpload = document.getElementById("qrUpload");
    if(!qrUpload){
      qrUpload = document.createElement("input");
      qrUpload.type = "file";
      qrUpload.accept = "image/png,image/jpeg,image/webp";
      qrUpload.id = "qrUpload";
      qrUpload.hidden = true;
      document.body.appendChild(qrUpload);
    }

    editor.querySelectorAll(".fsx-rail,.fsx-side,.fsx-panel,.fsx-rail-v5,.fsx-side-v5").forEach(el => el.remove());
    preview.querySelectorAll(".fsx-workbar,.fsx-workbar-v5").forEach(el => el.remove());

    const layers = [
      ["cardLabel","Label"],
      ["cardTitle","Title"],
      ["cardSub","Subtitle"],
      ["cardFooter","Footer"],
      ["qrBox","QR"]
    ];

    const textIds = ["cardLabel","cardTitle","cardSub","cardFooter"];
    const layoutKey = "flowsync_contextual_v5_" + location.pathname;

    let selected = qrBox;
    let drag = null;
    let lastTap = { id:"", time:0 };
    let snapOn = true;

    const rail = document.createElement("div");
    rail.className = "fsx-rail-v5";
    rail.innerHTML = `
      <div class="fsx-rail-brand fsx-logo-brand"><img id="fsxBrandLogo" src="../../../assets/common/brandlogowhite.png" data-light="../../../assets/common/brandlogowhite.png" data-dark="../../../assets/common/blackone.webp" alt="FlowSync"><span>F</span></div>
      <a href="../../../index.html" title="Home"><span class="ico">⌂</span><span class="txt">Home</span></a>
      <a href="../index.html" title="Templates"><span class="ico">▦</span><span class="txt">Temps</span></a>
      <a href="../../../index.html#create" title="Generate QR"><span class="ico">＋</span><span class="txt">QR</span></a>
      <div class="fsx-rail-spacer"></div>
      <button type="button" id="fsxRailDownload" title="Download"><span class="ico">⇩</span><span class="txt">Save</span></button>
    `;
    editor.appendChild(rail);

    const side = document.createElement("div");
    side.className = "fsx-side-v5";
    side.innerHTML = `
      <div class="fsx-side-head">
        <b>Studio</b>
        <small>Choose an element. The top toolbar changes based on what you select.</small>
        <div class="fsx-element-tabs">
          <button type="button" data-layer="cardLabel">Label</button>
          <button type="button" data-layer="cardTitle">Title</button>
          <button type="button" data-layer="cardSub">Sub</button>
          <button type="button" data-layer="cardFooter">Footer</button>
          <button type="button" data-layer="qrBox">QR</button>
        </div>
      </div>
      <div class="fsx-body" id="fsxBody"></div>
    `;
    editor.appendChild(side);

    const workbar = document.createElement("div");
    workbar.className = "fsx-workbar-v5";
    preview.appendChild(workbar);

    const vGuide = document.createElement("div");
    const hGuide = document.createElement("div");
    vGuide.className = "fsx-guide v";
    hGuide.className = "fsx-guide h";
    card.append(vGuide,hGuide);

    const $ = id => document.getElementById(id);
    const isText = el => el && textIds.includes(el.id);

    function layerName(id){
      const found = layers.find(x => x[0] === id);
      return found ? found[1] : "Layer";
    }

    function applyTheme(theme){
      document.body.classList.toggle("fsx-dark", theme === "dark");
      localStorage.setItem(themeKey, theme);

      const icon = theme === "dark" ? "☀" : "☾";
      const topTheme = $("fsxTopTheme");
      if(topTheme) topTheme.textContent = icon;

      const logo = document.getElementById("fsxBrandLogo");
      if(logo){
        const nextLogo = theme === "dark" ? logo.dataset.dark : logo.dataset.light;
        if(nextLogo) logo.src = nextLogo;
      }
    }

    applyTheme(localStorage.getItem(themeKey) || "light");

    function toggleTheme(){
      applyTheme(document.body.classList.contains("fsx-dark") ? "light" : "dark");
    }

    if($("fsxRailTheme")) $("fsxRailTheme").addEventListener("click", toggleTheme);

    function rgbToHex(rgb){
      const nums = rgb.match(/\d+/g);
      if(!nums) return "#101423";
      return "#" + nums.slice(0,3).map(n => Number(n).toString(16).padStart(2,"0")).join("");
    }

    function cleanFont(font){
      const f = font.split(",")[0].replaceAll('"',"").trim();
      return ["Inter","Arial","Georgia","Trebuchet MS","Impact"].includes(f) ? f : "Inter";
    }

    function normalize(el){
      const c = card.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      el.style.position = "absolute";
      el.style.left = (r.left - c.left) + "px";
      el.style.top = (r.top - c.top) + "px";
      el.style.right = "auto";
      el.style.bottom = "auto";
      el.style.transform = "none";
    }

    function clampMove(el,left,top){
      const maxX = Math.max(0, card.clientWidth - el.offsetWidth);
      const maxY = Math.max(0, card.clientHeight - el.offsetHeight);
      el.style.left = Math.max(0, Math.min(maxX, left)) + "px";
      el.style.top = Math.max(0, Math.min(maxY, top)) + "px";
    }

    function localRect(el){
      const c = card.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      return {
        left:r.left-c.left,
        top:r.top-c.top,
        right:r.right-c.left,
        bottom:r.bottom-c.top,
        cx:r.left-c.left+r.width/2,
        cy:r.top-c.top+r.height/2,
        width:r.width,
        height:r.height
      };
    }

    function getPercent(el){
      const r = localRect(el);
      return {
        x:Math.round((r.left / Math.max(1, card.clientWidth-r.width)) * 100),
        y:Math.round((r.top / Math.max(1, card.clientHeight-r.height)) * 100)
      };
    }

    function setPercent(el,x,y){
      normalize(el);
      clampMove(el, (card.clientWidth-el.offsetWidth)*x/100, (card.clientHeight-el.offsetHeight)*y/100);
    }

    function hideGuides(){
      vGuide.classList.remove("show");
      hGuide.classList.remove("show");
    }

    function showGuideX(x){
      vGuide.style.left = Math.round(x) + "px";
      vGuide.classList.add("show");
    }

    function showGuideY(y){
      hGuide.style.top = Math.round(y) + "px";
      hGuide.classList.add("show");
    }

    function snapElement(el){
      if(!snapOn) return;
      hideGuides();

      const r = localRect(el);
      let left = parseFloat(el.style.left || 0);
      let top = parseFloat(el.style.top || 0);

      const tx = [28, card.clientWidth/2, card.clientWidth-28];
      const ty = [28, card.clientHeight/2, card.clientHeight-28];

      [...card.querySelectorAll(".label-pill,.title,.sub,.footer,.qr-box")].forEach(other => {
        if(other === el) return;
        const o = localRect(other);
        tx.push(o.left,o.cx,o.right);
        ty.push(o.top,o.cy,o.bottom);
      });

      let bx = null;
      [r.left,r.cx,r.right].forEach(v => tx.forEach(t => {
        const d = t - v;
        if(Math.abs(d) <= 7 && (!bx || Math.abs(d) < Math.abs(bx.d))) bx = {d,t};
      }));

      if(bx){
        left += bx.d;
        el.style.left = left + "px";
        showGuideX(bx.t);
      }

      const r2 = localRect(el);
      let by = null;
      [r2.top,r2.cy,r2.bottom].forEach(v => ty.forEach(t => {
        const d = t - v;
        if(Math.abs(d) <= 7 && (!by || Math.abs(d) < Math.abs(by.d))) by = {d,t};
      }));

      if(by){
        top += by.d;
        el.style.top = top + "px";
        showGuideY(by.t);
      }
    }

    function selectLayer(layer, keepPanel){
      selected = typeof layer === "string" ? $(layer) : layer;
      if(!selected) return;

      layers.forEach(([id]) => $(id)?.classList.remove("fsx-selected"));
      selected.classList.add("fsx-selected");

      side.querySelectorAll("[data-layer]").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.layer === selected.id);
      });

      renderToolbar();
      if(!keepPanel) renderPanel();
      syncControls();
    }

    function renderToolbar(){
      const isQr = selected.id === "qrBox";
      const options = layers.map(([id,name]) => `<option value="${id}">${name}</option>`).join("");

      if(isQr){
        workbar.innerHTML = `
          <select id="fsxTopLayer" class="fsx-top-select">${options}</select>

          <label class="fsx-top-control">Box <input id="fsxTopQrSize" type="range" min="60" max="250"></label>
          <label class="fsx-top-control">Corner <input id="fsxTopRadius" type="range" min="0" max="90"></label>
          <label class="fsx-top-control">Scale <input id="fsxTopQrScale" type="range" min="45" max="95"></label>
          <label class="fsx-top-control">BG <input id="fsxTopQrBg" type="color"></label>

          <button type="button" id="fsxTopCenter">Center</button>
          <button type="button" id="fsxTopFront">Front</button>
          <button type="button" id="fsxTopUpload">Upload QR</button>

          <span class="fsx-toolbar-spacer"></span>
          <button type="button" class="primary" id="fsxTopDownload">Download PNG</button>
          <button type="button" id="fsxTopTheme" class="fsx-theme-round">☾</button>
        `;
      } else {
        workbar.innerHTML = `
          <select id="fsxTopLayer" class="fsx-top-select">${options}</select>

          <select id="fsxTopFont" class="fsx-top-select fsx-font-select">
            <option value="Inter">Inter</option>
            <option value="Arial">Arial</option>
            <option value="Georgia">Georgia</option>
            <option value="Trebuchet MS">Trebuchet</option>
            <option value="Impact">Impact</option>
          </select>

          <select id="fsxTopWeight" class="fsx-top-select fsx-weight-select">
            <option value="500">Normal</option>
            <option value="700">Bold</option>
            <option value="900">Black</option>
          </select>

          <label class="fsx-top-control">Size <input id="fsxTopSize" type="range" min="8" max="92"></label>
          <label class="fsx-top-control">Color <input id="fsxTopColor" type="color"></label>

          <button type="button" id="fsxTopLeft">Left</button>
          <button type="button" id="fsxTopCenter">Center</button>
          <button type="button" id="fsxTopRight">Right</button>
          <button type="button" id="fsxTopFront">Front</button>

          <span class="fsx-toolbar-spacer"></span>
          <button type="button" class="primary" id="fsxTopDownload">Download PNG</button>
          <button type="button" id="fsxTopTheme" class="fsx-theme-round">☾</button>
        `;
      }

      $("fsxTopLayer").value = selected.id;
      $("fsxTopLayer").addEventListener("change", () => selectLayer($("fsxTopLayer").value));

      $("fsxTopCenter").addEventListener("click", centerX);
      $("fsxTopFront").addEventListener("click", bringFront);
      $("fsxTopDownload").addEventListener("click", download);
      $("fsxTopTheme").addEventListener("click", toggleTheme);

      const cs = getComputedStyle(selected);

      if(isQr){
        const radius = parseInt(cs.borderRadius,10) || 0;
        const scale = parseInt(qrImage.style.width,10) || 74;

        $("fsxTopQrSize").value = selected.offsetWidth;
        $("fsxTopRadius").value = radius;
        $("fsxTopQrScale").value = scale;
        $("fsxTopQrBg").value = rgbToHex(cs.backgroundColor);

        $("fsxTopUpload").addEventListener("click", uploadQr);
        $("fsxTopQrSize").addEventListener("input", () => setQrSize($("fsxTopQrSize").value));
        $("fsxTopRadius").addEventListener("input", () => setQrRadius($("fsxTopRadius").value));
        $("fsxTopQrScale").addEventListener("input", () => setQrScale($("fsxTopQrScale").value));
        $("fsxTopQrBg").addEventListener("input", () => {
          qrBox.style.background = $("fsxTopQrBg").value;
          if($("fsxQrBg")) $("fsxQrBg").value = $("fsxTopQrBg").value;
        });
      } else {
        const size = parseInt(cs.fontSize,10) || 20;
        const color = rgbToHex(cs.color);
        const font = cleanFont(cs.fontFamily);
        const weight = String(Math.min(900, Math.max(500, parseInt(cs.fontWeight,10) || 700)));

        $("fsxTopFont").value = font;
        $("fsxTopWeight").value = weight;
        $("fsxTopSize").value = size;
        $("fsxTopColor").value = color;

        $("fsxTopFont").addEventListener("change", () => setTextFont($("fsxTopFont").value));
        $("fsxTopWeight").addEventListener("change", () => {
          selected.style.fontWeight = $("fsxTopWeight").value;
          if($("fsxWeight")) $("fsxWeight").value = $("fsxTopWeight").value;
        });
        $("fsxTopSize").addEventListener("input", () => setTextSize($("fsxTopSize").value));
        $("fsxTopColor").addEventListener("input", () => setTextColor($("fsxTopColor").value));
        $("fsxTopLeft").addEventListener("click", () => { selected.style.textAlign = "left"; });
        $("fsxTopRight").addEventListener("click", () => { selected.style.textAlign = "right"; });
      }

      applyTheme(localStorage.getItem(themeKey) || "light");
    }
    function renderPanel(){
      const body = $("fsxBody");
      const isQr = selected.id === "qrBox";
      const name = layerName(selected.id);

      if(isQr){
        body.innerHTML = `
          <div class="fsx-card">
            <div class="fsx-title"><b>QR</b><span>upload + resize</span></div>
            <div class="fsx-grid2">
              <button type="button" class="fsx-primary" id="fsxUploadQr">Upload QR</button>
              <button type="button" id="fsxUseQr">Use generated</button>
            </div>
            <div class="fsx-grid2">
              <label>Box <em id="fsxQrSizeVal">0</em><input id="fsxQrSize" type="range" min="60" max="250" value="120"></label>
              <label>Corner <em id="fsxRadiusVal">0</em><input id="fsxRadius" type="range" min="0" max="90" value="24"></label>
            </div>
            <div class="fsx-grid2">
              <label>QR scale <em id="fsxQrScaleVal">74</em><input id="fsxQrScale" type="range" min="45" max="95" value="74"></label>
              <label>BG<input id="fsxQrBg" type="color" value="#ffffff"></label>
            </div>
            <button type="button" class="fsx-wide" id="fsxClearQr">Clear QR</button>
          </div>
          ${moveCardHtml()}
          ${finishCardHtml()}
        `;

        $("fsxUploadQr").addEventListener("click", uploadQr);
        $("fsxUseQr").addEventListener("click", useGeneratedQr);
        $("fsxClearQr").addEventListener("click", clearQr);
        $("fsxQrSize").addEventListener("input", () => setQrSize($("fsxQrSize").value));
        $("fsxRadius").addEventListener("input", () => setQrRadius($("fsxRadius").value));
        $("fsxQrScale").addEventListener("input", () => setQrScale($("fsxQrScale").value));
        $("fsxQrBg").addEventListener("input", () => { qrBox.style.background = $("fsxQrBg").value; });
      } else {
        body.innerHTML = `
          <div class="fsx-card">
            <div class="fsx-title"><b>${name}</b><span>text layer</span></div>
            <label>Content<textarea id="fsxText"></textarea></label>
            <div class="fsx-grid2">
              <label>Font<select id="fsxFont"><option value="Inter">Inter</option><option value="Arial">Arial</option><option value="Georgia">Georgia</option><option value="Trebuchet MS">Trebuchet</option><option value="Impact">Impact</option></select></label>
              <label>Weight<select id="fsxWeight"><option value="500">Normal</option><option value="700">Bold</option><option value="900">Black</option></select></label>
            </div>
            <div class="fsx-grid2">
              <label>Size <em id="fsxSizeVal">0</em><input id="fsxSize" type="range" min="8" max="92" value="30"></label>
              <label>Color<input id="fsxColor" type="color" value="#101423"></label>
            </div>
            <div class="fsx-grid3">
              <button type="button" data-align="left">Left</button>
              <button type="button" data-align="center">Center</button>
              <button type="button" data-align="right">Right</button>
            </div>
          </div>
          <div class="fsx-card">
            <div class="fsx-title"><b>Polish</b><span>optional</span></div>
            <div class="fsx-grid2">
              <label>Opacity <em id="fsxOpacityVal">100</em><input id="fsxOpacity" type="range" min="20" max="100" value="100"></label>
              <label>Letter <em id="fsxLetterVal">0</em><input id="fsxLetter" type="range" min="-2" max="8" step=".5" value="0"></label>
            </div>
            <label>Line height <em id="fsxLineVal">1.2</em><input id="fsxLine" type="range" min=".8" max="2.2" step=".1" value="1.2"></label>
          </div>
          ${moveCardHtml()}
          ${finishCardHtml()}
        `;

        $("fsxText").addEventListener("input", () => { selected.textContent = $("fsxText").value; });
        $("fsxFont").addEventListener("change", () => setTextFont($("fsxFont").value));
        $("fsxWeight").addEventListener("change", () => { selected.style.fontWeight = $("fsxWeight").value; });
        $("fsxSize").addEventListener("input", () => setTextSize($("fsxSize").value));
        $("fsxColor").addEventListener("input", () => setTextColor($("fsxColor").value));
        $("fsxOpacity").addEventListener("input", () => {
          selected.style.opacity = Number($("fsxOpacity").value)/100;
          $("fsxOpacityVal").textContent = $("fsxOpacity").value;
        });
        $("fsxLetter").addEventListener("input", () => {
          selected.style.letterSpacing = $("fsxLetter").value + "px";
          $("fsxLetterVal").textContent = $("fsxLetter").value;
        });
        $("fsxLine").addEventListener("input", () => {
          selected.style.lineHeight = $("fsxLine").value;
          $("fsxLineVal").textContent = Number($("fsxLine").value).toFixed(1);
        });
        body.querySelectorAll("[data-align]").forEach(btn => {
          btn.addEventListener("click", () => { selected.style.textAlign = btn.dataset.align; });
        });
      }

      $("fsxX").addEventListener("input", () => { setPercent(selected, Number($("fsxX").value), Number($("fsxY").value)); syncControls(); });
      $("fsxY").addEventListener("input", () => { setPercent(selected, Number($("fsxX").value), Number($("fsxY").value)); syncControls(); });

      body.querySelectorAll("[data-nudge]").forEach(btn => {
        btn.addEventListener("click", () => {
          normalize(selected);
          const [dx,dy] = btn.dataset.nudge.split(",").map(Number);
          if(dx === 0 && dy === 0) setPercent(selected,50,50);
          else clampMove(selected, parseFloat(selected.style.left || 0)+dx*8, parseFloat(selected.style.top || 0)+dy*8);
          syncControls();
        });
      });

      $("fsxLeft").addEventListener("click", () => { normalize(selected); clampMove(selected,28,parseFloat(selected.style.top || 0)); syncControls(); });
      $("fsxCenter").addEventListener("click", centerX);
      $("fsxRight").addEventListener("click", () => { normalize(selected); clampMove(selected,card.clientWidth-selected.offsetWidth-28,parseFloat(selected.style.top || 0)); syncControls(); });
      $("fsxMiddle").addEventListener("click", () => { setPercent(selected,getPercent(selected).x,50); syncControls(); });
      $("fsxFront").addEventListener("click", bringFront);
      $("fsxBack").addEventListener("click", () => { selected.style.zIndex = "3"; });
      $("fsxSnap").addEventListener("click", () => {
        snapOn = !snapOn;
        $("fsxSnap").textContent = snapOn ? "Snap guides: on" : "Snap guides: off";
        hideGuides();
      });

      $("fsxDownload").addEventListener("click", download);
      $("fsxSave").addEventListener("click", saveLayout);
      $("fsxReset").addEventListener("click", () => { localStorage.removeItem(layoutKey); location.reload(); });
      $("fsxHide").addEventListener("click", hideOutline);
    }

    function moveCardHtml(){
      return `
        <div class="fsx-card">
          <div class="fsx-title"><b>Position</b><span>same for every element</span></div>
          <div class="fsx-grid2">
            <label>X <em id="fsxXVal">0</em><input id="fsxX" type="range" min="0" max="100" value="50"></label>
            <label>Y <em id="fsxYVal">0</em><input id="fsxY" type="range" min="0" max="100" value="50"></label>
          </div>
          <div class="fsx-nudge">
            <span></span><button type="button" data-nudge="0,-1">↑</button><span></span>
            <button type="button" data-nudge="-1,0">←</button><button type="button" data-nudge="0,0">•</button><button type="button" data-nudge="1,0">→</button>
            <span></span><button type="button" data-nudge="0,1">↓</button><span></span>
          </div>
        </div>

        <div class="fsx-card">
          <div class="fsx-title"><b>Align</b><span>quick</span></div>
          <div class="fsx-grid4">
            <button type="button" id="fsxLeft">Left</button>
            <button type="button" id="fsxCenter">Center</button>
            <button type="button" id="fsxRight">Right</button>
            <button type="button" id="fsxMiddle">Middle</button>
          </div>
          <div class="fsx-grid2" style="margin-top:10px">
            <button type="button" id="fsxFront">Front</button>
            <button type="button" id="fsxBack">Back</button>
          </div>
          <button type="button" class="fsx-wide" id="fsxSnap">Snap guides: on</button>
        </div>
      `;
    }

    function finishCardHtml(){
      return `
        <div class="fsx-card">
          <div class="fsx-title"><b>Finish</b><span>local only</span></div>
          <div class="fsx-grid2">
            <button type="button" class="fsx-primary" id="fsxDownload">Download PNG</button>
            <button type="button" id="fsxSave">Save layout</button>
            <button type="button" id="fsxReset">Reset layout</button>
            <button type="button" id="fsxHide">Hide outline</button>
          </div>
        </div>
      `;
    }

    function syncControls(){
      if(!selected) return;

      const p = getPercent(selected);
      if($("fsxX")) $("fsxX").value = p.x;
      if($("fsxY")) $("fsxY").value = p.y;
      if($("fsxXVal")) $("fsxXVal").textContent = p.x;
      if($("fsxYVal")) $("fsxYVal").textContent = p.y;

      const cs = getComputedStyle(selected);

      if($("fsxTopLayer")) $("fsxTopLayer").value = selected.id;

      if(selected.id === "qrBox"){
        const radius = parseInt(cs.borderRadius,10) || 0;
        const scale = parseInt(qrImage.style.width,10) || 74;

        if($("fsxQrSize")) $("fsxQrSize").value = selected.offsetWidth;
        if($("fsxQrSizeVal")) $("fsxQrSizeVal").textContent = selected.offsetWidth;
        if($("fsxTopQrSize")) $("fsxTopQrSize").value = selected.offsetWidth;

        if($("fsxRadius")) $("fsxRadius").value = radius;
        if($("fsxRadiusVal")) $("fsxRadiusVal").textContent = radius;
        if($("fsxTopRadius")) $("fsxTopRadius").value = radius;

        if($("fsxQrBg")) $("fsxQrBg").value = rgbToHex(cs.backgroundColor);

        if($("fsxQrScale")) $("fsxQrScale").value = scale;
        if($("fsxQrScaleVal")) $("fsxQrScaleVal").textContent = scale;
        if($("fsxTopQrScale")) $("fsxTopQrScale").value = scale;
        return;
      }

      const size = parseInt(cs.fontSize,10) || 20;
      const color = rgbToHex(cs.color);
      const font = cleanFont(cs.fontFamily);

      if($("fsxText")) $("fsxText").value = selected.textContent.trim();
      if($("fsxFont")) $("fsxFont").value = font;
      if($("fsxTopFont")) $("fsxTopFont").value = font;

      if($("fsxWeight")) $("fsxWeight").value = String(Math.min(900, Math.max(500, parseInt(cs.fontWeight,10) || 700)));

      if($("fsxSize")) $("fsxSize").value = size;
      if($("fsxSizeVal")) $("fsxSizeVal").textContent = size;
      if($("fsxTopSize")) $("fsxTopSize").value = size;

      if($("fsxColor")) $("fsxColor").value = color;
      if($("fsxTopColor")) $("fsxTopColor").value = color;

      if($("fsxOpacity")) $("fsxOpacity").value = Math.round((parseFloat(cs.opacity) || 1) * 100);
      if($("fsxOpacityVal")) $("fsxOpacityVal").textContent = $("fsxOpacity").value;

      if($("fsxLetter")) $("fsxLetter").value = parseFloat(cs.letterSpacing) || 0;
      if($("fsxLetterVal")) $("fsxLetterVal").textContent = $("fsxLetter").value;

      if($("fsxLine")) $("fsxLine").value = parseFloat(cs.lineHeight) || 1.2;
      if($("fsxLineVal")) $("fsxLineVal").textContent = Number($("fsxLine").value).toFixed(1);
    }

    function setTextFont(v){
      if(selected.id !== "qrBox") selected.style.fontFamily = v;
    }

    function setTextSize(v){
      if(selected.id !== "qrBox"){
        selected.style.fontSize = v + "px";
        if($("fsxSize")) $("fsxSize").value = v;
        if($("fsxTopSize")) $("fsxTopSize").value = v;
        if($("fsxSizeVal")) $("fsxSizeVal").textContent = v;
      }
    }

    function setTextColor(v){
      if(selected.id !== "qrBox"){
        selected.style.color = v;
        if($("fsxColor")) $("fsxColor").value = v;
        if($("fsxTopColor")) $("fsxTopColor").value = v;
      }
    }

    function setQrSize(v){
      qrBox.style.width = v + "px";
      qrBox.style.height = v + "px";
      if($("fsxQrSize")) $("fsxQrSize").value = v;
      if($("fsxTopQrSize")) $("fsxTopQrSize").value = v;
      if($("fsxQrSizeVal")) $("fsxQrSizeVal").textContent = v;
      syncControls();
    }

    function setQrRadius(v){
      qrBox.style.borderRadius = v + "px";
      if($("fsxRadius")) $("fsxRadius").value = v;
      if($("fsxTopRadius")) $("fsxTopRadius").value = v;
      if($("fsxRadiusVal")) $("fsxRadiusVal").textContent = v;
    }

    function setQrScale(v){
      qrImage.style.width = v + "%";
      qrImage.style.height = v + "%";
      if($("fsxQrScale")) $("fsxQrScale").value = v;
      if($("fsxTopQrScale")) $("fsxTopQrScale").value = v;
      if($("fsxQrScaleVal")) $("fsxQrScaleVal").textContent = v;
    }

    function centerX(){
      setPercent(selected,50,getPercent(selected).y);
      syncControls();
    }

    function bringFront(){
      selected.style.zIndex = String(Math.max(30, Number(selected.style.zIndex || 7)+1));
    }

    function uploadQr(){
      qrUpload.click();
    }

    function useGeneratedQr(){
      const saved = localStorage.getItem("flowsync_current_qr");
      if(!saved) return;
      qrImage.src = saved;
      qrBox.classList.add("has-qr");
    }

    function clearQr(){
      qrImage.removeAttribute("src");
      qrBox.classList.remove("has-qr");
    }

    qrUpload.addEventListener("change", () => {
      const file = qrUpload.files && qrUpload.files[0];
      if(!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        qrImage.src = reader.result;
        qrBox.classList.add("has-qr");
      };
      reader.readAsDataURL(file);
    });

    function hideOutline(){
      layers.forEach(([id]) => $(id)?.classList.remove("fsx-selected"));
      hideGuides();
    }

    function download(){
      hideOutline();
      document.getElementById("downloadBtn")?.click();
    }

    $("fsxRailDownload").addEventListener("click", download);

    function saveLayout(){
      const data = { qrImageStyle:{width:qrImage.style.width,height:qrImage.style.height} };
      layers.forEach(([idLayer]) => {
        const el = $(idLayer);
        if(!el) return;
        data[idLayer] = {
          text:idLayer === "qrBox" ? "" : el.textContent,
          style:{
            left:el.style.left,
            top:el.style.top,
            right:el.style.right,
            bottom:el.style.bottom,
            width:el.style.width,
            height:el.style.height,
            fontFamily:el.style.fontFamily,
            fontSize:el.style.fontSize,
            fontWeight:el.style.fontWeight,
            color:el.style.color,
            textAlign:el.style.textAlign,
            background:el.style.background,
            borderRadius:el.style.borderRadius,
            zIndex:el.style.zIndex,
            transform:el.style.transform,
            opacity:el.style.opacity,
            letterSpacing:el.style.letterSpacing,
            lineHeight:el.style.lineHeight
          }
        };
      });
      localStorage.setItem(layoutKey, JSON.stringify(data));
    }

    function loadLayout(){
      const raw = localStorage.getItem(layoutKey);
      if(!raw) return;
      try{
        const data = JSON.parse(raw);
        Object.entries(data).forEach(([key,saved]) => {
          const el = $(key);
          if(!el || !saved || !saved.style) return;
          if(key !== "qrBox" && saved.text) el.textContent = saved.text;
          Object.assign(el.style, saved.style);
        });
        if(data.qrImageStyle) Object.assign(qrImage.style, data.qrImageStyle);
      }catch(e){}
    }

    function enterTextEdit(el){
      if(!isText(el)) return;

      selected = el;
      el.classList.add("fsx-selected","fsx-editing");
      el.setAttribute("contenteditable","true");
      el.focus();
      selectLayer(el,true);

      const range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    }

    textIds.forEach(idText => {
      const el = $(idText);
      if(!el) return;
      el.setAttribute("contenteditable","false");
      el.addEventListener("blur", () => {
        el.setAttribute("contenteditable","false");
        el.classList.remove("fsx-editing");
        syncControls();
      });
      el.addEventListener("keydown", e => {
        if(e.key === "Escape"){
          e.preventDefault();
          el.blur();
        }
      });
      el.addEventListener("input", syncControls);
    });

    side.querySelectorAll("[data-layer]").forEach(btn => {
      btn.addEventListener("click", () => selectLayer(btn.dataset.layer));
    });

    function startDrag(target,event){
      if(!target || target.classList.contains("fsx-editing")) return;
      selectLayer(target,true);
      drag = { el:target, sx:event.clientX, sy:event.clientY, left:0, top:0, active:false, moved:false };
    }

    function moveDrag(event){
      if(!drag) return;
      const dx = event.clientX - drag.sx;
      const dy = event.clientY - drag.sy;
      const dist = Math.sqrt(dx*dx + dy*dy);

      if(!drag.active && dist > 5){
        event.preventDefault();
        normalize(drag.el);
        drag.left = parseFloat(drag.el.style.left || 0);
        drag.top = parseFloat(drag.el.style.top || 0);
        drag.active = true;
        drag.moved = true;
        document.body.style.cursor = "grabbing";
      }

      if(!drag.active) return;

      event.preventDefault();
      clampMove(drag.el, drag.left+dx, drag.top+dy);
      snapElement(drag.el);
      syncControls();
    }

    function stopDrag(){
      if(!drag) return;

      const target = drag.el;
      const moved = drag.moved;
      drag = null;
      document.body.style.cursor = "";
      setTimeout(hideGuides,80);

      if(moved) return;

      const now = Date.now();

      if(target.id === "qrBox"){
        selectLayer(target);
        return;
      }

      if(isText(target)){
        if(lastTap.id === target.id && now-lastTap.time < 350){
          enterTextEdit(target);
        }
        lastTap = {id:target.id,time:now};
      }
    }

    card.addEventListener("pointerdown", event => {
      const target = event.target.closest(".label-pill,.title,.sub,.footer,.qr-box");
      if(!target || !card.contains(target) || target.classList.contains("fsx-editing")) return;
      startDrag(target,event);
    });

    document.addEventListener("pointermove", moveDrag, {passive:false});
    document.addEventListener("pointerup", stopDrag, true);
    document.addEventListener("pointercancel", stopDrag, true);
    window.addEventListener("blur", stopDrag);

    card.addEventListener("dblclick", event => {
      const target = event.target.closest(".label-pill,.title,.sub,.footer,.qr-box");
      if(!target || !card.contains(target)) return;
      event.preventDefault();

      if(target.id === "qrBox"){
        selectLayer(qrBox);
        return;
      }

      enterTextEdit(target);
    });

    const savedQr = localStorage.getItem("flowsync_current_qr");
    if(savedQr){
      qrImage.src = savedQr;
      qrBox.classList.add("has-qr");
    }

    loadLayout();
    selectLayer("qrBox");
  });

  function installQrBridge(){
    if(window.__flowsyncQrBridgeInstalled) return;
    window.__flowsyncQrBridgeInstalled = true;

    document.addEventListener("click", event => {
      const link = event.target.closest('a[href*="fs-tamplate/templates"],a[href*="./templates"],a[href*="templates/"]');
      if(!link) return;

      const qr = [...document.querySelectorAll("canvas,svg,img")]
        .filter(el => {
          const r = el.getBoundingClientRect();
          return r.width > 80 && r.height > 80 && el.offsetParent !== null;
        })
        .sort((a,b) => {
          const ar = a.getBoundingClientRect();
          const br = b.getBoundingClientRect();
          return (br.width*br.height) - (ar.width*ar.height);
        })[0];

      if(!qr) return;

      try{
        if(qr.tagName.toLowerCase() === "canvas"){
          localStorage.setItem("flowsync_current_qr", qr.toDataURL("image/png"));
        }else if(qr.tagName.toLowerCase() === "svg"){
          localStorage.setItem("flowsync_current_qr", "data:image/svg+xml;charset=utf-8," + encodeURIComponent(new XMLSerializer().serializeToString(qr)));
        }else if(qr.tagName.toLowerCase() === "img" && qr.src && qr.src.startsWith("data:")){
          localStorage.setItem("flowsync_current_qr", qr.src);
        }
      }catch(e){}
    }, true);
  }
})();