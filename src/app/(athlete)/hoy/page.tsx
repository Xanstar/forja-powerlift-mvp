import { Dumbbell } from "lucide-react";
import { PinPad } from "@/components/pin-pad";

export default function HoyEntryPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-center gap-2 border-b border-border px-4 py-4">
        <Dumbbell size={18} className="text-accent" />
        <span className="font-display text-sm font-bold text-chalk">Forja</span>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center px-6 pb-10">
        <h1 className="font-display text-xl font-bold text-chalk">
          ¿Quién entrena hoy?
        </h1>
        <PinPad />
      </div>
    </div>
  );
}
