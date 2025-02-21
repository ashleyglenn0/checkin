import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "/",
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      workbox: {
        skipWaiting: true,
        clientsClaim: true, // Take control of the page immediately
        cleanupOutdatedCaches: true, // Remove old caches
      },
      includeAssets: ["favicon.ico", "robots.txt", "apple-touch-icon.png"],
      manifest: {
        name: "Volunteer Check-In App",
        short_name: "CheckIn",
        start_url: "/",
        display: "standalone",
        background_color: "#FDF0E2",
        theme_color: "#FE88DF",
        version: "1.0.0",
        icons: [
          {
            src: "/assets/icon-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/assets/icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
    }),
  ],
  "process.env": {}, // Helps avoid the "process is not defined" error
});
