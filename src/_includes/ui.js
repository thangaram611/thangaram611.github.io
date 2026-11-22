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

// Collections arrive oldest first.
export const newestFirst = (items) => [...items].reverse();

// A dated piece of writing, in the form search engines read.
export function posting({ site, page, title, description }) {
  const address = new URL(page.url, site.url).href;
  return jsonLd({
    "@type": "BlogPosting",
    headline: title,
    description,
    datePublished: isoDate(page.date),
    url: address,
    mainEntityOfPage: address,
    author: { "@type": "Person", "@id": `${site.url}#me`, name: site.author, url: site.url },
  });
}

// The trail places a piece between its idea, its problem and what got built. With nothing around it, there is no trail.
export const here = (kind) => `<span aria-current="page">${mark(kind)}this ${kind}</span>`;
export const step = (kind, item, sibling) => `<a${sibling ? ' class="sib"' : ""} href="${item.url}">${mark(kind)}${esc(item.data.title)}</a>`;
export function trail(steps) {
  const shown = steps.filter(Boolean);
  return shown.length > 1 ? `<nav class="trail" aria-label="Where this sits">${shown.join("")}</nav>` : "";
}

// What an idea turned into: the problem written up, the project built, something elsewhere, or nothing yet.
export function became({ slug, project, link, note }, problems, projectOf) {
  const problem = problems.find((p) => p.data.idea === slug);
  let went = "Still open.";
  if (problem) went = `${mark("problem")}Became a problem: <a href="${problem.url}">${esc(problem.data.title)}</a>.`;
  else if (project) {
    const made = projectOf(project, `ideas/${slug}.md`);
    went = `${mark("project")}Became a project: <a href="${made.url}">${esc(made.data.title)}</a>.`;
  } else if (link) went = `${mark("project")}Became <a href="${link.url}">${esc(link.label)} ↗</a>.`;
  return `<p class="went">${went}${note ? ` ${esc(note)}` : ""}</p>`;
}

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

// Shared by the three archive pages: where page n of a section lives, and the links between pages.
export const pageUrl = (section) => ({ pagination }) => (pagination.pageNumber ? `/${section}/${pagination.pageNumber + 1}/` : `/${section}/`);

export function pager({ pageNumber, pages, href }) {
  if (pages.length < 2) return "";
  const link = (to, label) => (to ? `<a href="${to}">${label}</a>` : `<span></span>`);
  return `<nav class="pager" aria-label="Pages">${link(href.previous, "← Previous")}<span>Page ${pageNumber + 1} of ${pages.length}</span>${link(href.next, "Next →")}</nav>`;
}
