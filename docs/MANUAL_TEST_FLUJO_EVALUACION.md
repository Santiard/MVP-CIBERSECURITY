# Prueba manual: flujo de evaluación (alcance + cuestionario)

Este documento describe el **orden recomendado** para comprobar que el front y el back funcionan de extremo a extremo con el flujo implementado en `/evaluations/:id/workflow`.

## Prerrequisitos

1. API y base de datos en marcha (Docker o entorno local) con datos sembrados (`seed` habilitado).
2. Usuario autenticado en el front (admin o evaluador con permisos sobre la organización).
3. Tras desplegar cambios de backend, conviene **recrear la base** o ejecutar migraciones/seed para que existan **preguntas** por control (`_seed_preguntas` en `seed.py`).

## Orden de prueba (flujo feliz)

### 1. Crear o elegir una evaluación

- Opción A: **Asignaciones** (`/asignaciones`): elija empresa → **Crear y abrir flujo**.
- Opción B: **Organización** → **Iniciar evaluación (rápido)**.
- Opción C: Si ya existe una evaluación, en **Asignaciones** o **Evaluaciones** use **Alcance y cuestionario** / **Flujo**.

**Resultado esperado:** navegación a `/evaluations/{id}/workflow` (paso 1 visible).

### 2. Paso 1 — Alcance (controles)

1. Marque uno o más cuestionarios (checkboxes).
2. Pulse **Guardar alcance y continuar**.

**APIs involucradas (orden lógico en pantalla):**

- `DELETE /evaluations/{id}/controles/{control_id}` por cada control que dejara de estar seleccionado respecto al estado previo en servidor.
- `POST /evaluations/{id}/controles` con cuerpo `{ "control_ids": [...] }` para los nuevos enlaces.
- `GET /questions/by-control/{control_id}` por cada control enlazado, al pasar al paso 2.

**Resultado esperado:** paso 2 sin errores; si no hay preguntas sembradas, verá el aviso de lista vacía.

### 3. Paso 2 — Cuestionario

1. Para cada pregunta, opcionalmente indique **Valor (1–5)** y/o **Comentario**.
2. Pulse **Guardar respuestas**.

**API:** `PATCH /evaluations/{id}` con `{ "answers": { "<id_pregunta>": { "valor": 3, "comentario": "..." }, ... } } }`.

**Resultado esperado:** mensaje de éxito; al recargar la página, los valores deberían rehidratarse desde `GET /evaluations/{id}`.

### 4. Informe (opcional)

- En el paso 2 use **Ver informe** o la ruta `/reports/{id}`.

**Resultado esperado:** el informe refleja respuestas almacenadas en `answers` (objetos con `valor`).

## Casos adicionales recomendados

| Caso | Acción | Esperado |
|------|--------|------------|
| Sin controles | Paso 1 sin marcar nada → continuar | Alerta pidiendo al menos un control |
| Valor inválido | Valor fuera de 1–5 | Mensaje de error de validación |
| Quitar un control del alcance | Volver al paso 1, desmarcar, guardar y continuar | Preguntas del control desaparecen del paso 2 |
| Usuario organización | Misma ruta con evaluación de su empresa | 403 si intenta otra empresa (backend) |

## Referencia rápida de endpoints

| Uso | Método y ruta |
|-----|----------------|
| Detalle evaluación + `answers` | `GET /evaluations/{id}` |
| Guardar respuestas | `PATCH /evaluations/{id}` |
| Listar controles enlazados | `GET /evaluations/{id}/controles` |
| Enlazar varios controles | `POST /evaluations/{id}/controles` |
| Desenlazar un control | `DELETE /evaluations/{id}/controles/{control_id}` |
| Preguntas por control | `GET /questions/by-control/{control_id}` |
| Catálogo de cuestionarios | `GET /questionnaires` |
