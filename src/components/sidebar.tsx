"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LayoutDashboard, Users, LogOut, Crosshair } from "lucide-react";
import { cn } from "@/lib/utils";
import { ForjaLogo } from "@/components/forja-logo";
import { ThemeControl } from "@/components/theme-control";

const links = [
  { href: "/dashboard", label: "Dashboard", shortLabel: "Inicio", icon: LayoutDashboard },
  { href: "/atletas", label: "Atletas", shortLabel: "Atletas", icon: Users },
  { href: "/marcas", label: "Marcas", shortLabel: "Marcas", icon: Crosshair },
];

export function Sidebar({ nombreEntrenador }: { nombreEntrenador: string }) {
  const pathname = usePathname();

  return (
    <>
      <aside className="hidden min-h-screen border-r border-on-brand-border bg-brand-canvas text-on-brand md:flex md:flex-col">
        <div className="border-b border-on-brand-border px-5 py-6">
          <Link href="/dashboard" className="inline-flex min-h-11 items-center">
            <ForjaLogo className="w-[168px]" onDark />
          </Link>
          <p className="mt-1 text-xs text-on-brand-muted">Panel de coaching</p>
        </div>
        <nav className="flex-1 py-5" aria-label="Navegación del coach">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link key={href} href={href} className={cn("flex min-h-12 items-center gap-3 border-y border-transparent px-5 text-sm font-semibold text-on-brand-muted transition-colors hover:bg-on-brand-hover hover:text-on-brand", active && "border-on-brand-border bg-on-brand text-brand-navy hover:bg-on-brand")}>
                <Icon size={17} aria-hidden="true" />{label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-on-brand-border p-4">
          <div className="flex items-center justify-between gap-2"><p className="min-w-0 truncate px-2 text-xs text-on-brand-muted">{nombreEntrenador}</p><ThemeControl onBrand /></div>
          <button onClick={() => signOut({ callbackUrl: "/login" })} className="mt-2 flex min-h-11 w-full items-center gap-3 px-2 text-sm font-semibold text-on-brand-muted hover:text-on-brand">
            <LogOut size={17} aria-hidden="true" />Cerrar sesión
          </button>
        </div>
      </aside>

      <header className="flex min-h-16 items-center justify-between border-b border-chalk bg-surface px-4 md:hidden">
        <Link href="/dashboard" className="inline-flex min-h-11 items-center">
          <ForjaLogo className="w-[132px]" />
        </Link>
        <ThemeControl />
      </header>

      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-chalk bg-surface md:hidden" aria-label="Navegación del coach">
        {links.map(({ href, shortLabel, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return <Link key={href} href={href} className={cn("flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-semibold text-chalk-muted", active && "bg-brand-canvas text-on-brand")}><Icon size={19} aria-hidden="true" />{shortLabel}</Link>;
        })}
        <button onClick={() => signOut({ callbackUrl: "/login" })} className="flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-semibold text-chalk-muted"><LogOut size={19} aria-hidden="true" />Salir</button>
      </nav>
    </>
  );
}
