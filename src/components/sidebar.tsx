"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LayoutDashboard, Users, LogOut, Crosshair } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Dashboard", shortLabel: "Inicio", icon: LayoutDashboard },
  { href: "/atletas", label: "Atletas", shortLabel: "Atletas", icon: Users },
  { href: "/marcas", label: "Marcas", shortLabel: "Marcas", icon: Crosshair },
];

export function Sidebar({ nombreEntrenador }: { nombreEntrenador: string }) {
  const pathname = usePathname();

  return (
    <>
      <aside className="hidden min-h-screen border-r border-chalk bg-chalk text-white md:flex md:flex-col">
        <div className="border-b border-white/25 px-5 py-6">
          <Link href="/dashboard" className="font-display text-2xl font-bold tracking-[-0.04em]">Forja</Link>
          <p className="mt-1 text-xs text-white/60">Panel de coaching</p>
        </div>
        <nav className="flex-1 py-5" aria-label="Navegación del coach">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link key={href} href={href} className={cn("flex min-h-12 items-center gap-3 border-y border-transparent px-5 text-sm font-semibold text-white/70 transition-colors hover:bg-white/10 hover:text-white", active && "border-white/25 bg-white text-chalk hover:bg-white")}>
                <Icon size={17} aria-hidden="true" />{label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-white/25 p-4">
          <p className="truncate px-2 pb-2 text-xs text-white/60">{nombreEntrenador}</p>
          <button onClick={() => signOut({ callbackUrl: "/login" })} className="flex min-h-11 w-full items-center gap-3 px-2 text-sm font-semibold text-white/70 hover:text-white">
            <LogOut size={17} aria-hidden="true" />Cerrar sesión
          </button>
        </div>
      </aside>

      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-chalk bg-surface md:hidden" aria-label="Navegación del coach">
        {links.map(({ href, shortLabel, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return <Link key={href} href={href} className={cn("flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold text-chalk-muted", active && "bg-chalk text-white")}><Icon size={19} aria-hidden="true" />{shortLabel}</Link>;
        })}
        <button onClick={() => signOut({ callbackUrl: "/login" })} className="flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold text-chalk-muted"><LogOut size={19} aria-hidden="true" />Salir</button>
      </nav>
    </>
  );
}
