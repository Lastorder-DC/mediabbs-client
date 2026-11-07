import { computed, ref, watch } from "vue";
import { DateTime } from "luxon";
import { decode } from "html-entities";
import { getTopics, permits } from "@/api";
import type { Topic } from "@/api";
import { t } from "@/i18n";
import { useAppStore } from "@/stores/app";
import { useInfiniteScroll } from "./useInfiniteScroll";
import { appendUnique } from "./appendUnique";
import { lastVisited } from "./visits";

const PAGE_SIZE = 10;

/** Topics of the current board, loaded page by page. */
export function useTopicList() {
  const store = useAppStore();
  const topics = ref<Topic[]>([]);
  const board = computed(() => store.board);

  const scroll = useInfiniteScroll(async (isCurrent) => {
    if (!board.value.id) return false;
    const boardId = board.value.id;
    const page = await getTopics(boardId, topics.value.length, PAGE_SIZE);
    // A reset (board change) happened while loading: drop this page.
    if (!isCurrent() || boardId !== board.value.id) return true;
    appendUnique(topics.value, page);
    return page.length === PAGE_SIZE;
  });

  function updateCanWrite(): void {
    store.canWrite =
      store.board.isActive &&
      !store.user.isBlocked &&
      permits(store.board.writePermission, store.user);
  }

  // The router guard loads the board before the route changes, so the board
  // id is the one thing that identifies the list (watching the route param as
  // well would reset the list twice per navigation).
  watch(
    () => store.board.id,
    () => {
      topics.value = [];
      updateCanWrite();
      scroll.reset();
    },
    { immediate: true },
  );
  watch(
    () => [store.user, store.board.isActive, store.board.writePermission],
    updateCanWrite,
    { deep: true },
  );

  return {
    topics,
    board,
    ...scroll,
    title: (topic: Topic) => decode(topic.title),
    topicPath: (topic: Topic) => `/${board.value.name}/${topic.id}`,
    updatedText: (topic: Topic) =>
      t("topic.updatedAt", { time: DateTime.fromISO(topic.updatedAt).toRelative() ?? "" }),
    isUpdatedSinceVisit(topic: Topic): boolean {
      const visited = lastVisited(topic.id);
      return !!visited && DateTime.fromISO(topic.updatedAt) > visited;
    },
  };
}
