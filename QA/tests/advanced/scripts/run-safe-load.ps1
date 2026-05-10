# PharmaQuick - Script de Test de Carga Seguro
# Diseñado para PCs de bajos recursos (i3)
# IMPORTANTE: Cierra el navegador antes de ejecutar

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "============================================" -ForegroundColor Yellow
Write-Host "⚠️  IMPORTANTE - LEER ANTES DE CONTINUAR" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "Este test está diseñado para no colapsar el servidor." -ForegroundColor White
Write-Host "Para evitar problemas:" -ForegroundColor White
Write-Host ""
Write-Host "1. CIERRA todas las pestañas del navegador que accessan localhost:8080" -ForegroundColor Red
Write-Host "2. CIERRA cualquier otra aplicación que use el servidor" -ForegroundColor Red
Write-Host "3. No intentes acceder a la app desde el navegador mientras corre el test" -ForegroundColor Red
Write-Host ""
Write-Host "El test comenzará en 10 segundos..." -ForegroundColor Yellow
Write-Host "Presiona Ctrl+C para cancelar" -ForegroundColor Gray
Write-Host ""

# Contador regresivo
for ($i = 10; $i -gt 0; $i--) {
    Write-Host "Iniciando en $i segundos..." -ForegroundColor Cyan
    Start-Sleep -Seconds 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PharmaQuick - Test de Carga Seguro" -ForegroundColor Cyan
Write-Host "Para PCs de bajos recursos (i3)" -ForegroundColor Cyan
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
Write-Host "Especificaciones del test:" -ForegroundColor Cyan
Write-Host "  - Usuarios simultáneos máx: ~45" -ForegroundColor White
Write-Host "  - Duración: ~8 minutos" -ForegroundColor White
Write-Host "  - Designed para NO colapsar el servidor" -ForegroundColor White
Write-Host ""

# Crear directorio de resultados si no existe
$resultsDir = "resultados"
if (-not (Test-Path $resultsDir)) {
    New-Item -ItemType Directory -Path $resultsDir | Out-Null
}

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$outputFile = "$resultsDir/safe-load_$timestamp.json"

Write-Host "Iniciando test de carga seguro..." -ForegroundColor Yellow
Write-Host "Resultados se guardarán en: $outputFile" -ForegroundColor Cyan
Write-Host ""

# Ejecutar test con Artillery
npx artillery run tests/advanced/safe-load.yaml --output $outputFile

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "Test completado exitosamente" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Ahora puedes abrir el navegador y acceder a localhost:8080" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Resumen del reporte:" -ForegroundColor Cyan
    npx artillery report $outputFile
} else {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "Test falló" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Por favor espera 30 segundos antes de acceder al navegador" -ForegroundColor Yellow
    exit 1
}