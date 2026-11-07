<script setup lang="ts">
// Board administration: boards (settings, order), navigation menus and the log.
// Skin-independent: plain markup with its own styles (admin.css).
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { useHead } from "@unhead/vue";
import { useAppStore } from "@/stores/app";
import { useSession } from "@/composables/useSession";
import BoardAdmin from "./BoardAdmin.vue";
import MenuAdmin from "./MenuAdmin.vue";
import LogAdmin from "./LogAdmin.vue";
import "./admin.css";

const { t } = useI18n();
const store = useAppStore();
const session = useSession();
const TABS = ["boards", "menus", "logs"] as const;
const tab = ref<(typeof TABS)[number]>("boards");
useHead({ title: () => t("admin.page") });
</script>

<template>
  <div class="mb-admin">
    <h2 class="mb-admin-title">{{ t("admin.page") }}</h2>
    <template v-if="store.user.isInitialized">
      <p v-if="!store.user.isLoggedIn" class="mb-admin-note">
        {{ t("admin.loginFirst") }}
        <button type="button" class="mb-btn" @click="session.login">{{ t("nav.login") }}</button>
      </p>
      <p v-else-if="!store.user.isAdmin" class="mb-admin-note">{{ t("admin.notAdmin") }}</p>
      <template v-else>
        <div class="mb-tabs" role="tablist">
          <button
            v-for="name in TABS"
            :key="name"
            type="button"
            role="tab"
            class="mb-tab"
            :class="{ active: tab === name }"
            :aria-selected="tab === name"
            @click="tab = name"
          >
            {{ t(`admin.${name}`) }}
          </button>
        </div>
        <BoardAdmin v-if="tab === 'boards'" />
        <MenuAdmin v-else-if="tab === 'menus'" />
        <LogAdmin v-else />
      </template>
    </template>
  </div>
</template>
