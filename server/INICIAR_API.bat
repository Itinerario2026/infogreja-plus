@echo off
cd /d "%~dp0"
title InfoGreja+ - API Node
echo Iniciando API Node...
call npm.cmd run dev
if errorlevel 1 (
  echo.
  echo [ERRO] A API Node foi encerrada com erro.
)
pause
