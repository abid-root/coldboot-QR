$ErrorActionPreference="Stop"
if (!(Test-Path ".\fs-tamplate\templates")) { throw "Run from project root after extracting this zip." }
Write-Host "Fixed template pack is installed. Open fs-tamplate/templates/index.html"