<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import {
  createBoard,
  deleteBoard,
  errorMessage,
  getBoardsUncached,
  reorderBoards,
  updateBoard,
} from "@/api";
import type { Board, BoardSettings, Permission } from "@/api";
import { refreshConfigCache } from "@/config";
import { boardIconClass } from "@/menu";
import { loadBoardIcons, useAppStore } from "@/stores/app";

const { t } = useI18n();
const store = useAppStore();
const PERMISSIONS: Permission[] = ["all", "users", "admins"];
const NAME_RE = /^[a-z][a-z0-9_-]{0,63}$/;
const RESERVED = ["auth", "admin", "api", "uploads", "config"];

const boards = ref<Board[]>([]);
/** Board ids in the order shown (may differ from the saved order). */
const order = ref<number[]>([]);
const loading = ref(true);
const busy = ref(false);
const message = ref<{ text: string; error: boolean } | null>(null);
/** The board being edited (`id: null` for a new one). */
const editing = ref<{ id: number | null; form: BoardSettings } | null>(null);
const iconNames = ref<Set<string> | null>(null);

const byId = computed(() => new Map(boards.value.map((b) => [b.id, b])));
const ordered = computed(() =>
  order.value.map((id) => byId.value.get(id)).filter((b): b is Board => !!b),
);
const orderChanged = computed(() => order.value.join() !== boards.value.map((b) => b.id).join());
const editedBoard = computed(() =>
  editing.value?.id != null ? byId.value.get(editing.value.id) : undefined,
);
const nameValid = computed(() => {
  const name = editing.value?.form.name.trim() ?? "";
  return NAME_RE.test(name) && !RESERVED.includes(name);
});
const iconValue = computed(() => (editing.value?.form.icon ?? "").trim().replace(/^bi-/, ""));
const iconUnknown = computed(
  () => !!iconValue.value && !!iconNames.value && !iconNames.value.has(iconValue.value),
);

function show(text: string, error = false): void {
  message.value = { text, error };
}

/** Applies a fresh board list here and everywhere else in the app. */
function apply(list: Board[]): void {
  boards.value = list;
  order.value = list.map((b) => b.id);
  store.setBoards(list);
}

async function reload(): Promise<void> {
  apply(await getBoardsUncached());
}

onMounted(async () => {
  loadBoardIcons();
  try {
    await reload();
  } catch (error) {
    show(errorMessage(error), true);
  } finally {
    loading.value = false;
  }
  // Icon names for the picker (only fetched on this page).
  import("bootstrap-icons/font/bootstrap-icons.json")
    .then((m) => (iconNames.value = new Set(Object.keys(m.default))))
    .catch(() => undefined);
});

function move(index: number, delta: number): void {
  const target = index + delta;
  if (target < 0 || target >= order.value.length) return;
  const ids = [...order.value];
  [ids[index], ids[target]] = [ids[target], ids[index]];
  order.value = ids;
}

// Drag and drop (mouse); the arrow buttons work everywhere.
const dragging = ref<number | null>(null);
function onDragStart(index: number, event: DragEvent): void {
  dragging.value = index;
  event.dataTransfer?.setData("text/plain", String(index));
  if (event.dataTransfer) event.dataTransfer.effectAllowed = "move";
}
function onDrop(index: number): void {
  const from = dragging.value;
  dragging.value = null;
  if (from === null || from === index) return;
  const ids = [...order.value];
  const [id] = ids.splice(from, 1);
  ids.splice(index, 0, id);
  order.value = ids;
}

async function saveOrder(): Promise<void> {
  busy.value = true;
  try {
    apply(await reorderBoards(order.value));
    await refreshConfigCache();
    show(t("admin.saved"));
  } catch (error) {
    show(errorMessage(error), true);
  } finally {
    busy.value = false;
  }
}

const blankForm = (): BoardSettings => ({
  name: "",
  displayName: "",
  icon: null,
  writePermission: "all",
  commentPermission: "all",
  isListed: true,
  isActive: true,
  separatorBefore: false,
});

function startNew(): void {
  message.value = null;
  editing.value = { id: null, form: blankForm() };
}

function startEdit(board: Board): void {
  message.value = null;
  editing.value = {
    id: board.id,
    form: {
      name: board.name,
      displayName: board.displayName,
      icon: board.icon,
      writePermission: board.writePermission,
      commentPermission: board.commentPermission,
      isListed: board.isListed,
      isActive: board.isActive,
      separatorBefore: board.separatorBefore,
    },
  };
}

async function save(): Promise<void> {
  if (!editing.value) return;
  const { id, form } = editing.value;
  const settings: BoardSettings = {
    ...form,
    name: form.name.trim(),
    displayName: form.displayName.trim(),
    icon: iconValue.value || null,
  };
  busy.value = true;
  try {
    if (id === null) await createBoard(settings);
    else await updateBoard(id, settings);
    // Keep an unsaved order out of the way of the fresh list.
    await reload();
    await refreshConfigCache();
    editing.value = null;
    show(t("admin.saved"));
  } catch (error) {
    show(errorMessage(error), true);
  } finally {
    busy.value = false;
  }
}

async function remove(): Promise<void> {
  const board = editedBoard.value;
  if (!board || !window.confirm(t("admin.board.deleteConfirm", { name: board.displayName }))) {
    return;
  }
  busy.value = true;
  try {
    await deleteBoard(board.id);
    await reload();
    editing.value = null;
    show(t("admin.saved"));
  } catch (error) {
    show(errorMessage(error), true);
  } finally {
    busy.value = false;
  }
}

const permissionLabel = (p: Permission) => t(`admin.board.permission.${p}`);
</script>

<template>
  <section class="mb-admin-section">
    <p v-if="message" class="mb-admin-message" :class="{ error: message.error }" role="status">
      {{ message.text }}
    </p>
    <p v-if="loading" class="mb-admin-note">…</p>
    <template v-else>
      <p class="mb-admin-hint">{{ t("admin.dragHint") }}</p>
      <ol class="mb-board-list">
        <li
          v-for="(board, index) in ordered"
          :key="board.id"
          class="mb-board-row"
          :class="{ separator: board.separatorBefore && index > 0, dragging: dragging === index }"
          :data-board="board.name"
          draggable="true"
          @dragstart="onDragStart(index, $event)"
          @dragover.prevent
          @drop.prevent="onDrop(index)"
          @dragend="dragging = null"
        >
          <span class="mb-handle" aria-hidden="true">⋮⋮</span>
          <span class="mb-board-name">
            <i v-if="board.icon" :class="boardIconClass(board.icon)" class="mb-board-icon" aria-hidden="true" />
            <strong>{{ board.displayName }}</strong>
            <span class="mb-muted">/{{ board.name }}</span>
          </span>
          <span class="mb-badges">
            <span v-if="!board.isListed" class="mb-badge">{{ t("admin.board.hidden") }}</span>
            <span v-if="!board.isActive" class="mb-badge">{{ t("admin.board.archived") }}</span>
            <span v-if="board.writePermission !== 'all'" class="mb-badge">
              {{ t("admin.board.writePermission") }}: {{ permissionLabel(board.writePermission) }}
            </span>
            <span v-if="board.commentPermission !== 'all'" class="mb-badge">
              {{ t("admin.board.commentPermission") }}: {{ permissionLabel(board.commentPermission) }}
            </span>
          </span>
          <span class="mb-row-actions">
            <button
              type="button"
              class="mb-btn small"
              :title="t('admin.moveUp')"
              :aria-label="t('admin.moveUp')"
              :disabled="index === 0"
              @click="move(index, -1)"
            >
              ↑
            </button>
            <button
              type="button"
              class="mb-btn small"
              :title="t('admin.moveDown')"
              :aria-label="t('admin.moveDown')"
              :disabled="index === ordered.length - 1"
              @click="move(index, 1)"
            >
              ↓
            </button>
            <button type="button" class="mb-btn small edit-board" @click="startEdit(board)">⚙</button>
          </span>
        </li>
      </ol>
      <div v-if="orderChanged" class="mb-admin-bar">
        <span>{{ t("admin.board.orderChanged") }}</span>
        <button type="button" class="mb-btn primary save-order" :disabled="busy" @click="saveOrder">
          {{ t("admin.board.saveOrder") }}
        </button>
        <button type="button" class="mb-btn" :disabled="busy" @click="order = boards.map((b) => b.id)">
          {{ t("admin.board.resetOrder") }}
        </button>
      </div>
      <p v-if="!editing">
        <button type="button" class="mb-btn new-board" @click="startNew">+ {{ t("admin.board.new") }}</button>
      </p>

      <form v-if="editing" class="mb-board-form" @submit.prevent="save">
        <h3>
          {{
            editing.id === null
              ? t("admin.board.new")
              : t("admin.board.edit", { name: editedBoard?.displayName ?? "" })
          }}
        </h3>
        <label class="mb-field">
          <span class="mb-label">{{ t("admin.board.displayName") }}</span>
          <input v-model="editing.form.displayName" class="mb-input" name="displayName" required maxlength="255" />
        </label>
        <label class="mb-field">
          <span class="mb-label">{{ t("admin.board.name") }}</span>
          <input
            v-model="editing.form.name"
            class="mb-input"
            name="name"
            required
            maxlength="64"
            autocapitalize="off"
            spellcheck="false"
            :aria-invalid="!nameValid"
          />
          <small class="mb-help" :class="{ error: editing.form.name !== '' && !nameValid }">
            {{ t("admin.board.nameHelp") }}
          </small>
          <small v-if="editedBoard && editing.form.name.trim() !== editedBoard.name" class="mb-help error">
            {{ t("admin.board.nameChangeWarning") }}
          </small>
        </label>
        <label class="mb-field">
          <span class="mb-label">{{ t("admin.board.icon") }}</span>
          <span class="mb-icon-input">
            <span class="mb-icon-preview" aria-hidden="true">
              <i v-if="iconValue && !iconUnknown" :class="boardIconClass(iconValue)" />
            </span>
            <input
              :value="editing.form.icon ?? ''"
              class="mb-input"
              name="icon"
              list="mb-icon-names"
              placeholder="chat-dots"
              autocapitalize="off"
              spellcheck="false"
              @input="editing.form.icon = ($event.target as HTMLInputElement).value"
            />
            <datalist id="mb-icon-names">
              <option v-for="name in iconNames" :key="name" :value="name" />
            </datalist>
          </span>
          <small class="mb-help">
            {{ t("admin.board.iconHelp") }}
            <a href="https://icons.getbootstrap.com/" target="_blank" rel="noopener">{{ t("admin.board.iconBrowse") }}</a>
          </small>
          <small v-if="iconUnknown" class="mb-help error">{{ t("admin.board.iconUnknown") }}</small>
        </label>
        <div class="mb-field-row">
          <label class="mb-field">
            <span class="mb-label">{{ t("admin.board.writePermission") }}</span>
            <select v-model="editing.form.writePermission" class="mb-input" name="writePermission">
              <option v-for="p in PERMISSIONS" :key="p" :value="p">{{ permissionLabel(p) }}</option>
            </select>
          </label>
          <label class="mb-field">
            <span class="mb-label">{{ t("admin.board.commentPermission") }}</span>
            <select v-model="editing.form.commentPermission" class="mb-input" name="commentPermission">
              <option v-for="p in PERMISSIONS" :key="p" :value="p">{{ permissionLabel(p) }}</option>
            </select>
          </label>
        </div>
        <label class="mb-check">
          <input v-model="editing.form.isListed" type="checkbox" name="isListed" />
          <span>{{ t("admin.board.listed") }} <small class="mb-help">{{ t("admin.board.listedHelp") }}</small></span>
        </label>
        <label class="mb-check">
          <input v-model="editing.form.separatorBefore" type="checkbox" name="separatorBefore" />
          <span>
            {{ t("admin.board.separatorBefore") }} <small class="mb-help">{{ t("admin.board.separatorHelp") }}</small>
          </span>
        </label>
        <label class="mb-check">
          <input
            :checked="!editing.form.isActive"
            type="checkbox"
            name="archived"
            @change="editing.form.isActive = !($event.target as HTMLInputElement).checked"
          />
          <span>{{ t("admin.board.archived") }} <small class="mb-help">{{ t("admin.board.archivedHelp") }}</small></span>
        </label>
        <div class="mb-form-actions">
          <button type="submit" class="mb-btn primary save-board" :disabled="busy || !nameValid">
            {{ t("admin.save") }}
          </button>
          <button type="button" class="mb-btn" :disabled="busy" @click="editing = null">{{ t("admin.cancel") }}</button>
          <button
            v-if="editing.id !== null"
            type="button"
            class="mb-btn danger delete-board"
            :disabled="busy"
            @click="remove"
          >
            {{ t("admin.delete") }}
          </button>
        </div>
      </form>
    </template>
  </section>
</template>
