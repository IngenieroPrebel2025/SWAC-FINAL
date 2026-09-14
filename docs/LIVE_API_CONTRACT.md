# Contrato de integración `LIVE_API`

## Objetivo

Este documento define lo que el frontend SWAC ya espera del backend cuando se selecciona `LIVE_API`. No sustituye una especificación OpenAPI; sirve como checklist de compatibilidad durante la conexión del servicio real.

## Activación

1. Definir `NEXT_PUBLIC_API_URL` con el prefijo del backend, por ejemplo `https://api.ejemplo.com/api/v1`.
2. Definir `NEXT_PUBLIC_DATA_SOURCE_MODE=LIVE_API`, o cambiar el origen desde **Configuración > Sistema**.
3. Iniciar sesión para que el token y el alcance de sede estén disponibles en el estado de cliente.

La capa HTTP concatena el prefijo configurado y el endpoint relativo. Las respuestas deben contener directamente el valor esperado por cada repositorio (por ejemplo, un arreglo de citas para `GET /citas`), no un sobre de respuesta adicional. Los errores pueden devolver `{ "message": "..." }`; ese mensaje se muestra al usuario y queda registrado en la consola HTTP.

## Cabeceras enviadas

Las operaciones que reciben `getAuthHeaders()` incluyen las siguientes cabeceras de contexto:

| Cabecera | Propósito |
| --- | --- |
| `Authorization: Bearer <token>` | Sesión autenticada, cuando existe token. |
| `X-Client-Version` | Versión de cliente configurada. |
| `X-Active-Sede` | Sede seleccionada. |
| `X-Sedes-Asignadas` | Alcance de sedes (`ALL` o identificadores separados por coma). |
| `X-User-Role` | Rol operativo actual. |
| `X-Nit-Proveedor`, `X-Proveedor-Id` | Contexto de proveedor cuando corresponde. |

El backend debe validar el token y el alcance por su propia cuenta; estas cabeceras facilitan trazabilidad y no reemplazan autorización del lado servidor.

## Endpoints por dominio

| Dominio | Operaciones esperadas |
| --- | --- |
| Autenticación y RBAC | `POST /auth/login`, `GET /auth/me`, `POST /auth/impersonate/:usuarioId`, CRUD `/usuarios`, CRUD `/roles`, `PATCH /roles/:rolId/permisos`, `GET /permisos`. |
| Citas | CRUD `/citas`, `PATCH /citas/:id/cancelar`, `PATCH /citas/:id/estado`, reservas temporales bajo `/citas/reservas-temporales`, `POST /citas/slots-disponibles` y `POST /citas/calcular-duracion`. |
| Transporte | `GET`/`POST /vehiculos` y `GET`/`POST /conductores`. |
| Portería y patio | `GET /porteria/turnos`, `POST /porteria/checkin`, inspecciones bajo `/porteria/inspecciones`, acciones de turno bajo `/porteria/turnos/:id/*`, `POST /porteria/checkout`, `GET /porteria/salidas` y `POST /driver/session`. |
| Infraestructura | CRUD `/sedes`, recursos de muelles bajo `/sedes/:id/muelles` y `/muelles/:id`, estado y bitácora de disponibilidad. |
| Formularios e integraciones | CRUD `/formularios`, respuestas por cita, CRUD `/integraciones` y prueba de conexión. |
| Catálogos y auditoría | Proveedores, materiales/tipos de material y bitácora de auditoría. |

Los métodos, parámetros y cuerpos exactos viven en `src/lib/repositories/live/`; los contratos TypeScript que describen cada modelo están en `src/lib/repositories/types.ts` y `src/types/`.

## Criterio de salida de MOCK

Antes de operar en `LIVE_API`, validar al menos:

- inicio de sesión y recuperación de `GET /auth/me`;
- listado y creación de una cita, incluida la reserva temporal;
- check-in, inspección y avance de un turno de patio;
- creación/edición de un muelle y consulta de disponibilidad;
- una operación RBAC y una integración de prueba;
- errores 401, 403, 422, 429 y 5xx con mensaje recuperable.

Mientras alguno de esos flujos no exista en backend, conservar `MOCK` como origen predeterminado para demos y pruebas de interfaz.
