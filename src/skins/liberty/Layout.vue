<script setup lang="ts">
import { computed, defineAsyncComponent } from "vue";
import { useHead } from "@unhead/vue";
import { useAppStore } from "@/stores/app";
import { boardSiteName } from "@/wiki";
import { boardIconClass } from "@/menu";
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
    <div class="main-container">
      <div class="main-column">
          <article class="main-box">
            <header class="main-header">
              <SiteNotice />
              <div class="title-wrapper-row">
                <RouterLink v-if="board.name" :to="`/${board.name}`">
                  <h1 class="title">
                    <i v-if="board.icon" :class="boardIconClass(board.icon)" class="board-title-icon" aria-hidden="true" />{{ board.displayName }}
                  </h1>
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
      <aside class="liberty-sidebar">
        <LiveRecent />
      </aside>
    </div>
    <EditorModal v-if="store.editor.open" />
    <ErrorModal />
  </div>
</template>

<style>
/* Layout of the Liberty MediaWiki skin: 1200px wide, 15rem sidebar, no shadows. */
.liberty-app .main-container {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  max-width: 1200px;
  margin: 3.33rem auto 0;
  padding-bottom: 1rem;
}
.liberty-app .main-column {
  flex: 1;
  min-width: 0;
}
.liberty-app .liberty-sidebar {
  flex: 0 0 15rem;
  width: 15rem;
}
.liberty-app .main-header {
  border: 1px solid var(--liberty-border);
  border-radius: var(--liberty-radius) var(--liberty-radius) 0 0;
  background-color: var(--liberty-background);
}
.liberty-app .board-title-icon {
  margin-right: 0.5rem;
}
.liberty-app .title-wrapper-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
}
.liberty-app .title-wrapper-row .title {
  color: #000;
  font-size: 2rem;
  font-weight: 700;
  line-height: 1.2;
}
.liberty-app .main-header .liberty-notice {
  margin: 1rem 1rem 0;
}
.liberty-app .main-content {
  word-wrap: break-word;
  padding: 1rem;
  line-height: 1.6rem;
  background-color: #fff;
  border-left: 1px solid var(--liberty-border);
  border-right: 1px solid var(--liberty-border);
}
@media screen and (max-width: 1023px) {
  .liberty-app .main-container {
    margin-top: 5.89rem;
    padding-bottom: 0.5rem;
  }
  .liberty-app .liberty-sidebar {
    display: none;
  }
  .liberty-app .title-wrapper-row,
  .liberty-app .main-content {
    padding: 0.5rem;
  }
  .liberty-app .main-header .liberty-notice {
    margin: 0.5rem 0.5rem 0;
  }
}
</style>
