# FastAPI Backend - MVP CIBERSECURITY

Migración profesional de Node.js/TypeScript → Python/FastAPI.

## Instalación local

```bash
# 1. Crear entorno virtual
python -m venv .venv
.venv\Scripts\activate    # Windows
source .venv/bin/activate # macOS/Linux

# 2. Instalar dependencias
pip install -r requirements.txt

# 3. Configurar variables de entorno
cp app/.env.example app/.env
# Editar app/.env con tus valores

# 4. Ejecutar servidor
uvicorn app.main:app --reload --port 8000
```

Servidor disponible en: `http://localhost:8000`  
Documentación interactiva: `http://localhost:8000/docs`

## Docker

```bash
# Build y run con docker-compose
docker-compose up --build

# O build manual
docker build -t mvp-cyber-api .
docker run -p 8000:8000 mvp-cyber-api
```

## Estructura

```
app/
  main.py                      # FastAPI app + rutas
  schemas.py                   # Pydantic models (DTOs)
  auth.py                      # JWT authentication
  db.py                        # SQLModel + DB engine
  use_cases/                   # Business logic
    create_evaluation.py
    create_organization.py
  repositories/                # Data layer
    evaluation_repository.py   # Evaluation + Organization models + repos
tests/
  test_main.py                 # Pytest tests
requirements.txt               # Dependencies
Dockerfile                     # Container image
docker-compose.yml             # Compose config
```

## API Endpoints

### Auth
- `POST /auth/token` — Generar JWT token
  ```bash
  curl -X POST http://localhost:8000/auth/token -H "Content-Type: application/json" -d '{"user_id": "user123"}'
  ```

### Organizations (requiere autenticación)
- `POST /organizations` — Crear organización
- `GET /organizations` — Listar todas
- `GET /organizations/{org_id}` — Obtener una

### Evaluations (requiere autenticación)
- `POST /evaluations` — Crear evaluación
  ```bash
  curl -X POST http://localhost:8000/evaluations \
    -H "Authorization: Bearer <TOKEN>" \
    -H "Content-Type: application/json" \
    -d '{"organization_id": 1, "answers": {"q1": "answer1"}}'
  ```
- `GET /evaluations` — Listar todas
- `GET /evaluations/{eval_id}` — Obtener una

## Testing

```bash
# Ejecutar tests
pytest tests/

# Con cobertura
pytest tests/ --cov=app
```

## Migración desde Node.js

### Mapeo de capas
| Node.js | Python FastAPI |
|---------|----------------|
| DTO (TypeScript interface) | Pydantic model (schemas.py) |
| Use-case class | Python class (use_cases/) |
| Express routes | FastAPI routers (main.py) |
| Prisma ORM | SQLModel + SQLAlchemy |
| JWT middleware | `@Depends(get_current_user)` |

### Cambios principales
1. **Tipos**: TypeScript → Python typing + Pydantic
2. **Rutas**: Express Router → FastAPI routers con `Depends()`
3. **DB**: Prisma → SQLModel (compatible con FastAPI/SQLAlchemy)
4. **Auth**: Custom JWT → python-jose + FastAPI security
5. **Testing**: Jest → pytest

## Deployment

### Producción (uvicorn + gunicorn)
```bash
pip install gunicorn
gunicorn -w 4 -k uvicorn.workers.UvicornWorker app.main:app
```

### Cloud (Azure, AWS, GCP)
- Dockerfile incluido para containerizar
- Variables de entorno: usar secrets management
- DB: Migrar a PostgreSQL (reemplazar DATABASE_URL en `.env`)

## Notas

- Todos los endpoints excepto `/auth/token` requieren autenticación JWT
- Token incluido en header: `Authorization: Bearer <token>`
- Base de datos: SQLite por defecto (dev.db)
- En producción, usar PostgreSQL + Alembic para migraciones
