"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type ThemePreference = "light" | "dark" | "system";
type ThemeChangeEvent = CustomEvent<ThemePreference>;

const STORAGE_KEY = "forja-theme";
const options: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Claro", icon: Sun },
  { value: "dark", label: "Oscuro", icon: Moon },
  { value: "system", label: "Sistema", icon: Monitor },
];

function resolveTheme(preference: ThemePreference) {
  return preference === "system"
    ? window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
    : preference;
}

function applyTheme(preference: ThemePreference) {
  const theme = resolveTheme(preference);
  document.documentElement.dataset.theme = theme;
  document.documentElement.dataset.themePreference = preference;
  document.documentElement.style.colorScheme = theme;
  document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach((meta) => {
    meta.content = theme === "dark" ? "#10294B" : "#F4F1EA";
  });
}

export function ThemeControl({ onBrand = false, className }: { onBrand?: boolean; className?: string }) {
  const [preference, setPreference] = useState<ThemePreference>("system");
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "light" || saved === "dark" || saved === "system") setPreference(saved);

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemChange = () => {
      const current = document.documentElement.dataset.themePreference;
      if (!current || current === "system") applyTheme("system");
    };
    const handleThemeChange = (event: Event) => {
      setPreference((event as ThemeChangeEvent).detail);
    };
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return;
      const next = event.newValue;
      if (next === "light" || next === "dark" || next === "system") {
        setPreference(next);
        applyTheme(next);
      }
    };
    const handlePointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    media.addEventListener("change", handleSystemChange);
    window.addEventListener("forja-theme-change", handleThemeChange);
    window.addEventListener("storage", handleStorage);
    document.addEventListener("pointerdown", handlePointer);
    return () => {
      media.removeEventListener("change", handleSystemChange);
      window.removeEventListener("forja-theme-change", handleThemeChange);
      window.removeEventListener("storage", handleStorage);
      document.removeEventListener("pointerdown", handlePointer);
    };
  }, []);

  const selected = options.find((option) => option.value === preference) ?? options[2];
  const SelectedIcon = selected.icon;

  function select(next: ThemePreference) {
    localStorage.setItem(STORAGE_KEY, next);
    setPreference(next);
    applyTheme(next);
    window.dispatchEvent(new CustomEvent<ThemePreference>("forja-theme-change", { detail: next }));
    setOpen(false);
  }

  return (
    <div ref={rootRef} className={cn("relative shrink-0", className)}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label={`Tema: ${selected.label}. Cambiar tema`}
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          "inline-flex min-h-11 min-w-11 items-center justify-center border transition-colors",
          onBrand
            ? "border-on-brand-border text-on-brand hover:bg-on-brand-hover"
            : "border-border-strong bg-surface text-chalk-muted hover:bg-surface-hover hover:text-chalk"
        )}
      >
        <SelectedIcon size={18} aria-hidden="true" />
      </button>
      {open && (
        <div role="menu" aria-label="Elegir tema" className="absolute right-0 z-50 mt-2 min-w-40 border border-border-strong bg-surface p-1 text-chalk">
          {options.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              role="menuitemradio"
              aria-checked={preference === value}
              onClick={() => select(value)}
              className={cn(
                "flex min-h-11 w-full items-center gap-3 px-3 text-left text-sm font-semibold hover:bg-surface-hover",
                preference === value && "bg-accent-soft text-accent-ink"
              )}
            >
              <Icon size={17} aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
