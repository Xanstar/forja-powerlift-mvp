import Link from "next/link";
import { ArrowRight, Check, Radio } from "lucide-react";
import { auth } from "@/lib/auth";
import { appName } from "@/lib/config";

const cycle = [
  ["Programar", "Definí semanas, días, ejercicios y series."],
  ["Ejecutar", "El atleta registra lo que realmente hizo."],
  ["Detectar", "Las diferencias con el plan quedan visibles."],
  ["Revisar", "El coach recupera contexto e historial."],
  ["Ajustar", "La próxima decisión vuelve al programa."],
] as const;

export default async function RootPage() {
  const session = await auth();
  const entrenadorHref = session ? "/dashboard" : "/login";

  return (
    <main className="min-h-screen bg-background text-chalk">
      <header className="flex items-center justify-between border-b border-chalk px-5 py-4 md:px-10">
        <Link href="/" className="font-display text-xl font-bold tracking-[-0.04em]">
          {appName}
        </Link>
        <nav aria-label="Accesos principales" className="flex items-center gap-2">
          <Link
            href="/hoy"
            className="px-3 py-2 text-sm font-semibold text-chalk-muted hover:text-chalk"
          >
            Soy atleta
          </Link>
          <Link
            href={entrenadorHref}
            className="inline-flex min-h-11 items-center gap-2 bg-chalk px-4 py-2 text-sm font-semibold text-white hover:bg-steel"
          >
            Acceso coach <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </nav>
      </header>

      <section className="public-hero border-b border-chalk">
        <div className="public-hero-copy">
          <div>
            <span className="competition-stamp">Sistema de coaching</span>
            <h1 className="mt-8 max-w-[11ch] text-balance font-display text-[clamp(3.4rem,8vw,6rem)] font-bold leading-[0.9] tracking-[-0.04em]">
              Cada serie deja evidencia.
            </h1>
            <p className="mt-7 max-w-[62ch] text-lg leading-8 text-chalk-muted">
              Forja conecta la planificación del coach con la ejecución real del atleta para que el entrenamiento pueda revisarse y ajustarse sin reconstruirlo a mano.
            </p>
            <p className="mt-4 text-sm font-semibold text-steel">
              Planificación de powerlifting para tu gimnasio
            </p>
          </div>
          <div className="mt-12 flex flex-wrap gap-3">
            <Link
              href={entrenadorHref}
              className="inline-flex min-h-12 items-center gap-3 bg-accent px-5 py-3 font-semibold text-white hover:bg-accent-hover"
            >
              Entrenador <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <Link
              href="/activar"
              className="inline-flex min-h-12 items-center border border-chalk px-5 py-3 font-semibold hover:bg-surface-hover"
            >
              Activar acceso de atleta
            </Link>
          </div>
        </div>

        <div className="public-board" aria-label="Ejemplo del ciclo operativo">
          <div className="flex items-center justify-between border-b border-white/60 pb-5">
            <div>
              <p className="text-sm font-semibold text-white">Plan vs. ejecución</p>
              <p className="mt-1 text-sm text-white/70">La decisión parte de lo que ocurrió.</p>
            </div>
            <Radio size={22} className="text-red-400" aria-hidden="true" />
          </div>
          <div className="mt-7">
            <div className="public-board-row text-white/70">
              <span>SET</span><span>PLAN</span><span>HECHO</span>
            </div>
            <div className="public-board-row">
              <span className="data-number text-3xl">1</span><span>5 × 120 kg</span><span className="competition-stamp border-green-300 text-green-200">Cumplido</span>
            </div>
            <div className="public-board-row">
              <span className="data-number text-3xl">2</span><span>5 × 120 kg</span><span className="data-number text-2xl">5 × 117,5</span>
            </div>
            <div className="public-board-row">
              <span className="data-number text-3xl">3</span><span>5 × 120 kg</span><span className="competition-stamp border-red-300 text-red-200">Revisar</span>
            </div>
          </div>
          <p className="mt-8 max-w-md text-sm leading-6 text-white/70">
            El registro real, el RPE, el historial y las diferencias con el plan permanecen juntos en el flujo de trabajo.
          </p>
        </div>
      </section>

      <section className="px-5 py-16 md:px-10 md:py-24">
        <div className="mb-10 grid gap-6 md:grid-cols-[1fr_1.2fr] md:items-end">
          <h2 className="max-w-[12ch] font-display text-4xl font-bold leading-none tracking-[-0.04em] md:text-6xl">
            Un ciclo operativo completo.
          </h2>
          <p className="max-w-[65ch] text-base leading-7 text-chalk-muted md:justify-self-end">
            Forja no separa la planilla del entrenamiento ni el entrenamiento de la revisión. Cada paso alimenta al siguiente.
          </p>
        </div>
        <div className="public-cycle">
          {cycle.map(([title, description], index) => (
            <div key={title}>
              <span className="data-number text-4xl text-accent">{index + 1}</span>
              <h3 className="mt-5 font-display text-xl font-bold tracking-tight">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-chalk-muted">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid border-y border-chalk md:grid-cols-2">
        <div className="competition-sheet px-5 py-16 md:px-10 md:py-20">
          <h2 className="max-w-[13ch] font-display text-4xl font-bold leading-none tracking-[-0.04em] md:text-5xl">
            Para operar el gimnasio.
          </h2>
          <ul className="mt-10 space-y-5">
            {["Perfiles y programas de atletas", "Series planificadas y ejecución real", "Marcas, historial y progreso", "Importación y exportación con Excel"].map((item) => (
              <li key={item} className="flex items-center gap-3 border-b border-border-strong pb-4 font-medium">
                <Check size={18} className="text-success" aria-hidden="true" /> {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-accent px-5 py-16 text-white md:px-10 md:py-20">
          <h2 className="max-w-[13ch] font-display text-4xl font-bold leading-none tracking-[-0.04em] md:text-5xl">
            Para ejecutar sin fricción.
          </h2>
          <p className="mt-7 max-w-[60ch] text-base leading-7 text-red-50">
            La vista móvil del atleta mantiene visibles el próximo entrenamiento, el estado de cada serie, el descanso, el progreso y el guardado sin conexión parcial.
          </p>
          <Link href="/hoy" className="mt-10 inline-flex min-h-12 items-center gap-3 bg-white px-5 py-3 font-semibold text-accent hover:bg-red-50">
            Entrar con PIN <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>
      </section>

      <footer className="flex flex-col gap-5 px-5 py-10 md:flex-row md:items-center md:justify-between md:px-10">
        <div><p className="font-display text-2xl font-bold tracking-[-0.04em]">{appName}</p><p className="mt-1 text-sm text-chalk-muted">Powerlifting con continuidad operativa.</p></div>
        <div className="flex gap-5 text-sm font-semibold"><Link href={entrenadorHref}>Acceso coach</Link><Link href="/hoy">Acceso atleta</Link><Link href="/activar">Activar acceso</Link></div>
      </footer>
    </main>
  );
}
