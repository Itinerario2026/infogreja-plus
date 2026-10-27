@echo off
cd /d "%~dp0"
title Minha Paroquia - React
echo Iniciando React/Vite...
call npm.cmd run dev
if errorlevel 1 (
  echo.
  echo [ERRO] O React/Vite foi encerrado com erro.
)
pause
