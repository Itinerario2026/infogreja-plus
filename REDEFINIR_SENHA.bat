@echo off
setlocal
cd /d "%~dp0"
title Minha Paroquia - Redefinir senha
echo ==============================================
echo        MINHA PAROQUIA - RECUPERAR ADMIN
echo ==============================================
echo.
if not exist "server\package.json" (
  echo [ERRO] Pasta server nao encontrada.
  pause
  exit /b 1
)
pushd "server"
call npm.cmd run reset-admin
set ERR=%ERRORLEVEL%
popd
echo.
if not "%ERR%"=="0" echo [ERRO] Nao foi possivel redefinir a senha.
pause
exit /b %ERR%
