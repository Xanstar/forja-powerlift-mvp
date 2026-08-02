import type { MetadataRoute } from "next";
import { appName } from "@/lib/config";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${appName} — Powerlifting Coaching`,
    short_name: appName,
    description: "Planificación y seguimiento para entrenadores de powerlifting.",
    start_url: "/",
    display: "standalone",
    background_color: "#F4F1EA",
    theme_color: "#10294B",
    orientation: "portrait",
    icons: [
      { src: "/brand/forja-mark-192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/forja-mark-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
