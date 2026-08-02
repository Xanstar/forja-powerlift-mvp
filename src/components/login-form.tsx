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
        <Link href="/" className="inline-flex min-h-11 items-center font-display text-2xl font-bold tracking-[-0.04em]">{appName}</Link>
        <h1 className="max-w-[10ch] font-display text-5xl font-bold leading-[0.92] tracking-[-0.04em]">Revisá. Ajustá. Publicá.</h1>
        <p className="max-w-md text-sm leading-6 text-white/70">Programa y ejecución en el mismo tablero.</p>
      </section>
      <section className="flex min-h-screen flex-col">
        <header className="flex items-center justify-between border-b border-chalk px-5 py-4 md:hidden"><Link href="/" className="inline-flex min-h-11 items-center font-display text-xl font-bold">{appName}</Link><Link href="/hoy" className="inline-flex min-h-11 items-center text-sm font-semibold">Soy atleta</Link></header>
        <div className="flex flex-1 items-center px-5 py-12 sm:px-10">
          <div className="w-full max-w-md">
            <h2 className="font-display text-4xl font-bold tracking-[-0.04em]">Acceso coach</h2>
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
