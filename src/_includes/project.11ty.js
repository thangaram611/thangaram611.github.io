import { esc, ideaUrl, mark, newestFirst, shortDate } from "./ui.js";

export const data = { layout: "base.11ty.js" };

export function render({ collections, page, title, line, meta, url, content }) {
  const slug = page.fileSlug;
  const allIdeas = collections.ideas ?? [];
  const problems = newestFirst((collections.problems ?? []).filter((p) => (p.data.projects ?? []).includes(slug)));
  const ideas = newestFirst(allIdeas.filter((i) => i.data.project === slug || problems.some((p) => p.data.idea === i.fileSlug)));
  const list = (kind, items, href) =>
    `<ul class="plain">${items.map((i) => `<li>${mark(kind)}<a href="${href(i)}">${esc(i.data.title)}</a><small>${shortDate(i.date)}</small></li>`).join("")}</ul>`;

  return `<main><article>
<h1>${esc(title)}</h1>
<p class="meta">${esc(meta)}</p>
<p class="lede">${esc(line)}</p>
${content}
${url ? `<p><a class="btn" href="${url}">Open the repository ↗</a></p>` : ""}
${problems.length ? `<h2>Problems it answers</h2>${list("problem", problems, (p) => p.url)}` : ""}
${ideas.length ? `<h2>Ideas behind it</h2>${list("idea", ideas, (i) => ideaUrl(i.fileSlug, allIdeas))}` : ""}
</article></main>`;
}
