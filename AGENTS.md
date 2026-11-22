# thangaram611.github.io

A personal site built with Eleventy. Templates are plain JavaScript (`src/**/*.11ty.js`) and pieces are markdown. The [README](README.md) is the documentation; this file holds only what must be known before touching anything.

## Commands

```bash
npm test        # builds the real templates in each state of the site
npm run dev     # local preview, drafts included, at http://localhost:8080
npm run build   # the published site, into _site/
```

## Rules

- **A push to `main` publishes.** The tests run, then the site deploys.
- **The repository is public.** Unpublished writing lives in `_drafts/`, which git ignores. Its text never goes into a tracked file or a commit message.
- **The site has no fixed shape.** Every template must hold with nothing written, with one piece and with many. A template change comes with its state in `test/states.test.js`.
- **Pieces link by file name.** A link to a missing or draft piece fails the build, on purpose.

## Publishing a piece

Unpublished pieces wait in `_drafts/pieces/`, laid out like `src/`. Move the piece into `src/` together with every idea and project it names, remove `draft: true` from each, then run `npm test` and `npm run build`.

## More

- [Adding a piece](README.md#adding-a-piece): folders and header fields
- [Being found](README.md#being-found): titles, descriptions, and what the build adds
- [Drafts](README.md#drafts)
- [When it grows](README.md#when-it-grows): page sizes
