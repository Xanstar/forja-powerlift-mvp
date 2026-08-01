import Link from "next/link";
import { AthleteActivationForm } from "@/components/athlete-activation-form";
import { appName } from "@/lib/config";

export default function ActivarAtletaPage() {
  return (
    <main className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-between border-b border-chalk px-5 py-4 md:px-10">
        <Link href="/" className="font-display text-xl font-bold tracking-[-0.04em]">{appName}</Link>
        <Link href="/hoy" className="text-sm font-semibold text-chalk-muted hover:text-chalk">Ya tengo PIN</Link>
      </header>
      <div className="grid flex-1 md:grid-cols-[0.8fr_1.2fr]">
        <section className="bg-chalk px-6 py-12 text-white md:p-12">
          <span className="competition-stamp border-red-300 text-red-200">Verificación</span>
          <h1 className="mt-7 max-w-[10ch] font-display text-5xl font-bold leading-[0.92] tracking-[-0.04em]">Activá tu acceso.</h1>
          <p className="mt-6 max-w-md leading-7 text-white/70">Usá el teléfono registrado por tu entrenador y el código de seis dígitos que recibiste por WhatsApp.</p>
        </section>
        <section className="flex items-center px-5 py-10 md:px-12">
          <div className="competition-sheet w-full max-w-xl border-y border-chalk p-5 sm:p-8">
            <h2 className="font-display text-2xl font-bold tracking-tight">Datos de acceso</h2>
            <AthleteActivationForm />
          </div>
        </section>
      </div>
    </main>
  );
}
