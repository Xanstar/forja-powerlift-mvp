import Link from "next/link";
import { PinPad } from "@/components/pin-pad";
import { appName } from "@/lib/config";

export default function HoyEntryPage() {
  return (
    <main className="grid min-h-screen bg-background md:grid-cols-[minmax(0,1fr)_minmax(22rem,0.72fr)]">
      <section className="hidden border-r border-chalk bg-chalk p-10 text-white md:flex md:flex-col md:justify-between">
        <Link href="/" className="font-display text-2xl font-bold tracking-[-0.04em]">{appName}</Link>
        <div>
          <span className="competition-stamp border-red-300 text-red-200">Acceso de atleta</span>
          <h1 className="mt-7 max-w-[9ch] font-display text-6xl font-bold leading-[0.9] tracking-[-0.04em]">Tu sesión. Serie por serie.</h1>
          <p className="mt-6 max-w-md leading-7 text-white/70">Ingresá con el PIN asignado por tu entrenador para ver el plan de hoy y registrar la ejecución.</p>
        </div>
        <p className="text-sm text-white/50">Plan, ejecución y progreso en un mismo registro.</p>
      </section>
      <section className="flex min-h-screen flex-col">
        <header className="flex items-center justify-between border-b border-chalk px-5 py-4 md:hidden"><Link href="/" className="font-display text-xl font-bold">{appName}</Link><Link href="/activar" className="text-sm font-semibold">Activar acceso</Link></header>
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
          <span className="competition-stamp">Ingreso de sesión</span>
          <h2 className="mt-5 text-center font-display text-3xl font-bold tracking-[-0.04em]">¿Quién entrena hoy?</h2>
          <PinPad />
          <Link href="/activar" className="mt-8 text-sm font-semibold text-steel hover:underline">Recibí un código de activación</Link>
        </div>
      </section>
    </main>
  );
}
