import { isoDate } from "./_includes/ui.js";
import site from "./_data/site.js";

// Every page that exists right now. A piece carries its date.
export const data = { permalink: "/sitemap.xml", eleventyExcludeFromCollections: true };

export function render({ collections }) {
  const entries = collections.all
    .filter((item) => item.url && item.url.endsWith("/")) // pages only: not the feed
    .map((item) => {
      const dated = ["ideas", "problems", "projects"].some((kind) => item.data.tags?.includes(kind)) ? `<lastmod>${isoDate(item.date)}</lastmod>` : "";
      return `<url><loc>${new URL(item.url, site.url).href}</loc>${dated}</url>`;
    });
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join("\n")}
</urlset>
`;
}
