@echo off
echo ========================================================
echo Starting ResolveX Enterprise & LexIntel AI Engine...
echo ========================================================

cd /d "%~dp0"

echo [1/2] Launching Backend Server on http://127.0.0.1:8000...
start "ResolveX Backend (FastAPI)" cmd /k "cd backend && venv\Scripts\activate && uvicorn app.main:app --host 127.0.0.1 --port 8000"

timeout /t 3 /nobreak >nul

echo [2/2] Launching Frontend Portal on http://localhost:5173...
start "ResolveX Frontend (Vite React)" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================================
echo ResolveX is now running!
echo - Web Application: http://localhost:5173/
echo - API Documentation: http://127.0.0.1:8000/docs
echo ========================================================
pause
