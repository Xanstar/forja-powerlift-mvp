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

- **Entrenador:** `demo@forja.app` / `demo1234`
- **Atleta (vista por celular, sin cuenta):** entrá a `http://localhost:3000/hoy/4821`
  (PIN de Martina Gómez, con un día ya completado y un "Día B" pendiente para probar el logging)

## Qué hay hecho

- Auth de entrenador (registro, login, recuperar contraseña — el envío de email real queda pendiente)
- Dashboard con métricas reales (atletas activos, pendientes/completados hoy)
- CRUD de atletas completo
- Constructor de planificación: Programa → Semana → Día → Ejercicio → Sets individuales
  (peso absoluto o % de RM, RPE objetivo)
- Récords de 1RM por atleta (sentadilla/banca/peso muerto) + Wilks y IPF GL Points calculados en el historial
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

1. Envío real de email para recuperar contraseña (Resend/Postmark)
2. Migrar de SQLite a Postgres (Neon/Supabase) para despliegue multi-usuario real
3. Rate limiting en el acceso por PIN del atleta (hoy es un PIN de 4 dígitos sin límite de intentos)
4. Íconos reales para el manifest de PWA (`public/manifest.json` referencia `icon-192.png`/`icon-512.png` que no existen todavía)
5. Deploy (Vercel es la opción más directa para este stack)
