@echo off
echo ===========================================
echo Stock Price Prediction - Backend Server
echo ===========================================
echo.

cd /d "%~dp0"

echo Checking Python installation...
python --version

echo.
echo Starting backend server...
echo Server will run at: http://localhost:8000
echo Press Ctrl+C to stop the server
echo.

python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

pause

