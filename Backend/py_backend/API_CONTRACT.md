# API Contract (Current)

Base URL: `http://localhost:8000`

Authentication:
- Get token with `POST /auth/token` using payload `{ "user_id": "your-user" }`
- Include header in protected endpoints: `Authorization: Bearer <token>`

## Auth

- `POST /auth/token`
  - Body: `{ "user_id": "string" }`
  - Response: `{ "access_token": "string", "token_type": "bearer" }`

## Organizations

- `POST /organizations`
  - Body: `{ "name": "string" }`
- `GET /organizations`
- `GET /organizations/{org_id}`
- `PATCH /organizations/{org_id}`
  - Body (partial): `{ "name": "string" }`
- `DELETE /organizations/{org_id}`

## Evaluations

- `POST /evaluations`
  - Body: `{ "organization_id": number, "answers": { "key": "value" } }`
- `GET /evaluations`
- `GET /evaluations/{evaluation_id}`
- `PATCH /evaluations/{evaluation_id}`
  - Body (partial): `{ "organization_id": number, "answers": {} }`
- `DELETE /evaluations/{evaluation_id}`

## Generic Entity CRUD

Prefix: `/entities`

Single primary key resources expose:
- `GET /entities/{resource}`
- `GET /entities/{resource}/{id}`
- `POST /entities/{resource}`
- `PATCH /entities/{resource}/{id}`
- `DELETE /entities/{resource}/{id}`

Resources:
- `roles`
- `usuarios`
- `empresas`
- `evaluaciones`
- `controles`
- `preguntas`
- `respuestas`
- `niveles-madurez`
- `resultados`
- `scores`
- `indicadores`
- `activos`
- `riesgos`
- `amenazas`
- `vulnerabilidades`

Composite key resources expose:
- `GET /entities/{resource}`
- `POST /entities/{resource}`
- `GET /entities/{resource}/{pk1}/{pk2}`
- `DELETE /entities/{resource}/{pk1}/{pk2}`

Resources:
- `riesgo-amenaza`
- `riesgo-vulnerabilidad`

## Notes

- Generic endpoints accept free-form JSON body validated by SQLModel constructor.
- For frontend integration, prefer module-specific routes (`/organizations`, `/evaluations`) when available.