<script setup lang="ts">
import { defineAsyncComponent, ref } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { useHead } from "@unhead/vue";
import { errorMessage, postTopic } from "@/api";
import { useAppStore } from "@/stores/app";
import { useTopicList } from "@/composables/useTopicList";

const MarkdownEditor = defineAsyncComponent(() => import("@/components/MarkdownEditor.vue"));
const { t } = useI18n();
const store = useAppStore();
const router = useRouter();
const list = useTopicList();
const { topics, board, sentinel, loading, done } = list;
useHead({ title: () => board.value.displayName });

const writing = ref(false);
const title = ref("");
const busy = ref(false);
const editor = ref<{ getMarkdown(): string } | null>(null);

async function submit(): Promise<void> {
  const content = editor.value?.getMarkdown().trim() ?? "";
  if (!title.value.trim() || !content) return;
  busy.value = true;
  try {
    const topic = await postTopic(board.value.id, title.value.trim(), content);
    router.push(`/${board.value.name}/${topic.id}`);
  } catch (error) {
    store.showModalError(errorMessage(error));
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <div class="simple-topic-list">
    <div v-if="store.canWrite" class="s-actions">
      <button class="s-button primary write-button" @click="writing = !writing">{{ t("common.write") }}</button>
    </div>
    <div v-if="writing" class="s-card s-compose">
      <input v-model="title" class="s-input" maxlength="100" :placeholder="t('topic.titlePlaceholder')" />
      <MarkdownEditor ref="editor" height="260px" />
      <p v-if="!store.user.isLoggedIn" class="s-muted">{{ t("topic.anonymousWarning") }}</p>
      <button class="s-button primary" :disabled="busy" @click="submit">{{ t("common.submit") }}</button>
    </div>
    <ul class="s-card s-topics">
      <li v-for="topic in topics" :key="topic.id" :class="{ 's-hidden-topic': topic.isHidden }">
        <RouterLink :to="list.topicPath(topic)" class="s-topic-title">
          <span v-if="topic.isPinned" :title="t('topic.pinned')">📌 </span>
          <span v-if="topic.isClosed || topic.isSuspended" :title="topic.isClosed ? t('topic.closed') : t('topic.suspended')">🔒 </span>
          <span v-if="topic.isHidden" class="sr-only">{{ t("topic.hidden") }}: </span>
          <span class="s-topic-text" :title="topic.isHidden ? t('topic.hidden') : undefined">{{ list.title(topic) }}</span>
          <span v-if="topic.commentCount > 1" class="s-muted">[{{ topic.commentCount }}]</span>
          <span v-if="list.isUpdatedSinceVisit(topic)" class="s-dot" :title="t('topic.updatedSinceVisit')" />
        </RouterLink>
        <div class="s-muted">{{ topic.authorName }} · {{ list.updatedText(topic) }}</div>
      </li>
      <li v-if="done && !topics.length" class="s-muted">{{ t("topic.empty") }}</li>
    </ul>
    <div ref="sentinel" class="s-sentinel s-muted">{{ loading ? "…" : "" }}</div>
  </div>
</template>

<style>
.simple-topic-list .s-actions {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 0.6rem;
}
.simple-topic-list .s-compose {
  display: grid;
  gap: 0.6rem;
  padding: 0.8rem;
  margin-bottom: 1rem;
}
.simple-topic-list .s-compose .s-button {
  justify-self: end;
}
.simple-topic-list .s-topics {
  list-style: none;
  margin: 0;
  padding: 0;
}
.simple-topic-list .s-topics li {
  padding: 0.6rem 0.9rem;
  border-bottom: 1px solid var(--border);
}
.simple-topic-list .s-topics li:last-child {
  border-bottom: 0;
}
.simple-topic-list .s-topic-title {
  color: var(--text);
  font-weight: 600;
}
/* Hidden topics: only board administrators get them, to unhide them. */
.simple-topic-list .s-topics li.s-hidden-topic {
  background: rgba(127, 127, 127, 0.12);
  opacity: 0.7;
}
.simple-topic-list .s-hidden-topic .s-topic-text {
  text-decoration: line-through;
}
.simple-topic-list .sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
}
.simple-topic-list .s-dot {
  display: inline-block;
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background: var(--primary);
  margin-left: 0.3rem;
}
.s-sentinel {
  min-height: 2rem;
  text-align: center;
}
</style>
