<script setup lang="ts">
// Edits a MenuText: one text, or one text per language when the stored value
// is per language (`{ ko: "…", en: "…" }`, see src/menu.ts).
import type { MenuText } from "@/menu";

const props = defineProps<{ placeholder?: string; required?: boolean; name?: string }>();
const model = defineModel<MenuText | undefined>();

function setPlain(value: string): void {
  model.value = value === "" && !props.required ? undefined : value;
}
function setLang(lang: string, value: string): void {
  if (typeof model.value !== "object") return;
  model.value = { ...model.value, [lang]: value };
}
</script>

<template>
  <span v-if="model && typeof model === 'object'" class="mb-text-langs">
    <label v-for="(text, lang) in model" :key="lang" class="mb-text-lang">
      <span class="mb-muted">{{ lang }}</span>
      <input
        class="mb-input"
        :value="text"
        :required="required"
        @input="setLang(String(lang), ($event.target as HTMLInputElement).value)"
      />
    </label>
  </span>
  <input
    v-else
    class="mb-input"
    :name="name"
    :value="model ?? ''"
    :placeholder="placeholder"
    :required="required"
    @input="setPlain(($event.target as HTMLInputElement).value)"
  />
</template>
