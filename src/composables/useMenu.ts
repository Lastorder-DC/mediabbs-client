import { computed } from "vue";
import type { ComputedRef } from "vue";
import { useI18n } from "vue-i18n";
import { getConfig, runtimeConfig, serverMenus } from "@/config";
import type { NavLink } from "@/config";
import { BUILTIN_ICONS, boardIconClass, isBuiltin } from "@/menu";
import type { MenuEntry, MenuItemConfig, MenuLink, MenuText } from "@/menu";
import { currentSkinName } from "@/skins";
import { useAppStore } from "@/stores/app";
import { specialUrl } from "@/wiki";

/** Where a skin's menu comes from, highest priority first. */
export type MenuSource = "admin" | "adminDefault" | "config" | "configDefault" | "skin";

/** The configured menu of `skin` and where it comes from. */
export function menuItemsFor(
  skin: string,
  skinDefault: MenuItemConfig[],
): { items: MenuItemConfig[]; source: MenuSource } {
  const saved = serverMenus.value;
  const deployed = runtimeConfig.menus;
  if (saved?.[skin]) return { items: saved[skin], source: "admin" };
  if (saved?.default) return { items: saved.default, source: "adminDefault" };
  if (deployed?.[skin]) return { items: deployed[skin], source: "config" };
  if (deployed?.default) return { items: deployed.default, source: "configDefault" };
  return { items: skinDefault, source: "skin" };
}

/**
 * The navigation menu of the current skin, resolved to links and dropdowns:
 * menus saved from the admin page (this skin's, else `default`), then config.js
 * `menus` (likewise), else the skin's own default.
 */
export function useMenu(skinDefault: MenuItemConfig[]): ComputedRef<MenuEntry[]> {
  const { t, locale } = useI18n();
  const store = useAppStore();
  const config = getConfig();
  const skin = currentSkinName();
  // The router guard loads the boards on every navigation; this covers pages
  // without a board (e.g. /auth).
  if (!store.boards) store.fetchBoards().catch((error) => console.error(error));

  function text(value: MenuText | undefined, fallback: string): string {
    if (value === undefined) return fallback;
    if (typeof value === "string") return value;
    return value[locale.value] ?? value.en ?? Object.values(value)[0] ?? fallback;
  }

  const fromNavLink = (link: NavLink, key: string): MenuEntry => ({
    key,
    label: link.label,
    icon: link.icon,
    href: link.url,
    children: link.children?.length
      ? link.children.map((c, i) => ({ key: `${key}-${i}`, label: c.label, href: c.url }))
      : undefined,
  });

  return computed(() => {
    const items = menuItemsFor(skin, skinDefault).items;
    const result: MenuEntry[] = [];
    items.forEach((item, index) => {
      const key = `menu-${index}`;
      if (!isBuiltin(item)) {
        result.push({
          key,
          label: text(item.label, ""),
          icon: item.icon,
          href: item.url,
          children: item.children?.map(
            (c, i): MenuLink => ({ key: `${key}-${i}`, label: text(c.label, ""), href: c.url }),
          ),
        });
        return;
      }
      const icon = item.icon ?? BUILTIN_ICONS[item.type];
      switch (item.type) {
        case "recentChanges":
          result.push({ key, icon, label: text(item.label, t("nav.recentChanges")), href: specialUrl("RecentChanges") });
          break;
        case "random":
          result.push({ key, icon, label: text(item.label, t("nav.random")), href: specialUrl("Random") });
          break;
        case "wiki":
          result.push({ key, icon, label: text(item.label, t("nav.wiki")), href: config.wiki.baseUrl });
          break;
        case "boards": {
          const boards = (store.boards || []).filter((b) => b.isListed);
          if (boards.length) {
            result.push({
              key,
              icon,
              label: text(item.label, t("nav.boards")),
              children: boards.map((b, i) => ({
                key: `${key}-${b.id}`,
                label: b.displayName,
                iconClass: boardIconClass(b.icon),
                // No separator above the first item.
                separator: i > 0 && b.separatorBefore,
                to: `/${b.name}`,
              })),
            });
          }
          break;
        }
        case "tools":
          result.push({
            key,
            icon,
            label: text(item.label, t("nav.tools")),
            children: [
              { key: `${key}-upload`, label: t("nav.upload"), href: specialUrl("Upload") },
              { key: `${key}-special`, label: t("nav.specialPages"), href: specialUrl("SpecialPages") },
            ],
          });
          break;
        case "navLinks":
          config.navLinks.forEach((link, i) => result.push(fromNavLink(link, `${key}-${i}`)));
          break;
      }
    });
    return result;
  });
}
