// Theme color: Bulma 1 derives its primary palette from CSS variables, so the
// color can be changed at runtime (config.js `primaryColor`) without rebuilding.

function hexToHsl(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) h = [...h].map((c) => c + c).join("");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, Math.round(l * 100)];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let hue: number;
  if (max === r) hue = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) hue = (b - r) / d + 2;
  else hue = (r - g) / d + 4;
  return [Math.round(hue * 60), Math.round(s * 100), Math.round(l * 100)];
}

/** Applies the theme color; returns the color actually used. */
export function applyPrimaryColor(color: string | undefined): string {
  const fallback = __DEFAULT_PRIMARY_COLOR__;
  const value = color && hexToHsl(color) ? color : fallback;
  const hsl = hexToHsl(value);
  if (hsl) {
    const root = document.documentElement.style;
    root.setProperty("--bulma-primary-h", `${hsl[0]}deg`);
    root.setProperty("--bulma-primary-s", `${hsl[1]}%`);
    root.setProperty("--bulma-primary-l", `${hsl[2]}%`);
    root.setProperty("--mediabbs-primary", value);
  }
  let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement("meta");
    meta.name = "theme-color";
    document.head.appendChild(meta);
  }
  meta.content = value;
  return value;
}
