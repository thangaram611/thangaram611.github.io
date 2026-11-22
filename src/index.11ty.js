import { FRONT, dayMonth, esc, finder, ideaUrl, jsonLd, mark, stamp } from "./_includes/ui.js";
import site from "./_data/site.js";

export const data = { layout: "base.11ty.js", title: site.title, permalink: "/" };

const KINDS = [
  { kind: "idea", label: "Ideas", section: "ideas", width: "minmax(0, 1fr)" },
  { kind: "problem", label: "Problems", section: "problems", width: "minmax(0, 1.3fr)" },
  { kind: "project", label: "Projects", section: "projects", width: "minmax(0, 1.15fr)" },
];

// One row per thread: the idea it started from, the problem written up, and what got built.
// Every piece appears exactly once, newest thread first; projects with no thread yet come last.
function threads(ideas, problems, projects) {
  const rows = problems.map((p) => ({ date: p.date, idea: p.data.idea, problem: p, projects: p.data.projects ?? [] }));
  const told = new Set(rows.map((r) => r.idea));
  for (const idea of ideas) {
    if (told.has(idea.fileSlug)) continue;
    rows.push({ date: idea.date, idea: idea.fileSlug, projects: idea.data.project ? [idea.data.project] : [], link: idea.data.link });
  }
  rows.sort((a, b) => b.date - a.date);
  const built = new Set(rows.flatMap((r) => r.projects));
  return [...rows, ...projects.filter((p) => !built.has(p.fileSlug)).map((p) => ({ projects: [p.fileSlug] }))];
}

// The headline, drawn: what other people make rests on the layers I build.
// Isometric slabs, top to bottom. The top one is theirs, so it is dashed and its label alternates.
function stack() {
  const cx = 322, w = 130, h = 75, depth = 14, step = 62;
  const layers = [
    { labels: ["somebody's product", "somebody's agent"] },
    { labels: ["SDKs · CLI · runtime"], mine: true },
    { labels: ["platform"], mine: true },
  ];
  const drawn = layers.map(({ labels, mine }, n) => {
    const y = 6 + n * step;
    const top = `${cx},${y} ${cx + w},${y + h} ${cx},${y + 2 * h} ${cx - w},${y + h}`;
    const left = `${cx - w},${y + h} ${cx},${y + 2 * h} ${cx},${y + 2 * h + depth} ${cx - w},${y + h + depth}`;
    const right = `${cx + w},${y + h} ${cx},${y + 2 * h} ${cx},${y + 2 * h + depth} ${cx + w},${y + h + depth}`;
    const text = labels.map((label) => `<text x="${cx - w - 24}" y="${y + h + 4}">${esc(label)}</text>`).join("");
    return `<g class="layer${mine ? " mine" : ""}" style="--n:${layers.length - 1 - n}"><g class="slab">
<polygon class="l" points="${left}"/><polygon class="r" points="${right}"/><polygon class="t" points="${top}"/>
</g><line x1="${cx - w - 16}" y1="${y + h}" x2="${cx - w - 3}" y2="${y + h}"/>${text}</g>`;
  });
  // Lower layers are drawn first so the ones above overlap them.
  return `<svg class="stack" viewBox="0 0 454 302" role="img" aria-label="Somebody else's product, or agent, resting on the layers I build: SDKs, CLI and runtime, with the platform beneath.">${drawn.reverse().join("")}</svg>`;
}

const item = (kind, href, title, sub) =>
  `<div class="it">${mark(kind)}<a href="${href}">${title}</a>${sub ? `<small>${esc(sub)}</small>` : ""}</div>`;

// The map of threads. Only the newest FRONT are shown, and a column exists only if one of them fills it.
function map(collections) {
  const ideas = collections.ideas ?? [];
  const problems = collections.problems ?? [];
  const projects = [...(collections.projects ?? [])].sort((a, b) => a.data.order - b.data.order);
  const ideaOf = finder(ideas, "idea");
  const projectOf = finder(projects, "project");
  const described = new Set(); // a project's one-line description is shown only the first time it appears

  const all = threads(ideas, problems, projects);
  const rows = all.slice(0, FRONT).map((row) => {
    const from = row.problem ? `problems/${row.problem.fileSlug}.md` : `ideas/${row.idea}.md`;
    const made = row.projects.map((slug) => {
      const p = projectOf(slug, from);
      const sub = described.has(slug) ? "" : p.data.line;
      described.add(slug);
      return item("project", p.url, esc(p.data.title), sub);
    });
    return {
      date: row.date,
      idea: row.idea ? item("idea", ideaUrl(row.idea, ideas), esc(ideaOf(row.idea, from).data.title)) : "",
      problem: row.problem ? item("problem", row.problem.url, esc(row.problem.data.title)) : "",
      project: row.link ? item("project", row.link.url, `${esc(row.link.label)} ↗`) : made.join(""),
    };
  });
  if (!rows.length) return "";

  const columns = KINDS.filter(({ kind }) => rows.some((row) => row[kind]));
  const counts = { idea: ideas.length, problem: problems.length, project: projects.length };
  const heads = columns.map(({ kind, label, section }) =>
    counts[kind] ? `<a role="columnheader" href="/${section}/">${mark(kind)}${label} <em>${counts[kind]}</em></a>` : `<span role="columnheader">${mark(kind)}${label}</span>`,
  );
  const lines = rows.map((row, n) => {
    const filled = columns.map(({ kind }) => Boolean(row[kind]));
    const first = filled.indexOf(true);
    const last = filled.lastIndexOf(true);
    const wire = last > first ? `<i class="wire" style="grid-column:${first + 2}/${last + 2}"></i>` : "";
    const cells = columns.map(({ kind }, col) => `<div class="c ${kind}" style="grid-column:${col + 2}">${row[kind]}</div>`);
    return `<div class="row" role="row" style="--i:${n}">${row.date ? stamp(row.date, dayMonth) : "<time></time>"}${wire}${cells.join("")}</div>`;
  });
  const sections = columns.filter(({ kind }) => counts[kind]).map(({ label, section }) => `<a href="/${section}/">${label}</a>`);

  return `<section>
${columns.length > 1 ? `<p class="cap">How it connects: an idea becomes a problem worth writing up, and a problem becomes something built.</p>` : ""}
<div class="map" role="table" aria-label="How ideas, problems and projects connect" style="--cols:${columns.map((c) => c.width).join(" ")}">
<div class="heads" role="row"><span></span>${heads.join("")}</div>
${lines.join("\n")}
</div>
${all.length > FRONT ? `<p class="more">These are the ${FRONT} most recent threads of ${all.length}. The rest are under ${new Intl.ListFormat("en-GB").format(sections)}.</p>` : ""}
</section>`;
}

export function render({ collections }) {
  // The front page is a profile of one person; this says so in the form search engines read.
  const who = jsonLd({
    "@type": "ProfilePage",
    mainEntity: {
      "@type": "Person",
      "@id": `${site.url}#me`,
      name: site.author,
      description: "Platform engineer in Chennai.",
      url: site.url,
      sameAs: [site.github, site.linkedin],
    },
  });
  return `<main class="wide">
<section class="hero">
<div>
<h1>I build the layer other engineers build on.</h1>
<p>Platform engineer in Chennai. A serverless platform, its SDKs and its CLI at Zoho, and now a runtime for AI agents. This is where I keep what I wish existed, what went wrong, and what I built about it.</p>
</div>
${stack()}
</section>
${map(collections)}
</main>
${who}`;
}
