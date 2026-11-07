import { onBeforeUnmount, ref, watch } from "vue";
import type { Ref } from "vue";
import { backendHost } from "@/config";

export interface LiveTopicHandlers {
  /** A comment was added. */
  comment(id: number): void;
  /** A comment changed (e.g. hidden). */
  commentUpdated(id: number): void;
  /** The topic's status changed. */
  topic(): void;
  /** Events may have been missed (reconnected, or the server dropped some). */
  resync(): void;
}

/** Give up on live updates after this many failed connection attempts in a row. */
const MAX_FAILURES = 3;

/**
 * Live updates for a topic page over Server-Sent Events
 * (`GET /topics/{id}/events`). `live` is true while connected; when it is
 * false (not supported, refused with 503, proxy trouble) the caller polls.
 * The stream is closed while the page is in the background.
 */
export function useLiveTopic(topicId: Ref<number>, handlers: LiveTopicHandlers) {
  const live = ref(false);
  let source: EventSource | null = null;
  let failures = 0;
  let opened = false;
  let gaveUp = false;

  function close(): void {
    source?.close();
    source = null;
    live.value = false;
  }

  function open(): void {
    close();
    const id = topicId.value;
    if (gaveUp || typeof EventSource === "undefined" || !Number.isInteger(id) || id <= 0) return;
    if (document.visibilityState === "hidden") return;
    const es = new EventSource(`${backendHost}/topics/${id}/events`);
    source = es;
    opened = false;
    const data = (event: MessageEvent): number => {
      try {
        return Number(JSON.parse(event.data).id) || 0;
      } catch {
        return 0;
      }
    };
    es.onopen = () => {
      if (source !== es) return;
      failures = 0;
      live.value = true;
      // Reconnected: whatever happened meanwhile was missed.
      if (opened) handlers.resync();
      opened = true;
    };
    es.onerror = () => {
      if (source !== es) return;
      live.value = false;
      failures++;
      // CLOSED: an HTTP error (no automatic retry); otherwise the browser retries.
      if (es.readyState === EventSource.CLOSED || failures >= MAX_FAILURES) {
        close();
        gaveUp = failures >= MAX_FAILURES || es.readyState === EventSource.CLOSED;
      }
    };
    es.addEventListener("comment", (e) => handlers.comment(data(e as MessageEvent)));
    es.addEventListener("comment_updated", (e) => handlers.commentUpdated(data(e as MessageEvent)));
    es.addEventListener("topic", () => handlers.topic());
    es.addEventListener("resync", () => handlers.resync());
  }

  function onVisibility(): void {
    if (document.visibilityState === "hidden") {
      close();
    } else if (!source && !gaveUp) {
      open();
      // Changes while in the background were missed.
      handlers.resync();
    }
  }

  watch(topicId, open, { immediate: true });
  document.addEventListener("visibilitychange", onVisibility);
  onBeforeUnmount(() => {
    document.removeEventListener("visibilitychange", onVisibility);
    close();
  });

  return { live };
}
