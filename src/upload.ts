// Image upload hook shared by the topic and comment editors.
import type { Editor } from "@toast-ui/vue-editor";
import { postFile } from "@/api";
import { getConfig } from "@/config";
import store from "@/store";

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = (error) => reject(error);
  });
}

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${Math.round((bytes / 1024 / 1024) * 10) / 10}MB`;
  }
  return `${Math.round(bytes / 1024)}KB`;
}

type Callback = (url: string, text?: string) => void;

/**
 * Registers the image upload hook on a TOAST UI editor. When uploads are
 * disabled, pasted/dropped images are rejected instead of being embedded as
 * huge data URLs.
 */
export function registerImageUpload(editor: Editor): void {
  editor.invoke(
    "addHook",
    "addImageBlobHook",
    async (file: File, callback: Callback): Promise<void> => {
      const { upload } = getConfig();
      if (!upload.enabled) {
        store.commit(
          "setErrormodal",
          "이 게시판에서는 파일 업로드를 사용할 수 없습니다."
        );
        return;
      }
      if (upload.requireLogin && !store.state.user.isLoggedIn) {
        store.commit("setErrormodal", "파일을 업로드하려면 로그인해야 합니다.");
        return;
      }
      const ext = (file.name.split(".").pop() || "").toLowerCase();
      if (!upload.allowedExtensions.includes(ext)) {
        store.commit(
          "setErrormodal",
          `업로드할 수 있는 파일 형식: ${upload.allowedExtensions.join(", ")}`
        );
        return;
      }
      if (file.size > upload.maxBytes) {
        store.commit(
          "setErrormodal",
          `업로드할 파일 용량은 ${formatBytes(
            upload.maxBytes
          )}까지만 가능합니다.`
        );
        return;
      }
      try {
        const { url } = await postFile(file.name, await toBase64(file));
        callback(url);
      } catch (error) {
        const message = error?.response?.data;
        store.commit(
          "setErrormodal",
          typeof message === "string" && message
            ? `업로드 실패: ${message}`
            : "업로드에 실패했습니다."
        );
      }
    }
  );
}
