// Image upload hook shared by the topic and comment editors.
import { errorMessage, postFile } from "@/api";
import { getConfig } from "@/config";
import { t } from "@/i18n";
import { useAppStore } from "@/stores/app";

function toBase64(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = () => reject(reader.error);
  });
}

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${Math.round((bytes / 1024 / 1024) * 10) / 10}MB`;
  }
  return `${Math.round(bytes / 1024)}KB`;
}

/**
 * TOAST UI `addImageBlobHook`. When uploads are disabled, pasted/dropped images
 * are rejected instead of being embedded as huge data URLs.
 */
export async function uploadImage(
  blob: Blob | File,
  callback: (url: string, text?: string) => void,
): Promise<void> {
  const store = useAppStore();
  const { upload } = getConfig();
  const name = blob instanceof File ? blob.name : "image.png";
  if (!upload.enabled) {
    store.showModalError(t("upload.disabled"));
    return;
  }
  if (upload.requireLogin && !store.user.isLoggedIn) {
    store.showModalError(t("upload.loginRequired"));
    return;
  }
  const ext = (name.split(".").pop() || "").toLowerCase();
  if (!upload.allowedExtensions.includes(ext)) {
    store.showModalError(t("upload.allowedTypes", { types: upload.allowedExtensions.join(", ") }));
    return;
  }
  if (blob.size > upload.maxBytes) {
    store.showModalError(t("upload.tooLarge", { size: formatBytes(upload.maxBytes) }));
    return;
  }
  try {
    const { url } = await postFile(name, await toBase64(blob));
    callback(url);
  } catch (error) {
    store.showModalError(t("upload.failedWithReason", { reason: errorMessage(error) }));
  }
}
