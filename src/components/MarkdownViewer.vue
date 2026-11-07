<script setup lang="ts">
// Renders Markdown (GFM; single newlines are line breaks, as the TOAST UI viewer
// showed them) or HTML, sanitized with DOMPurify.
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { Marked } from "marked";
import DOMPurify from "dompurify";
import "./markdown-content.css";

const props = defineProps<{
  content: string;
  /** Called with the rendered element, e.g. to rewrite links. */
  postProcess?: (el: HTMLElement) => void;
}>();

const marked = new Marked({ gfm: true, breaks: true, async: false });

const html = computed(() => DOMPurify.sanitize(marked.parse(props.content ?? "") as string));
const el = ref<HTMLElement | null>(null);

function runPostProcess(): void {
  if (el.value) props.postProcess?.(el.value);
}
onMounted(runPostProcess);
watch(html, () => nextTick(runPostProcess));
</script>

<template>
  <!-- eslint-disable-next-line vue/no-v-html -- sanitized above -->
  <div ref="el" class="markdown-viewer md-content" v-html="html" />
</template>
