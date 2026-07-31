import Link from "next/link";
import { Dumbbell, User, Smartphone } from "lucide-react";
import { auth } from "@/lib/auth";
import { appName } from "@/lib/config";

export default async function RootPage() {
  const session = await auth();
  const entrenadorHref = session ? "/dashboard" : "/login";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-10">
      <Dumbbell size={44} className="text-accent" />
      <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-chalk">
        {appName}
      </h1>
      <p className="mt-2 max-w-xs text-center text-sm text-chalk-muted">
        Planificación de powerlifting para tu gimnasio
      </p>

      <div className="mt-12 grid w-full max-w-sm gap-3">
        <Link
          href={entrenadorHref}
          className="group flex items-center gap-4 rounded-xl border border-border bg-surface p-5 transition-colors hover:bg-surface-hover"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-border-strong bg-background text-chalk">
            <User size={22} />
          </span>
          <span className="flex flex-col">
            <span className="font-display text-lg font-bold text-chalk">
              Entrenador
            </span>
            <span className="text-sm text-chalk-muted">
              Tus atletas y planificaciones
            </span>
          </span>
        </Link>

        <Link
          href="/hoy"
          className="group flex items-center gap-4 rounded-xl border border-accent bg-accent p-5 transition-colors hover:bg-accent-hover"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-background/20 text-white">
            <Smartphone size={22} />
          </span>
          <span className="flex flex-col">
            <span className="font-display text-lg font-bold text-white">
              Atleta
            </span>
            <span className="text-sm text-white/80">
              Entrá con tu PIN y registrá tu entrenamiento
            </span>
          </span>
        </Link>
      </div>
    </div>
  );
}
