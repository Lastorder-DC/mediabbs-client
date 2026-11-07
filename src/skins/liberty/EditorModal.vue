<script setup lang="ts">
// New topic (topic list page) or new comment (topic page) editor in a modal.
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { errorMessage, postTopic } from "@/api";
import { useAppStore } from "@/stores/app";
import { commentSubmitter } from "@/composables/commentSubmitter";
import MarkdownEditor from "@/components/MarkdownEditor.vue";

const { t } = useI18n();
const store = useAppStore();
const route = useRoute();
const router = useRouter();
const isComment = computed(() => route.name === "Topic");
const title = ref("");
const busy = ref(false);
const editor = ref<InstanceType<typeof MarkdownEditor> | null>(null);

// Quoting while the editor is open replaces its content.
watch(
  () => store.editor.revision,
  () => editor.value?.setMarkdown(store.editor.initialValue),
);

async function submit(): Promise<void> {
  const content = editor.value?.getMarkdown().trim() ?? "";
  if (!content || busy.value) return;
  busy.value = true;
  try {
    if (isComment.value) {
      if (await commentSubmitter.value?.(content)) store.closeEditor();
    } else {
      if (!title.value.trim()) return;
      const topic = await postTopic(store.board.id, title.value.trim(), content);
      store.closeEditor();
      router.push(`/${store.board.name}/${topic.id}`);
    }
  } catch (error) {
    store.showModalError(errorMessage(error));
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <div class="modal is-active editor-modal">
    <div class="modal-background" />
    <div class="modal-card">
      <header class="modal-card-head">
        <p class="modal-card-title">{{ isComment ? t("topic.newComment") : t("topic.newTopic") }}</p>
        <button class="delete" :aria-label="t('common.close')" @click="store.closeEditor()" />
      </header>
      <section class="modal-card-body">
        <div v-if="!isComment" class="field">
          <div class="control">
            <input
              v-model="title"
              class="input"
              type="text"
              maxlength="100"
              :placeholder="t('topic.titlePlaceholder')"
            />
          </div>
        </div>
        <MarkdownEditor ref="editor" :initial-value="store.editor.initialValue" />
      </section>
      <footer class="modal-card-foot">
        <span v-if="!store.user.isLoggedIn" class="anonymous-warning">{{ t("topic.anonymousWarning") }}</span>
        <button class="button is-link submit-button" :class="{ 'is-loading': busy }" @click="submit">
          {{ t("common.submit") }}
        </button>
      </footer>
    </div>
  </div>
</template>

<style>
.editor-modal .modal-card {
  width: min(960px, 95vw);
}
.editor-modal .modal-card-foot {
  justify-content: space-between;
  gap: 0.5rem;
}
.editor-modal .submit-button {
  margin-left: auto;
}
</style>
