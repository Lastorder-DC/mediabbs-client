<template lang="pug">
footer.liberty-footer.main-footer
  a.footer-wiki(:href="wikiHome") {{ wikiName }}
  .mediabbs
    a(href="https://github.com/Lastorder-DC/mediabbs") Powered by MediaBBS
    |
    | (based on
    |
    a(href="https://github.com/librewiki/librebbs") LibreBBS
    | )
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import { getConfig } from "@/config";

@Component
export default class FooterContent extends Vue {
  get wikiHome(): string {
    return getConfig().wiki.baseUrl;
  }

  get wikiName(): string {
    return getConfig().wiki.siteName || getConfig().wiki.baseUrl;
  }
}
</script>

<style lang="scss">
@import "@/assets/style-variables.scss";
@import "~bulma";
@import "~buefy/src/scss/buefy";
.main-footer {
  padding: $box-padding;
  @include touch {
    padding: ($box-padding / 2);
  }
  border: 1px solid #e1e8ed;
  border-bottom-left-radius: $radius-large;
  border-bottom-right-radius: $radius-large;
  background-color: $background;
}
.mediabbs {
  float: right;
  font-size: 0.9rem;
}
</style>
