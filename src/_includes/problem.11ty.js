import { esc, finder, here, longDate, mark, posting, stamp, step, summary, trail } from "./ui.js";

export const data = { layout: "base.11ty.js", ogType: "article" };

export function render({ site, collections, page, title, description, idea, projects = [], status, content }) {
  const from = `problems/${page.fileSlug}.md`;
  const ideaOf = finder(collections.ideas ?? [], "idea");
  const projectOf = finder(collections.projects ?? [], "project");
  const built = projects.map((slug) => projectOf(slug, from));


  return `<main><article>
${trail([idea && step("idea", ideaOf(idea, from)), here("problem"), ...built.map((p, n) => step("project", p, n))])}
<h1>${esc(title)}</h1>
<p class="meta">${stamp(page.date, longDate)}${status ? ` · ${esc(status)}` : ""}</p>
<div class="prose">${content}</div>
${built.length ? `<h2>What got built</h2>
<ul class="plain">${built.map((p) => `<li>${mark("project")}<a href="${p.url}">${esc(p.data.title)}</a><small>${summary(p)}</small></li>`).join("")}</ul>` : ""}
</article></main>
${posting({ site, page, title, description })}`;
}
