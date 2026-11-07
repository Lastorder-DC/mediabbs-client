<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { errorMessage, saveMenus } from "@/api";
import { refreshConfigCache, runtimeConfig, serverMenus } from "@/config";
import { BUILTIN_TYPES, isBuiltin } from "@/menu";
import type { BuiltinMenuType, CustomMenuItem, MenuConfigs, MenuItemConfig, MenuText } from "@/menu";
import type { MenuSource } from "@/composables/useMenu";
import { SKINS, availableSkins, currentSkinName } from "@/skins";
import MenuTextField from "./MenuTextField.vue";

const { t } = useI18n();
const DEFAULT = "default";
const URL_RE = /^(https?:\/\/\S+|\/(?!\/)\S*)$/i;

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const tabs = [
  ...availableSkins(),
  { name: DEFAULT, label: t("admin.menuEditor.allSkins") },
];
const tab = ref(currentSkinName());
const saved = ref<MenuConfigs>(clone(serverMenus.value ?? {}));
const draft = ref<MenuConfigs>(clone(saved.value));
const skinDefaults = ref<Record<string, MenuItemConfig[]>>({});
const busy = ref(false);
const message = ref<{ text: string; error: boolean } | null>(null);
const jsonMode = ref(false);
const jsonText = ref("");
const newBuiltin = ref<BuiltinMenuType>("boards");

onMounted(async () => {
  const entries = await Promise.all(
    availableSkins().map(async (s) => [s.name, await SKINS[s.name].menu()] as const),
  );
  skinDefaults.value = Object.fromEntries(entries);
});

/** The menu a skin currently gets from the draft, and where it comes from. */
function effective(skin: string): { items: MenuItemConfig[]; source: MenuSource | null } {
  const own = draft.value[skin];
  if (own) return { items: own, source: skin === DEFAULT ? null : "admin" };
  if (skin === DEFAULT) return { items: [], source: null };
  if (draft.value.default) return { items: draft.value.default, source: "adminDefault" };
  const deployed = runtimeConfig.menus;
  if (deployed?.[skin]) return { items: deployed[skin], source: "config" };
  if (deployed?.default) return { items: deployed.default, source: "configDefault" };
  return { items: skinDefaults.value[skin] ?? [], source: "skin" };
}

const current = computed(() => effective(tab.value));
const dirty = computed(() => JSON.stringify(draft.value) !== JSON.stringify(saved.value));
const hasOwn = computed(() => !!draft.value[tab.value]);

/** Edits the selected tab's menu, starting from what it shows now. */
function edit(change: (items: MenuItemConfig[]) => void): void {
  if (!draft.value[tab.value]) draft.value[tab.value] = clone(current.value.items);
  change(draft.value[tab.value]);
}

function move(index: number, delta: number): void {
  edit((items) => {
    const target = index + delta;
    if (target < 0 || target >= items.length) return;
    [items[index], items[target]] = [items[target], items[index]];
  });
}
const removeItem = (index: number) => edit((items) => items.splice(index, 1));
const addBuiltin = () => edit((items) => items.push({ type: newBuiltin.value }));
const addLink = () => edit((items) => items.push({ label: "", url: "" }));
const addDropdown = () =>
  edit((items) => items.push({ label: "", children: [{ label: "", url: "" }] }));

function setField(index: number, field: "label" | "url" | "icon", value: MenuText | undefined): void {
  edit((items) => {
    const item = items[index] as unknown as Record<string, unknown>;
    if (value === undefined || value === "") {
      if (field === "label" && !isBuiltin(items[index])) item.label = "";
      else delete item[field];
    } else {
      item[field] = value;
    }
  });
}

function editChildren(index: number, change: (children: NonNullable<CustomMenuItem["children"]>) => void): void {
  edit((items) => {
    const item = items[index] as CustomMenuItem;
    item.children ??= [];
    change(item.children);
  });
}

function resetTab(): void {
  delete draft.value[tab.value];
}

/** A message for the first invalid entry, or null. */
function validate(menus: MenuConfigs): string | null {
  for (const items of Object.values(menus)) {
    for (const item of items) {
      if (isBuiltin(item)) continue;
      const label = typeof item.label === "string" ? item.label : Object.values(item.label ?? {})[0];
      if (!label?.trim()) return `${t("admin.menuEditor.label")}: ${t("admin.menuEditor.empty")}`;
      if (item.children?.length) {
        for (const child of item.children) {
          if (!URL_RE.test(child.url)) return `${t("admin.menuEditor.url")}: ${child.url || "—"}`;
        }
      } else if (!item.url || !URL_RE.test(item.url)) {
        return `${t("admin.menuEditor.url")}: ${item.url || "—"}`;
      }
    }
  }
  return null;
}

function toggleJson(): void {
  message.value = null;
  if (!jsonMode.value) {
    jsonText.value = JSON.stringify(draft.value, null, 2);
    jsonMode.value = true;
    return;
  }
  if (applyJson()) jsonMode.value = false;
}

function applyJson(): boolean {
  try {
    const parsed: unknown = JSON.parse(jsonText.value || "{}");
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error();
    draft.value = parsed as MenuConfigs;
    return true;
  } catch {
    message.value = { text: t("admin.menuEditor.jsonInvalid"), error: true };
    return false;
  }
}

async function save(): Promise<void> {
  message.value = null;
  if (jsonMode.value && !applyJson()) return;
  const invalid = validate(draft.value);
  if (invalid) {
    message.value = { text: invalid, error: true };
    return;
  }
  const payload = Object.keys(draft.value).length ? clone(draft.value) : null;
  busy.value = true;
  try {
    await saveMenus(payload);
    saved.value = clone(draft.value);
    serverMenus.value = payload;
    await refreshConfigCache();
    message.value = { text: `${t("admin.saved")} ${t("admin.menuEditor.cacheNote")}`, error: false };
  } catch (error) {
    message.value = { text: errorMessage(error), error: true };
  } finally {
    busy.value = false;
  }
}

const kind = (item: MenuItemConfig) =>
  isBuiltin(item) ? "builtin" : item.children !== undefined ? "dropdown" : "link";
</script>

<template>
  <section class="mb-admin-section">
    <p v-if="message" class="mb-admin-message" :class="{ error: message.error }" role="status">
      {{ message.text }}
    </p>
    <div class="mb-field-row">
      <label class="mb-field">
        <span class="mb-label">{{ t("admin.menuEditor.skin") }}</span>
        <select v-model="tab" class="mb-input" name="menuSkin" :disabled="jsonMode">
          <option v-for="s in tabs" :key="s.name" :value="s.name">{{ s.label }}</option>
        </select>
      </label>
      <span class="mb-menu-mode">
        <button type="button" class="mb-btn toggle-json" @click="toggleJson">
          {{ jsonMode ? t("admin.menuEditor.visual") : t("admin.menuEditor.json") }}
        </button>
      </span>
    </div>

    <textarea v-if="jsonMode" v-model="jsonText" class="mb-input mb-json" name="menusJson" spellcheck="false" rows="18" />

    <template v-else>
      <p class="mb-admin-hint">
        <template v-if="tab === DEFAULT">
          {{ hasOwn ? t("admin.menuEditor.defaultSource.saved") : t("admin.menuEditor.defaultSource.none") }}
        </template>
        <template v-else-if="current.source">{{ t(`admin.menuEditor.source.${current.source}`) }}</template>
        <button v-if="hasOwn" type="button" class="mb-btn small reset-menu" :title="t('admin.menuEditor.resetHelp')" @click="resetTab">
          {{ t("admin.menuEditor.reset") }}
        </button>
      </p>

      <ol class="mb-menu-list">
        <li v-for="(item, index) in current.items" :key="index" class="mb-menu-item" :data-kind="kind(item)">
          <div class="mb-menu-item-head">
            <strong v-if="isBuiltin(item)">{{ t(`admin.menuEditor.builtin.${item.type}`) }}</strong>
            <strong v-else>{{ t(`admin.menuEditor.kind.${kind(item)}`) }}</strong>
            <span class="mb-row-actions">
              <button type="button" class="mb-btn small" :aria-label="t('admin.moveUp')" :title="t('admin.moveUp')" :disabled="index === 0" @click="move(index, -1)">↑</button>
              <button
                type="button"
                class="mb-btn small"
                :aria-label="t('admin.moveDown')"
                :title="t('admin.moveDown')"
                :disabled="index === current.items.length - 1"
                @click="move(index, 1)"
              >
                ↓
              </button>
              <button type="button" class="mb-btn small danger" :aria-label="t('admin.remove')" :title="t('admin.remove')" @click="removeItem(index)">✕</button>
            </span>
          </div>
          <div v-if="!(isBuiltin(item) && item.type === 'navLinks')" class="mb-menu-fields">
            <label class="mb-field">
              <span class="mb-label">{{ t("admin.menuEditor.label") }}</span>
              <MenuTextField
                :model-value="item.label"
                name="label"
                :required="!isBuiltin(item)"
                :placeholder="isBuiltin(item) ? t('admin.menuEditor.labelPlaceholder') : ''"
                @update:model-value="setField(index, 'label', $event)"
              />
            </label>
            <label v-if="kind(item) === 'link'" class="mb-field">
              <span class="mb-label">{{ t("admin.menuEditor.url") }}</span>
              <input
                class="mb-input"
                name="url"
                :value="(item as CustomMenuItem).url ?? ''"
                placeholder="https://"
                @input="setField(index, 'url', ($event.target as HTMLInputElement).value)"
              />
            </label>
            <label class="mb-field narrow">
              <span class="mb-label">{{ t("admin.menuEditor.icon") }}</span>
              <input
                class="mb-input"
                name="icon"
                :value="item.icon ?? ''"
                @input="setField(index, 'icon', ($event.target as HTMLInputElement).value)"
              />
            </label>
          </div>
          <ol v-if="kind(item) === 'dropdown'" class="mb-menu-children">
            <li v-for="(child, ci) in (item as CustomMenuItem).children" :key="ci" class="mb-menu-fields">
              <label class="mb-field">
                <span class="mb-label">{{ t("admin.menuEditor.label") }}</span>
                <MenuTextField
                  :model-value="child.label"
                  required
                  @update:model-value="editChildren(index, (c) => (c[ci].label = $event ?? ''))"
                />
              </label>
              <label class="mb-field">
                <span class="mb-label">{{ t("admin.menuEditor.url") }}</span>
                <input
                  class="mb-input"
                  :value="child.url"
                  placeholder="https://"
                  @input="editChildren(index, (c) => (c[ci].url = ($event.target as HTMLInputElement).value))"
                />
              </label>
              <span class="mb-row-actions">
                <button
                  type="button"
                  class="mb-btn small"
                  :aria-label="t('admin.moveUp')"
                  :disabled="ci === 0"
                  @click="editChildren(index, (c) => c.splice(ci - 1, 2, c[ci], c[ci - 1]))"
                >
                  ↑
                </button>
                <button type="button" class="mb-btn small danger" :aria-label="t('admin.remove')" @click="editChildren(index, (c) => c.splice(ci, 1))">✕</button>
              </span>
            </li>
            <li>
              <button type="button" class="mb-btn small" @click="editChildren(index, (c) => c.push({ label: '', url: '' }))">
                + {{ t("admin.menuEditor.addChild") }}
              </button>
            </li>
          </ol>
        </li>
        <li v-if="!current.items.length" class="mb-muted">{{ t("admin.menuEditor.empty") }}</li>
      </ol>

      <div class="mb-menu-add">
        <select v-model="newBuiltin" class="mb-input" name="newBuiltin">
          <option v-for="type in BUILTIN_TYPES" :key="type" :value="type">{{ t(`admin.menuEditor.builtin.${type}`) }}</option>
        </select>
        <button type="button" class="mb-btn add-builtin" @click="addBuiltin">+ {{ t("admin.menuEditor.addBuiltin") }}</button>
        <button type="button" class="mb-btn add-link" @click="addLink">+ {{ t("admin.menuEditor.addLink") }}</button>
        <button type="button" class="mb-btn add-dropdown" @click="addDropdown">+ {{ t("admin.menuEditor.addDropdown") }}</button>
      </div>
    </template>

    <div class="mb-form-actions">
      <button type="button" class="mb-btn primary save-menus" :disabled="busy || (!dirty && !jsonMode)" @click="save">
        {{ t("admin.save") }}
      </button>
      <span v-if="dirty" class="mb-muted">{{ t("admin.menuEditor.changed") }}</span>
    </div>
  </section>
</template>
