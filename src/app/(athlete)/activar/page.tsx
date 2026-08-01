import { Dumbbell } from "lucide-react";
import { AthleteActivationForm } from "@/components/athlete-activation-form";
import { Card } from "@/components/ui/card";
import { appName } from "@/lib/config";

export default function ActivarAtletaPage() {
  return (
    <main className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-center gap-2 border-b border-border px-4 py-4">
        <Dumbbell size={18} className="text-accent" aria-hidden="true" />
        <span className="font-display text-sm font-bold text-chalk">
          {appName}
        </span>
      </header>
      <div className="flex flex-1 items-center justify-center px-5 py-10">
        <Card className="w-full max-w-md">
          <h1 className="font-display text-2xl font-bold text-chalk">
            Activá tu acceso
          </h1>
          <p className="mt-2 text-sm text-chalk-muted">
            Ingresá el teléfono que registró tu entrenador y el código que recibiste por WhatsApp.
          </p>
          <AthleteActivationForm />
        </Card>
      </div>
    </main>
  );
}
