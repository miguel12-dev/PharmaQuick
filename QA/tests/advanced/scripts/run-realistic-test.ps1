# PharmaQuick - Script de Ejecución Test de Escenario Realista
# Simula un día laboral típico con picos de uso
# Uso: npm run test:realistic

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PharmaQuick - Test de Escenario Realista" -ForegroundColor Cyan
Write-Host "Simulación de día laboral típico" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar que el servidor esté corriendo
$healthCheck = Invoke-WebRequest -Uri "http://localhost:8080/api/auth/login" -Method POST -ContentType "application/json" -Body '{"email":"admin@pharmaquick.com","password":"password"}' -UseBasicParsing -ErrorAction SilentlyContinue
if ($healthCheck.StatusCode -ne 200) {
    Write-Host "ERROR: El servidor no está corriendo en http://localhost:8080" -ForegroundColor Red
    Write-Host "Por favor inicie el servidor primero" -ForegroundColor Yellow
    exit 1
}

Write-Host "Servidor detectado correctamente" -ForegroundColor Green
Write-Host ""

# Crear directorio de resultados
$resultsDir = "resultados"
if (-not (Test-Path $resultsDir)) {
    New-Item -ItemType Directory -Path $resultsDir | Out-Null
}

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$outputFile = "$resultsDir/realistic-test_$timestamp.json"

Write-Host "Iniciando test de escenario realista..." -ForegroundColor Yellow
Write-Host "Duración estimada: ~18 minutos" -ForegroundColor Yellow
Write-Host "Resultados se guardarán en: $outputFile" -ForegroundColor Cyan
Write-Host ""

# Ejecutar test con Artillery
npx artillery run tests/advanced/realistic-scenario.yaml --output $outputFile

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "Test de escenario realista completado" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Resumen del reporte:" -ForegroundColor Cyan
    npx artillery report $outputFile
} else {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "Test de escenario realista falló" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    exit 1
}