import Link from "next/link";
import { ArrowRight, Radio } from "lucide-react";
import { auth } from "@/lib/auth";
import { ForjaLogo } from "@/components/forja-logo";
import { ThemeControl } from "@/components/theme-control";

const cycle = ["Programar", "Ejecutar", "Detectar", "Revisar", "Ajustar"] as const;

export default async function RootPage() {
  const session = await auth();
  const coachHref = session ? "/dashboard" : "/login";

  return (
    <main className="min-h-screen bg-background text-chalk">
      <header className="flex items-center justify-between border-b border-chalk px-5 py-4 md:px-10">
        <Link href="/" className="inline-flex min-h-11 items-center">
          <ForjaLogo className="w-[132px] sm:w-[150px]" />
        </Link>
        <nav aria-label="Accesos principales" className="flex items-center gap-2">
          <ThemeControl />
          <Link href="/hoy" className="inline-flex min-h-11 items-center px-3 text-sm font-semibold text-chalk-muted hover:text-chalk">Atleta</Link>
          <Link href={coachHref} className="inline-flex min-h-11 items-center gap-2 bg-brand-canvas px-4 text-sm font-semibold text-on-brand hover:bg-on-brand-hover">
            {session ? "Abrir panel" : "Ingresar"} <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </nav>
      </header>

      <section className="public-hero border-b border-chalk">
        <div className="public-hero-copy">
          <div>
            <h1 className="max-w-[11ch] text-balance font-display text-[clamp(2.8rem,7vw,5rem)] font-bold leading-[0.92] tracking-[-0.04em]">
              Cada serie deja evidencia.
            </h1>
            <p className="mt-6 max-w-[58ch] text-lg leading-8 text-chalk-muted">
              Programa, ejecución y revisión de powerlifting en un mismo registro.
            </p>
          </div>
          <Link href={coachHref} className="mt-8 inline-flex min-h-12 w-fit items-center gap-3 bg-accent px-5 py-3 font-semibold text-white hover:bg-accent-hover">
            {session ? "Ir a decisiones pendientes" : "Acceso coach"} <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>

        <div className="public-board" aria-label="Ejemplo de plan y ejecución">
          <div className="flex items-center justify-between border-b border-on-brand-border pb-5">
            <p className="text-sm font-semibold text-on-brand">Plan vs. ejecución</p>
            <Radio size={22} className="text-accent" aria-hidden="true" />
          </div>
          <div className="mt-7">
            <div className="public-board-row text-on-brand-muted"><span>SERIE</span><span>PLAN</span><span>HECHO</span></div>
            <div className="public-board-row"><span className="data-number text-3xl">1</span><span>5 × 120 kg</span><span className="font-semibold text-brand-bone">Cumplida</span></div>
            <div className="public-board-row"><span className="data-number text-3xl">2</span><span>5 × 120 kg</span><span className="data-number text-2xl">5 × 117,5</span></div>
            <div className="public-board-row"><span className="data-number text-3xl">3</span><span>5 × 120 kg</span><span className="competition-stamp border-accent text-on-brand">Revisar</span></div>
          </div>
          <p className="mt-7 max-w-md text-sm leading-6 text-on-brand-muted">La prescripción y el resultado permanecen juntos para la próxima decisión.</p>
        </div>
      </section>

      <section className="px-5 py-12 md:px-10">
        <h2 className="font-display text-2xl font-bold tracking-[-0.04em]">Ciclo operativo</h2>
        <ol className="mt-5 grid border-y border-chalk sm:grid-cols-5">
          {cycle.map((step, index) => (
            <li key={step} className="flex min-h-16 items-center gap-3 border-b border-border-strong px-3 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
              <span className="data-number text-lg text-steel">{index + 1}</span>
              <span className="text-sm font-semibold">{step}</span>
            </li>
          ))}
        </ol>
        <div className="mt-6 flex flex-wrap items-center gap-5 text-sm font-semibold">
          <Link href="/hoy" className="inline-flex min-h-11 items-center text-steel hover:underline">Entrar a mi sesión</Link>
          <Link href="/activar" className="inline-flex min-h-11 items-center text-chalk-muted hover:text-chalk">Activar acceso</Link>
        </div>
      </section>

      <footer className="flex items-center justify-between border-t border-chalk px-5 py-7 md:px-10">
        <ForjaLogo className="w-[132px] sm:w-[150px]" />
        <p className="text-sm text-chalk-muted">Gym Sport · powerlifting</p>
      </footer>
    </main>
  );
}
