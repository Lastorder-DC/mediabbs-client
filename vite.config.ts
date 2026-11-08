import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath, URL } from "node:url";
import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import { VitePWA } from "vite-plugin-pwa";

function git(...args: string[]): string | null {
  try {
    return execFileSync("git", args, { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
  } catch {
    return null;
  }
}

/**
 * "0.4.0-1a2b3c4", or "0.4.0" for release packages. The hash comes from
 * MEDIABBS_GIT_HASH when set (Docker builds have no .git; empty = release
 * image), else from git: a checkout always shows its commit, even on a
 * release tag. No git (release tarball) gives the plain version.
 */
function appVersion(): string {
  const { version } = JSON.parse(
    readFileSync(new URL("./package.json", import.meta.url), "utf8"),
  ) as { version: string };
  let hash = process.env.MEDIABBS_GIT_HASH;
  if (hash === undefined) hash = git("rev-parse", "--short=7", "HEAD") ?? "";
  hash = hash.replace(/[^0-9a-zA-Z]/g, "").slice(0, 7);
  return hash ? `${version}-${hash}` : version;
}

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
      __APP_VERSION__: JSON.stringify(appVersion()),
    },
    build: {
      chunkSizeWarningLimit: 1500,
    },
  };
});
