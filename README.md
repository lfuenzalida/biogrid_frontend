# BioGrid Frontend

Frontend de BioGrid construido con Next.js App Router, React, Firebase Authentication,
Firestore y MapLibre. Permite consultar avistamientos geográficos, crear informes y
administrar perfiles con una frontera autenticada.

## Requisitos

- Node.js 20 o superior.
- Proyecto Firebase con Authentication y Firestore habilitados.
- Backend BioGrid disponible.
- Redis REST para rate limiting en producción.

## Configuración local

1. Copia `.env.example` como `.env.local`.
2. Completa las variables públicas de Firebase y las variables privadas del backend.
3. Ejecuta `npm ci` y luego `npm run dev`.

Las variables `NEXT_PUBLIC_*` se incluyen en el bundle del navegador y nunca deben
contener secretos. `BIOGRID_API_KEY`, credenciales administrativas y tokens Redis son
exclusivamente de servidor.

## Seguridad y App Check

Los Route Handlers verifican el ID token Firebase antes de reenviar solicitudes. El
proxy de avistamientos aplica un límite distribuido de 20 solicitudes por minuto y
usuario mediante Upstash. Sin Redis, solo desarrollo y tests usan un contador local;
producción rechaza la operación para no ofrecer una protección engañosa.

Para habilitar App Check:

1. Registra la aplicación web en Firebase App Check con reCAPTCHA Enterprise.
2. Define `NEXT_PUBLIC_FIREBASE_APP_CHECK_SITE_KEY` y despliega con enforcement aún
   desactivado.
3. Revisa las métricas de solicitudes válidas/no verificadas en Firebase Console.
4. Define `FIREBASE_APP_CHECK_REQUIRED=true` y después activa enforcement en Firebase.

## Calidad

```bash
npm run typecheck
npm run lint
npm run test
npm run test:e2e
npm run quality
```

El pipeline de GitHub ejecuta typecheck, lint, unitarios, build y pruebas Playwright.
Los E2E incluyen rutas privadas, viewports móvil/tablet/escritorio y auditoría WCAG
automatizada con axe.

## Despliegue

1. Configura todas las variables de `.env.example` en el proveedor de hosting.
2. Ejecuta `npm ci`, `npm run quality` y `npm run test:e2e` antes de promover.
3. Despliega con `npm run build` y `npm run start`.
4. Verifica login, consulta de mapa, creación de informe, historial y logout.
5. Confirma respuestas `401`, `403` y `429`, además del encabezado `x-request-id`.

Para rollback, conserva el artefacto o revisión anterior y restaura simultáneamente
las variables compatibles. No habilites App Check enforcement antes de observar el
tráfico real y disponer de un rollback probado.
