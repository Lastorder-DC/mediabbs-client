<script setup lang="ts">
import { useSiteNotice } from "@/composables/useSiteNotice";
import MarkdownViewer from "@/components/MarkdownViewer.vue";

const { html, fixLinks } = useSiteNotice();
</script>

<template>
  <div v-if="html" class="liberty-notice">
    <MarkdownViewer class="sitenotice" :content="html" :post-process="fixLinks" />
  </div>
</template>

<style>
.liberty-notice {
  padding: 1rem;
  background-color: #d9edf7;
  border-radius: 0.25rem;
  text-align: center;
}
.liberty-notice .toastui-editor-contents {
  font-size: 1rem;
  color: rgb(49, 112, 143);
  word-break: keep-all;
}
.liberty-notice .toastui-editor-contents p,
.liberty-notice .toastui-editor-contents ul,
.liberty-notice .toastui-editor-contents ol {
  margin: 0;
  padding: 0;
  color: rgb(49, 112, 143);
}
.liberty-notice .toastui-editor-contents ul {
  list-style: none;
  line-height: 1.8rem;
}
.liberty-notice .toastui-editor-contents ul > li::before {
  content: none;
}
</style>
