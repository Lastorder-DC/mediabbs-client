<script setup lang="ts">
import { computed, defineAsyncComponent } from "vue";
import { useHead } from "@unhead/vue";
import { useAppStore } from "@/stores/app";
import { boardSiteName } from "@/wiki";
import NavBar from "./NavBar.vue";
import LiveRecent from "./LiveRecent.vue";
import SiteNotice from "./SiteNotice.vue";
import Tools from "./Tools.vue";
import FooterContent from "./FooterContent.vue";
import ErrorModal from "./ErrorModal.vue";

const EditorModal = defineAsyncComponent(() => import("./EditorModal.vue"));
const store = useAppStore();
const siteName = boardSiteName();
useHead({
  titleTemplate: (title?: string) => (title && title !== siteName ? `${title} - ${siteName}` : siteName),
});
const board = computed(() => store.board);
</script>

<template>
  <div class="liberty-app">
    <NavBar />
    <div class="main-container container">
      <div class="columns main-columns">
        <div class="column main-column">
          <article class="box p-0 main-box">
            <header class="main-header">
              <SiteNotice />
              <div class="title-wrapper-row">
                <RouterLink v-if="board.name" :to="`/${board.name}`">
                  <h1 class="title">{{ board.displayName }}</h1>
                </RouterLink>
                <Tools />
              </div>
            </header>
            <section class="main-content">
              <div v-if="store.error" class="page-error">{{ store.error }}</div>
              <RouterView v-else />
            </section>
            <FooterContent />
          </article>
        </div>
        <div class="column is-narrow is-hidden-touch">
          <LiveRecent />
        </div>
      </div>
    </div>
    <EditorModal v-if="store.editor.open" />
    <ErrorModal />
  </div>
</template>

<style>
.liberty-app .main-container {
  margin-top: calc(var(--liberty-navbar-height) + 1rem);
  margin-bottom: 1rem;
}
@media screen and (min-width: 1408px) {
  .liberty-app .container:not(.is-max-desktop):not(.is-max-widescreen) {
    max-width: 1200px;
  }
}
@media screen and (max-width: 1023px) {
  .liberty-app .main-container {
    margin-top: calc(var(--liberty-navbar-height) * 2 + 0.333rem);
  }
  .liberty-app .main-columns {
    margin-left: 0;
    margin-right: 0;
  }
  .liberty-app .main-column {
    padding: 0;
  }
}
.liberty-app .main-box {
  overflow: visible;
}
.liberty-app .main-header {
  padding: var(--liberty-box-padding);
  border-top-left-radius: var(--bulma-radius-large);
  border-top-right-radius: var(--bulma-radius-large);
  border: 1px solid var(--liberty-border);
  background-color: var(--liberty-background);
}
.liberty-app .title-wrapper-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.liberty-app .main-content {
  word-wrap: break-word;
  padding: var(--liberty-box-padding);
  border-left: 1px solid var(--liberty-border);
  border-right: 1px solid var(--liberty-border);
}
@media screen and (max-width: 1023px) {
  .liberty-app .main-header,
  .liberty-app .main-content {
    padding: calc(var(--liberty-box-padding) / 2);
  }
}
</style>
