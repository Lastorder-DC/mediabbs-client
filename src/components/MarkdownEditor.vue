<script setup lang="ts">
// WYSIWYG editor with Markdown output (Tiptap, MIT), laid out like the TOAST UI
// editor it replaces: a fixed toolbar, image uploads (button, paste, drop) and
// a Markdown source mode.
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef } from "vue";
import { useI18n } from "vue-i18n";
import { Editor, type ChainedCommands } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { TableKit } from "@tiptap/extension-table";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import { Markdown } from "@tiptap/markdown";
import "bootstrap-icons/font/bootstrap-icons.min.css";
import "./markdown-content.css";
import { uploadImage } from "@/upload";

const props = withDefaults(defineProps<{ initialValue?: string; height?: string }>(), {
  initialValue: "",
  height: "300px",
});

const { t } = useI18n();
const el = ref<HTMLElement | null>(null);
const root = ref<HTMLElement | null>(null);
const editor = shallowRef<Editor | null>(null);
/** Bumped on every editor transaction so the toolbar state recomputes. */
const tick = ref(0);
const mode = ref<"wysiwyg" | "markdown">("wysiwyg");
const source = ref("");
type Popup = "heading" | "link" | "image" | "table";
const popup = ref<Popup | null>(null);
const popupLeft = ref(0);

function insertUploadedImage(file: File | Blob, pos?: number): void {
  void uploadImage(file, (url, text) => {
    const ed = editor.value;
    if (!ed) return;
    const alt = text ?? (file instanceof File ? file.name.replace(/\.[^.]+$/, "") : "image");
    const chain = ed.chain().focus();
    if (pos !== undefined) chain.setTextSelection(pos);
    chain.setImage({ src: url, alt }).run();
  });
}

function imageFiles(list: FileList | null | undefined): File[] {
  return Array.from(list ?? []).filter((f) => f.type.startsWith("image/"));
}

onMounted(() => {
  editor.value = new Editor({
    element: el.value as HTMLElement,
    extensions: [
      StarterKit.configure({
        underline: false, // no Markdown syntax for it
        link: { openOnClick: false, autolink: true, defaultProtocol: "https" },
      }),
      Image.configure({ inline: true }),
      TableKit.configure({ table: { resizable: false } }),
      TaskList,
      TaskItem.configure({ nested: true }),
      // `breaks`: single newlines are line breaks, as TOAST UI wrote and showed them.
      Markdown.configure({ markedOptions: { gfm: true, breaks: true } }),
    ],
    content: props.initialValue,
    contentType: "markdown",
    editorProps: {
      attributes: { class: "md-content mb-editor-content" },
      handlePaste: (_view, event) => {
        const files = imageFiles(event.clipboardData?.files);
        if (!files.length) return false;
        files.forEach((f) => insertUploadedImage(f));
        return true;
      },
      handleDrop: (view, event) => {
        const files = imageFiles(event.dataTransfer?.files);
        if (!files.length) return false;
        const pos = view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos;
        files.forEach((f) => insertUploadedImage(f, pos));
        return true;
      },
    },
    onTransaction: () => tick.value++,
  });
  document.addEventListener("mousedown", onOutside);
});
onBeforeUnmount(() => {
  document.removeEventListener("mousedown", onOutside);
  editor.value?.destroy();
});

function onOutside(event: MouseEvent): void {
  const toolbar = root.value?.querySelector(".mb-editor-toolbar");
  if (popup.value && !toolbar?.contains(event.target as Node)) popup.value = null;
}

function isActive(name: string, attrs?: Record<string, unknown>): boolean {
  void tick.value;
  return editor.value?.isActive(name, attrs) ?? false;
}

function run(fn: (c: ChainedCommands) => ChainedCommands): void {
  const ed = editor.value;
  if (!ed) return;
  fn(ed.chain().focus()).run();
  popup.value = null;
}

const inList = computed(() => isActive("listItem") || isActive("taskItem"));
function listItemType(): string {
  return isActive("taskItem") ? "taskItem" : "listItem";
}

function openPopup(name: Popup, event: MouseEvent): void {
  if (popup.value === name) {
    popup.value = null;
    return;
  }
  const button = event.currentTarget as HTMLElement;
  const bar = button.closest(".mb-editor-toolbar") as HTMLElement;
  popupLeft.value = Math.max(0, Math.min(button.offsetLeft, bar.clientWidth - 262));
  popup.value = name;
  if (name === "link") {
    const ed = editor.value;
    const { from, to } = ed?.state.selection ?? { from: 0, to: 0 };
    linkUrl.value = (ed?.getAttributes("link").href as string | undefined) ?? "";
    linkText.value = ed?.state.doc.textBetween(from, to, " ") ?? "";
    linkHasSelection.value = from !== to;
  }
  if (name === "image") {
    imageUrl.value = "";
    imageAlt.value = "";
  }
  if (name === "link" || name === "image") {
    void nextTick(() =>
      (
        root.value?.querySelector(".mb-editor-popup input[type=text]") as HTMLInputElement | null
      )?.focus(),
    );
  }
}

// Link
const linkUrl = ref("");
const linkText = ref("");
const linkHasSelection = ref(false);
function applyLink(): void {
  const href = linkUrl.value.trim();
  if (!href) {
    run((c) => c.extendMarkRange("link").unsetLink());
  } else if (linkHasSelection.value || isActive("link")) {
    run((c) => c.extendMarkRange("link").setLink({ href }));
  } else {
    const text = linkText.value.trim() || href;
    run((c) =>
      c
        .insertContent({ type: "text", text, marks: [{ type: "link", attrs: { href } }] })
        .unsetMark("link"),
    );
  }
}

// Image
const imageUrl = ref("");
const imageAlt = ref("");
const fileInput = ref<HTMLInputElement | null>(null);
function applyImageUrl(): void {
  const src = imageUrl.value.trim();
  if (src) run((c) => c.setImage({ src, alt: imageAlt.value.trim() }));
}
function onFileChosen(): void {
  const files = imageFiles(fileInput.value?.files);
  popup.value = null;
  files.forEach((f) => insertUploadedImage(f));
}

// Table: pick the size on a grid, like TOAST UI.
const tableHover = ref({ rows: 0, cols: 0 });
function insertTable(rows: number, cols: number): void {
  run((c) => c.insertTable({ rows, cols, withHeaderRow: true }));
}

// Markdown source mode
function setMode(next: "wysiwyg" | "markdown"): void {
  if (mode.value === next || !editor.value) return;
  popup.value = null;
  if (next === "markdown") source.value = editor.value.getMarkdown();
  else editor.value.commands.setContent(source.value, { contentType: "markdown" });
  mode.value = next;
  void nextTick(() => focus());
}

function getMarkdown(): string {
  return mode.value === "markdown" ? source.value : (editor.value?.getMarkdown() ?? "");
}
function setMarkdown(value: string): void {
  source.value = value;
  editor.value?.commands.setContent(value, { contentType: "markdown" });
}
function focus(): void {
  if (mode.value === "markdown")
    (root.value?.querySelector(".mb-editor-source") as HTMLElement | null)?.focus();
  else editor.value?.commands.focus("end");
}

defineExpose({ getMarkdown, setMarkdown, reset: (): void => setMarkdown(""), focus });

interface ToolButton {
  icon: string;
  title: string;
  active?: () => boolean;
  disabled?: () => boolean;
  action: (e: MouseEvent) => void;
}
const groups = computed((): ToolButton[][] => [
  [
    {
      icon: "type-h1",
      title: t("editor.heading"),
      active: () => isActive("heading"),
      action: (e) => openPopup("heading", e),
    },
    {
      icon: "type-bold",
      title: t("editor.bold"),
      active: () => isActive("bold"),
      action: () => run((c) => c.toggleBold()),
    },
    {
      icon: "type-italic",
      title: t("editor.italic"),
      active: () => isActive("italic"),
      action: () => run((c) => c.toggleItalic()),
    },
    {
      icon: "type-strikethrough",
      title: t("editor.strike"),
      active: () => isActive("strike"),
      action: () => run((c) => c.toggleStrike()),
    },
  ],
  [
    { icon: "dash-lg", title: t("editor.hr"), action: () => run((c) => c.setHorizontalRule()) },
    {
      icon: "quote",
      title: t("editor.quote"),
      active: () => isActive("blockquote"),
      action: () => run((c) => c.toggleBlockquote()),
    },
  ],
  [
    {
      icon: "list-ul",
      title: t("editor.bulletList"),
      active: () => isActive("bulletList"),
      action: () => run((c) => c.toggleBulletList()),
    },
    {
      icon: "list-ol",
      title: t("editor.orderedList"),
      active: () => isActive("orderedList"),
      action: () => run((c) => c.toggleOrderedList()),
    },
    {
      icon: "check2-square",
      title: t("editor.taskList"),
      active: () => isActive("taskList"),
      action: () => run((c) => c.toggleTaskList()),
    },
    {
      icon: "text-indent-left",
      title: t("editor.indent"),
      disabled: () => !inList.value,
      action: () => run((c) => c.sinkListItem(listItemType())),
    },
    {
      icon: "text-indent-right",
      title: t("editor.outdent"),
      disabled: () => !inList.value,
      action: () => run((c) => c.liftListItem(listItemType())),
    },
  ],
  [
    {
      icon: "table",
      title: t("editor.table"),
      active: () => isActive("table"),
      action: (e) => openPopup("table", e),
    },
    { icon: "image", title: t("editor.image"), action: (e) => openPopup("image", e) },
    {
      icon: "link-45deg",
      title: t("editor.link"),
      active: () => isActive("link"),
      action: (e) => openPopup("link", e),
    },
  ],
  [
    {
      icon: "code",
      title: t("editor.code"),
      active: () => isActive("code"),
      action: () => run((c) => c.toggleCode()),
    },
    {
      icon: "code-square",
      title: t("editor.codeBlock"),
      active: () => isActive("codeBlock"),
      action: () => run((c) => c.toggleCodeBlock()),
    },
  ],
]);

const tableActions = computed(() => [
  { label: t("editor.addRowAfter"), action: () => run((c) => c.addRowAfter()) },
  { label: t("editor.addColumnAfter"), action: () => run((c) => c.addColumnAfter()) },
  { label: t("editor.deleteRow"), action: () => run((c) => c.deleteRow()) },
  { label: t("editor.deleteColumn"), action: () => run((c) => c.deleteColumn()) },
  { label: t("editor.deleteTable"), action: () => run((c) => c.deleteTable()) },
]);
</script>

<template>
  <div ref="root" class="mb-editor markdown-editor" :style="{ height }" @keydown.esc="popup = null">
    <div class="mb-editor-toolbar" role="toolbar">
      <template v-for="(group, gi) in groups" :key="gi">
        <span v-if="gi" class="mb-editor-divider" />
        <button
          v-for="b in group"
          :key="b.icon"
          type="button"
          class="mb-editor-button"
          :class="[`mb-editor-${b.icon}`, { active: b.active?.() }]"
          :title="b.title"
          :aria-label="b.title"
          :disabled="mode === 'markdown' || b.disabled?.()"
          @mousedown.prevent
          @click="b.action"
        >
          <i :class="`bi bi-${b.icon}`" />
        </button>
      </template>

      <div
        v-if="popup"
        class="mb-editor-popup"
        :class="`mb-editor-popup-${popup}`"
        :style="{ left: `${popupLeft}px` }"
      >
        <template v-if="popup === 'heading'">
          <button
            v-for="level in [1, 2, 3, 4, 5, 6] as const"
            :key="level"
            type="button"
            class="mb-editor-menu-item"
            :class="`h${level}`"
            @click="run((c) => c.setHeading({ level }))"
          >
            {{ t("editor.headingN", { n: level }) }}
          </button>
          <button type="button" class="mb-editor-menu-item" @click="run((c) => c.setParagraph())">
            {{ t("editor.paragraph") }}
          </button>
        </template>

        <form v-else-if="popup === 'link'" @submit.prevent="applyLink">
          <label class="mb-editor-label">
            {{ t("editor.linkUrl") }}
            <input
              v-model="linkUrl"
              class="mb-editor-input"
              type="text"
              name="url"
              placeholder="https://"
            />
          </label>
          <label v-if="!linkHasSelection && !isActive('link')" class="mb-editor-label">
            {{ t("editor.linkText") }}
            <input v-model="linkText" class="mb-editor-input" type="text" name="text" />
          </label>
          <div class="mb-editor-popup-actions">
            <button type="button" class="mb-editor-popup-button" @click="popup = null">
              {{ t("editor.cancel") }}
            </button>
            <button type="submit" class="mb-editor-popup-button primary">
              {{ t("editor.ok") }}
            </button>
          </div>
        </form>

        <form v-else-if="popup === 'image'" @submit.prevent="applyImageUrl">
          <label class="mb-editor-label">
            {{ t("editor.imageFile") }}
            <input
              ref="fileInput"
              class="mb-editor-input"
              type="file"
              accept="image/*"
              multiple
              @change="onFileChosen"
            />
          </label>
          <label class="mb-editor-label">
            {{ t("editor.imageUrl") }}
            <input
              v-model="imageUrl"
              class="mb-editor-input"
              type="text"
              name="url"
              placeholder="https://"
            />
          </label>
          <label class="mb-editor-label">
            {{ t("editor.imageAlt") }}
            <input v-model="imageAlt" class="mb-editor-input" type="text" name="alt" />
          </label>
          <div class="mb-editor-popup-actions">
            <button type="button" class="mb-editor-popup-button" @click="popup = null">
              {{ t("editor.cancel") }}
            </button>
            <button type="submit" class="mb-editor-popup-button primary">
              {{ t("editor.ok") }}
            </button>
          </div>
        </form>

        <template v-else-if="popup === 'table'">
          <template v-if="isActive('table')">
            <button
              v-for="a in tableActions"
              :key="a.label"
              type="button"
              class="mb-editor-menu-item"
              @click="a.action"
            >
              {{ a.label }}
            </button>
          </template>
          <template v-else>
            <div class="mb-editor-grid" @mouseleave="tableHover = { rows: 0, cols: 0 }">
              <template v-for="r in 6" :key="r">
                <button
                  v-for="c in 6"
                  :key="c"
                  type="button"
                  class="mb-editor-cell"
                  :class="{ on: r <= tableHover.rows && c <= tableHover.cols }"
                  :aria-label="t('editor.tableSize', { rows: r, cols: c })"
                  @mouseenter="tableHover = { rows: r, cols: c }"
                  @click="insertTable(r, c)"
                />
              </template>
            </div>
            <div class="mb-editor-grid-label">
              {{
                tableHover.rows
                  ? t("editor.tableSize", { rows: tableHover.rows, cols: tableHover.cols })
                  : t("editor.table")
              }}
            </div>
          </template>
        </template>
      </div>
    </div>

    <div v-show="mode === 'wysiwyg'" ref="el" class="mb-editor-body" />
    <textarea
      v-if="mode === 'markdown'"
      v-model="source"
      class="mb-editor-body mb-editor-source"
      spellcheck="false"
      :aria-label="t('editor.markdown')"
    />

    <div class="mb-editor-modes">
      <button type="button" :class="{ active: mode === 'markdown' }" @click="setMode('markdown')">
        {{ t("editor.markdown") }}
      </button>
      <button type="button" :class="{ active: mode === 'wysiwyg' }" @click="setMode('wysiwyg')">
        {{ t("editor.wysiwyg") }}
      </button>
    </div>
  </div>
</template>

<style>
.mb-editor {
  --mb-editor-border: var(--liberty-border, var(--border, #dadde6));
  --mb-editor-primary: var(--bulma-primary, var(--primary, #4188f1));
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  border: 1px solid var(--mb-editor-border);
  border-radius: 4px;
  background: #fff;
  color: #222;
  text-align: left;
  min-height: 160px;
}
.mb-editor-toolbar {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 2px;
  padding: 4px 8px;
  border-bottom: 1px solid var(--mb-editor-border);
  background: #f7f9fc;
  border-radius: 4px 4px 0 0;
}
.mb-editor-divider {
  width: 1px;
  height: 18px;
  margin: 0 6px;
  background: #e1e3e9;
}
.mb-editor-button {
  width: 30px;
  height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid transparent;
  border-radius: 3px;
  background: none;
  color: #555;
  font-size: 16px;
  padding: 0;
  cursor: pointer;
}
.mb-editor-button:hover:not(:disabled),
.mb-editor-button.active {
  background: #fff;
  border-color: #e4e7ee;
}
.mb-editor-button.active {
  color: var(--mb-editor-primary);
}
.mb-editor-button:disabled {
  opacity: 0.35;
  cursor: default;
}
.mb-editor-popup {
  position: absolute;
  top: calc(100% + 2px);
  z-index: 30;
  min-width: 140px;
  max-width: 260px;
  padding: 8px;
  border: 1px solid var(--mb-editor-border);
  border-radius: 4px;
  background: #fff;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
  font-size: 13px;
}
.mb-editor-popup-link,
.mb-editor-popup-image {
  width: 260px;
  box-sizing: border-box;
}
.mb-editor-menu-item {
  display: block;
  width: 100%;
  text-align: left;
  border: 0;
  background: none;
  padding: 4px 8px;
  cursor: pointer;
  color: inherit;
  font: inherit;
  border-radius: 3px;
}
.mb-editor-menu-item:hover {
  background: #eef3fb;
}
.mb-editor-menu-item.h1 {
  font-size: 22px;
  font-weight: 700;
}
.mb-editor-menu-item.h2 {
  font-size: 20px;
  font-weight: 700;
}
.mb-editor-menu-item.h3 {
  font-size: 18px;
  font-weight: 700;
}
.mb-editor-menu-item.h4 {
  font-size: 16px;
  font-weight: 700;
}
.mb-editor-menu-item.h5,
.mb-editor-menu-item.h6 {
  font-size: 14px;
  font-weight: 700;
}
.mb-editor-label {
  display: block;
  margin-bottom: 6px;
  font-weight: 600;
}
.mb-editor-input {
  display: block;
  width: 100%;
  box-sizing: border-box;
  margin-top: 2px;
  border: 1px solid var(--mb-editor-border);
  border-radius: 3px;
  padding: 4px 6px;
  font: inherit;
  font-weight: normal;
}
.mb-editor-popup-actions {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
  margin-top: 8px;
}
.mb-editor-popup-button {
  border: 1px solid var(--mb-editor-border);
  border-radius: 3px;
  background: #fff;
  padding: 3px 12px;
  font: inherit;
  cursor: pointer;
}
.mb-editor-popup-button.primary {
  background: var(--mb-editor-primary);
  border-color: var(--mb-editor-primary);
  color: #fff;
}
.mb-editor-grid {
  display: grid;
  grid-template-columns: repeat(6, 18px);
  gap: 2px;
  justify-content: center;
}
.mb-editor-cell {
  width: 18px;
  height: 18px;
  padding: 0;
  border: 1px solid #d5d8e0;
  background: #fff;
  cursor: pointer;
}
.mb-editor-cell.on {
  background: #d6e5fb;
  border-color: var(--mb-editor-primary);
}
.mb-editor-grid-label {
  margin-top: 4px;
  text-align: center;
  color: #777;
}
.mb-editor-body {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
}
.mb-editor-body > .ProseMirror {
  min-height: 100%;
  box-sizing: border-box;
  padding: 12px 16px;
  outline: none;
}
.mb-editor-source {
  width: 100%;
  box-sizing: border-box;
  border: 0;
  resize: none;
  padding: 12px 16px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 13px;
  line-height: 1.6;
  outline: none;
  background: #fff;
  color: inherit;
}
.mb-editor-content td,
.mb-editor-content th {
  position: relative;
}
.mb-editor-content .selectedCell::after {
  content: "";
  position: absolute;
  inset: 0;
  background: rgba(65, 136, 241, 0.15);
  pointer-events: none;
}
.mb-editor-content img.ProseMirror-selectednode {
  outline: 2px solid var(--mb-editor-primary);
}
.mb-editor-modes {
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid var(--mb-editor-border);
  background: #f7f9fc;
  border-radius: 0 0 4px 4px;
}
.mb-editor-modes button {
  border: 0;
  border-left: 1px solid var(--mb-editor-border);
  background: none;
  padding: 3px 12px;
  font-size: 12px;
  color: #888;
  cursor: pointer;
}
.mb-editor-modes button.active {
  background: #fff;
  color: var(--mb-editor-primary);
  font-weight: 600;
}
</style>
