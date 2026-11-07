import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { DateTime } from "luxon";
import { getConfig } from "@/config";
import { specialUrl, wikiApi, wikiUrl } from "@/wiki";

export type LiveRecentMode = "document" | "discussion";

export interface LiveRecentItem {
  key: string;
  time: string;
  isNew: boolean;
  title: string;
  url: string;
}

interface RecentChangesResponse {
  query: { recentchanges: { timestamp: string; type: string; title: string }[] };
}

const LIMIT = 10;
const REFRESH_MS = 30_000;

/**
 * Recent wiki changes for a side panel, refreshed periodically. Not loaded on
 * narrow screens (`minWidth`), where skins usually hide the panel.
 */
export function useLiveRecent(minWidth = 769) {
  const config = getConfig().recentChanges;
  const mode = ref<LiveRecentMode>("document");
  const items = ref<LiveRecentItem[]>([]);
  const error = ref(false);
  let pending = false;
  let timer: number | undefined;

  function namespaces(): string {
    const list = mode.value === "document" ? config.documentNamespaces : config.discussionNamespaces;
    if (list && list.length) return list.join("|");
    return mode.value === "document" ? "0" : "1|3";
  }

  async function refresh(): Promise<void> {
    if (!config.enabled || window.innerWidth < minWidth || pending) return;
    pending = true;
    try {
      const data = await wikiApi<RecentChangesResponse>({
        action: "query",
        list: "recentchanges",
        rcprop: "title|timestamp",
        rcshow: "!bot|!redirect",
        rctype: "edit|new",
        rclimit: LIMIT,
        rcnamespace: namespaces(),
        rctoponly: true,
      });
      const dayAgo = DateTime.now().minus({ days: 1 });
      items.value = data.query.recentchanges.map((item) => {
        const at = DateTime.fromISO(item.timestamp);
        const time = at < dayAgo ? (at.toRelative() ?? "") : at.toFormat("HH:mm:ss");
        return {
          key: item.timestamp + item.title,
          time,
          isNew: item.type === "new",
          title: item.title,
          url: wikiUrl(item.title),
        };
      });
      error.value = false;
    } catch (err) {
      console.error(err);
      error.value = true;
    } finally {
      pending = false;
    }
  }

  onMounted(() => {
    void refresh();
    timer = window.setInterval(refresh, REFRESH_MS);
  });
  onBeforeUnmount(() => window.clearInterval(timer));

  return {
    enabled: config.enabled,
    mode,
    items,
    error,
    moreUrl: computed(() => specialUrl("RecentChanges")),
    setMode(next: LiveRecentMode): void {
      mode.value = next;
      void refresh();
    },
  };
}
