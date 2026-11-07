<script setup lang="ts">
// Menu bar of the Simple skin: links, and dropdowns that open on click.
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import type { MenuEntry } from "@/menu";

defineProps<{ entries: MenuEntry[] }>();
const open = ref<string | null>(null);
const root = ref<HTMLElement | null>(null);
const route = useRoute();

function onDocumentClick(event: MouseEvent): void {
  if (root.value && !root.value.contains(event.target as Node)) open.value = null;
}
function onKey(event: KeyboardEvent): void {
  if (event.key === "Escape") open.value = null;
}
const toggle = (key: string) => (open.value = open.value === key ? null : key);

watch(() => route.fullPath, () => (open.value = null));
onMounted(() => {
  document.addEventListener("click", onDocumentClick);
  document.addEventListener("keydown", onKey);
});
onBeforeUnmount(() => {
  document.removeEventListener("click", onDocumentClick);
  document.removeEventListener("keydown", onKey);
});
</script>

<template>
  <nav ref="root" class="s-menu">
    <template v-for="entry in entries" :key="entry.key">
      <div v-if="entry.children" class="s-menu-dropdown" :class="{ open: open === entry.key }">
        <button
          class="s-menu-item s-menu-trigger"
          type="button"
          :aria-expanded="open === entry.key"
          @click="toggle(entry.key)"
        >
          {{ entry.label }} <span class="s-caret" aria-hidden="true">▾</span>
        </button>
        <div v-show="open === entry.key" class="s-menu-panel" role="menu">
          <template v-for="child in entry.children" :key="child.key">
            <RouterLink v-if="child.to" :to="child.to" role="menuitem">{{ child.label }}</RouterLink>
            <a v-else :href="child.href" role="menuitem">{{ child.label }}</a>
          </template>
        </div>
      </div>
      <a v-else class="s-menu-item" :href="entry.href">{{ entry.label }}</a>
    </template>
  </nav>
</template>

<style>
.s-menu {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.2rem 0.9rem;
}
.s-menu-item {
  color: var(--text);
  font: inherit;
  background: none;
  border: 0;
  padding: 0.2rem 0;
  cursor: pointer;
}
.s-menu-item:hover {
  color: var(--primary);
  text-decoration: none;
}
.s-caret {
  font-size: 0.75em;
  color: var(--muted);
}
.s-menu-dropdown {
  position: relative;
}
.s-menu-panel {
  position: absolute;
  top: 100%;
  left: 0;
  z-index: 20;
  min-width: 10rem;
  margin-top: 0.3rem;
  padding: 0.3rem 0;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
}
.s-menu-panel a {
  display: block;
  padding: 0.35rem 0.9rem;
  color: var(--text);
  white-space: nowrap;
}
.s-menu-panel a:hover,
.s-menu-panel a.router-link-active {
  background: var(--background);
  color: var(--primary);
  text-decoration: none;
}
</style>
