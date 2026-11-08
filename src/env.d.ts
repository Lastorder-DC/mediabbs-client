/// <reference types="vite/client" />

declare const __DEFAULT_PRIMARY_COLOR__: string;
/** "0.4.0-1a2b3c4", or "0.4.0" for release builds (vite.config.ts). */
declare const __APP_VERSION__: string;

interface ImportMetaEnv {
  readonly VITE_BACKEND_HOST?: string;
  readonly VITE_DEFAULT_SKIN?: string;
}

declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent<object, object, unknown>;
  export default component;
}
