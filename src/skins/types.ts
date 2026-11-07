import type { App, Component } from "vue";
import type { LocaleCode } from "@/i18n";

/**
 * A skin supplies the whole look of the board: the page chrome (layout) and the
 * page components. Data loading and behaviour live in skin-independent code
 * (`@/composables`, `@/components`, `@/stores`), so a skin is mostly templates
 * and styles. See docs/skins.md.
 */
export interface Skin {
  /** Root component; renders `<RouterView />` where the page goes. */
  layout: Component;
  pages: {
    /** `/:boardName` */
    topicList: Component;
    /** `/:boardName/:topicId` */
    topic: Component;
  };
  /** Register plugins/global components (e.g. a UI library) before mounting. */
  install?: (app: App) => void;
  /** Extra translations used by the skin's templates. */
  messages?: Partial<Record<LocaleCode, Record<string, unknown>>>;
}

export interface SkinEntry {
  /** Name shown in the skin selector. */
  label: string;
  /** Lazily loads the skin (its code and CSS are only fetched when used). */
  load: () => Promise<{ default: Skin }>;
}
