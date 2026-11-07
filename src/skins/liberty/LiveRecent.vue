<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { useLiveRecent } from "@/composables/useLiveRecent";

const { t } = useI18n();
const { enabled, mode, items, moreUrl, setMode } = useLiveRecent();
</script>

<template>
  <nav v-if="enabled" class="panel live-recent">
    <div class="live-recent-header tabs is-toggle is-fullwidth mb-0">
      <ul>
        <li>
          <a :class="{ 'is-active': mode === 'document' }" role="button" @click="setMode('document')">
            {{ t("liveRecent.recentChanges") }}
          </a>
        </li>
        <li>
          <a
            :class="{ 'is-active': mode === 'discussion' }"
            role="button"
            @click="setMode('discussion')"
          >
            {{ t("liveRecent.recentDiscussions") }}
          </a>
        </li>
      </ul>
    </div>
    <div class="live-recent-content">
      <a v-for="item in items" :key="item.key" class="panel-block" :href="item.url" :title="item.title">
        <span class="live-recent-time">[{{ item.time }}]</span>
        <span v-if="item.isNew" class="live-recent-tag">[{{ t("liveRecent.new") }}]</span>
        <span class="live-recent-title">{{ item.title }}</span>
      </a>
    </div>
    <div class="live-recent-footer panel-block">
      <a class="button is-primary is-small" :href="moreUrl">{{ t("common.more") }}</a>
    </div>
  </nav>
</template>

<style>
.live-recent {
  width: 15rem;
  background-color: #fff;
  overflow: hidden;
}
.live-recent .live-recent-header {
  background-color: var(--liberty-background);
}
.live-recent .live-recent-header a {
  padding: 0.6rem;
  border-radius: 0 !important;
  border-width: 0 0 2px 0 !important;
  border-color: transparent !important;
  background: var(--liberty-background);
}
.live-recent .live-recent-header a.is-active {
  background-color: #fff;
  color: var(--bulma-text-strong);
  border-bottom-color: var(--bulma-primary) !important;
}
.live-recent .live-recent-content {
  font-size: 0.8rem;
}
.live-recent .panel-block {
  color: var(--bulma-text);
}
.live-recent .live-recent-tag {
  color: var(--liberty-new-link);
}
.live-recent .live-recent-time {
  flex-shrink: 0;
  margin-right: 0.2em;
}
.live-recent .live-recent-title {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.live-recent .live-recent-footer {
  justify-content: flex-end;
  background-color: var(--liberty-background);
}
</style>
