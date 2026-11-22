import { PAGE, esc, finder, mark, pageUrl, pager, shortDate } from "./_includes/ui.js";

// One page per PAGE ideas, newest first. With no ideas there is no page at all.
export const data = {
  layout: "base.11ty.js",
  title: "Ideas",
  description: "Wishes and rambles. Some became problems, some became projects, some are still open.",
  pagination: { data: "collections.ideas", size: PAGE, reverse: true },
  permalink: pageUrl("ideas"),
};

export function render({ collections, pagination, description }) {
  const problems = collections.problems ?? [];
  const projectOf = finder(collections.projects ?? [], "project");

  const notes = pagination.items.map((idea) => {
    const { title, project, link, note } = idea.data;
    const problem = problems.find((p) => p.data.idea === idea.fileSlug);
    let went = "Still open.";
    if (problem) went = `${mark("problem")}Became a problem: <a href="${problem.url}">${esc(problem.data.title)}</a>.`;
    else if (project) {
      const made = projectOf(project, `ideas/${idea.fileSlug}.md`);
      went = `${mark("project")}Became a project: <a href="${made.url}">${esc(made.data.title)}</a>.`;
    } else if (link) went = `${mark("project")}Became <a href="${link.url}">${esc(link.label)} ↗</a>.`;
    return `<article class="note" id="${idea.fileSlug}"><time>${shortDate(idea.date)}</time><div><h2>${esc(title)}</h2>${idea.content}<p class="went">${went}${note ? ` ${esc(note)}` : ""}</p></div></article>`;
  });

  return `<main><h1>Ideas</h1><p class="sub">${description}</p>${notes.join("\n")}${pager(pagination)}</main>`;
}
