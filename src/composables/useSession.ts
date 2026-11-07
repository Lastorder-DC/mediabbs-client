import { computed } from "vue";
import { useRoute } from "vue-router";
import { logout, startLoginProcess } from "@/auth";
import { getConfig } from "@/config";
import { boardSiteName, specialUrl, userUrl } from "@/wiki";
import { useAppStore } from "@/stores/app";

/** Login state and the links/actions a navigation bar needs. */
export function useSession() {
  const store = useAppStore();
  const route = useRoute();
  const config = getConfig();
  return {
    user: computed(() => store.user),
    boards: computed(() => store.boards || []),
    navLinks: config.navLinks,
    wikiName: config.wiki.siteName || "Wiki",
    wikiHome: config.wiki.baseUrl,
    wikiLogo: config.wiki.logo,
    siteName: boardSiteName(),
    special: specialUrl,
    userPage: userUrl,
    login: () => startLoginProcess(route.fullPath),
    async logout(): Promise<void> {
      await logout();
      location.reload();
    },
  };
}
