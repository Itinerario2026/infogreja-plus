@echo off
setlocal
title Teste do Admin
echo ==============================================
echo TESTE DA AREA ADMINISTRATIVA
echo ==============================================
echo.
echo 1. Testando API Node em http://localhost:3001/api/health
powershell -NoProfile -Command "try { $r=Invoke-RestMethod -Uri 'http://localhost:3001/api/health' -TimeoutSec 5; Write-Host '[OK] API Node respondeu:' $r.status } catch { Write-Host '[ERRO] API Node nao respondeu.' }"
echo.
echo 2. Abrindo Admin...
start "" "http://localhost:5173/admin"
echo.
pause
