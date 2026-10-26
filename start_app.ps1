Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "Starting ResolveX Enterprise & LexIntel AI Engine..." -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# 1. Start Backend in new process
Write-Host "[1/2] Starting Backend Server (http://127.0.0.1:8000)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptDir\backend'; .\venv\Scripts\Activate.ps1; uvicorn app.main:app --host 127.0.0.1 --port 8000"

Start-Sleep -Seconds 3

# 2. Start Frontend in new process
Write-Host "[2/2] Starting Frontend Portal (http://localhost:5173)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptDir\frontend'; npm run dev"

Write-Host ""
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "ResolveX is now operational!" -ForegroundColor Green
Write-Host "- Web App: http://localhost:5173/" -ForegroundColor Yellow
Write-Host "- Swagger API Docs: http://127.0.0.1:8000/docs" -ForegroundColor Yellow
Write-Host "========================================================" -ForegroundColor Cyan
