import Link from "next/link";
import { PinPad } from "@/components/pin-pad";
import { ForjaLogo } from "@/components/forja-logo";
import { ThemeControl } from "@/components/theme-control";

export default function HoyEntryPage() {
  return (
    <main className="grid min-h-screen bg-background md:grid-cols-[minmax(0,1fr)_minmax(22rem,0.72fr)]">
      <section className="hidden border-r border-on-brand-border bg-brand-canvas p-10 text-on-brand md:flex md:flex-col md:justify-between">
        <div className="flex items-start justify-between gap-4"><Link href="/" className="inline-flex min-h-11 items-center"><ForjaLogo className="w-[180px]" onDark /></Link><ThemeControl onBrand /></div>
        <div>
          <h1 className="max-w-[9ch] font-display text-5xl font-bold leading-[0.92] tracking-[-0.04em]">Tu próxima serie.</h1>
          <p className="mt-6 max-w-md leading-7 text-on-brand-muted">Ingresá con tu PIN para abrir la sesión.</p>
        </div>
        <p className="text-sm text-on-brand-muted">Carga, repeticiones y descanso.</p>
      </section>
      <section className="flex min-h-screen flex-col">
        <header className="flex items-center justify-between border-b border-chalk px-5 py-4 md:hidden"><Link href="/" className="inline-flex min-h-11 items-center"><ForjaLogo className="w-[112px] sm:w-[132px]" /></Link><div className="flex items-center gap-1"><ThemeControl /><Link href="/activar" className="inline-flex min-h-11 items-center px-2 text-sm font-semibold">Activar acceso</Link></div></header>
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
          <h2 className="text-center font-display text-3xl font-bold tracking-[-0.04em]">Ingresá tu PIN</h2>
          <PinPad />
        </div>
      </section>
    </main>
  );
}
