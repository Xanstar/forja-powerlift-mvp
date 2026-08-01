# Forja

MVP de planificación y seguimiento para entrenadores de powerlifting. Incluye gestión de atletas, programas y marcas, una vista móvil por PIN y soporte PWA para registrar entrenamientos con conectividad limitada.

> **Estado actual:** prototipo funcional para desarrollo y demostraciones. No está listo para datos reales ni para producción; consultá [Seguridad y despliegue](#seguridad-y-despliegue) antes de exponerlo.

## Inicio rápido

### Requisitos

| Herramienta | Versión |
| --- | --- |
| Node.js | `>=22.13.0` |
| pnpm | `11.1.1` (`>=11.1.1 <12`) |

Next.js 16.2.12 requiere Node.js 20.9 como mínimo, pero pnpm 11.1.1 eleva el mínimo efectivo del proyecto a Node.js 22.13.

### Preparar y ejecutar

```bash
pnpm install --frozen-lockfile
cp .env.example .env
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Antes de iniciar, reemplazá `AUTH_SECRET` en `.env` por un valor aleatorio. Podés generarlo sin dependencias adicionales:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
```

Abrí `http://localhost:3000`. El seed crea el entrenador definido por `ADMIN_EMAIL` y `ADMIN_PASSWORD`, además de una atleta de demostración accesible en `http://localhost:3000/hoy/1111`.

> `pnpm db:seed` agrega datos y no es idempotente. Ejecutalo una sola vez sobre una base vacía.

## Entorno

Copiá `.env.example` a `.env` y ajustá solo lo necesario. Nunca confirmes `.env` ni secretos reales.

| Variable | Uso | Requerida |
| --- | --- | --- |
| `AUTH_SECRET` | Firma y cifrado de Auth.js | Sí; especialmente en producción |
| `DATABASE_URL` | URL de libSQL; `file:./sqlite.db` usa SQLite local | No, tiene fallback local |
| `TURSO_AUTH_TOKEN` | Token para una base remota Turso | Solo con Turso |
| `APP_NAME` | Nombre visible de la instancia | No |
| `ADMIN_NOMBRE` | Nombre del entrenador creado por el seed | No |
| `ADMIN_EMAIL` | Usuario creado por el seed | No |
| `ADMIN_PASSWORD` | Contraseña creada por el seed | No |

Los valores predeterminados del seed son solo para desarrollo. Cambiá `ADMIN_EMAIL`, `ADMIN_PASSWORD` y `AUTH_SECRET` antes de usar un entorno compartido.

## Base de datos

El proyecto usa Drizzle ORM con libSQL/SQLite y conserva las migraciones en `drizzle/`.

```bash
pnpm db:migrate  # aplica las migraciones de drizzle/
pnpm db:seed     # carga entrenador, atleta y rutina de demostración
```

Para desarrollo local, `DATABASE_URL=file:./sqlite.db` crea `sqlite.db` en la raíz. Para Turso, reemplazá `DATABASE_URL` por la URL remota y definí `TURSO_AUTH_TOKEN`; verificá el destino antes de migrar o sembrar datos.

## Comandos

| Comando | Propósito |
| --- | --- |
| `pnpm dev` | Inicia Next.js en desarrollo |
| `pnpm build` | Genera el build de producción |
| `pnpm start` | Sirve un build ya generado |
| `pnpm db:migrate` | Aplica migraciones con el `.env` local |
| `pnpm db:seed` | Inserta los datos de demostración |
| `pnpm test:auth` | Ejecuta pruebas de credenciales y ownership |
| `pnpm test:onboarding` | Ejecuta pruebas de OTP, teléfonos y Evolution API |
| `pnpm test:e2e` | Ejecuta los smoke tests de Playwright |

El repositorio no define actualmente scripts de lint ni typecheck aislado; el build ejecuta la comprobación TypeScript.

## Capacidades

- Autenticación de un entrenador por instancia, sin auto-registro.
- Dashboard, CRUD de atletas e importación/exportación Excel.
- Programación por programa, semana, día, ejercicio y series individuales.
- Registro de marcas, historial y cálculos Wilks/IPF GL.
- Vista móvil del atleta por PIN y cola offline para registrar series.
- PWA con rutina cacheada y sincronización al recuperar conexión.

## Arquitectura

| Área | Responsabilidad |
| --- | --- |
| `src/app/` | Rutas App Router para entrenador, atleta y endpoints HTTP |
| `src/components/` | Formularios, vistas de entrenamiento y componentes UI |
| `src/lib/actions/` | Server Actions de atletas, planificación, marcas y registros |
| `src/lib/` | Auth.js, consultas, cálculo, Excel y soporte offline |
| `src/db/` | Cliente libSQL, esquema Drizzle, migración y seed |
| `drizzle/` | Migraciones SQL versionadas |
| `public/` | Manifest, iconos y service worker de la PWA |

El modelo principal sigue la jerarquía Programa -> Semana -> Día -> Ejercicio -> Serie planificada. Cada despliegue representa hoy un gimnasio o entrenador con su propia base de datos.

## Seguridad y despliegue

No uses este estado del repositorio con información real de atletas. Antes de producción, como mínimo:

- Corregí las Server Actions que todavía no validan autorización y pertenencia de recursos.
- Fortalecé el acceso por PIN y agregá rate limiting; el PIN actual es corto y no limita intentos.
- Reemplazá todas las credenciales de demostración y configurá secretos solo en el proveedor.
- Revisá las vulnerabilidades conocidas de dependencias con `pnpm audit --prod`.
- Definí una estrategia de base de datos, backups y aislamiento acorde al despliegue.

El build de Next.js puede ejecutarse como servidor Node.js mediante `pnpm build` y `pnpm start`. Un despliegue remoto requiere `AUTH_SECRET`, la conexión de base correspondiente y, si el proveedor no confía automáticamente en el host, `AUTH_TRUST_HOST=true`.

## Limitaciones de calidad

- No hay script de lint, typecheck dedicado ni CI configurada; sí hay pruebas de autorización, onboarding y smoke E2E.
- La comprobación automatizada disponible es el build de producción.
- El seed no se puede repetir de forma segura sobre la misma base.
- La seguridad y la preparación para datos reales siguen pendientes y quedan fuera de esta migración de tooling/documentación.
