<script setup lang="ts">
// Board administration: boards (settings, order) and navigation menus.
// Skin-independent: plain markup with its own styles (admin.css).
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { useHead } from "@unhead/vue";
import { useAppStore } from "@/stores/app";
import { useSession } from "@/composables/useSession";
import BoardAdmin from "./BoardAdmin.vue";
import MenuAdmin from "./MenuAdmin.vue";
import "./admin.css";

const { t } = useI18n();
const store = useAppStore();
const session = useSession();
const tab = ref<"boards" | "menus">("boards");
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
            type="button"
            role="tab"
            class="mb-tab"
            :class="{ active: tab === 'boards' }"
            :aria-selected="tab === 'boards'"
            @click="tab = 'boards'"
          >
            {{ t("admin.boards") }}
          </button>
          <button
            type="button"
            role="tab"
            class="mb-tab"
            :class="{ active: tab === 'menus' }"
            :aria-selected="tab === 'menus'"
            @click="tab = 'menus'"
          >
            {{ t("admin.menus") }}
          </button>
        </div>
        <BoardAdmin v-if="tab === 'boards'" />
        <MenuAdmin v-else />
      </template>
    </template>
  </div>
</template>
