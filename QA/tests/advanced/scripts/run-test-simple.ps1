# PharmaQuick - Script de Test Simple
# Test básico sin CSV para verificar que el servidor funciona

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PharmaQuick - Test Simple" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar que el servidor esté corriendo
$healthCheck = Invoke-WebRequest -Uri "http://localhost:8080/api/auth/login" -Method POST -ContentType "application/json" -Body '{"email":"admin@pharmaquick.com","password":"password"}' -UseBasicParsing -ErrorAction SilentlyContinue
if ($healthCheck.StatusCode -ne 200) {
    Write-Host "ERROR: El servidor no responde correctamente" -ForegroundColor Red
    Write-Host "Código de respuesta: $($healthCheck.StatusCode)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Por favor:" -ForegroundColor Yellow
    Write-Host "1. Reinicia los contenedores Docker" -ForegroundColor White
    Write-Host "2. Verifica que los contenedores estén corriendo" -ForegroundColor White
    Write-Host "3. Espera 30 segundos después de iniciar los contenedores" -ForegroundColor White
    exit 1
}

Write-Host "Servidor funcionando correctamente" -ForegroundColor Green

# Crear directorio de resultados
$resultsDir = "resultados"
if (-not (Test-Path $resultsDir)) {
    New-Item -ItemType Directory -Path $resultsDir | Out-Null
}

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$outputFile = "$resultsDir/test-simple_$timestamp.json"

Write-Host "Ejecutando test simple..." -ForegroundColor Yellow
Write-Host ""

npx artillery run tests/advanced/test-simple.yaml --output $outputFile

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "Test completado" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    npx artillery report $outputFile
} else {
    Write-Host ""
    Write-Host "Test tuvo problemas -revisa los errores arriba" -ForegroundColor Yellow
    exit 1
}