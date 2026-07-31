"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LayoutDashboard, Users, LogOut, Dumbbell } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/atletas", label: "Atletas", icon: Users },
];

export function Sidebar({ nombreEntrenador }: { nombreEntrenador: string }) {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-border bg-background px-3 py-5">
      <div className="mb-8 flex items-center gap-2 px-2">
        <Dumbbell size={20} className="text-accent" />
        <span className="font-display text-lg font-bold tracking-tight text-chalk">
          Forja
        </span>
      </div>

      <nav className="flex-1 space-y-1">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-surface text-chalk"
                  : "text-chalk-muted hover:bg-surface hover:text-chalk"
              )}
            >
              <Icon size={17} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border pt-3">
        <div className="mb-2 px-3 text-xs text-chalk-faint truncate">
          {nombreEntrenador}
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-chalk-muted transition-colors hover:bg-surface hover:text-accent"
        >
          <LogOut size={17} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
