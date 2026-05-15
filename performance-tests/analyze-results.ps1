#!/usr/bin/env pwsh

# Script para analizar resultados de pruebas K6
# Uso: .\analyze-results.ps1

param(
    [string]$TestFile,
    [switch]$Summary
)

Write-Host "╔══════════════════════════════════════════════════════╗"
Write-Host "║  Analizador de Resultados K6                        ║"
Write-Host "╚══════════════════════════════════════════════════════╝"
Write-Host ""

if (-not $TestFile) {
    Write-Host "Archivos disponibles:"
    Get-ChildItem "results/load-test-*.json", "results/stress-test-*.json" -ErrorAction SilentlyContinue | ForEach-Object {
        Write-Host "  - $($_.Name)"
    }
    exit 1
}

if (-not (Test-Path $TestFile)) {
    Write-Host "✗ Archivo no encontrado: $TestFile"
    exit 1
}

Write-Host "Analizando: $TestFile"
Write-Host ""

# Leer JSON
$data = Get-Content $TestFile | ConvertFrom-Json

# Extraer métricas principales
if ($data.metrics) {
    Write-Host "█ MÉTRICAS HTTP"
    Write-Host ""
    
    if ($data.metrics.http_req_duration) {
        $duration = $data.metrics.http_req_duration.values
        Write-Host "HTTP Request Duration:"
        Write-Host "  Avg:    $($duration.avg)ms"
        Write-Host "  Min:    $($duration.min)ms"
        Write-Host "  Max:    $($duration.max)ms"
        Write-Host "  P(95):  $($duration['p(95)'])ms"
        Write-Host "  P(99):  $($duration['p(99)'])ms"
        Write-Host "  Med:    $($duration.med)ms"
    }
    
    Write-Host ""
    
    if ($data.metrics.http_req_failed) {
        $failed = $data.metrics.http_req_failed.values
        Write-Host "HTTP Request Failed:"
        Write-Host "  Rate: $($failed.rate * 100)%"
    }
    
    Write-Host ""
    Write-Host "█ EJECUCIÓN"
    Write-Host ""
    
    if ($data.metrics.vus) {
        $vus = $data.metrics.vus.values
        Write-Host "VUS (Virtual Users):"
        Write-Host "  Current: $($vus.value)"
        Write-Host "  Min:     $($vus.min)"
        Write-Host "  Max:     $($vus.max)"
    }
    
    if ($data.metrics.iterations) {
        $iter = $data.metrics.iterations.values
        Write-Host ""
        Write-Host "Iterations:"
        Write-Host "  Total: $($iter.value)"
        Write-Host "  Rate:  $($iter.rate) iter/s"
    }
    
    if ($data.metrics.http_reqs) {
        $reqs = $data.metrics.http_reqs.values
        Write-Host ""
        Write-Host "HTTP Requests:"
        Write-Host "  Total: $($reqs.value)"
        Write-Host "  Rate:  $($reqs.rate) req/s"
    }
}

if ($Summary) {
    Write-Host ""
    Write-Host "█ RESUMEN EJECUTIVO"
    Write-Host ""
    
    if ($data.metrics.http_req_duration.values['p(95)']) {
        $p95 = $data.metrics.http_req_duration.values['p(95)']
        if ($p95 -lt 500) {
            Write-Host "✓ P95 Latency: EXCELENTE ($p95 ms < 500 ms)"
        } elseif ($p95 -lt 1000) {
            Write-Host "⚠ P95 Latency: ACEPTABLE ($p95 ms < 1000 ms)"
        } else {
            Write-Host "✗ P95 Latency: CRÍTICO ($p95 ms > 1000 ms)"
        }
    }
    
    if ($data.metrics.http_req_failed.values.rate) {
        $errorRate = $data.metrics.http_req_failed.values.rate
        if ($errorRate -lt 0.01) {
            Write-Host "✓ Error Rate: EXCELENTE ($($errorRate * 100)% < 1%)"
        } elseif ($errorRate -lt 0.05) {
            Write-Host "⚠ Error Rate: ACEPTABLE ($($errorRate * 100)% < 5%)"
        } else {
            Write-Host "✗ Error Rate: CRÍTICO ($($errorRate * 100)% > 5%)"
        }
    }
}

Write-Host ""
