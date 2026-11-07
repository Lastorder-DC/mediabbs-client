// Configuration:
//  - runtime/deploy-time settings from public/config.js (`window.MEDIABBS_CONFIG`)
//  - public settings served by the mediabbs backend (`GET /config`), loaded once
//    before the app is mounted (see main.ts) so components can read them
//    synchronously.
import axios from "axios";
import { shallowRef } from "vue";
import type { MenuItemConfig } from "@/menu";

export interface NavLink {
  label: string;
  url?: string;
  icon?: string;
  children?: NavLink[];
}

export interface PublicConfig {
  siteName: string | null;
  locale: string;
  defaultBoard: string | null;
  wiki: {
    baseUrl: string;
    apiUrl: string;
    /** Absolute article URL template; `$1` is replaced with the encoded title. */
    articlePath: string;
    siteName: string | null;
    logo: string | null;
    lang: string | null;
  };
  oauth: {
    clientId: string;
    authorizeUrl: string;
  };
  navLinks: NavLink[];
  recentChanges: {
    enabled: boolean;
    documentNamespaces: number[] | null;
    discussionNamespaces: number[] | null;
  };
  siteNotice: {
    enabled: boolean;
    page: string;
  };
  upload: {
    enabled: boolean;
    requireLogin: boolean;
    maxBytes: number;
    allowedExtensions: string[];
  };
}

/** Settings from public/config.js. */
export interface RuntimeConfig {
  backendHost?: string;
  /** Default skin name. */
  skin?: string;
  /** Skins users may choose from (default: all bundled skins). */
  skins?: string[];
  /** Theme color (hex). */
  primaryColor?: string;
  /** Navigation menu per skin name (or `default`), replacing the skin's own. */
  menus?: Record<string, MenuItemConfig[]>;
}

declare global {
  interface Window {
    MEDIABBS_CONFIG?: RuntimeConfig;
  }
}

export const runtimeConfig: RuntimeConfig = window.MEDIABBS_CONFIG || {};

/** Backend URL: runtime config.js first, then VITE_BACKEND_HOST (build time). */
export const backendHost: string = (
  runtimeConfig.backendHost ||
  import.meta.env.VITE_BACKEND_HOST ||
  ""
).replace(/\/+$/, "");

const state = shallowRef<PublicConfig | null>(null);

export async function loadConfig(): Promise<PublicConfig> {
  const { data } = await axios.get<PublicConfig>(`${backendHost}/config`);
  state.value = data;
  return data;
}

/** The loaded configuration. Only valid after `loadConfig()` resolved. */
export function getConfig(): PublicConfig {
  if (!state.value) {
    throw new Error("config is not loaded yet");
  }
  return state.value;
}
