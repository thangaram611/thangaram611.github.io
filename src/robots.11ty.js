import site from "./_data/site.js";

// Everything may be crawled, including by the crawlers AI search engines use; the sitemap lists what exists.
export const data = { permalink: "/robots.txt", eleventyExcludeFromCollections: true };

export const render = () => `User-agent: *
Allow: /

Sitemap: ${site.url}sitemap.xml
`;
