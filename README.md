Source for [thangaram611.github.io](https://thangaram611.github.io), built with [Eleventy](https://github.com/11ty/buildawesome).

## How the site fills itself in

There is no fixed shape. A section, its link in the header, its archive page and its column on the front-page map exist only when there is at least one piece for them. With nothing written, the site is the front page alone.

## Adding a piece

Each piece is one markdown file. The file name is its address.

| Kind | Folder | Header fields |
| --- | --- | --- |
| Idea | `src/ideas/` | `title`, `date`; optional `project`, `link` (`url`, `label`), `note` |
| Problem | `src/problems/` | `title`, `description`, `date`; optional `idea`, `projects`, `status` |
| Project | `src/projects/` | `title`, `line`, `meta`, `group`, `order`; optional `url` |

A problem names the idea it came from and the projects it led to. Every other link, including the map on the front page, is worked out from those two fields. A link to a piece that is missing or still a draft fails the build.

A problem is written free-flow, but it should cover five things: the problem, what I tried, what already exists, what was missing, and what I did.

## Being found

- The title should be the problem as someone would search for it or ask it, and the first paragraph should say what happened and how it ended. `description` is the one-sentence version shown in search results and link previews.
- The build adds the rest on every page: a canonical address, sharing tags with `src/og.png`, dates that machines can read, and structured data naming the author. It also writes `robots.txt` and a `sitemap.xml` of the pages that exist.
- There is no `llms.txt` on purpose. Google states it is not used, and no measurement so far shows AI search engines reading it.

## When it grows

- The front page shows the 8 most recent threads and points to the archives for the rest.
- Each archive holds 20 pieces a page (`/problems/`, `/problems/2/`, and so on).

Both numbers are at the top of `src/_includes/ui.js`.

## Drafts

Add `draft: true` to a piece's header. It shows in the local preview and is left out of the published site. This repository is public, so a committed draft can still be read here as a file. `_drafts/` is ignored by git and is the place for raw notes.

## Commands

```bash
npm install
npm run dev     # local preview with drafts, at http://localhost:8080
npm test        # builds the templates in each state: empty, one piece, a full thread, many pieces
npm run build   # the published site, into _site/
```

Pushing to `main` runs the tests, then builds and deploys the site.
