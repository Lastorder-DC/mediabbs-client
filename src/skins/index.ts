// Skin registry. To add a skin, create src/skins/<name>/index.ts exporting a
// `Skin` (see ./types.ts) and register it here.
import { runtimeConfig } from "@/config";
import type { Skin, SkinEntry } from "./types";

export const SKINS: Record<string, SkinEntry> = {
  liberty: {
    label: "Liberty",
    load: () => import("./liberty"),
    menu: () => import("./liberty/menu").then((m) => m.defaultMenu),
  },
  simple: {
    label: "Simple",
    load: () => import("./simple"),
    menu: () => import("./simple/menu").then((m) => m.defaultMenu),
  },
};

const STORAGE_KEY = "mediabbs.skin";
const FALLBACK = "simple";

/** Skins users may choose from: config.js `skins`, else every bundled skin. */
export function availableSkins(): { name: string; label: string }[] {
  const allowed = runtimeConfig.skins?.filter((s) => s in SKINS);
  const names = allowed && allowed.length ? allowed : Object.keys(SKINS);
  return names.map((name) => ({ name, label: SKINS[name].label }));
}

function defaultSkin(): string {
  const names = availableSkins().map((s) => s.name);
  for (const candidate of [runtimeConfig.skin, import.meta.env.VITE_DEFAULT_SKIN, FALLBACK]) {
    if (candidate && names.includes(candidate)) return candidate;
  }
  return names[0];
}

/** The skin to use: the user's choice if still allowed, else the site default. */
export function currentSkinName(): string {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && availableSkins().some((s) => s.name === stored)) return stored;
  return defaultSkin();
}

export async function loadSkin(name = currentSkinName()): Promise<Skin> {
  return (await SKINS[name].load()).default;
}

/** Switches skin; the page reloads so no styles of the old skin remain. */
export function setSkin(name: string): void {
  if (name === defaultSkin()) localStorage.removeItem(STORAGE_KEY);
  else localStorage.setItem(STORAGE_KEY, name);
  location.reload();
}
