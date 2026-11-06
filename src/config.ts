// Runtime configuration served by the mediabbs backend (`GET /config`).
// Loaded once before the app is mounted (see main.ts), so components can read
// `config` synchronously.
import axios from "axios";
import Vue from "vue";

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

declare global {
  interface Window {
    /** Set by public/config.js (runtime, deploy-time settings). */
    MEDIABBS_CONFIG?: { backendHost?: string };
  }
}

/** Backend URL: runtime config.js first, then VUE_APP_BACKEND_HOST (build time). */
export const backendHost: string = (
  window.MEDIABBS_CONFIG?.backendHost ||
  process.env.VUE_APP_BACKEND_HOST ||
  ""
).replace(/\/+$/, "");

// Reactive so templates update if the config object is replaced.
const state = Vue.observable({ config: null as PublicConfig | null });

export async function loadConfig(): Promise<PublicConfig> {
  const { data } = await axios.get<PublicConfig>(`${backendHost}/config`);
  state.config = data;
  return data;
}

/** The loaded configuration. Only valid after `loadConfig()` resolved. */
export function getConfig(): PublicConfig {
  if (!state.config) {
    throw new Error("config is not loaded yet");
  }
  return state.config;
}

/** Name shown for the board site: SITE_NAME, else "<wiki name> 게시판". */
export function boardSiteName(): string {
  const config = getConfig();
  if (config.siteName && config.siteName !== config.wiki.siteName) {
    return config.siteName;
  }
  return config.wiki.siteName ? `${config.wiki.siteName} 게시판` : "게시판";
}
