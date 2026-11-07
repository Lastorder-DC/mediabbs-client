# librewiki branding

Assets of the original librebbs-client deployment (bbs.librewiki.net), kept
for librewiki and removed from the default build:

| File | Was |
|---|---|
| `logo.png` | `src/assets/logo.png` (navbar fallback logo) |
| `designedbylibre.png` | `src/assets/designedbylibre.png` (footer). The Liberty skin now shows it again (`src/skins/liberty/assets/`) |
| `favicon.ico` | `public/favicon.ico` |
| `CNAME` | `public/CNAME` (GitHub Pages domain) |

To restore them, copy `logo.png` over the logo import in
`src/skins/liberty/NavBar.vue` (or replace `src/assets/logo.svg`), copy
`favicon.ico` to `public/`, and set the theme color with
`VUE_APP_PRIMARY_COLOR=#4188f1` (already the default).
