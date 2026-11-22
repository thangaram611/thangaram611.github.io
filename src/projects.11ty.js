import { PAGE, esc, journey, mark, pageUrl, pager, road, shortDate, stamp, summary } from "./_includes/ui.js";

// One page per PAGE projects, newest first. With no projects there is no page at all.
export const data = {
  layout: "base.11ty.js",
  title: "Projects",
  description: "What I built and what I contributed to, with the problems each one answers.",
  pagination: { data: "collections.projects", size: PAGE, reverse: true, addAllPagesToCollections: true },
  permalink: pageUrl("projects"),
};

export function render({ collections, pagination, description }) {
  const problems = collections.problems ?? [];
  const entry = (p) => {
    const answers = problems.filter((q) => (q.data.projects ?? []).includes(p.fileSlug)).length;
    const count = answers ? ` · answers ${answers} problem${answers === 1 ? "" : "s"}` : "";
    return `<article class="note">${road}${stamp(p.date, shortDate)}<div><h2>${mark("project")}<a href="${p.url}">${esc(p.data.title)}</a></h2><p>${summary(p)}</p><p class="went">${esc(p.data.meta)}${count}</p></div></article>`;
  };
  // Each group is a road of its own. The projects arrive newest first, so the group with the newest one leads.
  const sections = [...Map.groupBy(pagination.items, (p) => p.data.group)].map(([group, items]) => `<h2 class="grp">${esc(group)}</h2>${journey(items.map(entry))}`);
  return `<main><h1>Projects</h1><p class="sub">${description}</p>${sections.join("\n")}${pager(pagination)}</main>`;
}
