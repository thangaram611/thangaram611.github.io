import { isoDate } from "./_includes/ui.js";
import site from "./_data/site.js";

// Every page that exists right now. Problems carry the date they were written.
export const data = { permalink: "/sitemap.xml", eleventyExcludeFromCollections: true };

export function render({ collections }) {
  const entries = collections.all
    .filter((item) => item.url && item.url.endsWith("/")) // pages only: no feed, no ideas (they are anchors, not pages)
    .map((item) => {
      const dated = item.data.tags?.includes("problems") ? `<lastmod>${isoDate(item.date)}</lastmod>` : "";
      return `<url><loc>${new URL(item.url, site.url).href}</loc>${dated}</url>`;
    });
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join("\n")}
</urlset>
`;
}
