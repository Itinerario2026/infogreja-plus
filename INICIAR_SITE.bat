@echo off
setlocal
cd /d "%~dp0"
title Minha Paroquia - Inicializador

echo ==============================================
echo       MINHA PAROQUIA - REACT + NODE
echo ==============================================
echo.
echo Pasta atual:
echo %CD%
echo.

where node.exe >nul 2>nul
if errorlevel 1 (
  echo [ERRO] Node.js nao foi encontrado.
  echo Instale o Node.js e tente novamente.
  echo.
  pause
  exit /b 1
)

where npm.cmd >nul 2>nul
if errorlevel 1 (
  echo [ERRO] npm.cmd nao foi encontrado.
  echo Reinstale o Node.js e marque a opcao para adicionar ao PATH.
  echo.
  pause
  exit /b 1
)

echo Node:
node.exe --version
echo npm:
call npm.cmd --version
if errorlevel 1 (
  echo.
  echo [ERRO] O npm foi encontrado, mas nao conseguiu executar.
  pause
  exit /b 1
)
echo.

if not exist "server\package.json" (
  echo [ERRO] A pasta server nao foi encontrada.
  echo Extraia o ZIP completo antes de executar este arquivo.
  pause
  exit /b 1
)

if not exist "client\package.json" (
  echo [ERRO] A pasta client nao foi encontrada.
  echo Extraia o ZIP completo antes de executar este arquivo.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo [1/3] Instalando dependencias gerais...
  call npm.cmd install
  if errorlevel 1 goto erro
) else (
  echo [1/3] Dependencias gerais ja instaladas.
)

if not exist "server\node_modules" (
  echo [2/3] Instalando dependencias do servidor...
  pushd "server"
  call npm.cmd install
  if errorlevel 1 (
    popd
    goto erro
  )
  popd
) else (
  echo [2/3] Dependencias do servidor ja instaladas.
)

if not exist "client\node_modules" (
  echo [3/3] Instalando dependencias do React...
  pushd "client"
  call npm.cmd install
  if errorlevel 1 (
    popd
    goto erro
  )
  popd
) else (
  echo [3/3] Dependencias do React ja instaladas.
)

if not exist "server\data\admin.json" (
  echo.
  echo ==============================================
  echo PRIMEIRO ACESSO - CRIAR ADMINISTRADOR
  echo ==============================================
  echo.
  pushd "server"
  call npm.cmd run setup-admin
  if errorlevel 1 (
    popd
    goto erro
  )
  popd
  echo.
  echo IMPORTANTE: anote a chave de recuperacao exibida acima.
  echo Ela sera necessaria se voce esquecer a senha.
  echo.
  pause
)

echo.
echo Iniciando servidor Node...
start "Minha Paroquia - API Node" cmd.exe /k call "%~dp0server\INICIAR_API.bat"
timeout /t 3 /nobreak >nul

echo Iniciando React...
start "Minha Paroquia - React" cmd.exe /k call "%~dp0client\INICIAR_REACT.bat"
timeout /t 5 /nobreak >nul

echo Abrindo navegador...
start "" "http://localhost:5173"

echo.
echo ==============================================
echo SISTEMA INICIADO
echo ==============================================
echo Site: http://localhost:5173
echo Admin: http://localhost:5173/admin
echo.
echo Mantenha as janelas API Node e React abertas.
echo.
pause
exit /b 0

:erro
echo.
echo [ERRO] Nao foi possivel concluir a configuracao.
echo Envie uma foto desta janela para identificar a etapa do erro.
echo.
pause
exit /b 1
