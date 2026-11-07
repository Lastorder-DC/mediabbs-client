// UI translations (vue-i18n). Adding a language: create locales/<code>.ts with
// the same keys as ko.ts and register it in `LOCALES` below.
//
// Locale choice: the user's pick (localStorage) > SITE_LOCALE from the backend >
// the wiki's content language > the browser language > English.
import { createI18n } from "vue-i18n";
import { Settings } from "luxon";
import ko from "./locales/ko";
import en from "./locales/en";
import { SERVER_ERROR_KEYS } from "./serverErrors";

export const LOCALES = { ko, en } as const;
export type LocaleCode = keyof typeof LOCALES;
const STORAGE_KEY = "mediabbs.locale";

export const i18n = createI18n({
  legacy: false,
  locale: "en",
  fallbackLocale: "en",
  messages: LOCALES,
  missingWarn: false,
  fallbackWarn: false,
});

function match(tag: string | null | undefined): LocaleCode | null {
  if (!tag) return null;
  const base = tag.toLowerCase().split(/[-_]/)[0];
  return base in LOCALES ? (base as LocaleCode) : null;
}

export function availableLocales(): { code: LocaleCode; name: string }[] {
  return (Object.keys(LOCALES) as LocaleCode[]).map((code) => ({
    code,
    name: LOCALES[code].locale.name,
  }));
}

/** Full locale tag used for dates (e.g. SITE_LOCALE "ko-KR"), or the bare code. */
let dateLocale = "en";

export function currentLocale(): LocaleCode {
  return i18n.global.locale.value as LocaleCode;
}

function apply(code: LocaleCode, tag?: string): void {
  i18n.global.locale.value = code;
  dateLocale = tag && match(tag) === code ? tag : code;
  Settings.defaultLocale = dateLocale;
  document.documentElement.lang = code;
}

/** Picks the initial locale (see the module comment). */
export function initLocale(siteLocale: string | null | undefined, wikiLang: string | null): void {
  const stored = match(localStorage.getItem(STORAGE_KEY));
  const site = match(siteLocale);
  const fromBrowser = (navigator.languages || [navigator.language]).map(match).find(Boolean);
  const code = stored || site || match(wikiLang) || fromBrowser || "en";
  apply(code, code === site ? (siteLocale ?? undefined) : undefined);
}

/** Changes the UI language and remembers the choice. */
export function setLocale(code: LocaleCode): void {
  localStorage.setItem(STORAGE_KEY, code);
  apply(code);
}

export function getDateLocale(): string {
  return dateLocale;
}

/** Adds messages (e.g. from a skin) for one or more locales. */
export function mergeMessages(messages: Partial<Record<LocaleCode, Record<string, unknown>>>): void {
  for (const [code, msgs] of Object.entries(messages)) {
    if (msgs) i18n.global.mergeLocaleMessage(code, msgs);
  }
}

/** Translates a backend error body ("Topic is closed", "TokenMissing", ...). */
export function translateServerError(body: unknown): string | null {
  if (typeof body !== "string") return null;
  const key = SERVER_ERROR_KEYS[body.trim()];
  return key ? i18n.global.t(`error.server.${key}`) : null;
}

/** Shorthand for code outside components. */
export const t = (key: string, params?: Record<string, unknown>): string =>
  params ? i18n.global.t(key, params) : i18n.global.t(key);
