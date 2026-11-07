// Links to and API calls against the MediaWiki instance the board is attached to.
// Canonical (English) namespace and special page names are used on purpose:
// MediaWiki accepts them in every content language.
import axios from "axios";
import { getConfig } from "@/config";
import { t } from "@/i18n";

/** Encodes a page title for use in an article URL (spaces become underscores). */
export function encodeTitle(title: string): string {
  return encodeURIComponent(title.trim().replace(/ /g, "_"))
    .replace(/%3A/gi, ":")
    .replace(/%2F/gi, "/");
}

export function wikiUrl(title: string): string {
  return getConfig().wiki.articlePath.replace("$1", encodeTitle(title));
}

export function specialUrl(page: string): string {
  return wikiUrl(`Special:${page}`);
}

export function userUrl(name: string): string {
  return wikiUrl(`User:${name}`);
}

export function userTalkUrl(name: string): string {
  return wikiUrl(`User_talk:${name}`);
}

export function contributionsUrl(name: string): string {
  return specialUrl(`Contributions/${name}`);
}

export function blockUrl(name: string): string {
  return specialUrl(`Block/${name}`);
}

/** `index.php` next to `api.php`. */
function indexPhpUrl(): string {
  return getConfig().wiki.apiUrl.replace(/api\.php$/, "index.php");
}

/** Wiki search page; `fulltext` skips "go to page" behaviour. */
export function searchUrl(query: string, fulltext = false): string {
  const params = new URLSearchParams({
    title: "Special:Search",
    search: query,
  });
  if (fulltext) {
    params.set("fulltext", "1");
  }
  return `${indexPhpUrl()}?${params.toString()}`;
}

/** Makes a site-relative wiki link (e.g. `/wiki/Foo`) absolute. */
export function absoluteWikiHref(href: string): string {
  if (href.startsWith("/") && !href.startsWith("//")) {
    return `${getConfig().wiki.baseUrl}${href}`;
  }
  return href;
}

/** Name of the board site: SITE_NAME, else "<wiki name> 게시판/Board". */
export function boardSiteName(): string {
  const config = getConfig();
  if (config.siteName && config.siteName !== config.wiki.siteName) {
    return config.siteName;
  }
  return config.wiki.siteName
    ? t("site.wikiBoard", { wiki: config.wiki.siteName })
    : t("site.board");
}

/**
 * Anonymous, read-only call to the wiki's action API. `origin=*` lets the wiki
 * answer cross-origin requests without any CORS configuration on its side.
 */
export async function wikiApi<T>(params: Record<string, string | number | boolean>): Promise<T> {
  const { data } = await axios.get<T>(getConfig().wiki.apiUrl, {
    params: { format: "json", formatversion: 2, origin: "*", ...params },
  });
  return data;
}
