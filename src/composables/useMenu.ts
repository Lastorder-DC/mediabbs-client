import { computed } from "vue";
import type { ComputedRef } from "vue";
import { useI18n } from "vue-i18n";
import { getConfig, runtimeConfig } from "@/config";
import type { NavLink } from "@/config";
import { BUILTIN_ICONS, isBuiltin } from "@/menu";
import type { MenuEntry, MenuItemConfig, MenuLink, MenuText } from "@/menu";
import { currentSkinName } from "@/skins";
import { useAppStore } from "@/stores/app";
import { specialUrl } from "@/wiki";

/**
 * The navigation menu of the current skin, resolved to links and dropdowns:
 * config.js `menus[<skin>]`, else `menus.default`, else the skin's own default.
 */
export function useMenu(skinDefault: MenuItemConfig[]): ComputedRef<MenuEntry[]> {
  const { t, locale } = useI18n();
  const store = useAppStore();
  const config = getConfig();
  const menus = runtimeConfig.menus;
  const items: MenuItemConfig[] =
    menus?.[currentSkinName()] ?? menus?.default ?? skinDefault;

  if (!store.boards && items.some((i) => isBuiltin(i) && i.type === "boards")) {
    store.fetchBoards().catch((error) => console.error(error));
  }

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
          const boards = store.boards || [];
          if (boards.length) {
            result.push({
              key,
              icon,
              label: text(item.label, t("nav.boards")),
              children: boards.map((b) => ({ key: `${key}-${b.id}`, label: b.displayName, to: `/${b.name}` })),
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
