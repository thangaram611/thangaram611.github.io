import { became, esc, finder, journey, leaf, PAGE, pager, pageUrl, road, summary } from "./_includes/ui.js";

// One page per PAGE ideas, newest first. With no ideas there is no page at all.
export const data = {
  layout: "base.11ty.js",
  title: "Ideas",
  description: "Wishes and rambles. Some became problems, some became projects, some are still open.",
  pagination: { data: "collections.ideas", size: PAGE, reverse: true, addAllPagesToCollections: true },
  permalink: pageUrl("ideas"),
};

export function render({ collections, pagination, description }) {
  const problems = collections.problems ?? [];
  const projectOf = finder(collections.projects ?? [], "project");
  const list = pagination.items.map(
    (idea) =>
      `<article class="note">${road}${leaf(idea.date)}<div><h2><a href="${idea.url}">${esc(idea.data.title)}</a></h2><p>${summary(idea)}</p>${became({ slug: idea.fileSlug, ...idea.data }, problems, projectOf)}</div></article>`,
  );
  return `<main><h1>Ideas</h1><p class="sub">${description}</p>${journey(list)}${pager(pagination)}</main>`;
}
