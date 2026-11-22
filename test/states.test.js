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
const idea = (title, date, more) => piece({ title, description: "A wish, in a line.", date, ...more });
const problem = (title, date, more) => piece({ title, description: "A summary.", date, ...more });
const project = (title, date = "2026-08-01", more) => piece({ title, line: "What it does.", meta: "Some facts", group: "Projects", date, ...more });
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
  assert.equal(count(pages["/"], '<meta name="theme-color"'), 2, "the browser's own bar takes the page colour, light and dark");
});

test("search engines are told what exists and what each page is", async () => {
  const pages = await build({
    "ideas/wish.md": idea("A wish", "2026-10-01"),
    "problems/snag.md": problem("A snag", "2026-11-01", { idea: "wish", projects: ["tool"] }),
    "projects/tool.md": project("tool"),
  });
  assert.match(pages["/robots.txt"], new RegExp(`^Sitemap: ${SITE}/sitemap.xml$`, "m"));
  // Pages only: the feed is not a page. Ideas and problems carry the date they were written.
  assert.deepEqual(listed(pages), ["/", "/ideas/", "/ideas/wish/", "/problems/", "/problems/snag/", "/projects/", "/projects/tool/"]);
  assert.match(pages["/sitemap.xml"], /problems\/snag\/<\/loc><lastmod>2026-11-01<\/lastmod>/);
  assert.match(pages["/sitemap.xml"], /ideas\/wish\/<\/loc><lastmod>2026-10-01<\/lastmod>/);
  assert.match(pages["/sitemap.xml"], /projects\/tool\/<\/loc><lastmod>2026-08-01<\/lastmod>/);

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
    "projects/tool.md": project("tool"),
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
    "projects/tool.md": project("tool"),
  });
  const open = pages["/ideas/open/"];
  assert.ok(open.includes("<h1>Still a wish</h1>") && open.includes("Body text."));
  assert.ok(open.includes('<time datetime="2026-09-01">1 September 2026</time>'));
  assert.ok(open.includes("Still open."));
  assert.ok(!open.includes('class="trail"'), "an idea that led nowhere has no trail");
  assert.ok(open.includes(`<link rel="canonical" href="${SITE}/ideas/open/">`));
  assert.ok(open.includes('<meta name="description" content="A wish, in a line.">'));

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

test("the feed carries every piece, newest first", async () => {
  const pages = await build({
    "ideas/wish.md": idea("A wish", "2026-10-01", { project: "tool" }),
    "problems/snag.md": problem("A snag", "2026-11-01"),
    "projects/tool.md": project("tool"),
  });
  const entries = [...pages["/feed.xml"].matchAll(/<entry>\s*<title>(.*?)<\/title>\s*<link href="(.*?)"/g)].map((m) => [m[1], m[2]]);
  assert.deepEqual(entries, [["A snag", `${SITE}/problems/snag/`], ["A wish", `${SITE}/ideas/wish/`], ["tool", `${SITE}/projects/tool/`]]);
  // Any one piece is enough for the feed to exist and be linked.
  const projectOnly = await build({ "projects/tool.md": project("tool") });
  assert.ok(projectOnly["/"].includes('href="/feed.xml"') && projectOnly["/feed.xml"].includes("<title>tool</title>"));
});

test("a list that runs through time is a road: every piece is a stop with its full date, projects included", async () => {
  // A date beside a stop is a leaf: day, month, year in three parts that still read as one date.
  const dates = (html) => [...html.matchAll(/<time class="when" datetime="[\d-]+">(.*?)<\/time>/g)].map((m) => m[1].replace(/<[^>]+>/g, ""));
  const pages = await build({
    "problems/late.md": problem("Late", "2026-11-19"),
    "problems/early.md": problem("Early", "2026-11-13"),
    "ideas/old.md": idea("An old wish", "2017-02-25", { project: "tool" }),
    "projects/tool.md": project("tool", "2017-02-25"),
    "projects/loose.md": project("loose", "2026-03-01", { group: "Elsewhere" }),
  });
  // The front page: one stop per thread, newest first. A project with no thread is a stop of its own, at its date.
  assert.deepEqual(dates(pages["/"]), ["19 Nov 2026", "13 Nov 2026", "1 Mar 2026", "25 Feb 2017"]);
  assert.equal(count(pages["/"], 'class="journey"'), 1);
  assert.equal(count(pages["/"], 'class="road"'), 5, "the approach, then one stretch of road leaving each stop");

  assert.deepEqual(dates(pages["/problems/"]), ["19 Nov 2026", "13 Nov 2026"]);
  assert.equal(count(pages["/problems/"], 'class="road"'), 3);
  // Projects are dated like everything else: newest first, each group on a road of its own, the newest group first.
  assert.deepEqual(dates(pages["/projects/"]), ["1 Mar 2026", "25 Feb 2017"]);
  assert.match(pages["/projects/"], /Elsewhere<\/h2>.*class="journey".*>loose<.*Projects<\/h2>.*class="journey".*>tool</s);
  assert.ok(pages["/projects/tool/"].includes('<time datetime="2017-02-25">25 February 2017</time>'));

  // One piece is still a stop on the road.
  const alone = await build({ "ideas/old.md": idea("An old wish", "2017-02-25") });
  assert.deepEqual(dates(alone["/"]), ["25 Feb 2017"]);
  assert.equal(count(alone["/"], 'class="road"'), 2);
  assert.ok(!alone["/"].includes("How it connects"));
});

test("wherever a piece is listed, its one-line description is beside its title", async () => {
  const pages = await build({
    "ideas/wish.md": idea("A wish", "2026-10-01", { description: "Why I wanted it." }),
    "problems/snag.md": problem("A snag", "2026-11-01", { idea: "wish", projects: ["tool"] }),
    "problems/again.md": problem("Again", "2026-11-02", { projects: ["tool"] }),
    "projects/tool.md": project("tool"),
  });
  const beside = (html, title, text) => new RegExp(`>${title}</a>(</h2>)?<(small|p)>${text}</(small|p)>`).test(html);
  // The map: every kind, and a project each time it appears, not only the first.
  assert.ok(beside(pages["/"], "A wish", "Why I wanted it."));
  assert.ok(beside(pages["/"], "A snag", "A summary."));
  assert.equal(count(pages["/"], ">tool</a><small>What it does.</small>"), 2);
  // The archives.
  assert.ok(beside(pages["/ideas/"], "A wish", "Why I wanted it."));
  assert.ok(beside(pages["/problems/"], "A snag", "A summary."));
  // The lists on a piece's own page.
  assert.ok(beside(pages["/projects/tool/"], "A snag", "A summary."));
  assert.ok(beside(pages["/projects/tool/"], "A wish", "Why I wanted it."));
  assert.ok(beside(pages["/problems/snag/"], "tool", "What it does."));

  // Something an idea became outside the site is not a piece; its line says where the link leads.
  const away = await build({ "ideas/gone.md": idea("Gone elsewhere", "2026-10-01", { link: { url: "https://example.test/x/", label: "a thing" } }) });
  assert.ok(away["/"].includes('<a href="https://example.test/x/">a thing ↗</a><small>example.test/x</small>'));

  // A piece with no description cannot be listed, so the build says which file to fix.
  const failure = await build({ "ideas/bare.md": piece({ title: "Bare", date: "2026-10-01" }) }).then(() => null, (error) => error);
  const chain = [];
  for (let e = failure; e; e = e.originalError ?? e.cause) chain.push(e.message);
  assert.match(chain.join("\n"), /ideas\/bare\.md has no description/);
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
