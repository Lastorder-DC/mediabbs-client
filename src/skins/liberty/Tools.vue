<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useAppStore } from "@/stores/app";
import BoardSearchForm from "@/components/BoardSearchForm.vue";

const { t } = useI18n();
const store = useAppStore();
const scrolled = ref(false);

function onScroll(): void {
  scrolled.value = window.scrollY > 300;
}
const scrollTo = (top: number) => window.scroll({ left: 0, top, behavior: "smooth" });
const scrollBottom = () => scrollTo(document.body.scrollHeight);

onMounted(() => document.addEventListener("scroll", onScroll, { passive: true }));
onBeforeUnmount(() => document.removeEventListener("scroll", onScroll));
</script>

<template>
  <div class="liberty-tools">
    <BoardSearchForm v-if="store.board.id" input-class="input is-small" button-class="button is-small">
      <b-icon icon="search" size="is-small" />
    </BoardSearchForm>
    <button v-if="store.canWrite" class="button write-button" @click="store.openEditor()">
      <b-icon icon="edit" />
      <span>{{ t("common.write") }}</span>
    </button>
    <nav class="scroll-tools" :class="{ 'with-write': store.canWrite && scrolled }">
      <button
        v-if="store.canWrite && scrolled"
        class="scroll-button write"
        :title="t('common.write')"
        @click="store.openEditor()"
      >
        <b-icon icon="edit" />
      </button>
      <button class="scroll-button" :title="t('common.scrollTop')" @click="scrollTo(0)">
        <b-icon icon="angle-up" />
      </button>
      <button
        class="scroll-button"
        :title="t('common.scrollBottom')"
        @click="scrollBottom"
      >
        <b-icon icon="angle-down" />
      </button>
    </nav>
  </div>
</template>

<style>
.liberty-tools {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 0.5rem;
}
.liberty-tools .board-search {
  display: flex;
}
.liberty-tools .board-search .input {
  width: 11rem;
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}
.liberty-tools .board-search .button {
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
  margin-left: -1px;
}
.liberty-tools .write-button:hover {
  background-color: var(--bulma-primary);
  color: #fff;
}
.liberty-tools .scroll-tools {
  position: fixed;
  right: 0;
  bottom: 0;
  z-index: 20;
  height: 40px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  overflow: hidden;
  border-radius: 5px 5px 0 0;
  background: var(--bulma-primary);
}
.liberty-tools .scroll-tools.with-write {
  grid-template-columns: 1fr 1fr 1fr;
}
.liberty-tools .scroll-button {
  width: 40px;
  height: 40px;
  font-size: 1.6rem;
  color: #fff;
  cursor: pointer;
  border: 0;
  background: var(--bulma-primary);
}
.liberty-tools .scroll-button.write {
  font-size: 1.1rem;
}
.liberty-tools .scroll-button:hover {
  background-color: var(--liberty-primary-dark);
  transition: 500ms;
}
</style>
