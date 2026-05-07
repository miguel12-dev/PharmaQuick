# PharmaQuick - Script de Ejecución Test de Estrés 1000 Usuarios
# Duración: ~4.5 minutos
# Uso: npm run test:stress:1000

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PharmaQuick - Test de Estrés 1000 Usuarios" -ForegroundColor Cyan
Write-Host "Duración estimada: 4.5 minutos" -ForegroundColor Cyan
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

# Crear directorio de resultados si no existe
$resultsDir = "resultados"
if (-not (Test-Path $resultsDir)) {
    New-Item -ItemType Directory -Path $resultsDir | Out-Null
}

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$outputFile = "$resultsDir/stress-1000_$timestamp.json"

Write-Host "Iniciando test de estrés (1000 usuarios)..." -ForegroundColor Yellow
Write-Host "Resultados se guardarán en: $outputFile" -ForegroundColor Cyan
Write-Host ""

# Ejecutar test con Artillery
npx artillery run tests/advanced/stress-1000.yaml --output $outputFile

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "Test completado exitosamente" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Resumen del reporte:" -ForegroundColor Cyan
    npx artillery report $outputFile
} else {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "Test falló" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    exit 1
}