import { feedPlugin } from "@11ty/eleventy-plugin-rss";
import site from "./src/_data/site.js";

export default function (eleventyConfig) {
  // The tests set SITE_INPUT to build the same templates against a folder of made-up pieces.
  // It is read here, on every build, because this module is loaded only once per process.
  const input = process.env.SITE_INPUT ?? "src";
  eleventyConfig.setInputDirectory(input);
  eleventyConfig.setOutputDirectory("_site");
  eleventyConfig.addPassthroughCopy({ [`${input}/site.css`]: "site.css" });

  // A piece marked `draft: true` shows in `npm run dev` and is left out of the published build.
  eleventyConfig.addPreprocessor("drafts", "md", (data) => {
    if (data.draft && process.env.ELEVENTY_RUN_MODE === "build") return false;
  });

  eleventyConfig.addPlugin(feedPlugin, {
    type: "atom",
    outputPath: "/feed.xml",
    collection: { name: "problems", limit: 20 },
    metadata: {
      language: "en",
      title: site.title,
      subtitle: site.description,
      base: site.url,
      author: { name: site.author },
    },
  });

  // Markdown is left as written, so code samples containing {{ }} or {% %} are not treated as template tags.
  return { markdownTemplateEngine: false };
}
