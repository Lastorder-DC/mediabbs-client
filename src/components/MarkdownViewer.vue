<script setup lang="ts">
// Renders Markdown/HTML with the TOAST UI viewer (which sanitizes HTML).
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import Viewer from "@toast-ui/editor/dist/toastui-editor-viewer";
import "@toast-ui/editor/dist/toastui-editor-viewer.css";

const props = defineProps<{
  content: string;
  /** Called with the rendered element, e.g. to rewrite links. */
  postProcess?: (el: HTMLElement) => void;
}>();

const el = ref<HTMLElement | null>(null);
let viewer: Viewer | null = null;

function render(): void {
  if (!el.value) return;
  if (viewer) viewer.setMarkdown(props.content);
  else viewer = new Viewer({ el: el.value, initialValue: props.content, usageStatistics: false });
  props.postProcess?.(el.value);
}

onMounted(render);
watch(() => props.content, render);
onBeforeUnmount(() => viewer?.destroy());
</script>

<template>
  <div ref="el" class="markdown-viewer" />
</template>
