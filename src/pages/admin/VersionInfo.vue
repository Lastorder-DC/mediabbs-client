<script setup lang="ts">
// Running versions: "0.3.0-1a2b3c4" (commit), or "0.3.0" for release builds.
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { errorMessage, getBackendVersion } from "@/api";

const { t } = useI18n();
const frontend = __APP_VERSION__;
const backend = ref<string | null>(null);
const error = ref("");

onMounted(async () => {
  try {
    backend.value = await getBackendVersion();
  } catch (e) {
    error.value = errorMessage(e);
  }
});
</script>

<template>
  <div class="mb-version">
    <dl class="mb-version-list">
      <dt>{{ t("admin.versionInfo.backend") }}</dt>
      <dd>
        <code v-if="backend" class="mb-version-backend">{{ backend }}</code>
        <span v-else-if="!error">{{ t("admin.versionInfo.loading") }}</span>
        <span v-else>-</span>
      </dd>
      <dt>{{ t("admin.versionInfo.frontend") }}</dt>
      <dd><code class="mb-version-frontend">{{ frontend }}</code></dd>
    </dl>
    <p v-if="error" class="mb-admin-message error" role="status">{{ error }}</p>
  </div>
</template>

<style>
.mb-admin .mb-version-list {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 0.5rem 1.5rem;
  margin: 1rem 0;
}
.mb-admin .mb-version-list dt {
  font-weight: 600;
}
.mb-admin .mb-version-list dd {
  margin: 0;
}
</style>
