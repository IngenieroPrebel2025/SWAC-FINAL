# Arquitectura de SWAC

## Propósito

SWAC es una aplicación web para la asignación de citas, control de portería y operación de muelles. Esta implementación sustituye la aplicación de referencia basada en Vite por una aplicación Next.js con rutas independientes, conservando el dominio funcional y permitiendo operar con datos demo o una API REST.

## Tecnología

- Next.js 15 (App Router), React 19 y TypeScript estricto.
- Tailwind CSS 4 más tokens CSS semánticos para los temas claro y oscuro.
- React Query para consultas, caché e invalidación; Redux Toolkit para estado de sesión, interfaz, configuración y notificaciones.
- React Hook Form y Zod para formularios y validación.
- Axios para el adaptador HTTP y Lucide para iconografía.

## Capas y límites

```text
src/app                 Rutas, layouts y límites de error de Next.js
src/components          Átomos, moléculas, organismos y vistas de cada módulo
src/hooks               Casos de uso de interfaz y adaptadores de React Query
src/lib/repositories    Contratos y adaptadores MOCK / LIVE_API del dominio
src/lib/api             Cliente HTTP, cabeceras y claves de caché
src/schemas             Validación de comandos de formulario con Zod
src/store               Estado global reducido a UI, auth y configuración
src/types               Modelo de dominio compartido
src/mocks               Datos y comportamiento determinista de demostración
```

Las vistas no realizan peticiones HTTP directamente. Usan hooks; los hooks dependen de contratos de repositorio; el factory `repositories` elige el adaptador activo. Así, los módulos se pueden validar sin backend y migrar gradualmente a la API real sin reescribir la interfaz.

## Módulos funcionales

| Área | Ruta | Responsabilidad |
| --- | --- | --- |
| Inicio | `/inicio` | Contexto de sesión y accesos por rol. |
| Indicadores | `/indicadores` | KPIs, proveedores, alertas y auditoría documental. |
| Citas y muelles | `/operaciones/citas` | Agenda, capacidad, cronograma y detalle de cita. |
| Portería y patio | `/operaciones/porteria` | Check-in, inspección, patio y pase de conductor. |
| Formularios | `/operaciones/formularios` | Diseño y ejecución de workflows dinámicos. |
| Sedes y muelles | `/operaciones/sedes` | Infraestructura, compatibilidad y disponibilidad. |
| Configuración | `/configuracion/*` | Usuarios/RBAC, integraciones y parámetros de sistema. |

`src/config/navigation.ts` es la única fuente de navegación y reglas de acceso. El layout evalúa esas reglas antes de renderizar una ruta y el sidebar deriva el árbol visible del mismo archivo.

## Datos y configuración

El modo inicial se define con `NEXT_PUBLIC_DATA_SOURCE_MODE`:

- `MOCK`: repositorios en memoria, adecuado para demo y desarrollo de la interfaz.
- `LIVE_API`: repositorios Axios contra `NEXT_PUBLIC_API_URL`.

El usuario puede cambiar el origen desde Configuración > Sistema; el estado se persiste localmente. Para conectar un backend, implementar o ajustar solamente los adaptadores de `src/lib/repositories/live/`, manteniendo los contratos de `src/lib/repositories/types.ts`.

## Convenciones de interfaz

- Usar componentes existentes antes de crear variantes: átomos para controles, moléculas para composición, organismos para flujo y templates para cada módulo.
- Usar tokens `var(--...)`, nunca colores arbitrarios por pantalla; los tokens mantienen contraste y coherencia entre temas.
- Las acciones asíncronas se ejecutan mediante mutaciones React Query e informan éxito o error mediante el toaster global.
- Mantener etiquetas visibles para campos, foco visible, alternativas a interacciones de precisión y `prefers-reduced-motion`.

## Verificación local

```powershell
npm run typecheck
npm run lint
npm run build
```

La configuración ESLint usa las reglas Core Web Vitals de Next y excluye artefactos de compilación.
