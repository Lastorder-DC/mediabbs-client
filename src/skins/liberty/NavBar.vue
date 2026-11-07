<script setup lang="ts">
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { useSession } from "@/composables/useSession";
import { useWikiSearch } from "@/composables/useWikiSearch";
import GravatarImage from "@/components/GravatarImage.vue";
import defaultLogo from "@/assets/logo.svg";

const { t } = useI18n();
const session = useSession();
const { user, boards, navLinks, special } = session;
const search = useWikiSearch();
const logoFailed = ref(false);
</script>

<template>
  <nav class="liberty-navbar navbar is-primary">
    <div class="container">
      <div class="navbar-menu is-active">
        <div class="navbar-start">
          <a class="navbar-item brand" :href="session.wikiHome">
            <img
              alt=""
              :src="(!logoFailed && session.wikiLogo) || defaultLogo"
              @error="logoFailed = true"
            />
            <span class="navbar-text">{{ session.wikiName }}</span>
          </a>
          <a class="navbar-item" :href="special('RecentChanges')" :title="t('nav.recentChanges')">
            <b-icon icon="sync" />
            <span class="navbar-text">{{ t("nav.recentChanges") }}</span>
          </a>
          <a class="navbar-item" :href="special('Random')" :title="t('nav.random')">
            <b-icon icon="random" />
            <span class="navbar-text">{{ t("nav.random") }}</span>
          </a>
          <b-dropdown v-if="boards.length">
            <template #trigger>
              <a class="navbar-item" role="button" :title="t('nav.boards')">
                <b-icon icon="comments" />
                <span class="navbar-text">{{ t("nav.boards") }}</span>
                <b-icon class="navbar-caret" icon="caret-down" />
              </a>
            </template>
            <b-dropdown-item v-for="b in boards" :key="b.id" has-link>
              <RouterLink :to="`/${b.name}`">{{ b.displayName }}</RouterLink>
            </b-dropdown-item>
          </b-dropdown>
          <b-dropdown>
            <template #trigger>
              <a class="navbar-item" role="button" :title="t('nav.tools')">
                <b-icon icon="wrench" />
                <span class="navbar-text">{{ t("nav.tools") }}</span>
                <b-icon class="navbar-caret" icon="caret-down" />
              </a>
            </template>
            <b-dropdown-item has-link>
              <a :href="special('Upload')">{{ t("nav.upload") }}</a>
            </b-dropdown-item>
            <b-dropdown-item has-link>
              <a :href="special('SpecialPages')">{{ t("nav.specialPages") }}</a>
            </b-dropdown-item>
          </b-dropdown>
          <template v-for="(link, i) in navLinks" :key="`nav-${i}`">
            <b-dropdown v-if="link.children && link.children.length">
              <template #trigger>
                <a class="navbar-item" role="button">
                  <b-icon v-if="link.icon" :icon="link.icon" />
                  <span class="navbar-text">{{ link.label }}</span>
                  <b-icon class="navbar-caret" icon="caret-down" />
                </a>
              </template>
              <b-dropdown-item v-for="(child, j) in link.children" :key="j" has-link>
                <a :href="child.url">{{ child.label }}</a>
              </b-dropdown-item>
            </b-dropdown>
            <a v-else class="navbar-item" :href="link.url">
              <b-icon v-if="link.icon" :icon="link.icon" />
              <span class="navbar-text">{{ link.label }}</span>
            </a>
          </template>
        </div>
        <div v-if="user.isInitialized" class="user-items">
          <a
            v-if="!user.isLoggedIn"
            class="navbar-item login-button"
            role="button"
            :title="t('nav.login')"
            @click="session.login"
          >
            <b-icon icon="sign-in-alt" />
          </a>
          <template v-else>
            <b-dropdown position="is-bottom-left">
              <template #trigger>
                <a class="navbar-item user-gravatar-wrapper" role="button">
                  <GravatarImage class="user-gravatar" :email="user.email" />
                </a>
              </template>
              <b-dropdown-item has-link>
                <a :href="session.userPage(user.username)">{{ user.username }}</a>
              </b-dropdown-item>
              <hr class="dropdown-divider" />
              <b-dropdown-item has-link>
                <a :href="special('Preferences')">{{ t("nav.preferences") }}</a>
              </b-dropdown-item>
              <hr class="dropdown-divider" />
              <b-dropdown-item @click="session.logout">{{ t("nav.logout") }}</b-dropdown-item>
            </b-dropdown>
            <a class="navbar-item" role="button" :title="t('nav.logout')" @click="session.logout">
              <b-icon icon="sign-out-alt" />
            </a>
          </template>
        </div>
        <div class="navbar-end">
          <div class="search-box-wrapper">
            <b-field>
              <b-autocomplete
                v-model="search.query.value"
                :placeholder="t('nav.search')"
                icon="search"
                :data="search.suggestions.value"
                max-height="100%"
                @input="search.onInput"
                @select="(option: string | null) => option && search.go(option)"
                @keyup.enter="search.go()"
              />
              <p class="control">
                <button class="button" :title="t('nav.go')" @click="search.go()">
                  <b-icon icon="arrow-right" />
                </button>
              </p>
              <p class="control">
                <button class="button" :title="t('nav.search')" @click="search.search()">
                  <b-icon icon="search" />
                </button>
              </p>
            </b-field>
          </div>
        </div>
      </div>
    </div>
  </nav>
</template>

<style>
.liberty-navbar {
  top: 0;
  position: fixed !important;
  width: 100%;
  z-index: 30 !important;
  min-height: var(--liberty-navbar-height);
  box-shadow:
    0 2px 4px 0 rgba(0, 0, 0, 0.16),
    0 2px 10px 0 rgba(0, 0, 0, 0.12);
}
.liberty-navbar .navbar-menu {
  box-shadow: none;
  background-color: transparent;
}
.liberty-navbar .navbar-item {
  display: flex;
  align-items: center;
  white-space: nowrap;
  color: #fff;
}
.liberty-navbar .navbar-start .navbar-item {
  padding: 0.5rem 0.7rem;
}
.liberty-navbar .navbar-caret {
  width: 1rem;
  margin-left: 0.15rem;
}
.liberty-navbar .brand img {
  max-height: 1.75rem;
  margin-right: 0.4rem;
}
.liberty-navbar .navbar-end {
  align-items: center;
}
.liberty-navbar .dropdown + .dropdown {
  margin: 0;
}
.liberty-navbar .dropdown-content a {
  color: var(--bulma-text);
}
.liberty-navbar .user-items {
  display: flex;
  flex-direction: row;
  align-items: center;
}
.liberty-navbar .user-gravatar {
  max-height: 2rem;
  border-radius: 0.35rem;
  border: 1px solid var(--liberty-border);
}
.liberty-navbar .search-box-wrapper .field {
  margin-bottom: 0;
}
.liberty-navbar .search-box-wrapper .autocomplete {
  flex-grow: 1;
}
.liberty-navbar .search-box-wrapper .autocomplete .dropdown-item {
  text-align: left;
  white-space: pre-line;
  word-break: break-all;
}
.liberty-navbar .search-box-wrapper .button:focus {
  box-shadow: none;
}
@media screen and (min-width: 1024px) {
  .liberty-navbar .search-box-wrapper {
    margin-right: 0.3rem;
  }
  .liberty-navbar .navbar-start .navbar-item .icon:first-child {
    margin-right: 0.5rem;
  }
  .liberty-navbar .user-items {
    order: 3;
  }
}
@media screen and (max-width: 1023px) {
  .liberty-navbar > .container {
    display: flex;
    padding: 0 0.5rem 0.5rem;
  }
  .liberty-navbar .navbar-text,
  .liberty-navbar .navbar-caret {
    display: none;
  }
  .liberty-navbar .navbar-menu {
    flex: 1;
    display: flex !important;
    flex-wrap: wrap;
    padding: 0;
    justify-content: space-between;
  }
  .liberty-navbar .navbar-start,
  .liberty-navbar .navbar-end {
    display: flex;
    flex-direction: row;
  }
  .liberty-navbar .navbar-item {
    padding: 0.25rem !important;
  }
  .liberty-navbar .navbar-end {
    flex: 0 0 100%;
  }
  .liberty-navbar .search-box-wrapper {
    flex: 1;
  }
  .liberty-navbar .search-box-wrapper .input,
  .liberty-navbar .search-box-wrapper .button {
    height: 2rem;
  }
  .liberty-navbar .user-gravatar {
    max-height: 1.8rem;
  }
}
</style>
