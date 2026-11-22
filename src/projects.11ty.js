import { PAGE, esc, mark, pageUrl, pager } from "./_includes/ui.js";

// One page per PAGE projects, in their `order`. With no projects there is no page at all.
export const data = {
  layout: "base.11ty.js",
  title: "Projects",
  description: "What I built and what I contributed to, with the problems each one answers.",
  pagination: { data: "collections.projects", size: PAGE, addAllPagesToCollections: true, before: (items) => [...items].sort((a, b) => a.data.order - b.data.order) },
  permalink: pageUrl("projects"),
};

export function render({ collections, pagination, description }) {
  const problems = collections.problems ?? [];
  const entry = (p) => {
    const answers = problems.filter((q) => (q.data.projects ?? []).includes(p.fileSlug)).length;
    const count = answers ? ` · answers ${answers} problem${answers === 1 ? "" : "s"}` : "";
    return `<article class="note"><div><h2>${mark("project")}<a href="${p.url}">${esc(p.data.title)}</a></h2><p>${esc(p.data.line)}</p><p class="went">${esc(p.data.meta)}${count}</p></div></article>`;
  };
  const sections = [...Map.groupBy(pagination.items, (p) => p.data.group)].map(
    ([group, items]) => `<h2 class="grp">${esc(group)}</h2>${items.map(entry).join("\n")}`,
  );
  return `<main><h1>Projects</h1><p class="sub">${description}</p>${sections.join("\n")}${pager(pagination)}</main>`;
}
