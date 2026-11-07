<script setup lang="ts">
// OAuth callback (`/auth?code=...&state=<return path>`), shared by all skins.
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { useHead } from "@unhead/vue";
import { getToken } from "@/auth";
import { useAppStore } from "@/stores/app";

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const store = useAppStore();
const message = ref(t("login.inProgress"));
useHead({ title: () => t("login.title") });

onMounted(async () => {
  const { code, state } = route.query;
  if (typeof code !== "string") {
    message.value = t("login.failed");
    return;
  }
  try {
    await getToken(code);
  } catch {
    message.value = t("login.failed");
    return;
  }
  await store.fetchUserInfo();
  // Only follow same-site paths.
  const target = typeof state === "string" && state.startsWith("/") && !state.startsWith("//");
  router.replace(target ? (state as string) : "/");
});
</script>

<template>
  <div class="page-auth">{{ message }}</div>
</template>
