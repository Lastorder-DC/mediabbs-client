import { computed, onBeforeUnmount, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { DateTime } from "luxon";
import { decode } from "html-entities";
import {
  errorMessage,
  getComment,
  getComments,
  getTopic,
  permits,
  postComment,
  setCommentHidden,
  setTopicStatus,
} from "@/api";
import type { Comment, Topic, TopicStatus } from "@/api";
import { t } from "@/i18n";
import { useAppStore } from "@/stores/app";
import { useInfiniteScroll } from "./useInfiniteScroll";
import { appendUnique } from "./appendUnique";
import { markVisited } from "./visits";
import { commentSubmitter } from "./commentSubmitter";
import { useLiveTopic } from "./useLiveTopic";

const PAGE_SIZE = 20;
/**
 * After reaching the end, check for new comments this often — only while live
 * updates (Server-Sent Events, useLiveTopic) are not connected.
 */
const POLL_MS = 10_000;

/** A topic page: the topic, its comments and the moderation actions. */
export function useTopic() {
  const store = useAppStore();
  const route = useRoute();
  const topic = ref<Topic | null>(null);
  const comments = ref<Comment[]>([]);
  const topicId = computed(() => Number(route.params.topicId));
  let pollTimer: number | undefined;
  let unmounted = false;
  /** Board administrators can open hidden topics (to unhide them). */
  const showHidden = () => store.user.isAdmin;

  const scroll = useInfiniteScroll(async (isCurrent) => {
    const id = topicId.value;
    const page = await getComments(id, comments.value.length, PAGE_SIZE, showHidden());
    if (!isCurrent() || id !== topicId.value) return true;
    appendUnique(comments.value, page);
    const more = page.length === PAGE_SIZE;
    if (!more) schedulePoll();
    return more;
  });

  function schedulePoll(): void {
    window.clearTimeout(pollTimer);
    if (!live.value) pollTimer = window.setTimeout(() => scroll.resume(), POLL_MS);
  }

  const writeBlockReason = computed((): string | null => {
    if (!topic.value) return null;
    if (topic.value.isHidden) return t("topic.hiddenNotice");
    if (topic.value.isClosed) return t("topic.closedNotice");
    if (topic.value.isSuspended) return t("topic.suspendedNotice");
    if (!store.board.isActive) return t("topic.archivedNotice");
    if (store.user.isBlocked) return t("topic.blockedNotice");
    if (!permits(store.board.commentPermission, store.user)) {
      return store.board.commentPermission === "users"
        ? t("topic.loginToCommentNotice")
        : t("topic.adminCommentNotice");
    }
    return null;
  });

  watch(
    () => !!topic.value && !topic.value.isHidden && !writeBlockReason.value,
    (can) => (store.canWrite = can),
    { immediate: true },
  );

  /** Reloads a comment that changed (e.g. was hidden), if it is shown. */
  async function refreshComment(id: number): Promise<void> {
    const index = comments.value.findIndex((c) => c.id === id);
    if (index < 0) return;
    try {
      const fresh = await getComment(id, store.user.isAdmin);
      const now = comments.value.findIndex((c) => c.id === id);
      if (now >= 0) comments.value[now] = fresh;
    } catch (error) {
      console.error(error);
    }
  }

  /** New comments go to the end: load them only if the end is shown. */
  function onNewComments(): void {
    if (scroll.done.value && !scroll.loading.value) {
      loadNewComments().catch((error) => console.error(error));
    }
  }

  const { live } = useLiveTopic(topicId, {
    comment: onNewComments,
    commentUpdated: (id) => void refreshComment(id),
    topic: () => void fetchTopic(),
    resync: () => {
      void fetchTopic();
      onNewComments();
    },
  });
  // Connected: no polling. Disconnected for good: poll again (if at the end).
  watch(live, (isLive) => {
    if (isLive) window.clearTimeout(pollTimer);
    else if (scroll.done.value) schedulePoll();
  });

  async function fetchTopic(): Promise<void> {
    const id = topicId.value;
    try {
      const fresh = await getTopic(id, showHidden());
      if (unmounted || id !== topicId.value) return;
      topic.value = fresh;
      markVisited(id);
    } catch (error) {
      // The page was left meanwhile (e.g. Back while this was loading): the
      // error is about a page no longer shown.
      if (unmounted || id !== topicId.value) return;
      store.setError(errorMessage(error));
    }
  }

  watch(
    topicId,
    () => {
      topic.value = null;
      comments.value = [];
      window.clearTimeout(pollTimer);
      void fetchTopic();
      scroll.reset();
    },
    { immediate: true },
  );

  /** Appends comments added since the last load. */
  async function loadNewComments(): Promise<void> {
    const id = topicId.value;
    for (;;) {
      const page = await getComments(id, comments.value.length, PAGE_SIZE, showHidden());
      if (id !== topicId.value) return;
      appendUnique(comments.value, page);
      if (page.length < PAGE_SIZE) return;
    }
  }

  async function moderate(status: TopicStatus): Promise<void> {
    try {
      topic.value = await setTopicStatus(topicId.value, status);
    } catch (error) {
      store.showModalError(errorMessage(error));
    }
  }

  async function updateComment(index: number, action: () => Promise<Comment>): Promise<void> {
    try {
      comments.value[index] = await action();
    } catch (error) {
      store.showModalError(errorMessage(error));
    }
  }

  /** Posts a comment and loads it (and anything else new). */
  async function submitComment(content: string): Promise<boolean> {
    try {
      await postComment(topicId.value, content);
    } catch (error) {
      store.showModalError(errorMessage(error));
      return false;
    }
    markVisited(topicId.value);
    await loadNewComments();
    return true;
  }
  commentSubmitter.value = submitComment;
  onBeforeUnmount(() => {
    unmounted = true;
    window.clearTimeout(pollTimer);
    if (commentSubmitter.value === submitComment) commentSubmitter.value = null;
  });

  return {
    topic,
    comments,
    /** Whether live updates are connected. */
    live,
    ...scroll,
    writeBlockReason,
    title: computed(() => (topic.value ? decode(topic.value.title) : "")),
    topicPath: computed(() => `/${store.board.name}/${topicId.value}`),
    moderate,
    hideComment: (index: number) =>
      updateComment(index, () => setCommentHidden(comments.value[index].id, true)),
    unhideComment: (index: number) =>
      updateComment(index, () => setCommentHidden(comments.value[index].id, false)),
    showHiddenComment: (index: number) =>
      updateComment(index, () => getComment(comments.value[index].id, true)),
    submitComment,
    /** Opens the comment editor with a quote of `comment`. */
    quote(comment: Comment): void {
      const content = (comment.content || "").replaceAll("<br>", "").replaceAll("\n", "\n> ");
      const header = t("comment.quoteHeader", {
        date: commentDate(comment),
        author: comment.authorName,
      });
      store.openEditor(`> ${header}\n>\n> ${content}\n\n`);
    },
  };
}

export function commentDate(comment: Comment): string {
  return DateTime.fromISO(comment.createdAt).toLocaleString(DateTime.DATETIME_MED);
}
