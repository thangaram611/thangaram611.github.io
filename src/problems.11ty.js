import { PAGE, esc, finder, mark, pageUrl, pager, shortDate } from "./_includes/ui.js";

// One page per PAGE problems, newest first. With no problems there is no page at all.
export const data = {
  layout: "base.11ty.js",
  title: "Problems",
  description: "What went wrong, what I tried, what already existed, and what I did about it.",
  pagination: { data: "collections.problems", size: PAGE, reverse: true },
  permalink: pageUrl("problems"),
};

export function render({ collections, pagination, description }) {
  const projectOf = finder(collections.projects ?? [], "project");
  const list = pagination.items.map((p) => {
    const built = (p.data.projects ?? []).map((slug) => projectOf(slug, `problems/${p.fileSlug}.md`));
    const made = built.length ? `<p class="went">${built.map((b) => `${mark("project")}<a href="${b.url}">${esc(b.data.title)}</a>`).join(" ")}</p>` : "";
    return `<article class="note"><time>${shortDate(p.date)}</time><div><h2><a href="${p.url}">${esc(p.data.title)}</a></h2>${made}</div></article>`;
  });
  return `<main><h1>Problems</h1><p class="sub">${description}</p>${list.join("\n")}${pager(pagination)}</main>`;
}
