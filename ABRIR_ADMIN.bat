@echo off
setlocal
cd /d "%~dp0"
title Abrir Administracao
echo Abrindo area administrativa...
start "" "http://localhost:5173/admin"
exit /b 0
