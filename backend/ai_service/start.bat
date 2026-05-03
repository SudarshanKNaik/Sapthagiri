@echo off
echo ============================================
echo  SAHAYAK AI – Form Assist Microservice
echo  Port: 8001
echo ============================================

cd /d "%~dp0"

REM Create virtual environment if not present
IF NOT EXIST "venv" (
    echo Creating Python virtual environment...
    python -m venv venv
)

REM Activate venv
call venv\Scripts\activate.bat

REM Install / upgrade dependencies
echo Installing dependencies...
pip install --upgrade pip -q
pip install -r requirements.txt -q

echo.
echo Starting FastAPI server on http://localhost:8001
echo Press Ctrl+C to stop.
echo.

python -m uvicorn main:app --host 0.0.0.0 --port 8001 --reload
