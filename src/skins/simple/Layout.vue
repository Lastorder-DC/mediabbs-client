<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useHead } from "@unhead/vue";
import { useAppStore } from "@/stores/app";
import { useSession } from "@/composables/useSession";
import { useWikiSearch } from "@/composables/useWikiSearch";
import { availableLocales, currentLocale, setLocale } from "@/i18n";
import type { LocaleCode } from "@/i18n";
import { availableSkins, currentSkinName, setSkin } from "@/skins";
import { useMenu } from "@/composables/useMenu";
import { boardIconClass } from "@/menu";
import SimpleMenu from "./SimpleMenu.vue";
import { defaultMenu } from "./menu";

const { t } = useI18n();
const store = useAppStore();
const session = useSession();
const { user } = session;
const menu = useMenu(defaultMenu);
const search = useWikiSearch();
const board = computed(() => store.board);
const locales = availableLocales();
const skins = availableSkins();
useHead({
  titleTemplate: (title?: string) =>
    title && title !== session.siteName ? `${title} - ${session.siteName}` : session.siteName,
});
</script>

<template>
  <div class="simple-app">
    <header class="s-header">
      <div class="s-wrap s-header-row">
        <RouterLink to="/" class="s-brand">{{ session.siteName }}</RouterLink>
        <SimpleMenu class="s-boards" :entries="menu" />
        <form class="s-search" @submit.prevent="search.go()">
          <input
            v-model="search.query.value"
            class="s-input"
            type="search"
            list="s-search-suggestions"
            :placeholder="t('nav.search')"
            @input="search.onInput"
          />
          <datalist id="s-search-suggestions">
            <option v-for="s in search.suggestions.value" :key="s" :value="s" />
          </datalist>
        </form>
        <div v-if="user.isInitialized" class="s-user">
          <button v-if="!user.isLoggedIn" class="s-button login-button" @click="session.login">
            {{ t("nav.login") }}
          </button>
          <template v-else>
            <RouterLink v-if="user.isAdmin" to="/admin">{{ t("admin.page") }}</RouterLink>
            <a :href="session.userPage(user.username)">{{ user.username }}</a>
            <button class="s-button" @click="session.logout">{{ t("nav.logout") }}</button>
          </template>
        </div>
      </div>
    </header>
    <main class="s-wrap s-main">
      <div class="s-title-row">
        <h1 v-if="board.name">
          <RouterLink :to="`/${board.name}`">
            <i v-if="board.icon" :class="boardIconClass(board.icon)" class="s-title-icon" aria-hidden="true" />{{ board.displayName }}
          </RouterLink>
        </h1>
      </div>
      <div v-if="store.error" class="s-card s-error">{{ store.error }}</div>
      <RouterView v-else />
      <div v-if="store.modalError" class="s-toast" role="alert" @click="store.showModalError(null)">
        {{ store.modalError }}
      </div>
    </main>
    <footer class="s-wrap s-footer s-muted">
      <span>
        <a href="https://github.com/Lastorder-DC/mediabbs">{{ t("footer.poweredBy", { name: "MediaBBS" }) }}</a>
      </span>
      <span class="s-prefs">
        <select
          v-if="locales.length > 1"
          :aria-label="t('common.language')"
          :value="currentLocale()"
          @change="setLocale(($event.target as HTMLSelectElement).value as LocaleCode)"
        >
          <option v-for="l in locales" :key="l.code" :value="l.code">{{ l.name }}</option>
        </select>
        <select
          v-if="skins.length > 1"
          :aria-label="t('common.skin')"
          :value="currentSkinName()"
          @change="setSkin(($event.target as HTMLSelectElement).value)"
        >
          <option v-for="s in skins" :key="s.name" :value="s.name">{{ s.label }}</option>
        </select>
      </span>
    </footer>
  </div>
</template>

<style>
.simple-app .s-wrap {
  max-width: 860px;
  margin: 0 auto;
  padding: 0 1rem;
}
.simple-app .s-header {
  background: var(--surface);
  border-bottom: 3px solid var(--primary);
}
.simple-app .s-header-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem 1rem;
  padding-top: 0.6rem;
  padding-bottom: 0.6rem;
}
.simple-app .s-brand {
  font-weight: 700;
  font-size: 1.1rem;
  color: var(--text);
}
.simple-app .s-boards {
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem;
  flex: 1;
}
.simple-app .s-search {
  width: 12rem;
}
.simple-app .s-user {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.simple-app .s-main {
  padding-top: 1rem;
  padding-bottom: 2rem;
}
.simple-app .s-title-row h1 {
  margin: 0 0 0.8rem;
  font-size: 1.4rem;
}
.simple-app .s-title-icon {
  margin-right: 0.45rem;
}
.simple-app .s-title-row h1 a {
  color: var(--text);
}
.simple-app .s-error {
  padding: 1rem;
}
.simple-app .s-toast {
  position: fixed;
  left: 50%;
  bottom: 1.5rem;
  transform: translateX(-50%);
  background: #24292f;
  color: #fff;
  padding: 0.7rem 1.2rem;
  border-radius: 8px;
  cursor: pointer;
  max-width: 90vw;
}
.simple-app .s-footer {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding-bottom: 2rem;
}
.simple-app .s-prefs {
  display: flex;
  gap: 0.4rem;
}
</style>
