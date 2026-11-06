/**
 * @type {import('@vue/cli-service').ProjectOptions}
 */

// Build-time branding:
//   VUE_APP_PRIMARY_COLOR  theme color, e.g. "#4188f1" (default) or "#2e7d32"
//   VUE_APP_SITE_NAME      name used for the installable web app (PWA manifest)
const primaryColor = process.env.VUE_APP_PRIMARY_COLOR || "#4188f1";
if (!/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(primaryColor)) {
  throw new Error(
    `VUE_APP_PRIMARY_COLOR must be a hex color like #4188f1 (got "${primaryColor}")`
  );
}

module.exports = {
  css: {
    loaderOptions: {
      scss: {
        // Overrides `$primary: ... !default` in src/assets/style-variables.scss
        additionalData: `$primary: ${primaryColor};`,
      },
    },
  },
  pwa: {
    name: process.env.VUE_APP_SITE_NAME || "MediaBBS",
    iconPaths: {
      faviconSVG: null,
      favicon32: null,
      favicon16: null,
      appleTouchIcon: null,
      maskIcon: null,
      msTileImage: null,
    },
    themeColor: primaryColor,
    msTileColor: primaryColor,
    workboxOptions: {
      // Runtime settings must always come from the server, never the SW cache.
      exclude: [/config\.js$/, /\.map$/],
    },
  },
};
