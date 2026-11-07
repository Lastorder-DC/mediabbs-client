import { onMounted, ref } from "vue";
import { getConfig } from "@/config";
import { absoluteWikiHref, wikiApi } from "@/wiki";

interface ParseResponse {
  parse?: { text: string };
}

/** The wiki's site notice page, parsed to HTML (null when missing/disabled). */
export function useSiteNotice() {
  const html = ref<string | null>(null);

  onMounted(async () => {
    const { enabled, page } = getConfig().siteNotice;
    if (!enabled) return;
    try {
      const data = await wikiApi<ParseResponse>({ action: "parse", page, prop: "text" });
      // A missing page yields an error object instead of `parse`.
      if (data.parse?.text?.trim()) html.value = data.parse.text;
    } catch (err) {
      console.error(err);
    }
  });

  return {
    html,
    /** Makes wiki-relative links in the rendered notice absolute. */
    fixLinks(el: HTMLElement): void {
      for (const link of el.querySelectorAll("a[href]")) {
        link.setAttribute("href", absoluteWikiHref(link.getAttribute("href") || ""));
      }
    },
  };
}
