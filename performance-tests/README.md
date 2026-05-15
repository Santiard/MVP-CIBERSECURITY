# Performance Tests - MVP CIBERSECURITY

Este directorio contiene pruebas de carga, estrés y seguridad para el backend Python del proyecto.

## Requisitos

### Instalación de K6

**Windows (usando Chocolatey):**
```powershell
choco install k6
```

**Windows (descarga manual):**
Descargar desde: https://github.com/grafana/k6/releases

**Linux/Mac:**
```bash
brew install k6  # macOS
apt-get install k6  # Linux Debian/Ubuntu
```

### Instalación de OWASP ZAP

Descargar desde: https://www.zaproxy.org/download/

## Estructura

```
performance-tests/
├── load-test.js          # Prueba de carga (20-50 usuarios, 14 min)
├── stress-test.js        # Prueba de estrés (50-300 usuarios, 28 min)
├── security-test.js      # Prueba de seguridad (SQL injection, XSS, etc)
├── run-all-tests.ps1     # Script para ejecutar todas las pruebas
├── results/              # Resultados en JSON
└── screenshots/          # Capturas de pantalla
```

## Pruebas Disponibles

### 1. Load Test (Prueba de Carga)
**Archivo:** `load-test.js`

**Configuración:**
- 20 usuarios iniciales → 50 usuarios máximo
- Duración: 14 minutos
- Validación: 95% de requests < 500ms, 99% < 1000ms

**Endpoints probados:**
- `POST /auth/token` (Login)
- `POST /auth/register` (Registro)
- `GET /evaluations` (Dashboard)
- `GET /organizations`
- `GET /health`

**Comando:**
```powershell
k6 run load-test.js -o json=results/load-test-results.json
```

### 2. Stress Test (Prueba de Estrés)
**Archivo:** `stress-test.js`

**Configuración:**
- Fase 1: 50 usuarios (5 min)
- Fase 2: 100 usuarios (5 min)
- Fase 3: 200 usuarios (5 min)
- Fase 4: 300 usuarios (5 min) - MÁXIMO ESTRÉS
- Total: 28 minutos
- Umbrales: 95% < 1000ms, 99% < 2000ms

**Endpoints probados:**
- Autenticación con retry
- Creación de evaluaciones (POST)
- Lectura de evaluaciones (GET)
- Lectura de organizaciones (GET)
- Lectura de cuestionarios (GET)

**Comando:**
```powershell
k6 run stress-test.js -o json=results/stress-test-results.json
```

### 3. Security Test (Prueba de Seguridad)
**Archivo:** `security-test.js`

**Pruebas incluidas:**
1. SQL Injection (básica y UNION-based)
2. XSS (Cross-Site Scripting)
3. Acceso sin autorización
4. Fuerza bruta en login
5. Validación de formularios
6. Headers de seguridad
7. Autenticación débil / Credenciales por defecto
8. Path traversal

**Comando:**
```powershell
k6 run security-test.js -o json=results/security-test-results.json
```

## Ejecución Rápida

### En PowerShell:

**1. Prueba de carga:**
```powershell
k6 run load-test.js --out json=results/load-test-$(Get-Date -Format 'yyyyMMdd_HHmmss').json
```

**2. Prueba de estrés:**
```powershell
k6 run stress-test.js --out json=results/stress-test-$(Get-Date -Format 'yyyyMMdd_HHmmss').json
```

**3. Prueba de seguridad:**
```powershell
k6 run security-test.js --out json=results/security-test-$(Get-Date -Format 'yyyyMMdd_HHmmss').json
```

**4. Ejecutar todas las pruebas secuencialmente:**
```powershell
.\run-all-tests.ps1
```

## Interpretación de Resultados

### Métricas principales de K6:

| Métrica | Descripción | Valor esperado |
|---------|-------------|-----------------|
| `http_req_duration` | Tiempo de respuesta en ms | < 500ms (95%) |
| `http_req_failed` | % de requests fallidas | < 10% |
| `vus` | Usuarios virtuales concurrentes | Según escala |
| `iterations` | Número total de iteraciones | Depende del test |
| `http_reqs` | Total de requests completadas | Alta |
| `dropped_iterations` | Iteraciones descartadas | 0 |

### Ejemplo de resultado (JSON):
```json
{
  "metrics": {
    "http_req_duration": {
      "avg": 245,
      "max": 1500,
      "med": 200,
      "p(95)": 480,
      "p(99)": 900
    },
    "http_req_failed": {
      "rate": 0.05
    },
    "vus": {
      "value": 50
    }
  }
}
```

## Requisitos Previos - Backend

El backend debe estar ejecutándose:

```bash
cd Backend/py_backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

O con Docker:
```bash
docker-compose up -d backend
```

## Uso de OWASP ZAP

### Instalación y configuración:

1. Descargar OWASP ZAP desde: https://www.zaproxy.org/download/
2. Ejecutar ZAP en modo daemon:
```bash
zaproxy.sh -config api.disablekey=true -config api.key= -daemon -host 127.0.0.1 -port 8080
```

### Ejecutar escaneo automático:
```bash
zapcli quick-scan http://localhost:8000
```

### Generar reporte:
```bash
zapcli report --output-format html=zap-report.html http://localhost:8000
```

## Troubleshooting

### K6 no se ejecuta en Windows
```powershell
# Verificar instalación
k6 version

# Si no funciona, instalar manualmente:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
choco install k6
```

### Backend no responde
```powershell
# Verificar que el backend esté corriendo
curl http://localhost:8000/health

# Si falla, iniciar backend
cd Backend/py_backend
python -m uvicorn app.main:app --reload
```

### Errores de autenticación en tests
```
Verificar credenciales en:
- load-test.js línea 45
- stress-test.js línea 60

Credencial por defecto: admin@example.com / Admin123!@
```

### CORS errors
Si aparecen errores CORS, verificar que el backend tiene configurado CORS en main.py

## Análisis de Resultados

Después de ejecutar las pruebas, analizar:

### Para Load Test:
1. ¿95% de requests están bajo 500ms?
2. ¿El error rate está bajo 10%?
3. ¿El sistema es estable con 50 usuarios?

### Para Stress Test:
1. En qué fase comienzan a aumentar los errores?
2. ¿A cuántos usuarios llega el punto de quiebre?
3. ¿Se recupera el sistema después de escalar hacia abajo?
4. ¿Hay timeouts o desconexiones?

### Para Security Test:
1. ¿Se rechazaron todos los intentos de SQL injection?
2. ¿Los campos fueron sanitizados para XSS?
3. ¿Los endpoints protegidos requieren autenticación?
4. ¿Hay rate limiting en login?
5. ¿Las contraseñas débiles son rechazadas?

## Recomendaciones Post-Test

1. **Performance:**
   - Implementar caché
   - Optimizar queries de BD
   - Usar connection pooling

2. **Seguridad:**
   - Hashear contraseñas
   - Implementar rate limiting
   - Agregar headers de seguridad
   - HTTPS en producción

3. **Confiabilidad:**
   - Implementar circuit breaker
   - Health checks más detallados
   - Retry logic mejorado

## Referencias

- [K6 Documentation](https://k6.io/docs/)
- [K6 HTTP Module](https://k6.io/docs/javascript-api/k6-http/)
- [OWASP ZAP User Guide](https://www.zaproxy.org/docs/desktop/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
