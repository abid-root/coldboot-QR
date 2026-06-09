$ErrorActionPreference = "Stop"
$zip = ".\fs-tamplate-redesigned.zip"
if (!(Test-Path $zip)) { throw "Put fs-tamplate-redesigned.zip in your project root first." }
if (Test-Path ".\fs-tamplate") { Copy-Item ".\fs-tamplate" ".\_backup\fs-tamplate-before-redesign-$(Get-Date -Format 'yyyyMMdd-HHmmss')" -Recurse -Force; Remove-Item ".\fs-tamplate" -Recurse -Force }
Expand-Archive $zip -DestinationPath "." -Force
Write-Host "Done. New fs-tamplate installed."
Start-Process ".\fs-tamplate\templates\index.html"