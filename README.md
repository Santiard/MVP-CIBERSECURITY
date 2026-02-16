El proyecto implementa Arquitectura Limpia para garantizar separación de responsabilidades, independencia tecnológica y mantenibilidad.
El dominio encapsula la lógica de negocio (motor de madurez), la capa de aplicación orquesta casos de uso, infraestructura implementa persistencia y autenticación, y la capa de interfaces expone la API REST.

🔹 1️⃣ domain/

Aquí vive el corazón del sistema.
NO depende de Express, base de datos ni librerías externas.

Contiene:

Entidades (Organization, Evaluation, Questionnaire, Dimension)

Value Objects (Score, Level, Percentage)

Reglas de negocio

Interfaces (ports)

Ejemplo:

domain/
 ├── entities/
 ├── value-objects/
 ├── services/
 ├── repositories/


Aquí va el:

✔ Motor de scoring
✔ Lógica de cálculo de madurez
✔ Reglas como:

Una evaluación finalizada no se edita

Comparativa solo si hay 2 evaluaciones

💡 Esta capa no sabe que existe una base de datos.

🔹 2️⃣ application/

Orquesta los casos de uso.

Contiene:

Use Cases

DTOs

Validaciones de entrada

Coordinación entre dominio y repositorios

Ejemplo:

application/
 ├── use-cases/
 ├── dtos/


Ejemplos de casos de uso:

CreateEvaluation

CalculateScore

CompareEvaluations

GetEvaluationHistory

Esta capa dice:

“Quiero crear una evaluación”
“Necesito calcular el nivel”

Pero no sabe cómo se guarda en BD.

🔹 3️⃣ infrastructure/

Aquí vive la implementación técnica.

Contiene:

ORM (Prisma / TypeORM)

Implementación de repositorios

Conexión a base de datos

JWT

Servicios externos

Ejemplo:

infrastructure/
 ├── database/
 ├── repositories/
 ├── auth/


Aquí se implementa la interfaz que definiste en domain/repositories.

Si mañana cambias PostgreSQL por Mongo, solo modificas esta capa.

🔹 4️⃣ interfaces/

Es la capa más externa.

Contiene:

Controllers

Rutas

Middlewares

Mappers HTTP

Ejemplo:

interfaces/
 ├── controllers/
 ├── routes/
 ├── middlewares/


Aquí se conecta Express/NestJS con application.

📦 Frontend – Estructura profesional
src/
 ├── features/
 ├── components/
 ├── services/
 ├── hooks/
 ├── pages/
 ├── routes/

🔹 features/

Organización por funcionalidad, no por tipo.

Ejemplo:

features/
 ├── auth/
 ├── evaluation/
 ├── organization/
 ├── reports/


Cada feature contiene:

Componentes específicos

Servicios

Tipos

Hooks propios

Esto evita carpetas gigantes globales.

🔹 components/

Componentes reutilizables globales:

Button

Modal

Table

ChartContainer

🔹 services/

Comunicación con backend:

authService.ts

evaluationService.ts

Aquí se manejan llamadas HTTP.

🔹 hooks/

Hooks personalizados:

useAuth

useEvaluation

useCompare

🔹 pages/

Vistas principales:

LoginPage

DashboardPage

EvaluationPage

ReportPage

🔁 Flujo completo del sistema

Usuario → Controller → Use Case → Dominio → Repository → DB
↓
Motor Scoring

El dominio nunca depende de la base de datos.

🚀 ¿Por qué esto es ideal para tu MVP?

Aunque es MVP, tu proyecto:

Tiene reglas de negocio importantes

Debe ser demostrable académicamente

Debe escalar a investigación futura

Puede convertirse en producto real

Arquitectura Limpia te permite:

✔ Entregar MVP funcional
✔ Mantener profesionalismo
✔ Escalar a versión 2
✔ Agregar más normas ISO
✔ Convertirlo en SaaS futuro