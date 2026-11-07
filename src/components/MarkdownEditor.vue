<script setup lang="ts">
// TOAST UI editor (WYSIWYG, Markdown output) with image uploads.
import { onBeforeUnmount, onMounted, ref } from "vue";
import Editor from "@toast-ui/editor";
import "@toast-ui/editor/dist/toastui-editor.css";
import "@toast-ui/editor/dist/i18n/ko-kr";
import { currentLocale } from "@/i18n";
import { uploadImage } from "@/upload";

const props = withDefaults(defineProps<{ initialValue?: string; height?: string }>(), {
  initialValue: "",
  height: "300px",
});

const el = ref<HTMLElement | null>(null);
let editor: Editor | null = null;

onMounted(() => {
  editor = new Editor({
    el: el.value as HTMLElement,
    height: props.height,
    initialEditType: "wysiwyg",
    previewStyle: "vertical",
    hideModeSwitch: true,
    usageStatistics: false,
    initialValue: props.initialValue,
    language: currentLocale() === "ko" ? "ko-KR" : "en-US",
    hooks: { addImageBlobHook: uploadImage },
  });
});
onBeforeUnmount(() => editor?.destroy());

defineExpose({
  getMarkdown: (): string => editor?.getMarkdown() ?? "",
  setMarkdown: (value: string): void => editor?.setMarkdown(value),
  reset: (): void => editor?.reset(),
  focus: (): void => editor?.focus(),
});
</script>

<template>
  <div ref="el" class="markdown-editor" />
</template>
