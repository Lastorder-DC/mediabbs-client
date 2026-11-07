<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { getConfig } from "@/config";
import { availableLocales, currentLocale, setLocale } from "@/i18n";
import type { LocaleCode } from "@/i18n";
import { availableSkins, currentSkinName, setSkin } from "@/skins";

const { t } = useI18n();
const config = getConfig();
const locales = availableLocales();
const skins = availableSkins();
const skin = currentSkinName();
</script>

<template>
  <footer class="liberty-footer">
    <a class="footer-wiki" :href="config.wiki.baseUrl">{{ config.wiki.siteName || config.wiki.baseUrl }}</a>
    <div class="footer-right">
      <div class="footer-prefs">
        <label v-if="locales.length > 1" class="select is-small" :title="t('common.language')">
          <select
            :aria-label="t('common.language')"
            :value="currentLocale()"
            @change="setLocale(($event.target as HTMLSelectElement).value as LocaleCode)"
          >
            <option v-for="l in locales" :key="l.code" :value="l.code">{{ l.name }}</option>
          </select>
        </label>
        <label v-if="skins.length > 1" class="select is-small" :title="t('common.skin')">
          <select
            :aria-label="t('common.skin')"
            :value="skin"
            @change="setSkin(($event.target as HTMLSelectElement).value)"
          >
            <option v-for="s in skins" :key="s.name" :value="s.name">{{ s.label }}</option>
          </select>
        </label>
      </div>
      <div class="mediabbs">
        <a href="https://github.com/Lastorder-DC/mediabbs">{{ t("footer.poweredBy", { name: "MediaBBS" }) }}</a>
        {{ " " }}
        <i18n-t keypath="footer.basedOn" tag="span">
          <template #name><a href="https://github.com/librewiki/librebbs">LibreBBS</a></template>
        </i18n-t>
      </div>
    </div>
  </footer>
</template>

<style>
.liberty-footer {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: space-between;
  align-items: flex-start;
  padding: var(--liberty-box-padding);
  border: 1px solid var(--liberty-border);
  border-bottom-left-radius: var(--bulma-radius-large);
  border-bottom-right-radius: var(--bulma-radius-large);
  background-color: var(--liberty-background);
}
.liberty-footer .footer-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.4rem;
}
.liberty-footer .footer-prefs {
  display: flex;
  gap: 0.4rem;
}
.liberty-footer .mediabbs {
  font-size: 0.9rem;
}
@media screen and (max-width: 1023px) {
  .liberty-footer {
    padding: calc(var(--liberty-box-padding) / 2);
  }
}
</style>
