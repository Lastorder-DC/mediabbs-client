<script setup lang="ts">
// Topic and comment search. Skin-independent; the query lives in the URL
// (/search?q=…&in=title&board=3) so results can be linked and go back works.
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { useHead } from "@unhead/vue";
import { DateTime } from "luxon";
import { errorMessage, search } from "@/api";
import type { Board, SearchField, SearchHit } from "@/api";
import { useAppStore } from "@/stores/app";
import "./search.css";

const FIELDS: SearchField[] = ["all", "title", "content", "author"];
const PAGE = 20;

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const store = useAppStore();

const boards = ref<Board[]>([]);
const q = ref("");
const field = ref<SearchField>("all");
const board = ref<number | "">("");

const results = ref<SearchHit[]>([]);
const hasMore = ref(false);
const loading = ref(false);
const error = ref("");
/** The query the results are for. */
const searched = ref("");

useHead({
  title: () => (searched.value ? t("search.titleFor", { q: searched.value }) : t("search.title")),
});

function fromRoute(): void {
  q.value = typeof route.query.q === "string" ? route.query.q : "";
  const f = route.query.in;
  field.value = FIELDS.includes(f as SearchField) ? (f as SearchField) : "all";
  const b = Number(route.query.board);
  board.value = Number.isInteger(b) && b > 0 ? b : "";
}

async function load(more = false): Promise<void> {
  const text = q.value.trim();
  if (!text) {
    results.value = [];
    searched.value = "";
    hasMore.value = false;
    return;
  }
  loading.value = true;
  error.value = "";
  try {
    const page = await search({
      q: text,
      in: field.value,
      board: board.value === "" ? undefined : board.value,
      offset: more ? results.value.length : 0,
      limit: PAGE,
    });
    results.value = more ? [...results.value, ...page.results] : page.results;
    hasMore.value = page.hasMore;
    searched.value = text;
  } catch (e) {
    error.value = errorMessage(e);
  } finally {
    loading.value = false;
  }
}

function submit(): void {
  const text = q.value.trim();
  if (!text) return;
  const query: Record<string, string> = { q: text };
  if (field.value !== "all") query.in = field.value;
  if (board.value !== "") query.board = String(board.value);
  router.push({ path: "/search", query });
}

onMounted(async () => {
  fromRoute();
  void load();
  boards.value = await store.fetchBoards().catch(() => []);
});
watch(
  () => route.fullPath,
  () => {
    if (route.path !== "/search") return;
    fromRoute();
    void load();
  },
);

const boardOptions = computed(() => boards.value.filter((b) => b.isListed || b.id === board.value));

/** The search terms, for highlighting (the author field matches whole names). */
const terms = computed(() =>
  field.value === "author" ? [] : searched.value.split(/\s+/).filter(Boolean),
);
function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
/** `text` split into plain and matching parts (rendered without v-html). */
function highlight(text: string): { text: string; mark: boolean }[] {
  if (!terms.value.length) return [{ text, mark: false }];
  const re = new RegExp(`(${terms.value.map(escapeRe).join("|")})`, "gi");
  return text
    .split(re)
    .filter((part) => part !== "")
    .map((part) => ({
      text: part,
      mark: terms.value.some((term) => term.toLowerCase() === part.toLowerCase()),
    }));
}

function date(iso: string): string {
  return DateTime.fromISO(iso).toLocaleString(DateTime.DATETIME_MED);
}
function topicPath(hit: SearchHit): string {
  return `/${hit.boardName}/${hit.topic.id}`;
}
</script>

<template>
  <div class="mb-search">
    <h2 class="mb-search-title">{{ t("search.title") }}</h2>
    <form class="mb-search-form" role="search" @submit.prevent="submit">
      <input
        v-model="q"
        class="mb-search-input"
        type="search"
        name="q"
        maxlength="100"
        :placeholder="t('search.placeholder')"
        :aria-label="t('search.placeholder')"
      />
      <select v-model="field" class="mb-search-select" name="in" :aria-label="t('search.field')">
        <option v-for="f in FIELDS" :key="f" :value="f">{{ t(`search.fields.${f}`) }}</option>
      </select>
      <select v-model="board" class="mb-search-select" name="board" :aria-label="t('search.board')">
        <option value="">{{ t("search.allBoards") }}</option>
        <option v-for="b in boardOptions" :key="b.id" :value="b.id">{{ b.displayName }}</option>
      </select>
      <button type="submit" class="mb-search-button">{{ t("search.submit") }}</button>
    </form>
    <p class="mb-search-help">{{ t("search.help") }}</p>

    <p v-if="error" class="mb-search-error" role="status">{{ error }}</p>
    <p v-else-if="searched && !loading && !results.length" class="mb-search-empty">
      {{ t("search.noResults", { q: searched }) }}
    </p>

    <ol v-if="results.length" class="mb-search-results">
      <li v-for="hit in results" :key="hit.topic.id" class="mb-search-hit">
        <div class="mb-search-hit-head">
          <RouterLink :to="`/${hit.boardName}`" class="mb-search-board">{{
            hit.boardDisplayName
          }}</RouterLink>
          <RouterLink :to="topicPath(hit)" class="mb-search-topic">
            <template v-for="(part, i) in highlight(hit.topic.title)" :key="i">
              <mark v-if="part.mark && hit.titleMatch">{{ part.text }}</mark>
              <template v-else>{{ part.text }}</template>
            </template>
          </RouterLink>
          <span v-if="hit.topic.commentCount > 1" class="mb-search-muted"
            >[{{ hit.topic.commentCount }}]</span
          >
        </div>
        <div class="mb-search-muted">
          {{ hit.topic.authorName }} · {{ date(hit.topic.updatedAt) }}
        </div>
        <ul v-if="hit.comments.length" class="mb-search-comments">
          <li v-for="c in hit.comments" :key="c.id" class="mb-search-comment">
            <span class="mb-search-comment-meta">{{ c.authorName }} · {{ date(c.createdAt) }}</span>
            <span class="mb-search-snippet">
              <template v-for="(part, i) in highlight(c.snippet)" :key="i">
                <mark v-if="part.mark">{{ part.text }}</mark>
                <template v-else>{{ part.text }}</template>
              </template>
            </span>
          </li>
          <li v-if="hit.commentMatches > hit.comments.length" class="mb-search-muted">
            <RouterLink :to="topicPath(hit)">
              {{ t("search.moreComments", { n: hit.commentMatches - hit.comments.length }) }}
            </RouterLink>
          </li>
        </ul>
      </li>
    </ol>
    <p v-if="hasMore || loading" class="mb-search-more">
      <button
        type="button"
        class="mb-search-button secondary"
        :disabled="loading"
        @click="load(true)"
      >
        {{ loading ? t("search.loading") : t("common.more") }}
      </button>
    </p>
  </div>
</template>
