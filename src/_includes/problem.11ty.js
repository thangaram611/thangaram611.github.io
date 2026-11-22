import { esc, finder, ideaUrl, longDate, mark } from "./ui.js";

export const data = { layout: "base.11ty.js" };

export function render({ collections, page, title, idea, projects = [], status, content }) {
  const from = `problems/${page.fileSlug}.md`;
  const ideas = collections.ideas ?? [];
  const ideaOf = finder(ideas, "idea");
  const projectOf = finder(collections.projects ?? [], "project");
  const built = projects.map((slug) => projectOf(slug, from));

  // The trail places this problem between its idea and what got built; alone, it has nothing to show.
  const around = [
    idea && `<a href="${ideaUrl(idea, ideas)}">${mark("idea")}${esc(ideaOf(idea, from).data.title)}</a>`,
    `<span aria-current="page">${mark("problem")}this problem</span>`,
    ...built.map((p, n) => `<a${n ? ' class="sib"' : ""} href="${p.url}">${mark("project")}${esc(p.data.title)}</a>`),
  ].filter(Boolean);
  const trail = around.length > 1 ? `<nav class="trail" aria-label="Where this sits">${around.join("")}</nav>` : "";

  return `<main><article>
${trail}
<h1>${esc(title)}</h1>
<p class="meta">${longDate(page.date)}${status ? ` · ${esc(status)}` : ""}</p>
<div class="prose">${content}</div>
${built.length ? `<h2>What got built</h2>
<ul class="plain">${built.map((p) => `<li>${mark("project")}<a href="${p.url}">${esc(p.data.title)}</a><small>${esc(p.data.line)}</small></li>`).join("")}</ul>` : ""}
</article></main>`;
}
