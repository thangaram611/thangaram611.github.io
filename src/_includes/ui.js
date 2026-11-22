// Shared by the page templates. Shape and colour both carry the kind: ring = idea, dot = problem, square = project.
export const mark = (kind) => `<i class="m ${kind}" aria-hidden="true"></i>`;

export const esc = (text) => String(text).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

// Front-matter dates are parsed as UTC midnight, so they are formatted in UTC too.
const format = (options) => (date) => date.toLocaleDateString("en-GB", { timeZone: "UTC", ...options });
const month = format({ month: "short" });
export const longDate = format({ day: "numeric", month: "long", year: "numeric" });

// Beside its stop on the line a date is set like a leaf of a calendar: the day, the month under it, the year under that.
export const leaf = (date) => `<time class="when" datetime="${date.toISOString().slice(0, 10)}"><b>${date.getUTCDate()}</b> <span>${month(date)}</span> <span>${date.getUTCFullYear()}</span></time>`;

// A date as people read it, wrapped so that search engines can read it too.
export const isoDate = (date) => date.toISOString().slice(0, 10);
export const stamp = (date, show) => `<time datetime="${isoDate(date)}">${show(date)}</time>`;

// A list that runs through time is drawn as a winding dotted line, with a stop at every piece. Each entry carries
// the stretch that leaves its stop; the stylesheet turns every other stretch around, which is what makes it wind.
// The line arrives from above the first stop and carries on past the last, fading at both ends. Each stretch is
// drawn twice, plain and lit, so the lit copy can fade in and out around whichever entry is pointed at.
const stretch = (name) => `<svg class="${name}" viewBox="0 0 40 100" preserveAspectRatio="none" aria-hidden="true"><path d="M20 0C44 25 44 75 20 100"/></svg>`;
export const road = stretch("road") + stretch("road lit");
export const journey = (lines, attributes = "") =>
  lines.length ? `<div class="journey"${attributes}>\n<div class="approach" role="presentation">${road}</div>\n${lines.join("\n")}\n</div>` : "";

// Wherever a piece is listed it carries one line about itself: its `description`, which for a project is its `line`.
// A piece without one cannot be listed, so the build stops and names the file.
export function summary(piece) {
  if (!piece.data.description) throw new Error(`${piece.inputPath} has no description.`);
  return esc(piece.data.description);
}

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
