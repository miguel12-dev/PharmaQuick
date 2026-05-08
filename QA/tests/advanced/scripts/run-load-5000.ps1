# PharmaQuick - Script de Test 5000 Requests
# Objetivo: Alcanzar 5000 requests sin saturar el servidor

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PharmaQuick - Test 5000 Requests" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar servidor
$healthCheck = Invoke-WebRequest -Uri "http://localhost:8080/api/auth/login" -Method POST -ContentType "application/json" -Body '{"email":"admin@pharmaquick.com","password":"password"}' -UseBasicParsing -ErrorAction SilentlyContinue
if ($healthCheck.StatusCode -ne 200) {
    Write-Host "ERROR: El servidor no responde" -ForegroundColor Red
    exit 1
}

Write-Host "Servidor OK" -ForegroundColor Green

# Directorio resultados
$resultsDir = "resultados"
if (-not (Test-Path $resultsDir)) {
    New-Item -ItemType Directory -Path $resultsDir | Out-Null
}

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$outputFile = "$resultsDir/load-5000_$timestamp.json"

Write-Host "Iniciando test (durará ~8 minutos)..." -ForegroundColor Yellow
Write-Host ""

npx artillery run tests/advanced/load-5000.yaml --output $outputFile

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "Test completado" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    npx artillery report $outputFile
} else {
    Write-Host "Test tuvo problemas" -ForegroundColor Yellow
    exit 1
}