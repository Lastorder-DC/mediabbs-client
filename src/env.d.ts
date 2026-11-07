/// <reference types="vite/client" />

declare const __DEFAULT_PRIMARY_COLOR__: string;

interface ImportMetaEnv {
  readonly VITE_BACKEND_HOST?: string;
  readonly VITE_DEFAULT_SKIN?: string;
}

declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent<object, object, unknown>;
  export default component;
}
