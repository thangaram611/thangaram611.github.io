// The site has no fixed shape: sections, columns and pages exist only when there are pieces for them.
// These tests build the real templates against made-up pieces and check each state.
import assert from "node:assert/strict";
import { cpSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import Eleventy from "@11ty/eleventy";

const KINDS = ["ideas", "problems", "projects"];

// Returns { url: html } for a site holding exactly the given pieces, e.g. { "ideas/x.md": "..." }.
// The scratch copy lives inside the project because Eleventy does not apply a folder's data file
// (its layout and collection) to input outside the project.
async function build(pieces) {
  const input = mkdtempSync(join("test", "site-"));
  try {
    cpSync("src", input, { recursive: true });
    for (const kind of KINDS) {
      for (const file of readdirSync(join(input, kind))) if (file.endsWith(".md")) rmSync(join(input, kind, file));
    }
    for (const [path, text] of Object.entries(pieces)) writeFileSync(join(input, path), text);
    process.env.SITE_INPUT = input;
    const site = new Eleventy(input, join(input, "_out"), { configPath: "eleventy.config.js", quietMode: true });
    return Object.fromEntries((await site.toJSON()).map((page) => [page.url, page.content]));
  } finally {
    delete process.env.SITE_INPUT;
    rmSync(input, { recursive: true });
  }
}

const piece = (fields, body = "Body text.") => `---\n${Object.entries(fields).map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join("\n")}\n---\n\n${body}\n`;
const idea = (title, date, more) => piece({ title, date, ...more });
const problem = (title, date, more) => piece({ title, description: "A summary.", date, ...more });
const project = (title, order) => piece({ title, line: "What it does.", meta: "Some facts", group: "Projects", order });
const count = (html, needle) => html.split(needle).length - 1;
const sectionUrls = (pages) => Object.keys(pages).filter((url) => KINDS.some((kind) => url.startsWith(`/${kind}/`)));
const SITE = "https://thangaram611.github.io";
const listed = (pages) => [...pages["/sitemap.xml"].matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1].replace(SITE, "")).sort();

test("with nothing written, the site is the front page alone", async () => {
  const pages = await build({});
  assert.deepEqual(sectionUrls(pages), []);
  assert.ok(!pages["/"].includes('class="map"'), "no map");
  for (const kind of KINDS) assert.ok(!pages["/"].includes(`href="/${kind}/"`), `no ${kind} link`);
  assert.ok(!pages["/"].includes("feed.xml"), "no feed link");
  assert.deepEqual(listed(pages), ["/"]);
  assert.match(pages["/"], /<meta name="google-site-verification" content="[\w-]{20,}">/, "Search Console ownership tag");
});

test("search engines are told what exists and what each page is", async () => {
  const pages = await build({
    "ideas/wish.md": idea("A wish", "2026-10-01"),
    "problems/snag.md": problem("A snag", "2026-11-01", { idea: "wish", projects: ["tool"] }),
    "projects/tool.md": project("tool", 1),
  });
  assert.match(pages["/robots.txt"], new RegExp(`^Sitemap: ${SITE}/sitemap.xml$`, "m"));
  // Pages only: the feed is not a page. Ideas and problems carry the date they were written.
  assert.deepEqual(listed(pages), ["/", "/ideas/", "/ideas/wish/", "/problems/", "/problems/snag/", "/projects/", "/projects/tool/"]);
  assert.match(pages["/sitemap.xml"], /problems\/snag\/<\/loc><lastmod>2026-11-01<\/lastmod>/);
  assert.match(pages["/sitemap.xml"], /ideas\/wish\/<\/loc><lastmod>2026-10-01<\/lastmod>/);

  const page = pages["/problems/snag/"];
  assert.ok(page.includes(`<link rel="canonical" href="${SITE}/problems/snag/">`));
  assert.ok(page.includes('<meta property="og:type" content="article">'));
  assert.ok(page.includes('<time datetime="2026-11-01">1 November 2026</time>'));
  const about = JSON.parse(page.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);
  assert.deepEqual([about["@type"], about.headline, about.datePublished, about.author.name], ["BlogPosting", "A snag", "2026-11-01", "Thangaram Senthamaraikannan"]);

  // A project has no `description` field: its one line is what search results and link previews show.
  assert.ok(pages["/projects/tool/"].includes('<meta name="description" content="What it does.">'));

  const front = JSON.parse(pages["/"].match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);
  assert.equal(front.mainEntity.name, "Thangaram Senthamaraikannan");
  // Structured data may only repeat what the page shows: the name must be in the visible text too.
  assert.ok(pages["/"].replace(/<script.*?<\/script>/gs, "").replace(/<head>.*?<\/head>/s, "").includes("Thangaram Senthamaraikannan"));
});

test("a problem on its own gets a page and a one-column map, and nothing else appears", async () => {
  const pages = await build({ "problems/alone.md": problem("A lone problem", "2026-11-01") });
  assert.deepEqual(sectionUrls(pages).sort(), ["/problems/", "/problems/alone/"]);
  assert.equal(count(pages["/"], 'role="columnheader"'), 1);
  assert.ok(!pages["/"].includes('href="/ideas/"') && !pages["/"].includes('href="/projects/"'));
  assert.ok(!pages["/problems/alone/"].includes('class="trail"'), "no trail");
  assert.ok(!pages["/problems/alone/"].includes("What got built"));
});

test("a full thread is linked in both directions", async () => {
  const pages = await build({
    "ideas/wish.md": idea("A wish", "2026-10-01"),
    "problems/snag.md": problem("A snag", "2026-11-01", { idea: "wish", projects: ["tool"] }),
    "projects/tool.md": project("tool", 1),
  });
  assert.equal(count(pages["/"], 'role="columnheader"'), 3);
  assert.equal(count(pages["/"], 'class="wire"'), 1);
  assert.match(pages["/problems/snag/"], /href="\/ideas\/wish\/"/);
  assert.match(pages["/problems/snag/"], /href="\/projects\/tool\/"/);
  assert.match(pages["/projects/tool/"], /href="\/problems\/snag\/"/);
  assert.match(pages["/projects/tool/"], /href="\/ideas\/wish\/"/);
  assert.match(pages["/"], /href="\/ideas\/wish\/"/);
  assert.match(pages["/ideas/"], /<h2><a href="\/ideas\/wish\/">A wish<\/a><\/h2>/);
  assert.match(pages["/ideas/"], /Became a problem: <a href="\/problems\/snag\/"/);
  assert.match(pages["/ideas/wish/"], /class="trail".*href="\/problems\/snag\/".*href="\/projects\/tool\/"/s);
  assert.match(pages["/ideas/wish/"], /Became a problem: <a href="\/problems\/snag\/"/);
});

test("an idea has a page of its own that says what became of it", async () => {
  const pages = await build({
    "ideas/open.md": idea("Still a wish", "2026-09-01"),
    "ideas/built.md": idea("Got built", "2026-09-02", { project: "tool", note: "It took a week.", description: "The short version." }),
    "ideas/elsewhere.md": idea("Lives elsewhere", "2026-09-03", { link: { url: "https://example.test/x", label: "a thing" } }),
    "projects/tool.md": project("tool", 1),
  });
  const open = pages["/ideas/open/"];
  assert.ok(open.includes("<h1>Still a wish</h1>") && open.includes("Body text."));
  assert.ok(open.includes('<time datetime="2026-09-01">1 September 2026</time>'));
  assert.ok(open.includes("Still open."));
  assert.ok(!open.includes('class="trail"'), "an idea that led nowhere has no trail");
  assert.ok(open.includes(`<link rel="canonical" href="${SITE}/ideas/open/">`));
  // With no description of its own, an idea is summarised by its title, never by the site's description.
  assert.ok(open.includes('<meta name="description" content="Still a wish">'));

  const built = pages["/ideas/built/"];
  assert.ok(built.includes('<meta name="description" content="The short version.">'));
  assert.match(built, /Became a project: <a href="\/projects\/tool\/">tool<\/a>\. It took a week\./);
  assert.match(built, /class="trail".*href="\/projects\/tool\/"/s);
  assert.match(pages["/projects/tool/"], /href="\/ideas\/built\/"/);
  const about = JSON.parse(built.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);
  assert.deepEqual([about["@type"], about.headline, about.datePublished], ["BlogPosting", "Got built", "2026-09-02"]);

  assert.match(pages["/ideas/elsewhere/"], /Became <a href="https:\/\/example\.test\/x">a thing ↗<\/a>\./);
  // The archive lists each idea by its title and links to its page; the text itself is on the page.
  assert.ok(!pages["/ideas/"].includes("Body text."));
  assert.equal(count(pages["/ideas/"], 'class="note"'), 3);
});

test("the caption over the map names only the kinds that are on it", async () => {
  const caption = (pages) => pages["/"].match(/<p class="cap">How it connects: (.*?)\.<\/p>/)?.[1];
  const wish = idea("A wish", "2026-10-01", { project: "tool" });
  const tool = project("tool", 1);
  const snag = (more) => problem("A snag", "2026-11-01", more);

  assert.equal(caption(await build({ "ideas/wish.md": wish, "projects/tool.md": tool })), "an idea becomes something built");
  assert.equal(caption(await build({ "ideas/wish.md": idea("A wish", "2026-10-01"), "problems/snag.md": snag({ idea: "wish" }) })), "an idea becomes a problem worth writing up");
  assert.equal(caption(await build({ "problems/snag.md": snag({ projects: ["tool"] }), "projects/tool.md": tool })), "a problem becomes something built");
  assert.equal(
    caption(await build({ "ideas/wish.md": wish, "problems/snag.md": snag({ idea: "wish", projects: ["tool"] }), "projects/tool.md": tool })),
    "an idea becomes a problem worth writing up, and a problem becomes something built",
  );
  assert.equal(caption(await build({ "problems/snag.md": snag() })), undefined, "one kind alone needs no caption");
});

test("the front page says the year once, on the first thread and wherever it changes", async () => {
  const pages = await build({
    "problems/late.md": problem("Late", "2026-11-19"),
    "problems/early.md": problem("Early", "2026-11-13"),
    "ideas/old.md": idea("An old wish", "2017-02-25", { project: "tool" }),
    "projects/tool.md": project("tool", 1),
  });
  const dates = [...pages["/"].matchAll(/<div class="row"[^>]*><time datetime="[\d-]+">(.*?)<\/time>/g)].map((m) => m[1]);
  assert.deepEqual(dates, ["19 Nov 2026", "13 Nov", "25 Feb 2017"]);

  // An old thread on its own must still say which year it is from.
  const alone = await build({ "ideas/old.md": idea("An old wish", "2017-02-25") });
  assert.match(alone["/"], /<time datetime="2017-02-25">25 Feb 2017<\/time>/);
});

test("archives split into pages, the front page shows only the newest threads, and every idea keeps its page", async () => {
  const day = (n) => new Date(Date.UTC(2026, 0, 1 + n)).toISOString().slice(0, 10);
  const pieces = { "problems/old.md": problem("About the oldest idea", "2026-06-01", { idea: "idea-00" }) };
  for (let n = 0; n < 45; n++) pieces[`ideas/idea-${String(n).padStart(2, "0")}.md`] = idea(`Idea ${n}`, day(n));
  const pages = await build(pieces);

  assert.deepEqual(sectionUrls(pages).filter((url) => /^\/ideas\/(\d+\/)?$/.test(url)).sort(), ["/ideas/", "/ideas/2/", "/ideas/3/"]);
  assert.equal(sectionUrls(pages).filter((url) => /^\/ideas\/idea-\d+\/$/.test(url)).length, 45);
  assert.equal(count(pages["/ideas/"], 'class="note"'), 20);
  assert.equal(count(pages["/ideas/3/"], 'class="note"'), 5);
  assert.match(pages["/ideas/2/"], /href="\/ideas\/"[^>]*>← Previous.*Page 2 of 3.*href="\/ideas\/3\/"[^>]*>Next →/s);

  assert.equal(count(pages["/"], 'class="row"'), 8);
  assert.match(pages["/"], /8 most recent threads of 45/);

  // Whichever archive page lists it, an idea keeps one address.
  assert.match(pages["/problems/old/"], /href="\/ideas\/idea-00\/"/);
  assert.match(pages["/ideas/3/"], /href="\/ideas\/idea-00\/"/);
  assert.ok(pages["/ideas/idea-00/"]);
});

test("a link to a piece that does not exist fails the build", async () => {
  const failure = await build({ "problems/typo.md": problem("Typo", "2026-11-01", { projects: ["nope"] }) }).then(
    () => null,
    (error) => error,
  );
  assert.ok(failure, "the build should fail");
  const chain = [];
  for (let e = failure; e; e = e.originalError ?? e.cause) chain.push(e.message);
  assert.match(chain.join("\n"), /links to project "nope", which is missing or still a draft/);
});
