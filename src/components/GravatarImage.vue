<script setup lang="ts">
// Gravatar by SHA-256 of the e-mail address (no e-mail: the default avatar).
import { ref, watchEffect } from "vue";

const props = withDefaults(defineProps<{ email?: string; size?: number }>(), {
  email: "",
  size: 80,
});
const src = ref("");

async function sha256(text: string): Promise<string> {
  if (!text || !crypto.subtle) return "";
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

watchEffect(async () => {
  const hash = await sha256(props.email.trim().toLowerCase());
  src.value = `https://www.gravatar.com/avatar/${hash}?s=${props.size}&d=mp`;
});
</script>

<template>
  <img :src="src" alt="" class="gravatar" />
</template>
