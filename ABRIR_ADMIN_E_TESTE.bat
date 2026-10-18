@echo off
setlocal
cd /d "%~dp0"
start "" http://localhost:5173/admin
start "" http://localhost:3001/api/health
endlocal
