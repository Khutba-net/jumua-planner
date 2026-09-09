import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Jumua Planner",
    short_name: "Jumua",
    description: "Professional Khutbah Management Platform",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#f8f7f4",
    theme_color: "#00666d",
    icons: [
      {
        src: "/hero-mosque.jpg",
        sizes: "192x192",
        type: "image/jpeg",
      },
      {
        src: "/hero-mosque.jpg",
        sizes: "512x512",
        type: "image/jpeg",
      },
    ],
  };
}
