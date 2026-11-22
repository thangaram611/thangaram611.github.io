// Shared by the page templates. Shape and colour both carry the kind: ring = idea, dot = problem, square = project.
export const mark = (kind) => `<i class="m ${kind}" aria-hidden="true"></i>`;

export const esc = (text) => String(text).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

// Front-matter dates are parsed as UTC midnight, so they are formatted in UTC too.
const format = (options) => (date) => date.toLocaleDateString("en-GB", { timeZone: "UTC", ...options });
export const dayMonth = format({ day: "numeric", month: "short" });
export const shortDate = format({ day: "numeric", month: "short", year: "numeric" });
export const longDate = format({ day: "numeric", month: "long", year: "numeric" });

// A date as people read it, wrapped so that search engines can read it too.
export const isoDate = (date) => date.toISOString().slice(0, 10);
export const stamp = (date, show) => `<time datetime="${isoDate(date)}">${show(date)}</time>`;

// Structured data for search engines. It must only repeat what the page already says in visible text.
export const jsonLd = (data) => `<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", ...data }).replace(/</g, "\\u003c")}</script>`;

// Collections arrive oldest first. Reversing them (rather than re-sorting) matches the order
// the archive pages are split in, which ideaUrl below relies on.
export const newestFirst = (items) => [...items].reverse();

// Pieces per archive page, and threads shown on the front page before it points to the archives.
export const PAGE = 20;
export const FRONT = 8;

// Looks up the piece a link points at, and fails the build on a typo or on a link to an unfinished draft.
export function finder(items, kind) {
  const bySlug = new Map(items.map((item) => [item.fileSlug, item]));
  return (slug, from) => {
    const found = bySlug.get(slug);
    if (!found) throw new Error(`${from} links to ${kind} "${slug}", which is missing or still a draft.`);
    return found;
  };
}

// An idea has no page of its own: it is an anchor on whichever archive page holds it.
export function ideaUrl(slug, ideas) {
  const page = Math.floor(newestFirst(ideas).findIndex((idea) => idea.fileSlug === slug) / PAGE);
  return `${page ? `/ideas/${page + 1}/` : "/ideas/"}#${slug}`;
}

// Shared by the three archive pages: where page n of a section lives, and the links between pages.
export const pageUrl = (section) => ({ pagination }) => (pagination.pageNumber ? `/${section}/${pagination.pageNumber + 1}/` : `/${section}/`);

export function pager({ pageNumber, pages, href }) {
  if (pages.length < 2) return "";
  const link = (to, label) => (to ? `<a href="${to}">${label}</a>` : `<span></span>`);
  return `<nav class="pager" aria-label="Pages">${link(href.previous, "← Previous")}<span>Page ${pageNumber + 1} of ${pages.length}</span>${link(href.next, "Next →")}</nav>`;
}
