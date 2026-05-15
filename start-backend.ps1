#!/usr/bin/env pwsh

# Script para iniciar el backend de Python
# Uso: .\start-backend.ps1

$backendPath = "C:\Users\JAAL\Documents\MVP-CIBERSECURITY\Backend\py_backend"
$pythonCmd = "python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

Write-Host "╔══════════════════════════════════════════════════════╗"
Write-Host "║  Iniciando Backend - MVP CIBERSECURITY               ║"
Write-Host "╚══════════════════════════════════════════════════════╝"
Write-Host ""

# Verificar que la carpeta existe
if (-not (Test-Path $backendPath)) {
    Write-Host "✗ Ruta de backend no encontrada: $backendPath"
    exit 1
}

Write-Host "Ruta: $backendPath"
Write-Host "Comando: $pythonCmd"
Write-Host ""

# Cambiar a directorio del backend
Set-Location $backendPath

# Ejecutar backend
Write-Host "Iniciando uvicorn en puerto 8000..."
Write-Host ""

& python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
