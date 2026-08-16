# Cuenta técnica E2E

La cuenta `biogrid.e2e.20260816@example.com` se utiliza exclusivamente para
pruebas locales de Firebase Authentication, perfil Firestore y flujos de
informes.

Las credenciales se encuentran en `.env.test.local`. Ese archivo coincide con
la regla `.env*.local` de `.gitignore` y no debe incorporarse al repositorio.

## Datos certificados

- Nombre: `BioGrid E2E Test`
- Proveedor: Firebase Authentication (email/password)
- Perfil: `/users/{uid}` en la base Firestore `biogrid-database`
- Fecha de creación: 2026-08-16
- Uso permitido: desarrollo y pruebas automatizadas

La cuenta no debe reutilizarse como usuario productivo ni recibir permisos
administrativos.
