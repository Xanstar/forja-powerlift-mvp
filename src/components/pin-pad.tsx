"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Delete } from "lucide-react";
import { verificarPinAtleta } from "@/lib/actions/athlete-access";
import { cn } from "@/lib/utils";

const LARGO_PIN = 4;

export function PinPad() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const enviar = useCallback(
    (pinCompleto: string) => {
      startTransition(async () => {
        const res = await verificarPinAtleta(pinCompleto);
        if (res.ok) {
          router.push(`/hoy/${pinCompleto}`);
        } else {
          setError("PIN incorrecto, probá de nuevo.");
          setPin("");
        }
      });
    },
    [router]
  );

  const presionarDigito = useCallback(
    (d: string) => {
      if (isPending || pin.length >= LARGO_PIN) return;
      setError(null);
      const siguiente = pin + d;
      setPin(siguiente);
      if (siguiente.length === LARGO_PIN) {
        enviar(siguiente);
      }
    },
    [pin, isPending, enviar]
  );

  const borrar = useCallback(() => {
    if (isPending) return;
    setError(null);
    setPin((p) => p.slice(0, -1));
  }, [isPending]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) presionarDigito(e.key);
      if (e.key === "Backspace") borrar();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [presionarDigito, borrar]);

  const tecla = (label: string, onPress: () => void) => (
    <button
      type="button"
      onClick={onPress}
      disabled={isPending}
      className="data-number flex h-16 select-none items-center justify-center border border-border-strong bg-surface text-2xl font-bold text-chalk transition-colors hover:border-chalk hover:bg-surface-hover active:bg-chalk active:text-white disabled:opacity-40 sm:h-[72px]"
    >
      {label}
    </button>
  );

  return (
    <div className="mt-8 w-full max-w-xs">
      <div
        className={cn(
          "flex items-center justify-center gap-4",
          error && "animate-pulse"
        )}
      >
        {Array.from({ length: LARGO_PIN }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-4 w-8 border transition-colors",
              i < pin.length
                ? "border-accent bg-accent"
                : error
                  ? "border-accent/60"
                  : "border-border-strong bg-surface"
            )}
          />
        ))}
      </div>

      {error ? (
        <p className="mt-3 text-center text-sm text-accent">{error}</p>
      ) : (
        <p className="mt-3 text-center text-sm text-chalk-muted">
          Tu entrenador te dio un PIN de 4 dígitos
        </p>
      )}

      <div className="mt-6 grid grid-cols-3 gap-3">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) =>
          tecla(d, () => presionarDigito(d))
        )}
        <div />
        {tecla("0", () => presionarDigito("0"))}
        <button
          type="button"
          onClick={borrar}
          disabled={isPending}
          className="flex h-16 select-none items-center justify-center border border-border-strong bg-surface text-chalk-muted transition-colors hover:border-chalk hover:bg-surface-hover hover:text-chalk active:bg-chalk active:text-white disabled:opacity-40 sm:h-[72px]"
          aria-label="Borrar"
        >
          <Delete size={22} />
        </button>
      </div>
    </div>
  );
}
