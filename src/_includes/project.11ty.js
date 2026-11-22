import { esc, longDate, mark, newestFirst, stamp, summary } from "./ui.js";

export const data = { layout: "base.11ty.js" };

export function render({ collections, page, title, line, meta, url, content }) {
  const slug = page.fileSlug;
  const problems = newestFirst((collections.problems ?? []).filter((p) => (p.data.projects ?? []).includes(slug)));
  const ideas = newestFirst((collections.ideas ?? []).filter((i) => i.data.project === slug || problems.some((p) => p.data.idea === i.fileSlug)));
  const list = (kind, items) =>
    `<ul class="plain">${items.map((i) => `<li>${mark(kind)}<a href="${i.url}">${esc(i.data.title)}</a><small>${summary(i)}</small></li>`).join("")}</ul>`;

  return `<main><article>
<h1>${esc(title)}</h1>
<p class="meta">${stamp(page.date, longDate)} · ${esc(meta)}</p>
<p class="lede">${esc(line)}</p>
${content}
${url ? `<p><a class="btn" href="${url}">Open the repository ↗</a></p>` : ""}
${problems.length ? `<h2>Problems it answers</h2>${list("problem", problems)}` : ""}
${ideas.length ? `<h2>Ideas behind it</h2>${list("idea", ideas)}` : ""}
</article></main>`;
}
