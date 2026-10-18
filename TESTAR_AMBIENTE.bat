@echo off
cd /d "%~dp0"
echo TESTE DO AMBIENTE
echo =================
echo.
echo Node:
where node.exe
node.exe --version
echo.
echo npm:
where npm.cmd
call npm.cmd --version
echo.
echo Pastas:
if exist "server\package.json" (echo [OK] server) else (echo [ERRO] server)
if exist "client\package.json" (echo [OK] client) else (echo [ERRO] client)
echo.
pause
