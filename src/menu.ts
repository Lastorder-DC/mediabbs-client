// Navigation menus. Each skin has a default menu (Skin.menu). It can be replaced
// per skin from the admin page (stored on the server), or with config.js `menus`
// (see README / docs/skins.md). Admin page first, then config.js, then the skin:
//
//   menus: {
//     simple: [{ type: "boards" }, { type: "wiki" }],
//     liberty: [{ type: "recentChanges" }, { type: "boards" },
//               { label: "Help", url: "https://wiki.example.org/wiki/Help:Contents" }],
//   }

/** A text in one language, or per language: `{ ko: "도움말", en: "Help" }`. */
export type MenuText = string | Record<string, string>;

/** Built-in entries. Labels come from the UI translations unless `label` is set. */
export type BuiltinMenuType =
  /** Wiki Special:RecentChanges */
  | "recentChanges"
  /** Wiki Special:Random */
  | "random"
  /** Dropdown with every board */
  | "boards"
  /** Dropdown: upload file, special pages */
  | "tools"
  /** The wiki's main page */
  | "wiki"
  /** The backend's NAV_LINKS entries, inserted here */
  | "navLinks";

export interface BuiltinMenuItem {
  type: BuiltinMenuType;
  label?: MenuText;
  icon?: string;
}

export interface CustomMenuItem {
  label: MenuText;
  /** Link target (omit when `children` is given). */
  url?: string;
  /** Font Awesome icon name without the `fa-` prefix (skins may ignore it). */
  icon?: string;
  children?: { label: MenuText; url: string }[];
}

export type MenuItemConfig = BuiltinMenuItem | CustomMenuItem;

/** Menus per skin name, or `default` for every skin without its own. */
export type MenuConfigs = Record<string, MenuItemConfig[]>;

/** A resolved link: `to` for board routes, `href` for everything else. */
export interface MenuLink {
  key: string;
  label: string;
  /** Font Awesome icon name (top-level entries). */
  icon?: string;
  /** CSS classes of an icon shown before the label (board icons: `bi bi-…`). */
  iconClass?: string;
  /** Draw a separator above this link (dropdown items). */
  separator?: boolean;
  to?: string;
  href?: string;
}

/** A resolved top-level entry: a link, or a dropdown when `children` is set. */
export interface MenuEntry extends MenuLink {
  children?: MenuLink[];
}

export function isBuiltin(item: MenuItemConfig): item is BuiltinMenuItem {
  return typeof (item as BuiltinMenuItem).type === "string";
}

export const BUILTIN_TYPES: BuiltinMenuType[] = [
  "recentChanges",
  "random",
  "boards",
  "tools",
  "wiki",
  "navLinks",
];

/** CSS classes for a board's Bootstrap icon. */
export const boardIconClass = (icon: string | null | undefined): string | undefined =>
  icon ? `bi bi-${icon}` : undefined;

export const BUILTIN_ICONS: Record<BuiltinMenuType, string | undefined> = {
  recentChanges: "sync",
  random: "random",
  boards: "comments",
  tools: "wrench",
  wiki: "book",
  navLinks: undefined,
};
