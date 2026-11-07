import { ref } from "vue";
import { searchUrl, wikiApi } from "@/wiki";

interface PrefixSearchResponse {
  query?: { prefixsearch: { title: string }[] };
}

/** Wiki search box with title suggestions. */
export function useWikiSearch() {
  const query = ref("");
  const suggestions = ref<string[]>([]);
  let timer: number | undefined;
  let seq = 0;

  async function fetchSuggestions(key: string): Promise<void> {
    const mine = ++seq;
    if (!key.trim()) {
      suggestions.value = [];
      return;
    }
    try {
      const data = await wikiApi<PrefixSearchResponse>({
        action: "query",
        list: "prefixsearch",
        pssearch: key,
        pslimit: 10,
      });
      // Ignore responses that arrive after a newer request was sent.
      if (mine === seq) suggestions.value = (data.query?.prefixsearch || []).map((i) => i.title);
    } catch (err) {
      console.error(err);
    }
  }

  return {
    query,
    suggestions,
    /** Call on input; suggestions are fetched after a short pause. */
    onInput(): void {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => fetchSuggestions(query.value), 200);
    },
    /** "Go": open the page if it exists, else the search results. */
    go(value = query.value): void {
      if (value.trim()) location.href = searchUrl(value);
    },
    /** Full-text search. */
    search(value = query.value): void {
      if (value.trim()) location.href = searchUrl(value, true);
    },
  };
}
