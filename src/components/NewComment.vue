<template lang="pug">
.modal(:class="{ 'is-active': editorOpen }")
  .modal-background
  .modal-card
    .modal-card-head
      label#label_newtopic.modal-card-title 새 의견 추가하기
      button.delete(@click="modalclose")
    .modal-card-body
      .new-topic
        .field
          editor(
            :options="editorOptions",
            initialEditType="wysiwyg",
            ref="toastuiEditor"
          )
    .modal-card-foot
      .field
        span(v-if="!user.isLoggedIn") ⚠️현재 로그인되어 있지 않습니다. 글 작성 시 IP가 노출됩니다.
        .control
          button.button.is-link(@click="handleSubmit") 작성
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import { postComment } from "@/api";
import "@toast-ui/editor/dist/toastui-editor.css";
import { Editor } from "@toast-ui/vue-editor";
import "@toast-ui/editor/dist/i18n/ko-kr";
import store from "@/store";
import { getConfig } from "@/config";
import { registerImageUpload } from "@/upload";

@Component({
  components: {
    Editor,
  },
})
export default class NewComment extends Vue {
  @Prop() topicId!: number;
  @Prop() refresh!: () => void;

  get user(): typeof store.state.user {
    return store.state.user;
  }

  editorOptions = {
    usageStatistics: false,
    initialEditType: "wysiwyg",
    hideModeSwitch: true,
    language: getConfig().locale.startsWith("ko") ? "ko-KR" : "en-US",
  };
  $refs!: {
    toastuiEditor: Editor;
  };

  mounted(): void {
    registerImageUpload(this.$refs.toastuiEditor);
  }

  async handleSubmit(): Promise<void> {
    const markdown = this.$refs.toastuiEditor.invoke("getMarkdown");
    await postComment(this.topicId, markdown);
    localStorage.setItem(
      `topic-last-visited.${this.topicId}`,
      new Date().toISOString()
    );
    this.$refs.toastuiEditor.invoke("reset");
    this.refresh();
    this.modalclose();
  }

  get editorOpen(): boolean {
    return store.state.editor.open;
  }

  @Watch("$store.state.editor.initialValue")
  onInitialValueChange(): void {
    this.$refs.toastuiEditor.invoke(
      "setMarkdown",
      store.state.editor.initialValue
    );
  }

  modalclose(): void {
    store.commit("setEditorOpen", false);
  }
}
</script>

<style lang="scss">
@import "@/assets/style-variables.scss";
.modal-card-foot .field {
  width: 100%;
}
.control {
  text-align: right;
}
.button:hover {
  background-color: $primary;
  color: white;
  transition: 0.25s;
}
</style>
