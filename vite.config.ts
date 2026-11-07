import { fileURLToPath, URL } from "node:url";
import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  // Build-time branding (runtime overrides live in public/config.js).
  const primaryColor = env.VITE_PRIMARY_COLOR || "#4188f1";
  if (!/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(primaryColor)) {
    throw new Error(
      `VITE_PRIMARY_COLOR must be a hex color like #4188f1 (got "${primaryColor}")`,
    );
  }
  const siteName = env.VITE_SITE_NAME || "MediaBBS";

  return {
    plugins: [
      vue(),
      VitePWA({
        registerType: "autoUpdate",
        // Same name as the Vue CLI build, so existing installs update in place.
        filename: "service-worker.js",
        injectRegister: "auto",
        manifest: {
          name: siteName,
          short_name: siteName,
          theme_color: primaryColor,
          background_color: "#f5f5f5",
          display: "standalone",
          icons: [{ src: "favicon.svg", sizes: "any", type: "image/svg+xml" }],
        },
        workbox: {
          // Runtime settings must always come from the server, never the SW cache.
          globIgnores: ["**/config.js"],
          navigateFallbackDenylist: [/^\/config\.js$/],
          maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        },
      }),
    ],
    resolve: {
      alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
    },
    define: {
      __DEFAULT_PRIMARY_COLOR__: JSON.stringify(primaryColor),
    },
    build: {
      chunkSizeWarningLimit: 1500,
    },
  };
});
