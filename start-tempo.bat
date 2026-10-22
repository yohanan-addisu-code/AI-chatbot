@echo off
setlocal
cd /d "%~dp0"

echo Starting Tempo...
where node >nul 2>&1
if errorlevel 1 (
  echo Node.js is required. Install the Node.js LTS version, then double-click this file again.
  pause
  exit /b 1
)

if not exist "node_modules\vite\bin\vite.js" (
  echo First run: installing dependencies...
  call npm install
  if errorlevel 1 (
    echo Dependency installation failed.
    pause
    exit /b 1
  )
)

start "Tempo browser" cmd /c "timeout /t 2 /nobreak >nul & start http://localhost:5173"
call npm run dev
