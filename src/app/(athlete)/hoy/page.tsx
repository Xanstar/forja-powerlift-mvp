import Link from "next/link";
import { PinPad } from "@/components/pin-pad";
import { appName } from "@/lib/config";

export default function HoyEntryPage() {
  return (
    <main className="grid min-h-screen bg-background md:grid-cols-[minmax(0,1fr)_minmax(22rem,0.72fr)]">
      <section className="hidden border-r border-chalk bg-chalk p-10 text-white md:flex md:flex-col md:justify-between">
        <Link href="/" className="inline-flex min-h-11 items-center font-display text-2xl font-bold tracking-[-0.04em]">{appName}</Link>
        <div>
          <h1 className="max-w-[9ch] font-display text-5xl font-bold leading-[0.92] tracking-[-0.04em]">Tu próxima serie.</h1>
          <p className="mt-6 max-w-md leading-7 text-white/70">Ingresá con tu PIN para abrir la sesión.</p>
        </div>
        <p className="text-sm text-white/60">Carga, repeticiones y descanso.</p>
      </section>
      <section className="flex min-h-screen flex-col">
        <header className="flex items-center justify-between border-b border-chalk px-5 py-4 md:hidden"><Link href="/" className="inline-flex min-h-11 items-center font-display text-xl font-bold">{appName}</Link><Link href="/activar" className="inline-flex min-h-11 items-center text-sm font-semibold">Activar acceso</Link></header>
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
          <h2 className="text-center font-display text-3xl font-bold tracking-[-0.04em]">Ingresá tu PIN</h2>
          <PinPad />
        </div>
      </section>
    </main>
  );
}
