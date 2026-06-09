$ErrorActionPreference = "Stop"

if (!(Test-Path ".\index.html") -or !(Test-Path ".\css\styles.css")) {
  throw "Wrong folder. Run this from your main site root that has index.html and css/styles.css."
}

$enc = New-Object System.Text.UTF8Encoding -ArgumentList $false
$backupDir = ".\_backup\fs-tamplate-install-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
New-Item -ItemType Directory -Force $backupDir | Out-Null
Copy-Item ".\index.html" "$backupDir\index.html" -Force
Copy-Item ".\css\styles.css" "$backupDir\styles.css" -Force

$indexPath = (Resolve-Path ".\index.html").Path
$index = [System.IO.File]::ReadAllText($indexPath, [System.Text.Encoding]::UTF8)

$holder = @'
<!-- FS TAMPLATE PACK HOLDER START -->
<div class="fs-template-pack-holder">
  <div class="fs-pack-head">
    <div>
      <b>QR templates</b>
      <small>Open, upload QR, edit text, download PNG.</small>
    </div>
    <a href="fs-tamplate/templates/">All 20</a>
  </div>

  <div class="fs-pack-strip">
    <a class="fs-pack-card floral" href="fs-tamplate/templates/floral-bloom/">
      <span>Flower</span><b>Bloom</b><i>QR</i>
    </a>
    <a class="fs-pack-card ocean" href="fs-tamplate/templates/ocean-wave/">
      <span>Ocean</span><b>Wave</b><i>QR</i>
    </a>
    <a class="fs-pack-card premium" href="fs-tamplate/templates/luxury-black/">
      <span>Premium</span><b>Black</b><i>QR</i>
    </a>
  </div>

  <a class="fs-pack-more" href="fs-tamplate/templates/">Open template gallery</a>
</div>
<!-- FS TAMPLATE PACK HOLDER END -->
'@

$index = [regex]::Replace($index, '(?s)\s*<!-- FS TAMPLATE PACK HOLDER START -->.*?<!-- FS TAMPLATE PACK HOLDER END -->', '')
$index = [regex]::Replace($index, '(?s)\s*<!-- FLOWSYNC TEMPLATE HOLDER START -->.*?<!-- FLOWSYNC TEMPLATE HOLDER END -->', '')
$index = [regex]::Replace($index, '(?s)\s*<!-- FLOWSYNC REAL TEMPLATE MAKER START -->.*?<!-- FLOWSYNC REAL TEMPLATE MAKER END -->', '')
$index = [regex]::Replace($index, '(?s)\s*<!-- FLOWSYNC TEMPLATE MAKER START -->.*?<!-- FLOWSYNC TEMPLATE MAKER END -->', '')

$miniPattern = '(?s)\s*<div class="mini-card">\s*<span>.*?</span>\s*<div>.*?</div>\s*</div>'
if ([regex]::IsMatch($index, $miniPattern)) {
  $index = [regex]::Replace($index, $miniPattern, "`r`n" + $holder, 1)
} else {
  $btnPattern = '(?s)(<button[^>]*id="focusInput"[\s\S]*?</button>)'
  if (![regex]::IsMatch($index, $btnPattern)) {
    throw "Could not find mini-card or Create QR button in index.html. Add the holder manually from fs-tamplate/README.txt."
  }
  $index = [regex]::Replace($index, $btnPattern, '$1' + "`r`n" + $holder, 1)
}

[System.IO.File]::WriteAllText($indexPath, $index, $enc)

$cssPath = (Resolve-Path ".\css\styles.css").Path
$css = [System.IO.File]::ReadAllText($cssPath, [System.Text.Encoding]::UTF8)

$packCss = @'
/* === FS TAMPLATE PACK HOLDER START === */
@media (min-width: 901px) {
  .hero-copy h1 {
    max-width: 410px !important;
    font-size: clamp(38px, 3.55vw, 58px) !important;
    line-height: 1.02 !important;
  }

  .hero-copy p {
    max-width: 390px !important;
    font-size: 15.5px !important;
    line-height: 1.55 !important;
  }
}

.fs-template-pack-holder {
  width: 390px !important;
  max-width: 100% !important;
  margin-top: 24px !important;
  padding: 14px !important;
  border-radius: 28px !important;
  border: 1px solid var(--line, rgba(226,229,240,.86)) !important;
  background: radial-gradient(circle at 88% 12%, rgba(101,71,255,.18), transparent 34%), rgba(255,255,255,.74) !important;
  box-shadow: var(--soft-shadow, 0 18px 50px rgba(37,42,65,.09)) !important;
  backdrop-filter: blur(20px) !important;
}

html[data-theme="dark"] .fs-template-pack-holder {
  background: radial-gradient(circle at 88% 12%, rgba(101,71,255,.24), transparent 34%), rgba(255,255,255,.055) !important;
}

.fs-pack-head {
  display: flex !important;
  justify-content: space-between !important;
  align-items: flex-start !important;
  gap: 12px !important;
  margin-bottom: 12px !important;
}

.fs-pack-head b {
  display: block !important;
  color: var(--text, #101219) !important;
  font-size: 17px !important;
  letter-spacing: -.035em !important;
}

.fs-pack-head small {
  display: block !important;
  margin-top: 2px !important;
  color: var(--muted, #697083) !important;
  font-size: 12px !important;
  line-height: 1.25 !important;
}

.fs-pack-head a {
  color: var(--primary, #6547ff) !important;
  font-size: 12px !important;
  font-weight: 950 !important;
  text-decoration: none !important;
}

.fs-pack-strip {
  display: grid !important;
  grid-template-columns: repeat(3, 1fr) !important;
  gap: 10px !important;
}

.fs-pack-card {
  min-height: 146px !important;
  border-radius: 19px !important;
  padding: 11px !important;
  position: relative !important;
  overflow: hidden !important;
  text-decoration: none !important;
  color: #101219 !important;
  box-shadow: 0 18px 32px rgba(37,42,65,.14) !important;
  isolation: isolate !important;
}

.fs-pack-card::before {
  content: "" !important;
  position: absolute !important;
  right: -25px !important;
  top: 34px !important;
  width: 92px !important;
  height: 92px !important;
  border-radius: 42% 58% 48% 52% !important;
  background: rgba(255,255,255,.55) !important;
  z-index: -1 !important;
}

.fs-pack-card span {
  font-size: 9px !important;
  font-weight: 950 !important;
  letter-spacing: .08em !important;
  text-transform: uppercase !important;
}

.fs-pack-card b {
  position: absolute !important;
  left: 11px !important;
  bottom: 12px !important;
  font-size: 15px !important;
  letter-spacing: -.04em !important;
}

.fs-pack-card i {
  position: absolute !important;
  right: 14px !important;
  bottom: 42px !important;
  width: 52px !important;
  height: 52px !important;
  border-radius: 14px !important;
  background: #fff !important;
  display: grid !important;
  place-items: center !important;
  color: var(--primary, #6547ff) !important;
  font-style: normal !important;
  font-weight: 950 !important;
  box-shadow: 0 14px 28px rgba(37,42,65,.15) !important;
}

.fs-pack-card.floral { background: linear-gradient(145deg, #fff7fb, #ffe4f2 70%, #fff) !important; }
.fs-pack-card.ocean { background: linear-gradient(145deg, #ecfeff, #bae6fd 70%, #fff) !important; }
.fs-pack-card.premium { background: linear-gradient(145deg, #050505, #171717 70%, #4a3410) !important; color: #fff7e8 !important; }

.fs-pack-more {
  min-height: 42px !important;
  margin-top: 12px !important;
  border-radius: 16px !important;
  display: grid !important;
  place-items: center !important;
  color: #fff !important;
  text-decoration: none !important;
  font-size: 13px !important;
  font-weight: 950 !important;
  background: linear-gradient(135deg, var(--primary, #6547ff), var(--primary2, #2f80ff)) !important;
  box-shadow: 0 14px 32px rgba(101,71,255,.22) !important;
}

@media (max-width: 900px) {
  .fs-template-pack-holder { display: none !important; }
}
/* === FS TAMPLATE PACK HOLDER END === */
'@

if ($css -match "FS TAMPLATE PACK HOLDER START") {
  $css = [regex]::Replace($css, '(?s)/\* === FS TAMPLATE PACK HOLDER START === \*/.*?/\* === FS TAMPLATE PACK HOLDER END === \*/', $packCss)
} else {
  $css = $css + "`r`n" + $packCss
}

[System.IO.File]::WriteAllText($cssPath, $css, $enc)

Write-Host "Done. fs-tamplate gallery link added to homepage."
Start-Process ".\index.html"
Start-Process ".\fs-tamplate\templates\index.html"
