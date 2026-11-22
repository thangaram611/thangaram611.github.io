import { esc } from "./ui.js";

export function render({ site, page, collections, pagination, title, description, ogType = "website", content }) {
  // A section is linked only once it has something in it.
  const nav = ["ideas", "problems", "projects"]
    .filter((s) => collections[s]?.length)
    .map((s) => `<a href="/${s}/"${page.url.startsWith(`/${s}/`) ? ' aria-current="page"' : ""}>${s[0].toUpperCase() + s.slice(1)}</a>`)
    .join("");
  const feed = collections.pieces?.length;
  const summary = esc(description ?? site.description);
  const paged = pagination?.pageNumber ? `${title}, page ${pagination.pageNumber + 1}` : title;
  const fullTitle = title === site.title ? site.title : `${paged} · ${site.title}`;
  const address = new URL(page.url, site.url).href;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${summary}">
<meta name="author" content="${esc(site.author)}">
<link rel="canonical" href="${address}">
<meta name="google-site-verification" content="${site.googleVerification}">
<meta property="og:type" content="${ogType}">
<meta property="og:site_name" content="${esc(site.title)}">
<meta property="og:url" content="${address}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${summary}">
<meta property="og:image" content="${site.url}${site.image}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
${ogType === "article" ? `<meta property="article:published_time" content="${page.date.toISOString()}">` : ""}
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
${feed ? `<link rel="alternate" type="application/atom+xml" title="${esc(site.title)}" href="/feed.xml">` : ""}
<link rel="stylesheet" href="/site.css">
</head>
<body>
<header><a class="home" href="/"><span>$</span> thangaram</a><nav>${nav}<a class="ext" href="${site.github}">GitHub</a>${feed ? `<a class="ext" href="/feed.xml">RSS</a>` : ""}</nav></header>
${content}
<footer><a href="/">${esc(site.author)}</a><a href="${site.github}">GitHub</a><a href="${site.linkedin}">LinkedIn</a></footer>
</body>
</html>
`;
}
