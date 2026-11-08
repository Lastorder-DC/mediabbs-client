<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { useHead } from "@unhead/vue";
import { useTopicList } from "@/composables/useTopicList";
import { contributionsUrl, userTalkUrl, userUrl } from "@/wiki";

const { t } = useI18n();
const list = useTopicList();
const { topics, board, sentinel, loading, done } = list;
useHead({ title: () => board.value.displayName });
</script>

<template>
  <div class="page-topic-list">
    <ul>
      <li v-for="topic in topics" :key="topic.id">
        <RouterLink :to="list.topicPath(topic)" class="topic-card card" :class="{ 'is-hidden-topic': topic.isHidden }">
          <div class="topic-card-header">
            <span class="topic-author">
              <a :href="userUrl(topic.authorName)" @click.stop>{{ topic.authorName }}</a>
              <span class="topic-author-link">
                (<a :href="userTalkUrl(topic.authorName)" @click.stop>{{ t("user.talk") }}</a> |
                <a :href="contributionsUrl(topic.authorName)" @click.stop>{{ t("user.contribs") }}</a>)
              </span>
            </span>
            <span class="topic-updated-at">{{ list.updatedText(topic) }}</span>
          </div>
          <div class="topic-card-body">
            <div class="topic-title-area">
              <span class="topic-title">{{ list.title(topic) }}</span>
              <span v-if="topic.commentCount > 1" class="topic-comment-count">[{{ topic.commentCount }}]</span>
            </div>
            <div class="topic-icons">
              <b-tooltip v-if="list.isUpdatedSinceVisit(topic)" :label="t('topic.updatedSinceVisit')">
                <b-icon icon="exclamation" />
              </b-tooltip>
              <b-tooltip v-if="topic.isHidden" :label="t('topic.hidden')">
                <b-icon icon="eye-slash" />
              </b-tooltip>
              <b-tooltip v-if="topic.isClosed" :label="t('topic.closed')">
                <b-icon icon="lock" />
              </b-tooltip>
              <b-tooltip v-else-if="topic.isSuspended" :label="t('topic.suspended')">
                <b-icon icon="lock" />
              </b-tooltip>
              <b-tooltip v-if="topic.isPinned" :label="t('topic.pinned')">
                <b-icon icon="thumbtack" />
              </b-tooltip>
            </div>
          </div>
        </RouterLink>
      </li>
    </ul>
    <div ref="sentinel" class="list-sentinel">
      <span v-if="loading" class="loader-dots" />
      <p v-else-if="done && !topics.length" class="has-text-grey">{{ t("topic.empty") }}</p>
    </div>
  </div>
</template>

<style>
.page-topic-list .topic-card {
  display: block;
  padding: 0.5rem 1rem;
  border: 1px solid var(--liberty-border);
  border-radius: 0.25rem;
  margin: 2px 2px 5px;
  box-shadow: none;
}
.page-topic-list .topic-card:hover {
  box-shadow: 0 0 3px 1px var(--bulma-primary);
}
.page-topic-list .topic-card-header,
.page-topic-list .topic-card-body {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
}
.page-topic-list .topic-card-body {
  color: #4a4a4a;
}
/* Hidden topics: only board administrators get them, to unhide them. */
.page-topic-list .topic-card.is-hidden-topic {
  background: #f0f0f0;
  opacity: 0.7;
}
.page-topic-list .is-hidden-topic .topic-title {
  text-decoration: line-through;
}
.page-topic-list .topic-comment-count {
  margin-left: 0.2rem;
  color: #777;
}
.page-topic-list .topic-updated-at {
  font-size: 0.8rem;
  text-align: right;
  color: #4a4a4a;
}
.page-topic-list .topic-author-link {
  font-size: 0.75rem;
  margin-left: 0.25rem;
}
.list-sentinel {
  min-height: 2rem;
  display: flex;
  justify-content: center;
  align-items: center;
}
.loader-dots {
  width: 2rem;
  height: 0.5rem;
  background:
    radial-gradient(circle, var(--bulma-primary) 40%, transparent 41%) 0 50% / 0.5rem 0.5rem repeat-x;
  animation: loader-dots 0.8s infinite linear;
}
@keyframes loader-dots {
  50% {
    opacity: 0.3;
  }
}
</style>
