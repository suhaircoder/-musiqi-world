@echo off
cd /d "%~dp0"
where npm >nul 2>&1
if %errorlevel%==0 (
  npm run dev
) else (
  set "NODE=%~dp0..\.tools\node-v26.13.1-win-x64"
  "%NODE%\npm.cmd" run dev
)
echo.
echo MUSIQI WORLD stopped.
pause
