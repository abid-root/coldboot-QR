
(function () {
  if (window.__flowsyncQrFinalReviewFix) return;
  window.__flowsyncQrFinalReviewFix = true;

  var blackLogo = window.__FS_QR_BLACK_LOGO__ || "assets/common/blackone.webp";
  var whiteLogo = window.__FS_QR_WHITE_LOGO__ || "assets/common/whiteone.webp";

  function currentTheme() {
    var root = document.documentElement;
    var body = document.body;
    var stored = localStorage.getItem("flowsync-qr-theme") || localStorage.getItem("theme");
    var text = [
      stored || "",
      root.getAttribute("data-theme") || "",
      body ? body.getAttribute("data-theme") || "" : "",
      root.className || "",
      body ? body.className || "" : ""
    ].join(" ").toLowerCase();

    if (text.indexOf("light") !== -1) return "light";
    if (text.indexOf("dark") !== -1) return "dark";
    return "dark";
  }

  function setFavicons(src) {
    document.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]').forEach(function (link) {
      link.href = src;
    });
  }

  function applyTheme(theme) {
    var root = document.documentElement;
    var body = document.body;
    var isLight = theme === "light";
    var logoSrc = isLight ? blackLogo : whiteLogo;

    root.setAttribute("data-theme", theme);
    root.classList.toggle("light", isLight);
    root.classList.toggle("dark", !isLight);

    if (body) {
      body.setAttribute("data-theme", theme);
      body.classList.toggle("light", isLight);
      body.classList.toggle("dark", !isLight);
    }

    localStorage.setItem("flowsync-qr-theme", theme);
    localStorage.setItem("theme", theme);

    document.querySelectorAll(".fs-qr-theme-toggle, #themeToggle, .theme-toggle, .theme-btn, [data-theme-toggle], button[aria-label*='theme' i], button[title*='theme' i]").forEach(function (btn) {
      btn.classList.add("fs-qr-theme-toggle");
      btn.setAttribute("type", "button");
      btn.setAttribute("aria-label", isLight ? "Switch to dark theme" : "Switch to light theme");
      btn.textContent = isLight ? "☀" : "☾";
    });

    var logo =
      document.querySelector("[data-logo-dark][data-logo-light]") ||
      document.querySelector(".brand img") ||
      document.querySelector(".logo img") ||
      document.querySelector("header img") ||
      document.querySelector("nav img");

    if (logo) {
      logo.src = logoSrc;
      logo.alt = "FlowSync logo";
      logo.decoding = "async";
    }

    setFavicons(logoSrc);
  }

  function setupTheme() {
    document.querySelectorAll("#themeToggle, .theme-toggle, .theme-btn, [data-theme-toggle], button[aria-label*='theme' i], button[title*='theme' i]").forEach(function (btn) {
      btn.classList.add("fs-qr-theme-toggle");
      btn.setAttribute("type", "button");
    });
    applyTheme(currentTheme());
  }

  document.addEventListener("click", function (event) {
    var btn = event.target.closest(".fs-qr-theme-toggle, #themeToggle, .theme-toggle, .theme-btn, [data-theme-toggle], button[aria-label*='theme' i], button[title*='theme' i]");
    if (!btn) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    var next = currentTheme() === "light" ? "dark" : "light";
    applyTheme(next);
  }, true);

  function visible(el) {
    if (!el) return false;
    var r = el.getBoundingClientRect();
    var s = getComputedStyle(el);
    return r.width > 80 && r.height > 60 && s.display !== "none" && s.visibility !== "hidden" && Number(s.opacity) !== 0;
  }

  function score(el) {
    var r = el.getBoundingClientRect();
    var cls = String(el.className || "").toLowerCase();
    var bonus = 0;
    if (el.id === "card") bonus += 5000;
    if (cls.indexOf("card") !== -1) bonus += 1200;
    if (cls.indexOf("preview") !== -1) bonus += 900;
    if (cls.indexOf("template") !== -1) bonus += 700;
    if (cls.indexOf("stage") !== -1) bonus += 350;
    if (r.width > innerWidth * .9 || r.height > innerHeight * .9) bonus -= 900;
    return bonus + Math.min((r.width * r.height) / 1000, 1200);
  }

  function findExportTarget() {
    var selectors = [
      "#card",
      "[data-export-area]",
      "[data-template-preview]",
      ".template-preview",
      ".template-card",
      ".preview-card",
      ".qr-template",
      ".qr-card",
      ".design-card",
      ".card-preview",
      ".export-area",
      ".canvas-card",
      ".canvas-wrap",
      ".template-stage",
      ".preview-wrap .card",
      "canvas"
    ];

    var candidates = [];
    selectors.forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (el) {
        if (visible(el)) candidates.push(el);
      });
    });

    candidates.sort(function (a, b) { return score(b) - score(a); });
    return candidates[0] || null;
  }

  function copyComputedStyle(source, target) {
    if (source.nodeType !== 1 || target.nodeType !== 1) return;
    var computed = getComputedStyle(source);
    for (var i = 0; i < computed.length; i += 1) {
      var prop = computed[i];
      target.style.setProperty(prop, computed.getPropertyValue(prop), computed.getPropertyPriority(prop));
    }
    target.style.transform = computed.transform === "none" ? "" : computed.transform;
  }

  function cloneForExport(node) {
    if (node instanceof HTMLCanvasElement) {
      var img = document.createElement("img");
      try { img.src = node.toDataURL("image/png"); } catch (e) {}
      img.style.width = node.offsetWidth + "px";
      img.style.height = node.offsetHeight + "px";
      return img;
    }

    var clone = node.cloneNode(false);

    if (node.nodeType === 1) {
      copyComputedStyle(node, clone);

      if (node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement) {
        clone.setAttribute("value", node.value || "");
      }

      Array.prototype.forEach.call(node.childNodes, function (child) {
        if (child.nodeType === 3) {
          clone.appendChild(document.createTextNode(child.textContent));
        } else if (child.nodeType === 1) {
          clone.appendChild(cloneForExport(child));
        }
      });
    }

    return clone;
  }

  function downloadBlob(blob, filename) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      URL.revokeObjectURL(url);
      a.remove();
    }, 800);
  }

  function fileName() {
    var title =
      (document.querySelector("#cardTitle") && document.querySelector("#cardTitle").textContent) ||
      (document.querySelector("h1") && document.querySelector("h1").textContent) ||
      document.title ||
      "flowsync-qr-template";
    return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + ".png";
  }

  function fallbackCanvas(target) {
    var rect = target ? target.getBoundingClientRect() : { width: 900, height: 520 };
    var canvas = document.createElement("canvas");
    canvas.width = Math.max(900, Math.ceil(rect.width * 2));
    canvas.height = Math.max(520, Math.ceil(rect.height * 2));
    var ctx = canvas.getContext("2d");
    ctx.fillStyle = "#f5f7fb";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#111827";
    ctx.font = "700 52px system-ui, sans-serif";
    ctx.fillText((document.querySelector("#cardTitle")?.textContent || "FlowSync QR").trim(), 70, 130);
    ctx.font = "500 30px system-ui, sans-serif";
    ctx.fillText("QR template export", 70, 190);
    var qr = document.querySelector("#qrImage, .qr-box img, canvas");
    try {
      if (qr instanceof HTMLImageElement && qr.complete) ctx.drawImage(qr, canvas.width - 330, canvas.height - 330, 220, 220);
      if (qr instanceof HTMLCanvasElement) ctx.drawImage(qr, canvas.width - 330, canvas.height - 330, 220, 220);
    } catch (e) {}
    canvas.toBlob(function (blob) { if (blob) downloadBlob(blob, fileName()); }, "image/png");
  }

  async function exportElement(target, button) {
    if (!target) {
      alert("No preview found to export.");
      return;
    }

    button && button.classList.add("qr-export-working");

    try {
      if (target instanceof HTMLCanvasElement) {
        target.toBlob(function (blob) { if (blob) downloadBlob(blob, fileName()); }, "image/png");
        return;
      }

      if (document.fonts && document.fonts.ready) await document.fonts.ready;

      await Promise.all(Array.prototype.map.call(target.querySelectorAll("img"), function (img) {
        if (img.complete) return Promise.resolve();
        return new Promise(function (resolve) {
          img.onload = resolve;
          img.onerror = resolve;
          setTimeout(resolve, 700);
        });
      }));

      var rect = target.getBoundingClientRect();
      var width = Math.ceil(rect.width);
      var height = Math.ceil(rect.height);
      var scale = Math.min(3, Math.max(2, window.devicePixelRatio || 2));

      var clone = cloneForExport(target);
      clone.setAttribute("xmlns", "http://www.w3.org/1999/xhtml");
      clone.style.margin = "0";
      clone.style.transform = "none";

      var wrapper = document.createElement("div");
      wrapper.setAttribute("xmlns", "http://www.w3.org/1999/xhtml");
      wrapper.style.width = width + "px";
      wrapper.style.height = height + "px";
      wrapper.style.overflow = "hidden";
      wrapper.style.background = getComputedStyle(target).backgroundColor || "transparent";
      wrapper.appendChild(clone);

      var xml = new XMLSerializer().serializeToString(wrapper);
      var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + width + '" height="' + height + '"><foreignObject width="100%" height="100%">' + xml + '</foreignObject></svg>';
      var svgBlob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
      var url = URL.createObjectURL(svgBlob);

      var img = new Image();
      img.onload = function () {
        var canvas = document.createElement("canvas");
        canvas.width = width * scale;
        canvas.height = height * scale;
        var ctx = canvas.getContext("2d");
        ctx.setTransform(scale, 0, 0, scale, 0, 0);
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);
        canvas.toBlob(function (blob) {
          if (blob) downloadBlob(blob, fileName());
          else fallbackCanvas(target);
        }, "image/png");
      };
      img.onerror = function () {
        URL.revokeObjectURL(url);
        fallbackCanvas(target);
      };
      img.src = url;
    } catch (e) {
      fallbackCanvas(target);
    } finally {
      setTimeout(function () { button && button.classList.remove("qr-export-working"); }, 900);
    }
  }

  function isDownloadButton(el) {
    if (!el) return false;
    var text = String(el.textContent || "").toLowerCase().trim();
    var cls = String(el.className || "").toLowerCase();
    var id = String(el.id || "").toLowerCase();
    var aria = String(el.getAttribute("aria-label") || "").toLowerCase();

    return (
      text.indexOf("download png") !== -1 ||
      text === "save" ||
      cls.indexOf("download") !== -1 ||
      cls.indexOf("export") !== -1 ||
      id.indexOf("download") !== -1 ||
      id.indexOf("export") !== -1 ||
      aria.indexOf("download") !== -1 ||
      aria.indexOf("export") !== -1
    );
  }

  document.addEventListener("click", function (event) {
    var btn = event.target.closest("button, a");
    if (!isDownloadButton(btn)) return;

    var href = btn.getAttribute("href") || "";
    if (href && href !== "#" && !href.startsWith("javascript:")) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    exportElement(findExportTarget(), btn);
  }, true);

  setupTheme();
  window.addEventListener("load", setupTheme);
})();
