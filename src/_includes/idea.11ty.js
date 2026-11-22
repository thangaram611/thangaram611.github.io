import { became, esc, finder, here, longDate, posting, stamp, step, trail } from "./ui.js";

export const data = { layout: "base.11ty.js", ogType: "article" };

export function render({ site, collections, page, title, description, project, link, note, content }) {
  const slug = page.fileSlug;
  const problems = collections.problems ?? [];
  const projectOf = finder(collections.projects ?? [], "project");
  // An idea leads to the problem written about it and on to what that built, or straight to a project.
  const problem = problems.find((p) => p.data.idea === slug);
  const built = (problem ? (problem.data.projects ?? []) : project ? [project] : []).map((name) => projectOf(name, `ideas/${slug}.md`));

  return `<main><article>
${trail([here("idea"), problem && step("problem", problem), ...built.map((p, n) => step("project", p, n))])}
<h1>${esc(title)}</h1>
<p class="meta">${stamp(page.date, longDate)}</p>
<div class="prose">${content}</div>
${became({ slug, project, link, note }, problems, projectOf)}
</article></main>
${posting({ site, page, title, description })}`;
}
