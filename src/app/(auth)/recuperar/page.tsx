"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export default function RecuperarPage() {
  const [email, setEmail] = useState("");
  const [enviado, setEnviado] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // TODO: conectar a un proveedor de email (Resend/Postmark) para el envío real.
    // Por ahora dejamos el flujo de UI listo end-to-end.
    setEnviado(true);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="font-display text-2xl font-bold tracking-tight text-chalk">
            Forja
          </h1>
          <p className="mt-2 text-sm text-chalk-muted">
            Recuperar contraseña
          </p>
        </div>

        {enviado ? (
          <div className="rounded-lg border border-border bg-surface p-4 text-center text-sm text-chalk-muted">
            Si existe una cuenta con ese email, te enviamos un link para
            restablecer tu contraseña.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="juan@ejemplo.com"
                required
              />
            </div>
            <Button type="submit" className="w-full">
              Enviar instrucciones
            </Button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-chalk-muted">
          <Link href="/login" className="text-chalk hover:text-accent">
            Volver a iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
