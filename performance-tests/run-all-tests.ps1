#!/usr/bin/env pwsh

# Script para ejecutar todas las pruebas de rendimiento
# Uso: .\run-all-tests.ps1

param(
    [switch]$OnlyLoad,
    [switch]$OnlyStress,
    [switch]$OnlySecurity,
    [switch]$NoSecurity
)

$testDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$resultsDir = Join-Path $testDir "results"
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"

Write-Host "╔══════════════════════════════════════════════════════╗"
Write-Host "║  SUITE DE PRUEBAS - MVP CIBERSECURITY               ║"
Write-Host "║  Backend Performance & Security Testing              ║"
Write-Host "╚══════════════════════════════════════════════════════╝"
Write-Host ""

# Verificar que K6 está instalado
Write-Host "[*] Verificando K6..."
try {
    $k6Version = k6 version
    Write-Host "✓ K6 encontrado: $k6Version"
} catch {
    Write-Host "✗ K6 no está instalado. Por favor instalar con:"
    Write-Host "  choco install k6"
    exit 1
}

# Verificar que el backend está disponible
Write-Host "[*] Verificando backend (http://localhost:8000)..."
try {
    $health = Invoke-WebRequest -Uri "http://localhost:8000/health" -ErrorAction Stop
    Write-Host "✓ Backend disponible"
} catch {
    Write-Host "✗ Backend no responde en http://localhost:8000"
    Write-Host "  Por favor, inicia el backend con:"
    Write-Host "  cd Backend/py_backend && python -m uvicorn app.main:app --reload"
    exit 1
}

Write-Host ""

# Crear directorio de resultados si no existe
if (-not (Test-Path $resultsDir)) {
    New-Item -ItemType Directory -Path $resultsDir | Out-Null
    Write-Host "✓ Directorio de resultados creado: $resultsDir"
}

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════╗"
Write-Host "║  PRUEBAS A EJECUTAR                                 ║"
Write-Host "╚══════════════════════════════════════════════════════╝"

$tests = @()

if (-not $OnlyStress -and -not $OnlySecurity) {
    $tests += @{
        name = "Load Test"
        file = "load-test.js"
        duration = "14 minutos"
        skip = $OnlyLoad -eq $false
    }
}

if (-not $OnlyLoad -and -not $OnlySecurity) {
    $tests += @{
        name = "Stress Test"
        file = "stress-test.js"
        duration = "28 minutos"
        skip = $OnlyStress -eq $false
    }
}

if (-not $OnlyLoad -and -not $OnlyStress -and -not $NoSecurity) {
    $tests += @{
        name = "Security Test"
        file = "security-test.js"
        duration = "3 minutos"
        skip = $OnlySecurity -eq $false
    }
}

$i = 1
$tests | ForEach-Object {
    Write-Host "$i. $($_.name) ($($_.duration))"
    $i++
}

Write-Host ""
Write-Host "Duración total estimada: ~45 minutos (si ejecutas todas)"
Write-Host ""

# Opciones de ejecución
$response = Read-Host "¿Deseas ejecutar todas las pruebas? (s/n/solo-load/solo-stress/solo-security)"

switch ($response.ToLower()) {
    "n" { 
        Write-Host "Abortado."
        exit 0
    }
    "solo-load" { 
        $tests = $tests | Where-Object { $_.name -eq "Load Test" }
    }
    "solo-stress" { 
        $tests = $tests | Where-Object { $_.name -eq "Stress Test" }
    }
    "solo-security" { 
        $tests = $tests | Where-Object { $_.name -eq "Security Test" }
    }
}

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════╗"
Write-Host "║  INICIANDO PRUEBAS                                  ║"
Write-Host "╚══════════════════════════════════════════════════════╝"

$startTime = Get-Date
$totalResults = @()

$testIndex = 1
foreach ($test in $tests) {
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    Write-Host "[$testIndex/$($tests.Count)] $($test.name)"
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    $testFile = Join-Path $testDir $($test.file)
    $resultsFile = Join-Path $resultsDir "$($test.name.ToLower().Replace(' ', '-'))-$timestamp.json"
    
    Write-Host "Archivo: $($test.file)"
    Write-Host "Resultados: $resultsFile"
    Write-Host ""
    
    $testStartTime = Get-Date
    
    try {
        # Ejecutar K6
        & k6 run $testFile --out json=$resultsFile
        
        $testEndTime = Get-Date
        $testDuration = $testEndTime - $testStartTime
        
        Write-Host ""
        Write-Host "✓ $($test.name) completado exitosamente"
        Write-Host "  Duración: $([int]$testDuration.TotalSeconds) segundos"
        Write-Host "  Archivo: $resultsFile"
        
        $totalResults += @{
            name = $test.name
            file = $resultsFile
            status = "✓ Exitoso"
            duration = $testDuration
        }
    } catch {
        Write-Host ""
        Write-Host "✗ Error en $($test.name)"
        Write-Host "  Error: $_"
        
        $totalResults += @{
            name = $test.name
            status = "✗ Error"
            duration = New-TimeSpan
        }
    }
    
    $testIndex++
    
    # Espera entre pruebas
    if ($testIndex -le $tests.Count) {
        Write-Host ""
        Write-Host "Esperando 30 segundos antes de la siguiente prueba..."
        Start-Sleep -Seconds 30
    }
}

$endTime = Get-Date
$totalDuration = $endTime - $startTime

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════╗"
Write-Host "║  RESUMEN FINAL                                      ║"
Write-Host "╚══════════════════════════════════════════════════════╝"
Write-Host ""

foreach ($result in $totalResults) {
    Write-Host "$($result.status) - $($result.name)"
    Write-Host "    Duración: $([int]$result.duration.TotalSeconds) segundos"
    if ($result.file) {
        Write-Host "    Archivo: $($result.file)"
    }
    Write-Host ""
}

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-Host "Tiempo total: $([int]$totalDuration.TotalMinutes) minutos $([int]($totalDuration.Seconds)) segundos"
Write-Host "Resultados guardados en: $resultsDir"
Write-Host ""

# Mostrar próximos pasos
Write-Host "╔══════════════════════════════════════════════════════╗"
Write-Host "║  PRÓXIMOS PASOS                                     ║"
Write-Host "╚══════════════════════════════════════════════════════╝"
Write-Host ""
Write-Host "1. Revisar resultados JSON en: $resultsDir"
Write-Host ""
Write-Host "2. Analizar con K6 Cloud (opcional):"
Write-Host "   k6 run load-test.js --cloud"
Write-Host ""
Write-Host "3. Convertir resultados a HTML:"
Write-Host "   npm install -g k6-html-reporter"
Write-Host "   k6-html-reporter -i results/load-test-*.json -o results/report.html"
Write-Host ""
Write-Host "4. Ejecutar pruebas de seguridad adicionales con OWASP ZAP:"
Write-Host "   zapcli quick-scan http://localhost:8000"
Write-Host ""

Write-Host "✓ Suite de pruebas completada"
Write-Host ""
