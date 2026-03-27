# Checklist de Instalación Python para Windows

Este archivo guía la instalación de Python 3.11+ en Windows para ejecutar el backend FastAPI.

## Opción 1: Python.org (Recomendado)

### Paso 1: Descargar Python

1. Ir a [python.org](https://www.python.org/downloads/)
2. Descargar **Python 3.11.x** (última versión estable)
3. Elegir installer de Windows (64-bit recomendado)

### Paso 2: Ejecutar instalador

1. **Importante**: Marcar checkbox **"Add Python to PATH"** ✓
2. Seleccionar **"Install Now"** o **"Customize Installation"**
3. Esperar a completar instalación

### Paso 3: Verificar instalación

Abrir **PowerShell** o **CMD** y ejecutar:

```powershell
python --version
python -m pip --version
```

Debe mostrar:
```
Python 3.11.x
pip 23.x.x from C:\Users\...\AppData\Local\Programs\Python\Python311\lib\site-packages\pip
```

---

## Opción 2: Winget (Windows Package Manager)

Si tienes Windows 10/11 con Winget:

```powershell
winget install Python.Python.3.11
```

---

## Opción 3: Chocolatey

Si tienes Chocolatey instalado:

```powershell
choco install python311
```

---

## Instalación de FastAPI Backend

Una vez Python está listo:

```powershell
# 1. Navegar a la carpeta del proyecto
cd Backend\py_backend

# 2. Crear entorno virtual
python -m venv .venv

# 3. Activar entorno (PowerShell)
.venv\Scripts\activate

# 4. Actualizar pip
python -m pip install --upgrade pip

# 5. Instalar dependencias
pip install -r requirements.txt

# 6. Copiar configuración de entorno
copy app\.env.example app\.env
# Editar app\.env si es necesario

# 7. Ejecutar servidor
uvicorn app.main:app --reload --port 8000
```

---

## Verificación Rápida

```powershell
# Dentro del venv activado
python -c "import fastapi; print('FastAPI OK')"
python -c "import sqlmodel; print('SQLModel OK')"
python -c "import pytest; print('Pytest OK')"
```

---

## Ejecutar Tests

```powershell
# Dentro del venv
pytest tests/ -v
```

---

## IDE Recomendado

- **VS Code** (gratuito, excelente Python support)
  - Extensión: Python (Microsoft)
  - Extensión: Pylance
  - Extensión: FastAPI

- **PyCharm Community** (gratuito)
  - IDE profesional para Python

---

## Problemas Comunes

### "python: The term 'python' is not recognized"

**Solución**: Python no está en PATH. Reinstalar marcando "Add Python to PATH".

### "pip install" es muy lento

**Solución**: Usar mirror de PyPI:
```powershell
pip install -i https://mirrors.aliyun.com/pypi/simple/ -r requirements.txt
```

### "No module named 'venv'"

**Solución**: Reinstalar Python con opción "pip and venv" marcada.

---

## Documentación Oficial

- [Python.org Download](https://www.python.org/downloads/)
- [FastAPI Docs](https://fastapi.tiangolo.com/)
- [Virtual Environments Docs](https://docs.python.org/3/tutorial/venv.html)
