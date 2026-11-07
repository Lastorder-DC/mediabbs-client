<script setup lang="ts">
import { useI18n } from "vue-i18n";
import type { Comment } from "@/api";
import { useAppStore } from "@/stores/app";
import { commentDate } from "@/composables/useTopic";
import { blockUrl, contributionsUrl, userTalkUrl, userUrl } from "@/wiki";
import MarkdownViewer from "@/components/MarkdownViewer.vue";

defineProps<{ comment: Comment }>();
const emit = defineEmits<{ quote: []; hide: []; unhide: []; showHidden: [] }>();
const { t } = useI18n();
const store = useAppStore();
</script>

<template>
  <div class="card topic-comment-card">
    <header class="card-header">
      <div class="topic-comment-info">
        <a :href="userUrl(comment.authorName)" class="topic-comment-author">{{ comment.authorName }}</a>
        <span class="comment-author-link">
          (<a :href="userTalkUrl(comment.authorName)">{{ t("user.talk") }}</a> |
          <a :href="contributionsUrl(comment.authorName)">{{ t("user.contribs") }}</a>)
        </span>
      </div>
      <div class="topic-comment-tools">
        <span class="topic-comment-date">{{ commentDate(comment) }}</span>
        <b-dropdown position="is-bottom-left">
          <template #trigger>
            <button class="button is-small"><b-icon icon="angle-down" /></button>
          </template>
          <b-dropdown-item @click="emit('quote')">{{ t("comment.quote") }}</b-dropdown-item>
          <template v-if="store.user.isAdmin">
            <hr class="dropdown-divider" />
            <template v-if="comment.isHidden">
              <b-dropdown-item @click="emit('unhide')">{{ t("comment.unhide") }}</b-dropdown-item>
              <b-dropdown-item @click="emit('showHidden')">{{ t("comment.showHidden") }}</b-dropdown-item>
            </template>
            <b-dropdown-item v-else @click="emit('hide')">{{ t("comment.hide") }}</b-dropdown-item>
            <b-dropdown-item has-link>
              <a :href="blockUrl(comment.authorName)">{{ t("comment.block") }}</a>
            </b-dropdown-item>
          </template>
        </b-dropdown>
      </div>
    </header>
    <div class="card-comment" :class="{ 'hidden-comment': comment.isHidden }">
      <MarkdownViewer v-if="comment.content" :content="comment.content" />
      <p v-else>{{ t("comment.hidden") }}</p>
    </div>
  </div>
</template>

<style>
.topic-comment-card {
  margin-bottom: 1rem;
}
.topic-comment-card .card-header {
  background-color: var(--liberty-background);
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: none;
}
.topic-comment-card .topic-comment-info,
.topic-comment-card .topic-comment-tools {
  display: flex;
  align-items: center;
}
.topic-comment-card .comment-author-link {
  margin-left: 0.5rem;
  font-size: 0.8rem;
}
.topic-comment-card .topic-comment-date {
  margin-right: 1rem;
  word-break: keep-all;
}
.topic-comment-card .card-comment {
  padding: 1rem;
}
.topic-comment-card .hidden-comment {
  background-color: var(--bulma-light);
}
@media screen and (max-width: 768px) {
  .topic-comment-card .topic-comment-date {
    margin-right: 0.2rem;
  }
}
</style>
