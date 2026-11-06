<template lang="pug">
nav.liberty-navbar.navbar
  .container
    .navbar-menu.is-active
      .navbar-start
        a.navbar-item(active-class="", :href="wikiHome")
          img(alt="Logo", :src="logo", @error="logoFailed = true")
          | {{ wikiName }}
        a.navbar-item(:href="special('RecentChanges')")
          b-icon(icon="sync")
          span.navbar-text 최근 바뀜
        a.navbar-item(:href="special('Random')")
          b-icon(icon="random")
          span.navbar-text 임의 문서
        b-dropdown(v-if="boards.length")
          a.navbar-item(slot="trigger")
            b-icon(icon="comments")
            span.navbar-text 게시판
            b-icon.navbar-caret(icon="caret-down")
          b-dropdown-item(has-link, v-for="b in boards", :key="b.id")
            router-link(:to="`/${b.name}`") {{ b.displayName }}
        b-dropdown
          a.navbar-item(slot="trigger")
            b-icon(icon="wrench")
            span.navbar-text 도구
            b-icon.navbar-caret(icon="caret-down")
          b-dropdown-item(has-link)
            a(:href="special('Upload')") 파일 업로드
          b-dropdown-item(has-link)
            a(:href="special('SpecialPages')") 특수 문서 목록
        template(v-for="(link, i) in navLinks")
          b-dropdown(v-if="link.children && link.children.length", :key="`nav-${i}`")
            a.navbar-item(slot="trigger")
              b-icon(v-if="link.icon", :icon="link.icon")
              span.navbar-text {{ link.label }}
              b-icon.navbar-caret(icon="caret-down")
            b-dropdown-item(
              has-link,
              v-for="(child, j) in link.children",
              :key="`nav-${i}-${j}`"
            )
              a(:href="child.url") {{ child.label }}
          a.navbar-item(v-else, :key="`nav-${i}`", :href="link.url")
            b-icon(v-if="link.icon", :icon="link.icon")
            span.navbar-text {{ link.label }}
      .user-items(v-if="user.isInitialized")
        a.navbar-item(v-if="!user.isLoggedIn", @click="login")
          b-icon(pack="fa", icon="sign-in")
        template(v-else)
          b-dropdown
            a.navbar-item.user-gravatar-wrapper(slot="trigger")
              gravatar.user-gravatar(:email="user.email")
            b-dropdown-item(has-link)
              a(:href="userPage(user.username)") {{ user.username }}
            hr.dropdown-divider
            b-dropdown-item(has-link)
              a(:href="special('Preferences')") 환경설정
            hr.dropdown-divider
            b-dropdown-item(has-link)
              a.navbar-item(@click="logout") 로그아웃
          a.navbar-item(role="button", @click="logout")
            b-icon(pack="fa", icon="sign-out")
      .navbar-end
        .search-box-wrapper
          b-field
            b-autocomplete(
              placeholder="검색",
              icon="search",
              v-model="searchInput",
              :data="autoCompleteItem",
              @keyup.enter.native="go",
              @select="(option) => (selected = option)",
              @input="onSearchInput",
              max-height="100%"
            )
            p.control
              button.button(active-class="", @click="go")
                b-icon(icon="arrow-right")
            p.control
              button.button(active-class="", @click="search")
                b-icon(icon="search")
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import Gravatar from "vue-gravatar";
import { startLoginProcess, logout } from "@/auth";
import store from "@/store";
import type { Board } from "@/api";
import { getConfig } from "@/config";
import type { NavLink } from "@/config";
import { searchUrl, specialUrl, userUrl, wikiApi } from "@/wiki";
import defaultLogo from "@/assets/logo.svg";

interface PrefixSearchResponse {
  query?: {
    prefixsearch: { ns: number; title: string; pageid: number }[];
  };
}

@Component({
  components: {
    Gravatar,
  },
})
export default class NavBar extends Vue {
  searchInput = "";
  selected: string | null = null;
  autoCompleteItem: string[] = [];
  searchTimer: number | undefined = undefined;
  searchSeq = 0;
  logoFailed = false;

  get user(): typeof store.state.user {
    return store.state.user;
  }

  get boards(): Board[] {
    return store.state.boards || [];
  }

  get wikiName(): string {
    return getConfig().wiki.siteName || "Wiki";
  }

  get wikiHome(): string {
    return getConfig().wiki.baseUrl;
  }

  get logo(): string {
    // Fall back to the bundled logo if the wiki has none or it fails to load.
    return (!this.logoFailed && getConfig().wiki.logo) || defaultLogo;
  }

  get navLinks(): NavLink[] {
    return getConfig().navLinks;
  }

  special(page: string): string {
    return specialUrl(page);
  }

  userPage(name: string): string {
    return userUrl(name);
  }

  mounted(): void {
    store.dispatch("fetchBoards").catch((err) => console.log(err));
  }

  async login(): Promise<void> {
    startLoginProcess(this.$route.fullPath);
  }

  async logout(): Promise<void> {
    await logout();
    location.reload();
  }

  go(): void {
    if (this.searchInput) {
      location.href = searchUrl(this.searchInput);
    }
  }

  search(): void {
    if (this.searchInput) {
      location.href = searchUrl(this.searchInput, true);
    }
  }

  onSearchInput(): void {
    window.clearTimeout(this.searchTimer);
    this.searchTimer = window.setTimeout(
      () => this.fetchSuggestions(this.searchInput),
      200
    );
  }

  async fetchSuggestions(key: string): Promise<void> {
    const seq = ++this.searchSeq;
    if (!key.trim()) {
      this.autoCompleteItem = [];
      return;
    }
    try {
      const data = await wikiApi<PrefixSearchResponse>({
        action: "query",
        list: "prefixsearch",
        pssearch: key,
        pslimit: 10,
      });
      // Ignore responses that arrive after a newer request was sent.
      if (seq === this.searchSeq) {
        this.autoCompleteItem = (data.query?.prefixsearch || []).map(
          (item) => item.title
        );
      }
    } catch (err) {
      console.log(err);
    }
  }
}
</script>

<style lang="scss">
@import "@/assets/style-variables.scss";
.navbar-start > a.navbar-item:first-child img {
  margin-right: 0.4rem;
}
.liberty-navbar {
  top: 0;
  z-index: 18 !important;
  position: fixed;
  width: 100%;
  @include touch {
    & > .container {
      display: flex;
      padding-left: 0.5rem;
      padding-right: 0.5rem;
      padding-bottom: 0.5rem;
    }
    .navbar-text {
      display: none;
    }
    .navbar-menu {
      flex: 1;
      display: flex !important;
      flex-wrap: wrap;
      padding: 0;
      background-color: inherit;
      justify-content: space-between;
    }
    .navbar-start,
    .navbar-end {
      display: flex;
      flex-direction: row;
    }
    .navbar-item {
      padding: 0.25rem !important;
    }
    .navbar-caret {
      display: none;
    }
    .user-gravatar-wrapper {
      display: flex;
    }
    .navbar-end {
      flex: 0 0 100%;
    }
    .search-box-wrapper {
      flex: 1;
      .input,
      .icon.is-left,
      .button {
        height: 2rem;
      }
      .button {
        padding-top: 0;
        padding-bottom: 0;
      }
      .fa {
        font-size: 1.1rem;
      }
    }
    .navbar-search-input {
      width: 100%;
    }
    .user-items {
      .fa {
        font-size: 1rem;
      }
    }
    .user-gravatar {
      max-height: 1.8rem;
    }
  }
  @include desktop {
    .search-box-wrapper {
      margin-right: 0.3rem;
    }
    .navbar-start .navbar-item .icon:first-child {
      margin-right: 0.5rem;
    }
    .user-items {
      order: 3;
    }
  }
  .navbar-menu {
    box-shadow: none;
  }
  .dropdown + .dropdown {
    margin: 0;
  }
  .navbar-start .navbar-item {
    padding: 0.5rem 0.7rem;
    .icon {
      .fa {
        font-size: 1rem;
      }
    }
  }
  .navbar-item {
    display: flex;
    align-items: center;
    white-space: nowrap;
  }
  .navbar-end {
    align-items: center;
  }
  .search-box-wrapper {
    .button:focus {
      box-shadow: none;
    }
    .autocomplete {
      flex-grow: 1;
    }
    .autocomplete .dropdown-item {
      text-align: left;
      white-space: pre-line;
      word-break: break-all;
    }
  }
  .navbar-search-input {
    input:focus,
    input:active,
    input:hover {
      border-color: rgb(219, 219, 219);
      box-shadow: inset 0 1px 2px hsla(0, 0%, 4%, 0.1);
    }
  }
  .user-items {
    display: flex;
    flex-direction: row;
  }
  .user-gravatar {
    max-height: 2rem;
    border-radius: 0.35rem;
    border: 1px solid #e1e8ed;
  }
}
</style>
