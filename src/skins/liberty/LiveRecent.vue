<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { useLiveRecent } from "@/composables/useLiveRecent";

const { t } = useI18n();
const { enabled, mode, items, moreUrl, setMode } = useLiveRecent();
</script>

<template>
  <div v-if="enabled" class="live-recent">
    <div class="live-recent-header">
      <a
        class="live-recent-tab"
        :class="{ active: mode === 'document' }"
        role="button"
        @click="setMode('document')"
      >
        {{ t("liveRecent.recentChanges") }}
      </a>
      <a
        class="live-recent-tab"
        :class="{ active: mode === 'discussion' }"
        role="button"
        @click="setMode('discussion')"
      >
        {{ t("liveRecent.recentDiscussions") }}
      </a>
    </div>
    <ul class="live-recent-content">
      <li v-for="item in items" :key="item.key">
        <a class="recent-item" :href="item.url" :title="item.title">
          [{{ item.time }}] <span v-if="item.isNew" class="new">[{{ t("liveRecent.new") }}]</span>
          {{ item.title }}
        </a>
      </li>
    </ul>
    <div class="live-recent-footer">
      <a class="more-link" :href="moreUrl">{{ t("common.more") }}</a>
    </div>
  </div>
</template>

<style>
/* Same structure and sizes as the Liberty MediaWiki skin's live-recent box. */
.live-recent {
  width: 15rem;
}
.live-recent .live-recent-header {
  display: flex;
}
.live-recent .live-recent-tab {
  flex: 0 0 7.5rem;
  text-align: center;
  padding: 0.6rem 0;
  color: #6e7478;
  background-color: var(--liberty-background);
  border: 1px solid var(--liberty-border);
  border-top-left-radius: var(--liberty-radius);
}
.live-recent .live-recent-tab + .live-recent-tab {
  border-left: 0;
  border-top-left-radius: 0;
  border-top-right-radius: var(--liberty-radius);
}
.live-recent .live-recent-tab.active,
.live-recent .live-recent-tab:hover {
  color: var(--liberty-text);
  background-color: #fff;
  transition: 0.3s;
}
.live-recent .live-recent-tab.active {
  border-bottom-color: #fff;
  box-shadow: inset 0 -2px 0 var(--bulma-primary);
}
.live-recent .live-recent-content {
  list-style: none;
  margin: 0;
  background-color: #fff;
  border: 1px solid var(--liberty-border);
  border-top: 0;
}
.live-recent .live-recent-content li {
  border-bottom: 1px solid var(--liberty-border);
  padding: 0.2rem 0.6rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.live-recent .live-recent-content li:last-child {
  border-bottom: none;
}
.live-recent .recent-item {
  font-size: 0.8rem;
  color: var(--liberty-text);
}
.live-recent .recent-item .new {
  color: var(--liberty-new-link);
}
.live-recent .live-recent-footer {
  text-align: right;
  padding: 0.4rem 0.6rem;
  background-color: var(--liberty-background);
  border: 1px solid var(--liberty-border);
  border-top: 0;
  border-bottom-left-radius: var(--liberty-radius);
  border-bottom-right-radius: var(--liberty-radius);
}
.live-recent .live-recent-footer .more-link {
  display: inline-block;
  padding: 0.4rem;
  font-size: 0.8rem;
  line-height: 1;
  color: #fff;
  background-color: var(--bulma-primary);
  border-radius: 0.25em;
}
.live-recent .live-recent-footer .more-link:hover {
  background-color: var(--liberty-primary-dark);
  transition: 0.3s;
}
</style>
