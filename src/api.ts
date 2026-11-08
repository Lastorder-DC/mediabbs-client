import axios, { AxiosError } from "axios";
import { refreshToken } from "@/auth";
import { backendHost } from "@/config";
import type { MenuConfigs } from "@/menu";
import { t, translateServerError } from "@/i18n";

const client = axios.create({
  baseURL: backendHost,
  withCredentials: true,
});

client.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as (typeof error.config & { _retried?: boolean }) | undefined;
    if (
      config &&
      !config._retried &&
      error.response?.status === 401 &&
      error.response.data === "TokenExpired"
    ) {
      config._retried = true;
      await refreshToken();
      return client(config);
    }
    return Promise.reject(error);
  },
);

/** User-facing message for an API error. */
export function errorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) return t("error.network");
    const translated = translateServerError(error.response.data);
    if (translated) return translated;
    if (typeof error.response.data === "string" && error.response.data.length < 200) {
      return error.response.data || t("error.generic");
    }
    return t("error.generic");
  }
  if (error instanceof Error) return error.message;
  return t("error.generic");
}

export interface UserInfo {
  id: number;
  blocked: boolean;
  confirmedEmail: boolean;
  email: string;
  groups: string[];
  rights: string[];
  username: string;
  isAdmin: boolean;
}

/** Who may write in a board: everyone, logged-in users, or admins. */
export type Permission = "all" | "users" | "admins";

export interface Board {
  id: number;
  displayName: string;
  name: string;
  /** `false`: archived (read-only). */
  isActive: boolean;
  sortOrder: number;
  /** Bootstrap Icons name shown before the board name (`chat-dots`). */
  icon: string | null;
  /** Who may start topics. */
  writePermission: Permission;
  /** Who may add comments. */
  commentPermission: Permission;
  /** Shown in the boards menu. Unlisted boards are still reachable by URL. */
  isListed: boolean;
  /** Draw a separator above the board in the boards menu. */
  separatorBefore: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Whether a user may write under `permission`. */
export function permits(
  permission: Permission,
  user: { isLoggedIn: boolean; isAdmin: boolean },
): boolean {
  if (permission === "users") return user.isLoggedIn;
  if (permission === "admins") return user.isLoggedIn && user.isAdmin;
  return true;
}

export interface Topic {
  id: number;
  boardId: number;
  title: string;
  isClosed: boolean;
  isSuspended: boolean;
  isHidden: boolean;
  isPinned: boolean;
  authorId: null | number;
  authorName: string;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: number;
  topicId: number;
  content: null | string;
  authorId: null | number;
  authorName: string;
  isHidden: boolean;
  createdAt: string;
  updatedAt: string;
}

export type TopicStatus = Partial<
  Pick<Topic, "isClosed" | "isSuspended" | "isHidden" | "isPinned">
>;

export async function getUserInfo(): Promise<UserInfo> {
  return (await client.get<UserInfo>("/me")).data;
}

export async function getBoards(): Promise<Board[]> {
  return (await client.get<Board[]>("/boards")).data;
}

/**
 * Boards fresh from the server. Also refreshes the browser's cached copy, so
 * a reload after an admin change does not show the old list.
 */
export async function getBoardsUncached(): Promise<Board[]> {
  const response = await fetch(`${backendHost}/boards`, { cache: "reload" });
  if (!response.ok) throw new Error(await response.text());
  return (await response.json()) as Board[];
}

/** `showHidden` (board administrators only) adds the parameter; left off, URLs stay cacheable. */
function hiddenParam(showHidden: boolean): { showHidden?: true } {
  return showHidden ? { showHidden: true } : {};
}

/** `showHidden`: include hidden topics (board administrators only). */
export async function getTopics(
  boardId: number,
  offset: number,
  limit: number,
  showHidden = false,
): Promise<Topic[]> {
  return (
    await client.get<Topic[]>(`/boards/${boardId}/topics`, {
      params: { offset, limit, ...hiddenParam(showHidden) },
    })
  ).data;
}

/** `showHidden`: also when the topic is hidden (board administrators only). */
export async function getTopic(topicId: number, showHidden = false): Promise<Topic> {
  return (await client.get<Topic>(`/topics/${topicId}`, { params: hiddenParam(showHidden) })).data;
}

export async function postTopic(boardId: number, title: string, content: string): Promise<Topic> {
  return (await client.post<Topic>("/topics", { boardId, title, content })).data;
}

/** Moderation: change one status flag of a topic (one log entry per request). */
export async function setTopicStatus(topicId: number, status: TopicStatus): Promise<Topic> {
  return (await client.put<Topic>(`/topics/${topicId}/status`, status)).data;
}

export async function getComments(
  topicId: number,
  offset: number,
  limit: number,
  showHidden = false,
): Promise<Comment[]> {
  return (
    await client.get<Comment[]>(`/topics/${topicId}/comments`, {
      params: { offset, limit, ...hiddenParam(showHidden) },
    })
  ).data;
}

export async function getComment(commentId: number, showHidden: boolean): Promise<Comment> {
  return (await client.get<Comment>(`/comments/${commentId}`, { params: { showHidden } })).data;
}

export async function postComment(topicId: number, content: string): Promise<void> {
  await client.post(`/topics/${topicId}/comments`, { content });
}

export async function setCommentHidden(commentId: number, isHidden: boolean): Promise<Comment> {
  return (await client.put<Comment>(`/comments/${commentId}/status`, { isHidden })).data;
}

export interface FileResponse {
  path: string;
  url: string;
}

export async function postFile(filename: string, content: string): Promise<FileResponse> {
  return (await client.post<FileResponse>("/files", { filename, content })).data;
}

// Admin (board administrators only)

export type BoardSettings = Pick<
  Board,
  | "name"
  | "displayName"
  | "icon"
  | "writePermission"
  | "commentPermission"
  | "isListed"
  | "isActive"
  | "separatorBefore"
>;

export async function createBoard(settings: BoardSettings): Promise<Board> {
  return (await client.post<Board>("/admin/boards", settings)).data;
}

export async function updateBoard(id: number, settings: BoardSettings): Promise<Board> {
  return (await client.put<Board>(`/admin/boards/${id}`, settings)).data;
}

export async function deleteBoard(id: number): Promise<void> {
  await client.delete(`/admin/boards/${id}`);
}

/** Sets the menu order; `ids` lists every board. Returns the boards in order. */
export async function reorderBoards(ids: number[]): Promise<Board[]> {
  return (await client.put<Board[]>("/admin/boards-order", { ids })).data;
}

/** Saves the menus (`null` removes them: config.js / skin defaults apply). */
export async function saveMenus(menus: MenuConfigs | null): Promise<void> {
  await client.put("/admin/menus", { menus });
}

export const LOG_TYPES = [
  "close_topic",
  "unclose_topic",
  "hide_topic",
  "unhide_topic",
  "suspend_topic",
  "unsuspend_topic",
  "pin_topic",
  "unpin_topic",
  "hide_comment",
  "unhide_comment",
  "create_board",
  "update_board",
  "delete_board",
  "reorder_boards",
  "update_menus",
] as const;
export type LogType = (typeof LOG_TYPES)[number];

/** A moderation/administration log entry (`GET /admin/logs`). */
export interface LogEntry {
  id: number;
  type: LogType | "unknown";
  /** The topic, comment or board id (0 when there is none). */
  target: number;
  userId: number | null;
  userName: string | null;
  createdAt: string;
  topicId: number | null;
  topicTitle: string | null;
  boardName: string | null;
  boardDisplayName: string | null;
}

/** Newest first; pass the last id as `before` for the next page. */
/** The backend version (board administrators only). */
export async function getBackendVersion(): Promise<string> {
  return (await client.get<{ version: string }>("/admin/version")).data.version;
}

export async function getLogs(params: {
  before?: number;
  types?: LogType[];
  limit?: number;
}): Promise<{ logs: LogEntry[]; hasMore: boolean }> {
  const query = {
    before: params.before,
    limit: params.limit,
    types: params.types?.length ? params.types.join(",") : undefined,
  };
  return (await client.get<{ logs: LogEntry[]; hasMore: boolean }>("/admin/logs", { params: query })).data;
}

export type SearchField = "all" | "title" | "content" | "author";

export interface SearchCommentHit {
  id: number;
  authorName: string;
  createdAt: string;
  /** Plain text around the first match. */
  snippet: string;
}

export interface SearchHit {
  topic: Topic;
  boardName: string;
  boardDisplayName: string;
  titleMatch: boolean;
  /** Matching comments; the first few are in `comments`. */
  commentMatches: number;
  comments: SearchCommentHit[];
}

/** Topic and comment search (`GET /search`), newest activity first. */
export async function search(params: {
  q: string;
  in?: SearchField;
  board?: number;
  offset?: number;
  limit?: number;
}): Promise<{ results: SearchHit[]; hasMore: boolean }> {
  return (await client.get<{ results: SearchHit[]; hasMore: boolean }>("/search", { params })).data;
}
