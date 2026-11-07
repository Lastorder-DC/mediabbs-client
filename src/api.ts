import axios, { AxiosError } from "axios";
import { refreshToken } from "@/auth";
import { backendHost } from "@/config";
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

export interface Board {
  id: number;
  displayName: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
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

export async function getTopics(boardId: number, offset: number, limit: number): Promise<Topic[]> {
  return (await client.get<Topic[]>(`/boards/${boardId}/topics`, { params: { offset, limit } }))
    .data;
}

export async function getTopic(topicId: number): Promise<Topic> {
  return (await client.get<Topic>(`/topics/${topicId}`)).data;
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
): Promise<Comment[]> {
  return (
    await client.get<Comment[]>(`/topics/${topicId}/comments`, { params: { offset, limit } })
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
