"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export function LoginForm({ appName }: { appName: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.ok) router.push("/dashboard");
    else setError("Usuario o contraseña incorrectos.");
  }

  return (
    <main className="grid min-h-screen bg-background md:grid-cols-[minmax(0,0.9fr)_minmax(24rem,0.72fr)]">
      <section className="hidden bg-chalk p-10 text-white md:flex md:flex-col md:justify-between">
        <Link href="/" className="font-display text-2xl font-bold tracking-[-0.04em]">{appName}</Link>
        <div><span className="competition-stamp border-red-300 text-red-200">Control de coach</span><h1 className="mt-7 max-w-[10ch] font-display text-6xl font-bold leading-[0.9] tracking-[-0.04em]">Decidí con el entrenamiento a la vista.</h1></div>
        <p className="max-w-md text-sm leading-6 text-white/60">Programación, ejecución, marcas e historial dentro del mismo ciclo operativo.</p>
      </section>
      <section className="flex min-h-screen flex-col">
        <header className="flex items-center justify-between border-b border-chalk px-5 py-4 md:hidden"><Link href="/" className="font-display text-xl font-bold">{appName}</Link><Link href="/hoy" className="text-sm font-semibold">Soy atleta</Link></header>
        <div className="flex flex-1 items-center px-5 py-12 sm:px-10">
          <div className="w-full max-w-md">
            <span className="competition-stamp">Acceso autorizado</span>
            <h2 className="mt-5 font-display text-4xl font-bold tracking-[-0.04em]">Acceso del entrenador</h2>
            <form onSubmit={handleSubmit} className="competition-sheet mt-8 space-y-5 border-y border-chalk p-5 sm:p-7">
              <div><Label htmlFor="email">Usuario</Label><Input id="email" type="text" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin" required /></div>
              <div><Label htmlFor="password">Contraseña</Label><Input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required /></div>
              {error && <p role="alert" className="border border-accent bg-red-50 px-3 py-2 text-sm font-medium text-accent">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>{loading ? "Ingresando..." : "Ingresar"}</Button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
