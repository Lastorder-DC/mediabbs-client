import { defineStore } from "pinia";
import { getBoards, getUserInfo } from "@/api";
import type { Board } from "@/api";
import { t } from "@/i18n";

export interface UserState {
  isInitialized: boolean;
  isLoggedIn: boolean;
  isAdmin: boolean;
  isBlocked: boolean;
  email: string;
  username: string;
}

const anonymous = (): UserState => ({
  isInitialized: true,
  isLoggedIn: false,
  isAdmin: false,
  isBlocked: false,
  email: "",
  username: "",
});

export const emptyBoard = (): Board => ({
  id: 0,
  displayName: "",
  name: "",
  isActive: false,
  sortOrder: 0,
  icon: null,
  writePermission: "all",
  commentPermission: "all",
  isListed: false,
  separatorBefore: false,
  createdAt: "",
  updatedAt: "",
});

/** Loads the Bootstrap Icons font once some board uses an icon. */
let iconsRequested = false;
export function loadBoardIcons(): void {
  if (iconsRequested) return;
  iconsRequested = true;
  import("bootstrap-icons/font/bootstrap-icons.min.css").catch((error) => console.error(error));
}

export type EditorKind = "topic" | "comment";

export const useAppStore = defineStore("app", {
  state: () => ({
    /** Error shown instead of the page content. */
    error: null as string | null,
    /** Error shown in a modal dialog. */
    modalError: null as string | null,
    board: emptyBoard(),
    boards: null as Board[] | null,
    user: { ...anonymous(), isInitialized: false } as UserState,
    /** Whether the current page accepts a new topic/comment from this user. */
    canWrite: false,
    editor: {
      open: false,
      initialValue: "",
      /** Incremented to make an open editor reload `initialValue`. */
      revision: 0,
    },
  }),
  actions: {
    setError(error: string | null) {
      this.error = error;
    },
    showModalError(message: string | null) {
      this.modalError = message;
    },
    openEditor(initialValue = "") {
      this.editor.open = true;
      this.editor.initialValue = initialValue;
      this.editor.revision++;
    },
    closeEditor() {
      this.editor.open = false;
      this.editor.initialValue = "";
    },
    async fetchUserInfo() {
      try {
        const data = await getUserInfo();
        this.user = {
          isInitialized: true,
          isLoggedIn: true,
          isAdmin: data.isAdmin,
          isBlocked: data.blocked,
          email: data.email,
          username: data.username,
        };
      } catch {
        this.user = anonymous();
      }
    },
    async fetchBoards(): Promise<Board[]> {
      if (!this.boards) {
        this.setBoards(await getBoards());
      }
      return this.boards ?? [];
    },
    /** Replaces the board list (also after admin changes) and the current board. */
    setBoards(boards: Board[]) {
      this.boards = boards;
      if (boards.some((b) => b.icon)) loadBoardIcons();
      if (this.board.id) {
        const current = boards.find((b) => b.id === this.board.id);
        if (current) this.board = current;
      }
    },
    clearBoard() {
      if (this.board.id) this.board = emptyBoard();
    },
    async fetchBoard(name: string) {
      const boards = await this.fetchBoards();
      const board = boards.find((b) => b.name === name);
      if (!board) throw new Error(t("error.boardNotFound"));
      this.board = board;
    },
  },
});
