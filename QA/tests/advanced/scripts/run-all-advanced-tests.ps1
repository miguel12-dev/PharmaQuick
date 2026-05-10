# PharmaQuick - Script Maestro de Tests Avanzados
# Ejecuta todos los tests de carga avanzados en secuencia
# Uso: npm run test:advanced:all

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PharmaQuick - Suite de Tests Avanzados" -ForegroundColor Cyan
Write-Host "Ejecutando todos los tests de carga" -ForegroundColor Cyan
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

$resultsDir = "resultados"
if (-not (Test-Path $resultsDir)) {
    New-Item -ItemType Directory -Path $resultsDir | Out-Null
}

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"

# Función para ejecutar un test
function Run-Test {
    param (
        [string]$testName,
        [string]$testFile,
        [string]$description,
        [int]$estimatedMinutes
    )

    Write-Host ""
    Write-Host "----------------------------------------" -ForegroundColor Yellow
    Write-Host "EJECUTANDO: $testName" -ForegroundColor Yellow
    Write-Host "Descripción: $description" -ForegroundColor Gray
    Write-Host "Duración estimada: $estimatedMinutes minutos" -ForegroundColor Gray
    Write-Host "----------------------------------------" -ForegroundColor Yellow

    $outputFile = "$resultsDir/${testName}_$timestamp.json"

    npx artillery run $testFile --output $outputFile

    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Test '$testName' falló" -ForegroundColor Red
        return $false
    }

    Write-Host "Test '$testName' completado" -ForegroundColor Green
    return $true
}

#Ejecutar tests en orden
$tests = @(
    @{
        name = "spike-test"
        file = "tests/advanced/spike-test.yaml"
        description = "Picos de tráfico inesperados"
        minutes = 8
    },
    @{
        name = "realistic-test"
        file = "tests/advanced/realistic-scenario.yaml"
        description = "Simulación de día laboral típico"
        minutes = 18
    },
    @{
        name = "stress-test"
        file = "tests/advanced/stress-test.yaml"
        description = "Test de estrés masivo (5000 usuarios)"
        minutes = 20
    }
)

$passedTests = 0
$failedTests = 0

foreach ($test in $tests) {
    $result = Run-Test -testName $test.name -testFile $test.file -description $test.description -estimatedMinutes $test.minutes
    if ($result) {
        $passedTests++
    } else {
        $failedTests++
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "RESUMEN DE EJECUCIÓN" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Tests completados: $($passedTests + $failedTests)" -ForegroundColor White
Write-Host "Tests exitosos: $passedTests" -ForegroundColor Green
Write-Host "Tests fallidos: $failedTests" -ForegroundColor $(if ($failedTests -gt 0) { "Red" } else { "Green" })
Write-Host ""
Write-Host "Resultados guardados en: $resultsDir/" -ForegroundColor Cyan