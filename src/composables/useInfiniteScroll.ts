import { nextTick, onBeforeUnmount, ref, watch } from "vue";
import type { Ref } from "vue";

/**
 * Calls `loadMore` whenever the `sentinel` element becomes visible. `loadMore`
 * returns whether more items may exist; when it returns false loading stops
 * until `resume()` (keep the list, check again) or `reset()` (caller cleared
 * the list).
 */
export function useInfiniteScroll(loadMore: () => Promise<boolean>) {
  const sentinel: Ref<HTMLElement | null> = ref(null);
  const loading = ref(false);
  const done = ref(false);
  const failed = ref(false);
  let observer: IntersectionObserver | null = null;
  let visible = false;
  let generation = 0;
  const MARGIN = 200;

  /** Measured now (observer callbacks lag behind DOM updates). */
  function nearViewport(): boolean {
    const el = sentinel.value;
    if (!el || !el.isConnected) return false;
    const rect = el.getBoundingClientRect();
    return rect.top < window.innerHeight + MARGIN && rect.bottom > -MARGIN;
  }

  async function load(): Promise<void> {
    if (loading.value || done.value) return;
    loading.value = true;
    failed.value = false;
    const gen = generation;
    try {
      const more = await loadMore();
      if (gen !== generation) return;
      done.value = !more;
    } catch (error) {
      console.error(error);
      if (gen === generation) {
        failed.value = true;
        done.value = true;
      }
    } finally {
      if (gen === generation) loading.value = false;
    }
    // Keep loading while the sentinel stays on screen (short pages).
    if (gen !== generation || done.value) return;
    await nextTick();
    if (nearViewport()) void load();
  }

  function observe(el: HTMLElement | null): void {
    observer?.disconnect();
    if (!el) return;
    observer = new IntersectionObserver(
      (entries) => {
        visible = entries.some((e) => e.isIntersecting);
        if (visible) void load();
      },
      { rootMargin: `${MARGIN}px` },
    );
    observer.observe(el);
  }

  watch(sentinel, observe, { flush: "post" });
  onBeforeUnmount(() => observer?.disconnect());

  return {
    sentinel,
    loading,
    done,
    failed,
    /** Look for more items again without clearing anything. */
    resume(): void {
      done.value = false;
      if (visible || nearViewport()) void load();
    },
    /** Start over (after the caller cleared its list). */
    reset(): void {
      generation++;
      loading.value = false;
      done.value = false;
      failed.value = false;
      void nextTick(() => {
        if (visible || nearViewport()) void load();
      });
    },
  };
}
