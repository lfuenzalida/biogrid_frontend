# Frontera de autenticación

BioGrid utiliza Firebase Authentication en el cliente. `AuthProvider` observa la
persistencia de Firebase mediante `onAuthStateChanged`; los grupos `(auth)` y
`(protected)` aplican guards de navegación y nunca muestran el chasis privado
mientras la sesión está ausente o aún se está resolviendo.

Estos guards son una frontera de experiencia de usuario, no una autorización de
datos. Los endpoints y el backend deben validar cada operación sensible.

## Decisión sobre `/api/avistamientos`

`POST /api/avistamientos` es, por ahora, un endpoint **público de solo consulta**.
La `BIOGRID_API_KEY` permanece exclusivamente en el servidor y nunca se entrega
al navegador. El endpoint no acepta mutaciones, pero una persona anónima puede
consumir consultas y cuota a través del proxy.

Antes de producción debe elegirse una de estas medidas:

1. Verificar el Firebase ID token en el backend de BioGrid, igual que en informes,
   y reenviar `Authorization` desde el Route Handler.
2. Incorporar Firebase Admin en el servidor Next.js con credenciales de servicio
   administradas fuera del repositorio.

Además, el despliegue debe aplicar rate limiting independientemente de la opción
seleccionada. No se considera seguro comprobar únicamente que exista un header
Bearer sin validar criptográficamente el token.
