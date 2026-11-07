// Runtime settings, read before the app starts. Edit after deployment as needed
// (the Docker image generates this file from environment variables).
window.MEDIABBS_CONFIG = {
  // Backend (mediabbs) URL, e.g. "https://bbs.example.org/api".
  // Empty: use VITE_BACKEND_HOST from build time.
  backendHost: "",
  // Default skin ("simple", "liberty"; default: simple). Users can pick another
  // one unless `skins` limits the choice, e.g. skins: ["liberty"].
  // skin: "liberty",
  // Navigation menu per skin (replaces the skin's default menu). Entries:
  // { type: "recentChanges" | "random" | "boards" | "tools" | "wiki" | "navLinks" },
  // or links { label: "Help", url: "...", children?: [{ label, url }] }.
  // Labels may be per language: { ko: "도움말", en: "Help" }.
  // menus: {
  //   simple: [{ type: "boards" }, { type: "wiki" }],
  // },
  // Theme color (hex), e.g. "#2e7d32". Default: VITE_PRIMARY_COLOR or #4188f1.
  // primaryColor: "",
};
