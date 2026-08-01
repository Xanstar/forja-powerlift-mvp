import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ServiceWorkerRegister } from "@/components/sw-register";
import { appName } from "@/lib/config";

export const metadata: Metadata = {
  title: `${appName} — Sistema operativo para coaches de powerlifting`,
  description:
    "Programá, ejecutá, detectá desvíos, revisá y ajustá el entrenamiento de powerlifting en un solo ciclo.",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#f2f0e9",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" data-scroll-behavior="smooth">
      <body className="min-h-screen font-sans antialiased">
        {/*
          THESIS: Forja turns the meet room's evidence system into an operating interface, refusing generic dark SaaS.
          OWN-WORLD: mineral paper, regulatory navy, competition red, crisp rules, stamps, condensed display and dominant numerals.
          STORY: understand the coaching cycle, enter the right role, operate from evidence.
          FIRST VIEWPORT: Forja and the cycle at left, a live attempt-style operating board at right, actions above the fold.
          FORM: approved Sala de competencia replacement world; seed key user-pinned-sala-competencia.
          FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md.
        */}
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
