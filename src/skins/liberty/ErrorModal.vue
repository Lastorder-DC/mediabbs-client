<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { useAppStore } from "@/stores/app";

const { t } = useI18n();
const store = useAppStore();
</script>

<template>
  <div class="modal error-modal" :class="{ 'is-active': !!store.modalError }">
    <div class="modal-background" @click="store.showModalError(null)" />
    <div class="modal-content error-modal-content">
      <span>{{ store.modalError }}</span>
    </div>
    <button class="modal-close is-large" :aria-label="t('common.close')" @click="store.showModalError(null)" />
  </div>
</template>

<style>
.error-modal-content {
  width: min(50vw, 640px);
  padding: 3rem;
  text-align: center;
  background-color: var(--liberty-background);
  border-radius: 1rem;
}
@media screen and (max-width: 768px) {
  .error-modal-content {
    width: 90vw;
  }
}
</style>
