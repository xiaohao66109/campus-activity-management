@echo off
setlocal
cd /d "%~dp0"
if not exist "package.json" goto missing_project
if not exist "package-lock.json" goto missing_project
where node >nul 2>nul
if errorlevel 1 (
 echo Please install Node.js 22.13 or later.
 pause
 exit /b 1
)
where npm >nul 2>nul
if errorlevel 1 (
 echo npm was not found. Please reinstall Node.js with npm included.
 pause
 exit /b 1
)
if not exist "node_modules\.bin\vinext.cmd" (
 call npm ci
 if errorlevel 1 (
  pause
  exit /b 1
 )
)
echo Open http://localhost:3000/ after the server is ready.
call npm run dev
pause
exit /b

:missing_project
echo The complete project files were not found in this folder.
echo Extract ALL files from the ZIP first, then run this script from the extracted folder.
echo Do not double-click this script inside the ZIP archive.
echo Required files: package.json and package-lock.json alongside this script.
pause
exit /b 1
