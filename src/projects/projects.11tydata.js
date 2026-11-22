export default {
  tags: "projects",
  layout: "project.11ty.js",
  permalink: (data) => `/projects/${data.page.fileSlug}/`,
  // A project's one line is also its summary in search results and link previews.
  eleventyComputed: { description: (data) => data.line },
};
