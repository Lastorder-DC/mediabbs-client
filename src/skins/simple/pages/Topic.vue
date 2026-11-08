<script setup lang="ts">
import { defineAsyncComponent, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useHead } from "@unhead/vue";
import { useAppStore } from "@/stores/app";
import { commentDate, useTopic } from "@/composables/useTopic";
import { userUrl } from "@/wiki";
import MarkdownViewer from "@/components/MarkdownViewer.vue";

const MarkdownEditor = defineAsyncComponent(() => import("@/components/MarkdownEditor.vue"));
const { t } = useI18n();
const store = useAppStore();
const page = useTopic();
const { topic, comments, sentinel, loading, writeBlockReason, title } = page;
useHead({ title: () => (title.value ? `${title.value} - ${store.board.displayName}` : store.board.displayName) });

const editor = ref<{ getMarkdown(): string; setMarkdown(v: string): void; reset(): void } | null>(null);
const busy = ref(false);

// Quotes (and the layout's "write" actions) go through store.openEditor().
watch(
  () => store.editor.revision,
  () => {
    editor.value?.setMarkdown(store.editor.initialValue);
    store.closeEditor();
  },
);

async function submit(): Promise<void> {
  const content = editor.value?.getMarkdown().trim() ?? "";
  if (!content) return;
  busy.value = true;
  if (await page.submitComment(content)) editor.value?.reset();
  busy.value = false;
}
</script>

<template>
  <div v-if="topic" class="simple-topic">
    <div class="s-topic-head">
      <h2 :class="{ 's-hidden-topic': topic.isHidden }">{{ title }}</h2>
      <div v-if="store.user.isAdmin" class="s-admin">
        <button class="s-button" @click="page.moderate({ isPinned: !topic.isPinned })">
          {{ topic.isPinned ? t("admin.unpin") : t("admin.pin") }}
        </button>
        <button class="s-button" @click="page.moderate({ isClosed: !topic.isClosed })">
          {{ topic.isClosed ? t("admin.unclose") : t("admin.close") }}
        </button>
        <button class="s-button" @click="page.moderate({ isSuspended: !topic.isSuspended })">
          {{ topic.isSuspended ? t("admin.unsuspend") : t("admin.suspend") }}
        </button>
        <button class="s-button" @click="page.moderate({ isHidden: !topic.isHidden })">
          {{ topic.isHidden ? t("admin.unhide") : t("admin.hide") }}
        </button>
      </div>
    </div>
    <article v-for="(comment, index) in comments" :key="comment.id" class="s-card s-comment">
      <header class="s-comment-head">
        <a :href="userUrl(comment.authorName)">{{ comment.authorName }}</a>
        <span class="s-muted">{{ commentDate(comment) }}</span>
        <span class="s-comment-actions">
          <button class="s-link" @click="page.quote(comment)">{{ t("comment.quote") }}</button>
          <template v-if="store.user.isAdmin">
            <button v-if="comment.isHidden" class="s-link" @click="page.unhideComment(index)">
              {{ t("comment.unhide") }}
            </button>
            <button v-if="comment.isHidden" class="s-link" @click="page.showHiddenComment(index)">
              {{ t("comment.showHidden") }}
            </button>
            <button v-else class="s-link" @click="page.hideComment(index)">{{ t("comment.hide") }}</button>
          </template>
        </span>
      </header>
      <MarkdownViewer v-if="comment.content" :content="comment.content" />
      <p v-else class="s-muted">{{ t("comment.hidden") }}</p>
    </article>
    <div ref="sentinel" class="s-sentinel s-muted">{{ loading ? "…" : "" }}</div>
    <p v-if="writeBlockReason" class="s-muted">{{ writeBlockReason }}</p>
    <div v-else class="s-card s-compose">
      <strong>{{ t("topic.newComment") }}</strong>
      <MarkdownEditor ref="editor" height="220px" />
      <p v-if="!store.user.isLoggedIn" class="s-muted">{{ t("topic.anonymousWarning") }}</p>
      <button class="s-button primary submit-button" :disabled="busy" @click="submit">{{ t("common.submit") }}</button>
    </div>
  </div>
</template>

<style>
.simple-topic .s-topic-head {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
}
.simple-topic .s-topic-head h2.s-hidden-topic {
  text-decoration: line-through;
  opacity: 0.6;
}
.simple-topic .s-topic-head h2 {
  margin: 0 0 0.6rem;
  font-size: 1.25rem;
}
.simple-topic .s-admin {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
}
.simple-topic .s-comment {
  padding: 0.6rem 0.9rem;
  margin-bottom: 0.7rem;
}
.simple-topic .s-comment-head {
  display: flex;
  gap: 0.6rem;
  align-items: baseline;
  border-bottom: 1px solid var(--border);
  padding-bottom: 0.3rem;
  margin-bottom: 0.4rem;
}
.simple-topic .s-comment-actions {
  margin-left: auto;
  display: flex;
  gap: 0.5rem;
}
.simple-topic .s-link {
  border: 0;
  background: none;
  color: var(--primary);
  cursor: pointer;
  padding: 0;
  font-size: 0.85rem;
}
.simple-topic .s-compose {
  display: grid;
  gap: 0.6rem;
  padding: 0.8rem;
}
.simple-topic .s-compose .s-button {
  justify-self: end;
}
</style>
