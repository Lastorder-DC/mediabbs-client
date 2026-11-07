import { computed, onBeforeUnmount, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { DateTime } from "luxon";
import { decode } from "html-entities";
import {
  errorMessage,
  getComment,
  getComments,
  getTopic,
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

const PAGE_SIZE = 20;
/** After reaching the end, check for new comments this often. */
const POLL_MS = 10_000;

/** A topic page: the topic, its comments and the moderation actions. */
export function useTopic() {
  const store = useAppStore();
  const route = useRoute();
  const router = useRouter();
  const topic = ref<Topic | null>(null);
  const comments = ref<Comment[]>([]);
  const topicId = computed(() => Number(route.params.topicId));
  let pollTimer: number | undefined;

  const scroll = useInfiniteScroll(async (isCurrent) => {
    const id = topicId.value;
    const page = await getComments(id, comments.value.length, PAGE_SIZE);
    if (!isCurrent() || id !== topicId.value) return true;
    appendUnique(comments.value, page);
    const more = page.length === PAGE_SIZE;
    if (!more) {
      window.clearTimeout(pollTimer);
      pollTimer = window.setTimeout(() => scroll.resume(), POLL_MS);
    }
    return more;
  });

  const writeBlockReason = computed((): string | null => {
    if (!topic.value) return null;
    if (topic.value.isClosed) return t("topic.closedNotice");
    if (topic.value.isSuspended) return t("topic.suspendedNotice");
    if (!store.board.isActive) return t("topic.archivedNotice");
    if (store.user.isBlocked) return t("topic.blockedNotice");
    return null;
  });

  watch(
    () => !!topic.value && !topic.value.isHidden && !writeBlockReason.value,
    (can) => (store.canWrite = can),
    { immediate: true },
  );

  async function fetchTopic(): Promise<void> {
    try {
      topic.value = await getTopic(topicId.value);
      markVisited(topicId.value);
    } catch (error) {
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
      const page = await getComments(id, comments.value.length, PAGE_SIZE);
      if (id !== topicId.value) return;
      appendUnique(comments.value, page);
      if (page.length < PAGE_SIZE) return;
    }
  }

  async function moderate(status: TopicStatus): Promise<void> {
    try {
      topic.value = await setTopicStatus(topicId.value, status);
      if (status.isHidden) router.push(`/${store.board.name}`);
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
    window.clearTimeout(pollTimer);
    if (commentSubmitter.value === submitComment) commentSubmitter.value = null;
  });

  return {
    topic,
    comments,
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
