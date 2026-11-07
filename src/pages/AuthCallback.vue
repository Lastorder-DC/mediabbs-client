<script setup lang="ts">
// OAuth callback (`/auth?code=...&state=...`), shared by all skins.
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { useHead } from "@unhead/vue";
import { getToken, takeLoginState } from "@/auth";
import { useAppStore } from "@/stores/app";

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const store = useAppStore();
const message = ref(t("login.inProgress"));
useHead({ title: () => t("login.title") });

onMounted(async () => {
  const { code, state } = route.query;
  // Only a login this tab started (see startLoginProcess).
  const returnTo = takeLoginState(state);
  if (typeof code !== "string" || returnTo === null) {
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
  const target = returnTo.startsWith("/") && !returnTo.startsWith("//") && !returnTo.includes("\\");
  router.replace(target ? returnTo : "/");
});
</script>

<template>
  <div class="page-auth">{{ message }}</div>
</template>
