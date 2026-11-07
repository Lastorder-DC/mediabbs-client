import { computed, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { DateTime } from "luxon";
import { decode } from "html-entities";
import { getTopics } from "@/api";
import type { Topic } from "@/api";
import { t } from "@/i18n";
import { useAppStore } from "@/stores/app";
import { useInfiniteScroll } from "./useInfiniteScroll";
import { lastVisited } from "./visits";

const PAGE_SIZE = 10;

/** Topics of the current board, loaded page by page. */
export function useTopicList() {
  const store = useAppStore();
  const route = useRoute();
  const topics = ref<Topic[]>([]);
  const board = computed(() => store.board);

  const scroll = useInfiniteScroll(async () => {
    if (!board.value.id) return false;
    const boardId = board.value.id;
    const page = await getTopics(boardId, topics.value.length, PAGE_SIZE);
    if (boardId !== board.value.id) return true;
    topics.value.push(...page);
    return page.length === PAGE_SIZE;
  });

  function updateCanWrite(): void {
    store.canWrite = store.board.isActive && !store.user.isBlocked;
  }

  watch(
    () => [route.params.boardName, store.board.id],
    () => {
      topics.value = [];
      updateCanWrite();
      scroll.reset();
    },
    { immediate: true },
  );
  watch(() => store.user.isBlocked, updateCanWrite);

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
