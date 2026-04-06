@echo off
echo Starting M365 Sentinel Platform...
echo.

echo [1/2] Starting Backend (FastAPI on port 8000)...
start "M365 Sentinel - Backend" cmd /k "cd /d %~dp0backend && pip install -r requirements.txt -q && uvicorn main:app --reload --port 8000"

echo Waiting for backend to initialize...
timeout /t 4 /nobreak >nul

echo [2/2] Starting Frontend (Vite on port 5173)...
start "M365 Sentinel - Frontend" cmd /k "cd /d %~dp0frontend && npm install && npm run dev"

echo.
echo Both services started:
echo   Backend API:  http://localhost:8000
echo   Frontend App: http://localhost:5173
echo   API Docs:     http://localhost:8000/docs
echo.
echo Press any key to exit this window...
pause >nul
