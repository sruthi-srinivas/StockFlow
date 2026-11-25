@echo off
echo ==============================================
echo  Starting StockFlow Backend & Frontend Services
echo ==============================================

start "StockFlow Backend" cmd /k "cd /d %~dp0backend && python -m uvicorn main:app --reload --port 8000"
start "StockFlow Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo Both services are starting!
echo Backend:  http://localhost:8000/docs
echo Frontend: http://localhost:5173
pause
