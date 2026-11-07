import { createApp } from "vue";
import { createPinia } from "pinia";
import { createHead } from "@unhead/vue/client";
import "@fortawesome/fontawesome-free/css/all.css";
import { backendHost, loadConfig, runtimeConfig } from "@/config";
import { i18n, initLocale, mergeMessages } from "@/i18n";
import { loadSkin } from "@/skins";
import { createAppRouter } from "@/router";
import { applyPrimaryColor } from "@/theme";

async function start(): Promise<void> {
  applyPrimaryColor(runtimeConfig.primaryColor);
  const [config, skin] = await Promise.all([loadConfig(), loadSkin()]);
  initLocale(config.locale, config.wiki.lang);
  if (skin.messages) mergeMessages(skin.messages);

  const app = createApp(skin.layout);
  app.use(createPinia());
  app.use(i18n);
  app.use(createHead());
  app.use(createAppRouter(skin));
  skin.install?.(app);
  app.mount("#app");
}

start().catch((error) => {
  console.error(error);
  // i18n may not be ready yet: pick the message by browser language.
  const ko = (navigator.language || "").toLowerCase().startsWith("ko");
  const host = backendHost || (ko ? "백엔드 주소 미설정" : "backend URL not set");
  const el = document.getElementById("app");
  if (el) {
    el.textContent = ko
      ? `서버(${host})에서 설정을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.`
      : `Could not load the settings from the server (${host}). Please try again later.`;
  }
});
