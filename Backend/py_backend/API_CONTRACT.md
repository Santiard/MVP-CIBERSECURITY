# API Contract (Current)

Base URL: `http://localhost:8000`

Authentication:
- Get token with `POST /auth/token` using payload `{ "email": "user@example.com", "password": "StrongPass!1" }`
- Include header in protected endpoints: `Authorization: Bearer <token>`

## Auth

- `POST /auth/token`
  - Body: `{ "email": "string", "password": "string" }`
  - Response: `{ "access_token": "string", "token_type": "bearer", "user_id": number, "name": "string", "role": "admin|evaluator|user" }`

- `POST /auth/recover-password`
  - Body: `{ "email": "string", "new_password": "string" }`
  - Response: `{ "message": "Contraseña actualizada correctamente" }`

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

## Core Entities (Canonical)

Single primary key resources expose:
- `GET /{resource}`
- `GET /{resource}/{id}`
- `POST /{resource}`
- `PATCH /{resource}/{id}`
- `DELETE /{resource}/{id}`

Resources:
- `roles`
- `users`
- `questionnaires`
- `vulnerabilities`
- `risks`

## Notes

- Core entity endpoints accept free-form JSON body validated by SQLModel constructor.
- Frontend integration uses canonical routes only: `/organizations`, `/evaluations`, `/users`, `/roles`, `/questionnaires`, `/vulnerabilities`, `/risks`.