import { esc } from "./ui.js";

export function render({ site, page, collections, pagination, title, description, content }) {
  // A section is linked only once it has something in it.
  const nav = ["ideas", "problems", "projects"]
    .filter((s) => collections[s]?.length)
    .map((s) => `<a href="/${s}/"${page.url.startsWith(`/${s}/`) ? ' aria-current="page"' : ""}>${s[0].toUpperCase() + s.slice(1)}</a>`)
    .join("");
  const feed = collections.problems?.length;
  const summary = esc(description ?? site.description);
  const paged = pagination?.pageNumber ? `${title}, page ${pagination.pageNumber + 1}` : title;
  const fullTitle = title === site.title ? site.title : `${paged} · ${site.title}`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${summary}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${summary}">
${feed ? `<link rel="alternate" type="application/atom+xml" title="${esc(site.title)}" href="/feed.xml">` : ""}
<link rel="stylesheet" href="/site.css">
</head>
<body>
<header><a class="home" href="/"><span>$</span> thangaram</a><nav>${nav}<a class="ext" href="${site.github}">GitHub</a>${feed ? `<a class="ext" href="/feed.xml">RSS</a>` : ""}</nav></header>
${content}
<footer><a href="/">thangaram</a><a href="${site.github}">GitHub</a><a href="${site.linkedin}">LinkedIn</a></footer>
</body>
</html>
`;
}
