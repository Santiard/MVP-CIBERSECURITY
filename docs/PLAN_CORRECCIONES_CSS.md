# Plan de correcciones CSS (paso a paso)

Este documento define que revisar, que corregir y en que orden para mejorar CSS sin romper la app.

## 1) Estado actual

- Archivo validado: `Frontend/src/styles/theme.css`
- Resultado W3C: sin errores de sintaxis.
- Advertencias vistas:
  - Uso de variables CSS (`var(--...)`) no chequeables estaticamente por el validador.
  - Extensiones de vendor (`-webkit-font-smoothing`, `-moz-osx-font-smoothing`, `-apple-system`).

## 2) Que SI corregir (prioridad alta)

1. Coherencia visual por pagina (espaciados, tamanos, alineacion).
2. Responsive en mobile (320px, 375px, 768px).
3. Estados interactivos (hover, focus, disabled) en botones/links.
4. Contraste y legibilidad (texto vs fondo, especialmente en dark mode).
5. Overflow y cortes de contenido (tablas, cards, titulos largos).

## 3) Que NO corregir por ahora

- Advertencias de variables CSS del validador W3C.
- Advertencias vendor de suavizado de fuente si la app se ve bien.

Motivo: no rompen funcionalidad y son comunes en apps modernas.

## 4) Archivos a revisar (orden recomendado)

1. `Frontend/src/styles/theme.css` (tokens, clases base `.btn`, `.card`, foco y responsive)
2. `Frontend/src/components/Sidebar.tsx` (links, estados activos, contraste)
3. `Frontend/pages/LoginPage.tsx` (entrada principal, formularios y enlaces)
4. `Frontend/pages/AdminDashboardPage.tsx` (cards y botones principales)
5. `Frontend/src/pages/OrganizationsPage.tsx` y `Frontend/src/components/OrganizationsTable.tsx`
6. `Frontend/src/pages/EvaluationsPage.tsx` y `Frontend/src/components/EvaluationsTable.tsx`
7. `Frontend/src/pages/ReportsPage.tsx` y `Frontend/src/pages/ReportDetailPage.tsx`

## 5) Checklist de validacion manual por ruta

- `/LoginPage`
- `/dashboard`
- `/organizations`
- `/evaluations`
- `/reports`
- `/vulnerabilities`

En cada ruta validar:
- No hay texto cortado o desbordado.
- Botones con hover/focus visible.
- Contraste suficiente en fondos claros/oscuros.
- Diseno usable en mobile.

## 6) Metodo de trabajo (iterativo)

1. Revisar 1 archivo/ruta.
2. Ajustar CSS minimo necesario.
3. Probar visual desktop + mobile.
4. Revalidar CSS si hubo cambios grandes en `theme.css`.
5. Pasar al siguiente bloque.

## 7) Primer paso sugerido ahora

Empezar por: `Frontend/src/styles/theme.css`

En esta primera pasada revisaremos:
- Tipografia base de `body`.
- Estados de foco (`:focus`, `:focus-visible`).
- Botones (`.btn`, `.btn-primary`, `.btn-secondary`).
- Ajustes responsive del bloque `@media (max-width: 640px)`.
