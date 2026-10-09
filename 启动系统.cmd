@echo off
setlocal
cd /d "%~dp0"
if not exist "package.json" goto missing_project
if not exist "package-lock.json" goto missing_project
if not exist "scripts\start-windows.mjs" goto missing_project
set "NODE_EXE="
if exist "%~dp0runtime\node.exe" set "NODE_EXE=%~dp0runtime\node.exe"
if defined NODE_EXE goto node_ready
for /f "delims=" %%N in ('where node 2^>nul') do if not defined NODE_EXE set "NODE_EXE=%%N"
if not defined NODE_EXE (
 echo Node.js was not found. Use the complete Windows x64 runtime ZIP.
 echo That ZIP includes Node.js and dependencies; no installation is required.
 pause
 exit /b 1
)
:node_ready
set "PATH=%~dp0runtime;%PATH%"
if not exist "node_modules\vinext\dist\cli.js" (
 where npm >nul 2>nul
 if errorlevel 1 (
  echo Dependencies and npm were not found. Please use the complete Windows x64 runtime ZIP.
  pause
  exit /b 1
 )
 call npm ci
 if errorlevel 1 (
  echo Dependency installation failed. Use the Windows x64 runtime ZIP for offline startup.
  pause
  exit /b 1
 )
)
"%NODE_EXE%" "%~dp0scripts\start-windows.mjs" %*
set "START_EXIT=%ERRORLEVEL%"
if "%~1"=="--check" exit /b %START_EXIT%
pause
exit /b %START_EXIT%
:missing_project
echo The complete project files were not found in this folder.
echo Extract ALL files from the ZIP first, then double-click this script from the extracted folder.
echo Do not run this script directly inside the ZIP archive.
pause
exit /b 1
