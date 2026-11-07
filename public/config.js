// Runtime settings, read before the app starts. Edit after deployment as needed
// (the Docker image generates this file from environment variables).
window.MEDIABBS_CONFIG = {
  // Backend (mediabbs) URL, e.g. "https://bbs.example.org/api".
  // Empty: use VITE_BACKEND_HOST from build time.
  backendHost: "",
  // Default skin ("liberty", "simple"). Users can pick another one unless
  // `skins` limits the choice, e.g. skins: ["liberty"].
  // skin: "liberty",
  // Theme color (hex), e.g. "#2e7d32". Default: VITE_PRIMARY_COLOR or #4188f1.
  // primaryColor: "",
};
