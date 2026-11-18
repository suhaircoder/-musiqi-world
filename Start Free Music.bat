@echo off
cd /d "%~dp0"
where python >nul 2>&1
if errorlevel 1 (
  echo Install Python from https://www.python.org/ and run this file again.
  pause
  exit /b 1
)
python -u app.py
echo.
echo Free Music stopped.
pause
