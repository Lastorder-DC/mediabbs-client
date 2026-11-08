<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { useHead } from "@unhead/vue";
import { useTopic } from "@/composables/useTopic";
import { useAppStore } from "@/stores/app";
import CommentCard from "../CommentCard.vue";

const { t } = useI18n();
const store = useAppStore();
const page = useTopic();
const { topic, comments, sentinel, loading, writeBlockReason, title, topicPath } = page;
useHead({ title: () => (title.value ? `${title.value} - ${store.board.displayName}` : store.board.displayName) });
</script>

<template>
  <div v-if="topic" class="page-topic">
    <div class="topic-heading box">
      <RouterLink :to="topicPath">
        <h3 class="title topic-title" :class="{ 'is-hidden-topic': topic.isHidden }">{{ title }}</h3>
      </RouterLink>
      <b-dropdown v-if="store.user.isAdmin" class="admin-tools" position="is-bottom-left">
        <template #trigger>
          <button class="button is-small">{{ t("admin.menu") }}</button>
        </template>
        <b-dropdown-item @click="page.moderate({ isHidden: !topic.isHidden })">
          {{ topic.isHidden ? t("admin.unhide") : t("admin.hide") }}
        </b-dropdown-item>
        <b-dropdown-item @click="page.moderate({ isSuspended: !topic.isSuspended })">
          {{ topic.isSuspended ? t("admin.unsuspend") : t("admin.suspend") }}
        </b-dropdown-item>
        <b-dropdown-item @click="page.moderate({ isClosed: !topic.isClosed })">
          {{ topic.isClosed ? t("admin.unclose") : t("admin.close") }}
        </b-dropdown-item>
        <b-dropdown-item @click="page.moderate({ isPinned: !topic.isPinned })">
          {{ topic.isPinned ? t("admin.unpin") : t("admin.pin") }}
        </b-dropdown-item>
      </b-dropdown>
    </div>

    <CommentCard
      v-for="(comment, index) in comments"
      :key="comment.id"
      :comment="comment"
      @quote="page.quote(comment)"
      @hide="page.hideComment(index)"
      @unhide="page.unhideComment(index)"
      @show-hidden="page.showHiddenComment(index)"
    />
    <div ref="sentinel" class="list-sentinel"><span v-if="loading" class="loader-dots" /></div>
    <hr />
    <p v-if="writeBlockReason">{{ writeBlockReason }}</p>
    <button v-else class="button is-fullwidth new-comment-button" @click="store.openEditor()">
      <b-icon icon="edit" />
      <span>{{ t("topic.newComment") }}</span>
    </button>
  </div>
</template>

<style>
.page-topic .topic-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 2rem;
}
.page-topic .topic-title.is-hidden-topic {
  text-decoration: line-through;
  opacity: 0.6;
}
.page-topic .topic-title {
  font-size: 1.5rem;
  margin-bottom: 0;
}
.page-topic .new-comment-button:hover {
  background-color: var(--bulma-primary);
  color: #fff;
}
</style>
