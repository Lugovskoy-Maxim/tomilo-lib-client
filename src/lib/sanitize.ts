import DOMPurify from "isomorphic-dompurify";

/**
 * Санитизация HTML перед вставкой через dangerouslySetInnerHTML.
 * Защита от XSS для контента с бэкенда (описания тайтлов, тела новостей и т.д.).
 */
export function sanitizeHtml(html: string): string {
  if (!html || typeof html !== "string") return "";
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "p",
      "br",
      "strong",
      "b",
      "em",
      "i",
      "u",
      "s",
      "a",
      "ul",
      "ol",
      "li",
      "h1",
      "h2",
      "h3",
      "h4",
      "blockquote",
      "code",
      "pre",
      "span",
      "div",
    ],
    ALLOWED_ATTR: ["href", "target", "rel", "class"],
    ADD_ATTR: ["target"],
  });
}
