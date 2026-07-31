"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);
    if (res?.ok) {
      router.push("/dashboard");
    } else {
      setError("Email o contraseña incorrectos.");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="font-display text-2xl font-bold tracking-tight text-chalk">
            Forja
          </h1>
          <p className="mt-2 text-sm text-chalk-muted">
            Iniciá sesión para ver tus atletas
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Usuario</Label>
            <Input
              id="email"
              type="text"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin"
              required
            />
          </div>
          <div>
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
            <div className="mt-1.5 text-right">
              <Link
                href="/recuperar"
                className="text-xs text-chalk-muted hover:text-accent"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
          </div>

          {error && (
            <p className="rounded-lg bg-accent/10 px-3 py-2 text-sm text-accent">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Ingresando..." : "Ingresar"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-chalk-muted">
          ¿No tenés cuenta?{" "}
          <Link href="/registro" className="text-chalk hover:text-accent">
            Registrate
          </Link>
        </p>
      </div>
    </div>
  );
}
