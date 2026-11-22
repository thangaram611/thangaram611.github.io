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

test("with nothing written, the site is the front page alone", async () => {
  const pages = await build({});
  assert.deepEqual(sectionUrls(pages), []);
  assert.ok(!pages["/"].includes('class="map"'), "no map");
  for (const kind of KINDS) assert.ok(!pages["/"].includes(`href="/${kind}/"`), `no ${kind} link`);
  assert.ok(!pages["/"].includes("feed.xml"), "no feed link");
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
  assert.match(pages["/problems/snag/"], /href="\/ideas\/#wish"/);
  assert.match(pages["/problems/snag/"], /href="\/projects\/tool\/"/);
  assert.match(pages["/projects/tool/"], /href="\/problems\/snag\/"/);
  assert.match(pages["/projects/tool/"], /href="\/ideas\/#wish"/);
  assert.match(pages["/ideas/"], /Became a problem: <a href="\/problems\/snag\/"/);
});

test("archives split into pages, the front page shows only the newest threads, and idea links follow", async () => {
  const day = (n) => new Date(Date.UTC(2026, 0, 1 + n)).toISOString().slice(0, 10);
  const pieces = { "problems/old.md": problem("About the oldest idea", "2026-06-01", { idea: "idea-00" }) };
  for (let n = 0; n < 45; n++) pieces[`ideas/idea-${String(n).padStart(2, "0")}.md`] = idea(`Idea ${n}`, day(n));
  const pages = await build(pieces);

  assert.deepEqual(sectionUrls(pages).filter((url) => url.startsWith("/ideas/")).sort(), ["/ideas/", "/ideas/2/", "/ideas/3/"]);
  assert.equal(count(pages["/ideas/"], 'class="note"'), 20);
  assert.equal(count(pages["/ideas/3/"], 'class="note"'), 5);
  assert.match(pages["/ideas/2/"], /href="\/ideas\/"[^>]*>← Previous.*Page 2 of 3.*href="\/ideas\/3\/"[^>]*>Next →/s);

  assert.equal(count(pages["/"], 'class="row"'), 8);
  assert.match(pages["/"], /8 most recent threads of 45/);

  // The oldest idea sits on the last archive page; its problem must link there, and the anchor must exist.
  assert.match(pages["/problems/old/"], /href="\/ideas\/3\/#idea-00"/);
  assert.ok(pages["/ideas/3/"].includes('id="idea-00"'));
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
