import Vue from "vue";
import VueRouter, { RouteConfig } from "vue-router";
import store from "@/store";
import type { Board } from "@/api";
import { getConfig } from "@/config";

Vue.use(VueRouter);

const routes: Array<RouteConfig> = [
  {
    // Default board: DEFAULT_BOARD, else the first active board.
    path: "/",
    beforeEnter: async (to, from, next) => {
      try {
        const boards: Board[] = await store.dispatch("fetchBoards");
        const configured = getConfig().defaultBoard;
        const board =
          boards.find((b) => b.name === configured) ||
          boards.find((b) => b.isActive) ||
          boards[0];
        if (board) {
          next(`/${board.name}`);
        } else {
          store.commit(
            "setError",
            new Error("아직 만들어진 게시판이 없습니다.")
          );
          next(false);
        }
      } catch (error) {
        store.commit("setError", error);
        next(false);
      }
    },
  },
  {
    path: "/auth",
    name: "Auth",
    component: () => import(/* webpackChunkName: "auth" */ "../views/Auth.vue"),
  },
  {
    path: "/:boardName",
    name: "TopicList",
    component: () =>
      import(/* webpackChunkName: "topic_list" */ "../views/TopicList.vue"),
  },
  {
    path: "/:boardName/:topicId",
    name: "Topic",
    component: () =>
      import(/* webpackChunkName: "topic" */ "../views/Topic.vue"),
  },
];

const router = new VueRouter({
  mode: "history",
  base: process.env.BASE_URL,
  routes,
});

router.beforeEach(async (to, from, next) => {
  store.commit("setError", null);
  try {
    const promises = [];
    if (!store.state.user.isInitialized && to.name !== "Auth") {
      promises.push(store.dispatch("fetchUserInfo"));
    }
    if (to.params.boardName) {
      promises.push(store.dispatch("fetchBoard", to.params.boardName));
    }
    await Promise.all(promises);
    next();
  } catch (error) {
    store.commit("setError", error);
  }
});

export default router;
