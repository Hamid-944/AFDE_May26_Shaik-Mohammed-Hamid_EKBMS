@echo off
cd /d "%~dp0backend"
echo Starting EKBMS Backend API...
echo API docs: http://localhost:8000/api/docs
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
pause
