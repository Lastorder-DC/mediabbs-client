import { getBoards, getUserInfo } from "@/api";
import type { Board } from "@/api";
import Vue from "vue";
import Vuex, { StoreOptions } from "vuex";

Vue.use(Vuex);

interface State {
  meta: {
    error: Error | null;
  };
  board: Board;
  boards: Board[] | null;
  user: {
    isInitialized: boolean;
    isLoggedIn: boolean;
    isAdmin: boolean;
    isBlocked: boolean;
    email: string;
    username: string;
  };
  modalError: Error | null;
  canWrite: boolean;
  editor: {
    open: boolean;
    initialValue: string;
  };
}

const storeOptions: StoreOptions<State> = {
  state: {
    meta: {
      error: null,
    },
    board: {
      id: 0,
      displayName: "",
      name: "",
      isActive: false,
      createdAt: "",
      updatedAt: "",
    },
    boards: null,
    user: {
      isInitialized: false,
      isLoggedIn: false,
      isAdmin: false,
      isBlocked: false,
      email: "",
      username: "",
    },
    modalError: null,
    canWrite: false,
    editor: {
      open: false,
      initialValue: "",
    },
  },
  mutations: {
    setBoard(state, board: Board) {
      state.board = board;
    },
    setBoards(state, boards: Board[]) {
      state.boards = boards;
    },
    setError(state, error: Error) {
      state.meta.error = error;
    },
    setErrormodal(state, error: Error) {
      state.modalError = error;
    },
    setEditorOpen(state, newState: boolean) {
      state.editor.open = newState;
      state.editor.initialValue = "";
    },
    setEditorInitialValue(state, initialValue: string) {
      state.editor.initialValue = initialValue;
    },
    setCanWrite(state, newState: boolean) {
      state.canWrite = newState;
    },
    updateUserInfo(state, newState: State["user"]) {
      state.user = newState;
    },
    resetUserInfo(state) {
      state.user = {
        isInitialized: true,
        isLoggedIn: false,
        isAdmin: false,
        isBlocked: false,
        email: "",
        username: "",
      };
    },
  },
  actions: {
    async fetchUserInfo() {
      try {
        const data = await getUserInfo();
        store.commit("updateUserInfo", {
          isInitialized: true,
          isLoggedIn: true,
          isAdmin: data.isAdmin,
          isBlocked: data.blocked,
          email: data.email,
          username: data.username,
        });
      } catch {
        store.commit("resetUserInfo");
      }
    },
    async fetchBoards(): Promise<Board[]> {
      if (!store.state.boards) {
        store.commit("setBoards", await getBoards());
      }
      return store.state.boards as Board[];
    },
    async fetchBoard(state, boardName: string) {
      const boards: Board[] = await store.dispatch("fetchBoards");
      const board = boards.find((x) => x.name === boardName);
      if (board) {
        store.commit("setBoard", board);
      } else {
        throw new Error("존재하지 않는 게시판입니다.");
      }
    },
  },
  modules: {},
};

const store = new Vuex.Store(storeOptions);

export default store;
