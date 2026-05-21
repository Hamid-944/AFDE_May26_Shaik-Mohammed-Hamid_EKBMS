@echo off
cd /d "%~dp0frontend"
echo Starting EKBMS Frontend...
echo App: http://localhost:5173
npm run dev
pause
