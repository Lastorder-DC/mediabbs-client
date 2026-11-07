<script setup lang="ts">
// Moderation and administration log (GET /admin/logs), newest first.
import { onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { DateTime } from "luxon";
import { errorMessage, getLogs } from "@/api";
import type { LogEntry, LogType } from "@/api";

const { t } = useI18n();

const FILTERS: Record<string, LogType[]> = {
  all: [],
  topics: [
    "close_topic",
    "unclose_topic",
    "hide_topic",
    "unhide_topic",
    "suspend_topic",
    "unsuspend_topic",
    "pin_topic",
    "unpin_topic",
  ],
  comments: ["hide_comment", "unhide_comment"],
  boards: ["create_board", "update_board", "delete_board", "reorder_boards"],
  menus: ["update_menus"],
};
const filter = ref<keyof typeof FILTERS>("all");
const logs = ref<LogEntry[]>([]);
const hasMore = ref(false);
const loading = ref(false);
const error = ref("");

async function load(more = false): Promise<void> {
  loading.value = true;
  error.value = "";
  try {
    const before = more ? logs.value[logs.value.length - 1]?.id : undefined;
    const page = await getLogs({ before, types: FILTERS[filter.value] });
    logs.value = more ? [...logs.value, ...page.logs] : page.logs;
    hasMore.value = page.hasMore;
  } catch (e) {
    error.value = errorMessage(e);
  } finally {
    loading.value = false;
  }
}
onMounted(() => load());
watch(filter, () => load());

function time(entry: LogEntry): string {
  return DateTime.fromISO(entry.createdAt).toLocaleString(DateTime.DATETIME_SHORT_WITH_SECONDS);
}
function action(entry: LogEntry): string {
  return t(`admin.log.types.${entry.type}`);
}
/** Where the entry's target can be seen, if anywhere. */
function link(entry: LogEntry): string | null {
  if (entry.topicId && entry.boardName) return `/${entry.boardName}/${entry.topicId}`;
  if (entry.type.endsWith("_board") && entry.boardName) return `/${entry.boardName}`;
  return null;
}
function targetText(entry: LogEntry): string {
  if (entry.topicId) {
    const topic = `#${entry.topicId} ${entry.topicTitle ?? ""}`.trim();
    return entry.type.endsWith("_comment")
      ? t("admin.log.commentIn", { id: entry.target, topic })
      : topic;
  }
  if (entry.type.endsWith("_comment")) return t("admin.log.comment", { id: entry.target });
  if (entry.type.endsWith("_topic")) return `#${entry.target}`;
  if (entry.type.endsWith("_board")) {
    return entry.boardDisplayName
      ? `${entry.boardDisplayName} (${entry.boardName})`
      : t("admin.log.deletedBoard", { id: entry.target });
  }
  return "";
}
</script>

<template>
  <section class="mb-log-admin">
    <p class="mb-admin-hint">
      <label>
        {{ t("admin.log.filter") }}
        <select v-model="filter" class="mb-input mb-log-filter" name="log-filter">
          <option v-for="(_, key) in FILTERS" :key="key" :value="key">
            {{ t(`admin.log.filters.${key}`) }}
          </option>
        </select>
      </label>
      <button type="button" class="mb-btn small" :disabled="loading" @click="load()">
        {{ t("admin.log.refresh") }}
      </button>
    </p>
    <p v-if="error" class="mb-admin-message error" role="status">{{ error }}</p>
    <p v-else-if="!loading && !logs.length" class="mb-admin-note">{{ t("admin.log.empty") }}</p>
    <ol v-if="logs.length" class="mb-log-list">
      <li v-for="entry in logs" :key="entry.id" class="mb-log-row">
        <time class="mb-log-time mb-muted" :datetime="entry.createdAt">{{ time(entry) }}</time>
        <span class="mb-log-user">{{ entry.userName ?? "?" }}</span>
        <span class="mb-badge mb-log-action" :class="`log-${entry.type}`">{{ action(entry) }}</span>
        <span class="mb-log-target">
          <router-link v-if="link(entry)" :to="link(entry)!">{{ targetText(entry) }}</router-link>
          <template v-else>{{ targetText(entry) }}</template>
        </span>
      </li>
    </ol>
    <p v-if="hasMore || loading" class="mb-log-more">
      <button type="button" class="mb-btn" :disabled="loading" @click="load(true)">
        {{ loading ? t("admin.log.loading") : t("common.more") }}
      </button>
    </p>
  </section>
</template>
