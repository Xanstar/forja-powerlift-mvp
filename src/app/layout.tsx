import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ServiceWorkerRegister } from "@/components/sw-register";
import { appName } from "@/lib/config";

export const metadata: Metadata = {
  title: {
    default: `${appName} | Sistema operativo para coaches de powerlifting`,
    template: `%s | ${appName}`,
  },
  description:
    "Programá, ejecutá, detectá desvíos, revisá y ajustá el entrenamiento de powerlifting en un solo ciclo.",
  manifest: "/manifest.webmanifest",
  applicationName: appName,
  category: "sports",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F4F1EA" },
    { media: "(prefers-color-scheme: dark)", color: "#10294B" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" data-scroll-behavior="smooth" data-theme="light" data-theme-preference="system" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var p=localStorage.getItem("forja-theme");if(p!=="light"&&p!=="dark"&&p!=="system")p="system";var t=p==="system"?(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"):p;var d=document.documentElement;d.dataset.theme=t;d.dataset.themePreference=p;d.style.colorScheme=t;document.querySelectorAll('meta[name="theme-color"]').forEach(function(m){m.content=t==="dark"?"#10294B":"#F4F1EA"})}catch(e){}})()`,
          }}
        />
      </head>
      <body className="min-h-screen font-sans antialiased">
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
