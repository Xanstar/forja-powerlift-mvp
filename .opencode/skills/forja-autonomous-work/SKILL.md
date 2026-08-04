---
name: forja-autonomous-work
description: Use when working on the Forja powerlifting MVP project (forja-powerlift-mvp). The user expects the agent to work autonomously and do EVERYTHING necessary to complete a task (code changes, verify with build, git commit, push to GitHub, deploy to Vercel, env vars, DB migrate/seed) without asking extra questions. Trigger on words like "hacé todo", "mandale", "deploy", "subilo", "Vercel", "pusheá", "comiteá", or any mention of preparing this project for production.
---

# Forja — Trabajo autónomo (no preguntar de más)

El usuario de este proyecto quiere que actúes por tu cuenta: **hacé todo lo necesario y no preguntes de más**. Si falta información que solo el usuario puede dar (login, token, URL), hacé TODO el trabajo previo y pedí solo lo estrictamente indispensable.

## Contexto del proyecto

- App: Next.js 16 (App Router) + TypeScript + Tailwind v4 + Drizzle ORM + libSQL.
- Repo GitHub: `https://github.com/Xanstar/forja-powerlift-mvp` (privado, rama `main`). Credenciales de GitHub viven en el credential manager de Windows (se obtienen con `git credential fill`); se pueden usar para operar el repo vía API REST.
- DB producción: Turso (libSQL en la nube) — `libsql://forja-xanstar.aws-us-east-1.turso.io`, token en `.env` (`TURSO_AUTH_TOKEN`).
- Demo creds: `admin` / `admin` · atleta: `ATHLETE_DEMO_ACCESS_TOKEN` en la ruta canónica `/hoy`.

## Reglas de autonomía

1. **Commit + push**: cuando haya cambios pendientes y el contexto sea "subir/deploy", comiteá con mensaje descriptivo y pusheá a `main` sin preguntar.
2. **Build antes de push**: corré `pnpm build` y arreglá los errores vos mismo.
3. **DB**: los scripts `db:migrate` / `db:seed` cargan `.env` (via `node --env-file`). Si no corren contra el destino correcto, el problema suele ser que no se pasan las env vars. Verificá contra qué DB estás hablando (SQLite local vs Turso).
4. **Vercel**: si hay que desplegar, usá la CLI de Vercel (`pnpm exec vercel`). Lo único que necesitás que provea el usuario: un login/token de Vercel (ver dashboards). Las env vars a setear en producción: `DATABASE_URL`, `TURSO_AUTH_TOKEN`, `AUTH_SECRET`, `AUTH_TRUST_HOST=true`.
5. **No commitear secretos**: `.env` está en `.gitignore`. Nunca subir tokens ni hashes al repo.
6. **Cuando necesites sí o sí input del usuario**, pedí lo mínimo y en formato accionable (ej: "pasame el token de Vercel de https://vercel.com/account/tokens").

## Comandos útiles

- `pnpm dev` / `pnpm build` / `pnpm db:migrate` / `pnpm db:seed`
- Credenciales GitHub vía credential manager: `"protocol=https`nhost=github.com`n" | git credential fill`
