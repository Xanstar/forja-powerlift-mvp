# Forja — MVP de planificación para entrenadores de powerlifting

## Cómo correrlo

Requisitos: Node.js 20+.

```bash
npm install
npm run db:migrate   # crea sqlite.db con el schema
npm run db:seed      # carga datos de demo (opcional pero recomendado)
npm run dev
```

Abrí `http://localhost:3000`.

### Credenciales de demo

- **Entrenador:** `admin` / `admin`
- **Atleta (vista por celular, sin cuenta):** entrá a `http://localhost:3000/hoy/1111`
  (PIN de Martina Gómez, con un día ya completado y un "Día B" pendiente para probar el logging)

## Qué hay hecho

- Auth de entrenador (un solo admin por instancia — no hay auto-registro)
- Dashboard con métricas reales (atletas activos, pendientes/completados hoy)
- CRUD de atletas completo
- Constructor de planificación: Programa → Semana → Día → Ejercicio → Sets individuales
  (peso absoluto o % de RM, RPE objetivo)
- Récords de 1RM por atleta (sentadilla/banca/peso muerto) + Wilks y IPF GL Points calculados en el historial
- **Toma de marcas** (`/marcas`): pesaje + los tres levantamientos en una sola pantalla, con Wilks e IPF GL calculados en vivo; acceso directo desde el dashboard
- **Excel**: importar atletas desde la planilla del gimnasio (con sus marcas), exportar atletas + historial de marcas a Excel, y plantilla descargable
- Vista del atleta por PIN (sin cuenta), con logging de sets, pensada para el celular en el gimnasio
- PWA offline-first: la vista del atleta cachea la rutina y encola los sets registrados sin señal,
  sincronizando solos cuando vuelve la conexión
- Historial con gráfico de evolución de cargas por ejercicio

## Decisiones de arquitectura (por qué)

- **Next.js 16 (App Router) + TypeScript + Tailwind v4**: velocidad de desarrollo del MVP,
  Server Actions elimina la necesidad de una API separada.
- **Drizzle ORM + libSQL (SQLite)** en vez de Prisma: mismo nivel de tipado y control
  sobre el modelo relacional, con binarios precompilados (sin Python/Visual Studio/node-gyp
  necesarios en Windows). Migrar a Postgres para producción es cambiar el cliente en
  `src/db/index.ts` — el schema en Drizzle es portable entre motores.
- **Sets individuales, no un campo plano por ejercicio**: cada serie tiene su propio peso/reps/RPE,
  necesario para representar top sets y back-off sets reales de powerlifting.
- **Jerarquía Programa → Semana → Día → Ejercicio → Set**: el agrupador "Programa" está para no
  tener que migrar cuando el entrenador empiece a pensar en mesociclos/bloques.
- **Vista del atleta por PIN, no por cuenta**: fricción cero para usar en el momento del entrenamiento.
- **PWA offline-first**: la vista del atleta se usa en sótanos de gimnasio con señal pésima; perder
  el registro del día por falta de conexión es el peor escenario posible para este producto.
- **Sin facturación/mensualidades en el MVP**: decisión de producto — diluye el foco y agrega
  complejidad legal/fiscal que no aporta al problema que se está resolviendo.

## Lo que falta para producción

1. Migrar de SQLite a Postgres (Neon/Supabase) para despliegue multi-tenant real
2. Rate limiting en el acceso por PIN del atleta (hoy es un PIN de 4 dígitos sin límite de intentos)
3. Deploy (Vercel es la opción más directa para este stack)

## Modelo de producto: una instancia por gimnasio

La app **no tiene auto-registro**: cada deploy es la app "personificada" de un solo
gimnasio/entrenador, con su propio nombre, su propio link y su propia base de datos.
Lo que cambia entre gimnasios son variables de entorno:

- `APP_NAME` — nombre que se muestra en la landing, el login y la PWA instalada
- `ADMIN_NOMBRE`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` — credenciales del admin (se aplican con `db:seed`)
- `DATABASE_URL`, `TURSO_AUTH_TOKEN` — la base de datos Turso de ese gimnasio

Para crear la instancia de un gimnasio nuevo: clonar este repo, crear su base en Turso,
correr `db:migrate` + `db:seed` contra esa base, y deployar a un proyecto Vercel propio
con esas env vars. Los atletas entran por PIN, sin cuenta.
