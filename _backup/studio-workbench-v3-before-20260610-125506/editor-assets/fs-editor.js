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

    installGlobalTheme();
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

    editor.querySelectorAll(".fsx-panel").forEach(el => el.remove());
    preview.querySelectorAll(".fsx-workbar").forEach(el => el.remove());

    const layers = [
      ["cardLabel","Label"],
      ["cardTitle","Title"],
      ["cardSub","Subtitle"],
      ["cardFooter","Footer"],
      ["qrBox","QR"]
    ];

    const textIds = ["cardLabel","cardTitle","cardSub","cardFooter"];
    const layoutKey = "flowsync_workbench_layout_" + location.pathname;

    let selected = qrBox;
    let drag = null;
    let lastTap = { id:"", time:0 };
    let snapOn = true;

    const workbar = document.createElement("div");
    workbar.className = "fsx-workbar";
    workbar.innerHTML = `
      <a href="../../../index.html">Home</a>
      <a href="../index.html">Templates</a>
      <span class="fsx-divider"></span>
      <select id="fsxTopLayer">${layers.map(([id,name]) => `<option value="${id}">${name}</option>`).join("")}</select>
      <button type="button" data-tab="move">Move</button>
      <button type="button" data-tab="text">Text</button>
      <button type="button" data-tab="qr">QR</button>
      <button type="button" data-tab="finish">Finish</button>
      <span class="fsx-divider"></span>
      <button type="button" id="fsxTopUpload">Upload QR</button>
      <button type="button" class="primary" id="fsxTopDownload">Download</button>
      <button type="button" id="fsxTopTheme">☾</button>
    `;
    preview.appendChild(workbar);

    const panel = document.createElement("div");
    panel.className = "fsx-panel";
    panel.innerHTML = `
      <div class="fsx-side-head">
        <b>FlowSync Studio</b>
        <small>Canva-style workbench. Use the top bar for fast actions, side panel for details.</small>
        <div class="fsx-nav-row">
          <a href="../../../index.html">Home</a>
          <a href="../index.html">Templates</a>
        </div>
        <div class="fsx-status"><span>Selected</span><strong id="fsxSelectedName">QR</strong></div>
      </div>

      <div class="fsx-mode-row">
        <button type="button" class="active" data-tab="move">Move</button>
        <button type="button" data-tab="text">Text</button>
        <button type="button" data-tab="qr">QR</button>
        <button type="button" data-tab="finish">Finish</button>
      </div>

      <div class="fsx-body">
        <section class="fsx-section active" data-section="move">
          <div class="fsx-card">
            <div class="fsx-title"><b>Layer</b><span>choose item</span></div>
            <label>Select
              <select id="fsxLayer">${layers.map(([id,name]) => `<option value="${id}">${name}</option>`).join("")}</select>
            </label>
          </div>

          <div class="fsx-card">
            <div class="fsx-title"><b>Position</b><span>drag or adjust</span></div>
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
          </div>

          <div class="fsx-grid2">
            <button type="button" id="fsxFront">Front</button>
            <button type="button" id="fsxBack">Back</button>
          </div>
          <button type="button" class="fsx-wide" id="fsxSnap">Snap guides: on</button>
          <p class="fsx-help">Drag directly on the card. Purple guides show alignment.</p>
        </section>

        <section class="fsx-section" data-section="text">
          <div class="fsx-card">
            <div class="fsx-title"><b>Text</b><span>selected layer</span></div>
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
        </section>

        <section class="fsx-section" data-section="qr">
          <div class="fsx-card">
            <div class="fsx-title"><b>QR</b><span>safe upload</span></div>
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
        </section>

        <section class="fsx-section" data-section="finish">
          <div class="fsx-card">
            <div class="fsx-title"><b>Finish</b><span>export</span></div>
            <div class="fsx-grid2">
              <button type="button" class="fsx-primary" id="fsxDownload">Download PNG</button>
              <button type="button" id="fsxSave">Save layout</button>
              <button type="button" id="fsxReset">Reset layout</button>
              <button type="button" id="fsxHide">Hide outline</button>
            </div>
          </div>
          <p class="fsx-help">Save is local browser only. No backend needed.</p>
        </section>
      </div>
    `;
    editor.appendChild(panel);

    const vGuide = document.createElement("div");
    const hGuide = document.createElement("div");
    vGuide.className = "fsx-guide v";
    hGuide.className = "fsx-guide h";
    card.append(vGuide,hGuide);

    const $ = id => document.getElementById(id);
    const isText = el => el && textIds.includes(el.id);

    function setStatus(name){
      $("fsxSelectedName").textContent = name;
    }

    function applyTheme(theme){
      document.body.classList.toggle("fsx-dark", theme === "dark");
      localStorage.setItem(themeKey, theme);
      const label = theme === "dark" ? "☀ Light" : "☾ Dark";
      const small = theme === "dark" ? "☀" : "☾";
      const topTheme = $("fsxTopTheme");
      if(topTheme) topTheme.textContent = small;
      document.querySelectorAll(".fs-theme-toggle").forEach(btn => btn.textContent = small);
    }

    applyTheme(localStorage.getItem(themeKey) || "light");

    function toggleTheme(){
      applyTheme(document.body.classList.contains("fsx-dark") ? "light" : "dark");
    }

    $("fsxTopTheme").addEventListener("click", toggleTheme);

    function switchTab(tab){
      document.querySelectorAll("[data-tab]").forEach(btn => btn.classList.toggle("active", btn.dataset.tab === tab));
      panel.querySelectorAll("[data-section]").forEach(sec => sec.classList.toggle("active", sec.dataset.section === tab));
    }

    document.querySelectorAll("[data-tab]").forEach(btn => {
      btn.addEventListener("click", () => switchTab(btn.dataset.tab));
    });

    function cleanSelection(){
      layers.forEach(([id]) => $(id)?.classList.remove("fsx-selected"));
    }

    function selectLayer(layer, keepTab){
      selected = typeof layer === "string" ? $(layer) : layer;
      if(!selected) return;

      cleanSelection();
      selected.classList.add("fsx-selected");

      const found = layers.find(x => x[0] === selected.id);
      const name = found ? found[1] : "Layer";
      setStatus(name);

      if($("fsxLayer")) $("fsxLayer").value = selected.id;
      if($("fsxTopLayer")) $("fsxTopLayer").value = selected.id;

      syncControls();

      if(!keepTab){
        switchTab(selected.id === "qrBox" ? "qr" : "text");
      }
    }

    $("fsxLayer").addEventListener("change", () => selectLayer($("fsxLayer").value));
    $("fsxTopLayer").addEventListener("change", () => selectLayer($("fsxTopLayer").value));

    function rgbToHex(rgb){
      const nums = rgb.match(/\d+/g);
      if(!nums) return "#101423";
      return "#" + nums.slice(0,3).map(n => Number(n).toString(16).padStart(2,"0")).join("");
    }

    function cleanFont(font){
      const f = font.split(",")[0].replaceAll('"',"").trim();
      return [...$("fsxFont").options].some(o => o.value === f) ? f : "Inter";
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

    function syncControls(){
      if(!selected) return;

      const p = getPercent(selected);
      $("fsxX").value = p.x;
      $("fsxY").value = p.y;
      $("fsxXVal").textContent = p.x;
      $("fsxYVal").textContent = p.y;

      const cs = getComputedStyle(selected);

      if(selected.id === "qrBox"){
        $("fsxQrSize").value = selected.offsetWidth;
        $("fsxQrSizeVal").textContent = selected.offsetWidth;
        $("fsxRadius").value = parseInt(cs.borderRadius,10) || 0;
        $("fsxRadiusVal").textContent = $("fsxRadius").value;
        $("fsxQrBg").value = rgbToHex(cs.backgroundColor);
        const scale = parseInt(qrImage.style.width,10) || 74;
        $("fsxQrScale").value = scale;
        $("fsxQrScaleVal").textContent = scale;
        return;
      }

      $("fsxText").value = selected.textContent.trim();
      $("fsxFont").value = cleanFont(cs.fontFamily);
      $("fsxWeight").value = String(Math.min(900, Math.max(500, parseInt(cs.fontWeight,10) || 700)));
      $("fsxSize").value = parseInt(cs.fontSize,10) || 20;
      $("fsxSizeVal").textContent = $("fsxSize").value;
      $("fsxColor").value = rgbToHex(cs.color);
      $("fsxOpacity").value = Math.round((parseFloat(cs.opacity) || 1) * 100);
      $("fsxOpacityVal").textContent = $("fsxOpacity").value;
      $("fsxLetter").value = parseFloat(cs.letterSpacing) || 0;
      $("fsxLetterVal").textContent = $("fsxLetter").value;
      $("fsxLine").value = parseFloat(cs.lineHeight) || 1.2;
      $("fsxLineVal").textContent = Number($("fsxLine").value).toFixed(1);
    }

    function enterTextEdit(el){
      if(!isText(el)) return;

      cleanSelection();
      selected = el;
      el.classList.add("fsx-selected","fsx-editing");
      el.setAttribute("contenteditable","true");
      el.focus();
      selectLayer(el,true);
      switchTab("text");

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

    $("fsxX").addEventListener("input", () => {
      setPercent(selected, Number($("fsxX").value), Number($("fsxY").value));
      syncControls();
    });

    $("fsxY").addEventListener("input", () => {
      setPercent(selected, Number($("fsxX").value), Number($("fsxY").value));
      syncControls();
    });

    panel.querySelectorAll("[data-nudge]").forEach(btn => {
      btn.addEventListener("click", () => {
        normalize(selected);
        const [dx,dy] = btn.dataset.nudge.split(",").map(Number);
        if(dx === 0 && dy === 0) setPercent(selected,50,50);
        else clampMove(selected, parseFloat(selected.style.left || 0)+dx*8, parseFloat(selected.style.top || 0)+dy*8);
        syncControls();
      });
    });

    $("fsxLeft").addEventListener("click", () => {
      normalize(selected);
      clampMove(selected,28,parseFloat(selected.style.top || 0));
      syncControls();
    });

    $("fsxCenter").addEventListener("click", () => {
      setPercent(selected,50,getPercent(selected).y);
      syncControls();
    });

    $("fsxRight").addEventListener("click", () => {
      normalize(selected);
      clampMove(selected,card.clientWidth-selected.offsetWidth-28,parseFloat(selected.style.top || 0));
      syncControls();
    });

    $("fsxMiddle").addEventListener("click", () => {
      setPercent(selected,getPercent(selected).x,50);
      syncControls();
    });

    $("fsxFront").addEventListener("click", () => {
      selected.style.zIndex = String(Math.max(30, Number(selected.style.zIndex || 7)+1));
    });

    $("fsxBack").addEventListener("click", () => {
      selected.style.zIndex = "3";
    });

    $("fsxSnap").addEventListener("click", () => {
      snapOn = !snapOn;
      $("fsxSnap").textContent = snapOn ? "Snap guides: on" : "Snap guides: off";
      hideGuides();
    });

    $("fsxText").addEventListener("input", () => {
      if(selected.id !== "qrBox") selected.textContent = $("fsxText").value;
    });

    $("fsxFont").addEventListener("change", () => {
      if(selected.id !== "qrBox") selected.style.fontFamily = $("fsxFont").value;
    });

    $("fsxWeight").addEventListener("change", () => {
      if(selected.id !== "qrBox") selected.style.fontWeight = $("fsxWeight").value;
    });

    $("fsxSize").addEventListener("input", () => {
      if(selected.id !== "qrBox"){
        selected.style.fontSize = $("fsxSize").value + "px";
        $("fsxSizeVal").textContent = $("fsxSize").value;
      }
    });

    $("fsxColor").addEventListener("input", () => {
      if(selected.id !== "qrBox") selected.style.color = $("fsxColor").value;
    });

    $("fsxOpacity").addEventListener("input", () => {
      if(selected.id !== "qrBox"){
        selected.style.opacity = Number($("fsxOpacity").value)/100;
        $("fsxOpacityVal").textContent = $("fsxOpacity").value;
      }
    });

    $("fsxLetter").addEventListener("input", () => {
      if(selected.id !== "qrBox"){
        selected.style.letterSpacing = $("fsxLetter").value + "px";
        $("fsxLetterVal").textContent = $("fsxLetter").value;
      }
    });

    $("fsxLine").addEventListener("input", () => {
      if(selected.id !== "qrBox"){
        selected.style.lineHeight = $("fsxLine").value;
        $("fsxLineVal").textContent = Number($("fsxLine").value).toFixed(1);
      }
    });

    panel.querySelectorAll("[data-align]").forEach(btn => {
      btn.addEventListener("click", () => {
        if(selected.id !== "qrBox") selected.style.textAlign = btn.dataset.align;
      });
    });

    function uploadQr(){
      qrUpload.click();
    }

    $("fsxUploadQr").addEventListener("click", uploadQr);
    $("fsxTopUpload").addEventListener("click", uploadQr);

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

    $("fsxUseQr").addEventListener("click", () => {
      const saved = localStorage.getItem("flowsync_current_qr");
      if(!saved) return;
      qrImage.src = saved;
      qrBox.classList.add("has-qr");
    });

    $("fsxClearQr").addEventListener("click", () => {
      qrImage.removeAttribute("src");
      qrBox.classList.remove("has-qr");
    });

    $("fsxQrSize").addEventListener("input", () => {
      qrBox.style.width = $("fsxQrSize").value + "px";
      qrBox.style.height = $("fsxQrSize").value + "px";
      $("fsxQrSizeVal").textContent = $("fsxQrSize").value;
      syncControls();
    });

    $("fsxRadius").addEventListener("input", () => {
      qrBox.style.borderRadius = $("fsxRadius").value + "px";
      $("fsxRadiusVal").textContent = $("fsxRadius").value;
    });

    $("fsxQrBg").addEventListener("input", () => {
      qrBox.style.background = $("fsxQrBg").value;
    });

    $("fsxQrScale").addEventListener("input", () => {
      qrImage.style.width = $("fsxQrScale").value + "%";
      qrImage.style.height = $("fsxQrScale").value + "%";
      $("fsxQrScaleVal").textContent = $("fsxQrScale").value;
    });

    function hideOutline(){
      cleanSelection();
      hideGuides();
    }

    $("fsxHide").addEventListener("click", hideOutline);

    function download(){
      hideOutline();
      document.getElementById("downloadBtn")?.click();
    }

    $("fsxDownload").addEventListener("click", download);
    $("fsxTopDownload").addEventListener("click", download);

    $("fsxSave").addEventListener("click", () => {
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
    });

    $("fsxReset").addEventListener("click", () => {
      localStorage.removeItem(layoutKey);
      location.reload();
    });

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

    function startDrag(target,event){
      if(!target || target.classList.contains("fsx-editing")) return;
      selectLayer(target,true);
      drag = {
        el:target,
        sx:event.clientX,
        sy:event.clientY,
        left:0,
        top:0,
        active:false,
        moved:false
      };
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
        switchTab("qr");
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

  function installGlobalTheme(){
    const saved = localStorage.getItem(themeKey) || "light";
    document.body.classList.toggle("fsx-dark", saved === "dark");
  }

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