<script setup lang="ts">
// Search box for a board page: opens /search for the current board.
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { useAppStore } from "@/stores/app";

defineProps<{ inputClass?: string; buttonClass?: string }>();
const { t } = useI18n();
const store = useAppStore();
const router = useRouter();
const q = ref("");

function submit(): void {
  const text = q.value.trim();
  if (!text) return;
  const query: Record<string, string> = { q: text };
  if (store.board.id) query.board = String(store.board.id);
  router.push({ path: "/search", query });
  q.value = "";
}
</script>

<template>
  <form class="board-search" role="search" @submit.prevent="submit">
    <input
      v-model="q"
      type="search"
      name="q"
      maxlength="100"
      :class="inputClass"
      :placeholder="t('search.boardPlaceholder')"
      :aria-label="t('search.boardPlaceholder')"
    />
    <button
      type="submit"
      :class="buttonClass"
      :title="t('search.submit')"
      :aria-label="t('search.submit')"
    >
      <slot>{{ t("search.submit") }}</slot>
    </button>
  </form>
</template>
