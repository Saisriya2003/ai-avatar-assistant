# AI Avatar Integration System - one-command start for Windows PowerShell.
# Installs dependencies on first run, then opens the chat API (5070) and UI (5176) in two windows.
# Use Chrome or Edge for microphone + speech.

$root = $PSScriptRoot

if (-not (Test-Path (Join-Path $root "node_modules"))) {
  Write-Host "Installing packages..."
  Push-Location $root
  npm install
  Pop-Location
}

Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root'; npm run server"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root'; npm run dev"

Start-Sleep -Seconds 4
Start-Process "http://localhost:5176"
Write-Host "AI Avatar Integration System: API http://127.0.0.1:5070  UI http://localhost:5176"
