import { createRouter, createWebHistory } from "vue-router";
import type { Router } from "vue-router";
import { getConfig } from "@/config";
import { errorMessage } from "@/api";
import { t } from "@/i18n";
import { useAppStore } from "@/stores/app";
import type { Skin } from "@/skins/types";

export function createAppRouter(skin: Skin): Router {
  const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    scrollBehavior: (to, from, saved) => saved || { top: 0 },
    routes: [
      {
        // Default board: DEFAULT_BOARD, else the first listed active board.
        path: "/",
        name: "Home",
        component: { render: () => null },
        beforeEnter: async () => {
          const store = useAppStore();
          try {
            const boards = await store.fetchBoards();
            const configured = getConfig().defaultBoard;
            const board =
              boards.find((b) => b.name === configured) ||
              boards.find((b) => b.isListed && b.isActive) ||
              boards.find((b) => b.isListed) ||
              boards[0];
            if (board) return `/${board.name}`;
            store.setError(t("error.noBoards"));
          } catch (error) {
            store.setError(errorMessage(error));
          }
          return true;
        },
      },
      {
        path: "/auth",
        name: "Auth",
        component: () => import("@/pages/AuthCallback.vue"),
      },
      {
        path: "/admin",
        name: "Admin",
        component: () => import("@/pages/admin/AdminPage.vue"),
      },
      {
        path: "/:boardName",
        name: "TopicList",
        component: skin.pages.topicList,
      },
      {
        path: "/:boardName/:topicId(\\d+)",
        name: "Topic",
        component: skin.pages.topic,
      },
    ],
  });

  router.beforeEach(async (to) => {
    const store = useAppStore();
    store.setError(null);
    try {
      const jobs: Promise<unknown>[] = [];
      if (!store.user.isInitialized && to.name !== "Auth") {
        jobs.push(store.fetchUserInfo());
      }
      if (typeof to.params.boardName === "string") {
        jobs.push(store.fetchBoard(to.params.boardName));
      } else {
        store.clearBoard();
        store.canWrite = false;
      }
      await Promise.all(jobs);
    } catch (error) {
      store.setError(errorMessage(error));
    }
    return true;
  });

  return router;
}
