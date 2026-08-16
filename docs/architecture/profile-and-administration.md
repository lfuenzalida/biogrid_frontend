# Perfil y administración B2B

## Responsabilidades

- `/perfil` pertenece a cualquier usuario autenticado. Lee identidad desde
  `AuthContext` y el documento `/users/{uid}` desde `ProfileContext`.
- `/administracion` es una superficie distinta. Requiere `role == ADMIN` y
  `status == ACTIVE`.
- El Sidebar muestra Administración únicamente cuando se cumplen ambas
  condiciones.

## Modelo de usuario

| Campo | Editable por el usuario | Responsable |
| --- | --- | --- |
| `fullName` | Sí | Usuario autenticado |
| `uid` | No | Firebase Authentication |
| `email` | No desde el perfil | Firebase Authentication |
| `role` | No | Backend / Firebase Admin |
| `organizationId` | No | Backend / Firebase Admin |
| `organizationName` | No | Backend / Firebase Admin |
| `status` | No | Backend / Firebase Admin |
| `createdAt` | No | Registro |
| `updatedAt` | Automático | Servidor Firestore |

Los perfiles históricos que no tengan campos B2B se interpretan de forma
segura como `USER`, `ACTIVE` y sin organización. La migración persistente debe
realizarse desde un entorno administrativo confiable.

## Seguridad

Las reglas incluidas en `firestore.rules` permiten al propietario leer su
documento, pero solo modificar `fullName` y `updatedAt`. No existe una operación
cliente para otorgar roles o asociar organizaciones.

La actualización local de las reglas no cambia el proyecto remoto por sí sola.
Debe desplegarse mediante el flujo de infraestructura Firebase correspondiente
antes de considerar activo el endurecimiento en producción.

La gestión real de miembros y permisos requerirá endpoints del backend BioGrid
o Firebase Admin. La UI administrativa no debe escribir roles directamente en
Firestore desde el navegador.
