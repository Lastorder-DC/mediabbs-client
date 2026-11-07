<script setup lang="ts">
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { useSession } from "@/composables/useSession";
import { useWikiSearch } from "@/composables/useWikiSearch";
import { useMenu } from "@/composables/useMenu";
import { defaultMenu } from "./menu";
import GravatarImage from "@/components/GravatarImage.vue";
import defaultLogo from "@/assets/logo.svg";

const { t } = useI18n();
const session = useSession();
const { user, special } = session;
const menu = useMenu(defaultMenu);
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
          <template v-for="entry in menu" :key="entry.key">
            <b-dropdown v-if="entry.children">
              <template #trigger>
                <a class="navbar-item" role="button" :title="entry.label">
                  <b-icon v-if="entry.icon" :icon="entry.icon" />
                  <span class="navbar-text">{{ entry.label }}</span>
                  <b-icon class="navbar-caret" icon="caret-down" />
                </a>
              </template>
              <b-dropdown-item v-for="child in entry.children" :key="child.key" has-link>
                <RouterLink v-if="child.to" :to="child.to">{{ child.label }}</RouterLink>
                <a v-else :href="child.href">{{ child.label }}</a>
              </b-dropdown-item>
            </b-dropdown>
            <a v-else class="navbar-item" :href="entry.href" :title="entry.label">
              <b-icon v-if="entry.icon" :icon="entry.icon" />
              <span class="navbar-text">{{ entry.label }}</span>
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
                  <GravatarImage class="user-gravatar" :email="user.email" fallback="identicon" />
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
            <a class="navbar-item logout-button" role="button" :title="t('nav.logout')" @click="session.logout">
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
                :data="search.suggestions.value"
                max-height="100%"
                @input="search.onInput"
                @select="(option: string | null) => option && search.go(option)"
                @keyup.enter="search.go()"
              />
              <p class="control">
                <button class="button" :title="t('nav.go')" @click="search.go()">
                  <b-icon icon="eye" />
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
/* Sizes follow the Liberty MediaWiki skin's navbar (css/default.css). */
.liberty-navbar {
  --bulma-navbar-height: var(--liberty-navbar-height);
  top: 0;
  position: fixed !important;
  width: 100%;
  z-index: 30 !important;
  min-height: var(--liberty-navbar-height) !important;
  box-shadow:
    0 2px 4px 0 rgba(0, 0, 0, 0.16),
    0 2px 10px 0 rgba(0, 0, 0, 0.12);
}
.liberty-navbar > .container {
  max-width: 1200px !important;
  width: 100%;
  min-height: var(--liberty-navbar-height);
  padding: 0 1rem !important;
}
.liberty-navbar .navbar-menu {
  box-shadow: none;
  background-color: transparent;
  padding: 0;
  margin: 0 !important;
  align-items: stretch;
}
.liberty-navbar .navbar-start,
.liberty-navbar .navbar-end,
.liberty-navbar .user-items {
  display: flex;
  align-items: stretch;
}
.liberty-navbar .navbar-item {
  display: flex;
  align-items: center;
  white-space: nowrap;
  color: #fff;
  font-size: 1rem;
  line-height: 1.4rem;
  padding: 0.7rem 0.8rem;
  gap: 0;
  background-color: transparent !important;
}
.liberty-navbar .navbar-item:hover {
  background-color: var(--liberty-primary-dark) !important;
  transition: 0.3s;
}
.liberty-navbar .dropdown,
.liberty-navbar .dropdown-trigger {
  display: flex;
  align-items: stretch;
}
.liberty-navbar .navbar-item .icon {
  width: auto;
  height: auto;
  font-size: 1rem;
  margin-right: 0.5rem;
}
.liberty-navbar .navbar-item .icon.navbar-caret {
  font-size: 0.75rem;
  margin: 0 0 0 0.35rem;
}
.liberty-navbar .brand {
  padding: 0;
  margin-right: 0.6rem;
}
.liberty-navbar .brand:hover {
  background-color: transparent !important;
}
.liberty-navbar .brand img {
  height: 1.75rem;
  max-height: 1.75rem;
  margin-right: 0.55rem;
}
.liberty-navbar .dropdown + .dropdown {
  margin: 0;
}
.liberty-navbar .dropdown-menu {
  padding-top: 0;
}
.liberty-navbar .dropdown-content {
  border-top-left-radius: 0;
  border-top-right-radius: 0;
}
.liberty-navbar .dropdown-content a {
  color: var(--liberty-text);
}
/* Search box: 2rem high, 0.8rem text, like the wiki's form-inline. */
.liberty-navbar .search-box-wrapper {
  --bulma-input-radius: var(--liberty-radius);
  --bulma-control-radius: var(--liberty-radius);
  display: flex;
  align-items: center;
  padding: 0.4rem 0;
}
.liberty-navbar .search-box-wrapper .field {
  margin-bottom: 0;
}
.liberty-navbar .search-box-wrapper .autocomplete {
  width: 10.8rem;
}
.liberty-navbar .search-box-wrapper .field.has-addons .control .input {
  height: 2rem;
  font-size: 0.8rem;
  padding: 0.2rem 0.4rem;
  border-color: #ccc;
  border-radius: var(--liberty-radius) 0 0 var(--liberty-radius) !important;
  box-shadow: none;
}
.liberty-navbar .search-box-wrapper .field.has-addons .control .button {
  height: 2rem;
  padding: 0.2rem 0.4rem;
  color: #4f5b63;
  border-color: #ccc;
  border-radius: 0;
}
.liberty-navbar .search-box-wrapper .field.has-addons .control:last-child .button {
  border-radius: 0 var(--liberty-radius) var(--liberty-radius) 0;
}
.liberty-navbar .search-box-wrapper .button:hover {
  color: #fff;
  background-color: var(--bulma-primary);
}
.liberty-navbar .search-box-wrapper .button .icon {
  width: 0.9rem;
  height: auto;
  margin: 0 !important;
  font-size: 1rem;
}
.liberty-navbar .search-box-wrapper .button:focus {
  box-shadow: none;
}
.liberty-navbar .search-box-wrapper .autocomplete .dropdown-item {
  text-align: left;
  white-space: pre-line;
  word-break: break-all;
  font-size: 0.8rem;
}
/* Login / user menu */
.liberty-navbar .user-items {
  padding-left: 0.8rem;
}
.liberty-navbar .user-items .navbar-item {
  padding: 0.4rem 0;
}
.liberty-navbar .user-items .navbar-item:hover {
  background-color: transparent !important;
}
.liberty-navbar .user-items .navbar-item .icon {
  font-size: 1.5rem;
  margin: 0;
}
/* Profile picture and logout icon are 0.8rem apart, like the wiki. */
.liberty-navbar .user-items > * + * {
  margin-left: 0.8rem;
}
.liberty-navbar .user-gravatar {
  width: 2rem;
  height: 2rem;
  max-height: 2rem;
  border-radius: var(--liberty-radius);
  border: 1px solid var(--liberty-border);
}
@media screen and (min-width: 1024px) {
  .liberty-navbar .navbar-end {
    margin-left: auto;
  }
  .liberty-navbar .user-items {
    order: 3;
  }
}
/* Breakpoints of the Liberty MediaWiki skin (css/default_mobile.css). */
@media screen and (max-width: 1023px) {
  .liberty-navbar > .container {
    display: flex;
    padding: 0 0.5rem !important;
  }
  .liberty-navbar .brand .navbar-text {
    display: none;
  }
  .liberty-navbar .brand img {
    margin-right: 0;
  }
  .liberty-navbar .navbar-menu {
    flex: 1;
    display: flex !important;
    flex-wrap: wrap;
    justify-content: space-between;
  }
  .liberty-navbar .navbar-end {
    flex: 0 0 100%;
  }
  .liberty-navbar .search-box-wrapper {
    flex: 1;
    padding: 0.25rem 0 0.5rem;
  }
  .liberty-navbar .search-box-wrapper .field,
  .liberty-navbar .search-box-wrapper .autocomplete {
    width: 100%;
  }
  .liberty-navbar .search-box-wrapper .field .control:first-child {
    flex: 1;
  }
}
@media screen and (max-width: 890px) {
  .liberty-navbar .navbar-text {
    display: none;
  }
  .liberty-navbar .navbar-start .navbar-item .icon:not(.navbar-caret) {
    margin: 0 0.25rem;
  }
}
@media screen and (max-width: 520px) {
  .liberty-navbar .navbar-start .navbar-item {
    padding: 0.7rem 0.3rem;
  }
  /* Logout moves into the profile menu. */
  .liberty-navbar .user-items .logout-button {
    display: none;
  }
}
@media screen and (max-width: 397px) {
  .liberty-navbar .navbar-start .navbar-item {
    padding: 0.7rem 0.2rem;
  }
  .liberty-navbar .brand img {
    height: 1.5rem;
  }
  .liberty-navbar .navbar-caret {
    display: none !important;
  }
  .liberty-navbar .user-items {
    padding-left: 0.4rem;
  }
  .liberty-navbar .search-box-wrapper {
    padding-top: 0.04rem;
  }
}
</style>
