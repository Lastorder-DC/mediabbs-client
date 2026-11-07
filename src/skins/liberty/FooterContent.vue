<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { availableLocales, currentLocale, setLocale } from "@/i18n";
import type { LocaleCode } from "@/i18n";
import { availableSkins, currentSkinName, setSkin } from "@/skins";
import designedByLibre from "./assets/designedbylibre.png";

const { t } = useI18n();
const locales = availableLocales();
const skins = availableSkins();
const skin = currentSkinName();
</script>

<template>
  <footer class="liberty-footer">
    <!-- Same badge as the Liberty MediaWiki skin's footer. -->
    <a class="designedbylibre" href="https://librewiki.net">
      <img :src="designedByLibre" alt="Designed by Librewiki" />
    </a>
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
  align-items: flex-end;
  padding: 1rem;
  border: 1px solid var(--liberty-border);
  border-bottom-left-radius: var(--liberty-radius);
  border-bottom-right-radius: var(--liberty-radius);
  background-color: var(--liberty-background);
}
.liberty-footer .designedbylibre img {
  display: block;
  height: 31px;
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
    padding: 0.5rem;
  }
}
</style>
