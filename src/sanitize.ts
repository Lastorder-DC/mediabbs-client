// HTML sanitizing for rendered Markdown (comments) and wiki HTML (site notice).
import DOMPurify from "dompurify";

const purify = DOMPurify();

// Form controls could build a fake login form over the page; only the
// disabled checkboxes of Markdown task lists are kept.
const FORM_TAGS = ["form", "button", "textarea", "select", "option", "fieldset", "dialog"];

purify.addHook("uponSanitizeElement", (node, data) => {
  if (data.tagName !== "input") return;
  const input = node as HTMLInputElement;
  if (input.getAttribute("type") !== "checkbox") {
    input.parentNode?.removeChild(input);
  }
});

purify.addHook("afterSanitizeAttributes", (node) => {
  const el = node as Element;
  if (el.tagName === "INPUT") {
    el.setAttribute("disabled", "");
    el.removeAttribute("name");
  }
  // Links to other sites: no referrer to them, no ranking credit for spam.
  if (el.tagName === "A" && el.getAttribute("href")) {
    const href = el.getAttribute("href") ?? "";
    if (/^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith("//")) {
      el.setAttribute("rel", "nofollow ugc noopener noreferrer");
    }
  }
});

/**
 * User content (comments): no inline styles (they could cover the page with
 * a fake form), no forms.
 */
export function sanitizeUserHtml(html: string): string {
  return purify.sanitize(html, {
    FORBID_TAGS: [...FORM_TAGS, "style"],
    FORBID_ATTR: ["style", "formaction", "action"],
  });
}

/** Wiki HTML edited by wiki administrators (site notice): inline styles allowed. */
export function sanitizeWikiHtml(html: string): string {
  return purify.sanitize(html, {
    FORBID_TAGS: [...FORM_TAGS, "style"],
    FORBID_ATTR: ["formaction", "action"],
  });
}
