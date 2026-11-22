import { esc, finder, FRONT, journey, jsonLd, leaf, mark, road, summary } from "./_includes/ui.js";
import site from "./_data/site.js";

export const data = { layout: "base.11ty.js", title: site.title, permalink: "/" };

const KINDS = [
  { kind: "idea", label: "Ideas", section: "ideas", width: "minmax(0, 1fr)" },
  { kind: "problem", label: "Problems", section: "problems", width: "minmax(0, 1.3fr)" },
  { kind: "project", label: "Projects", section: "projects", width: "minmax(0, 1.15fr)" },
];

// One row per thread: the idea it started from, the problem written up, and what got built. Newest first.
// A project that no idea or problem leads to yet is a thread of its own, at the date it began.
function threads(ideas, problems, projects) {
  const rows = problems.map((p) => ({ date: p.date, idea: p.data.idea, problem: p, projects: p.data.projects ?? [] }));
  const told = new Set(rows.map((r) => r.idea));
  for (const idea of ideas) {
    if (told.has(idea.fileSlug)) continue;
    rows.push({ date: idea.date, idea: idea.fileSlug, projects: idea.data.project ? [idea.data.project] : [], link: idea.data.link });
  }
  const built = new Set(rows.flatMap((r) => r.projects));
  for (const p of projects) if (!built.has(p.fileSlug)) rows.push({ date: p.date, projects: [p.fileSlug] });
  return rows.sort((a, b) => b.date - a.date);
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

// Something an idea became outside this site. Its one line is where the link leads.
function outside({ url, label }) {
  const { host, pathname } = new URL(url);
  return `<div class="it">${mark("project")}<a href="${url}">${esc(label)} ↗</a><small>${esc(host + pathname.replace(/\/$/, ""))}</small></div>`;
}

// One piece on the map: its mark, its title, and the one line about it.
const item = (kind, piece) => `<div class="it">${mark(kind)}<a href="${piece.url}">${esc(piece.data.title)}</a><small>${summary(piece)}</small></div>`;

// The map of threads. Only the newest FRONT are shown, and a column exists only if one of them fills it.
function map(collections) {
  const ideas = collections.ideas ?? [];
  const problems = collections.problems ?? [];
  const projects = collections.projects ?? [];
  const ideaOf = finder(ideas, "idea");
  const projectOf = finder(projects, "project");

  const all = threads(ideas, problems, projects);
  const rows = all.slice(0, FRONT).map((row) => {
    const from = row.problem ? `problems/${row.problem.fileSlug}.md` : row.idea ? `ideas/${row.idea}.md` : `projects/${row.projects[0]}.md`;
    return {
      date: row.date,
      idea: row.idea ? item("idea", ideaOf(row.idea, from)) : "",
      problem: row.problem ? item("problem", row.problem) : "",
      project: row.link ? outside(row.link) : row.projects.map((slug) => item("project", projectOf(slug, from))).join(""),
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
    const lead = `<i class="lead" style="grid-column:1/${first + 2}"></i>`; // from the stop on the road to the thread's first piece
    const cells = columns.map(({ kind }, col) => `<div class="c ${kind}" style="grid-column:${col + 2}">${row[kind]}</div>`);
    return `<div class="row" role="row" style="--i:${n}">${road}${leaf(row.date)}${lead}${wire}${cells.join("")}</div>`;
  });
  const sections = columns.filter(({ kind }) => counts[kind]).map(({ label, section }) => `<a href="/${section}/">${label}</a>`);

  return `<section>
<div class="map" role="table" aria-label="How ideas, problems and projects connect" style="--cols:${columns.map((c) => c.width).join(" ")}">
<div class="heads" role="row"><span></span>${heads.join("")}</div>
${journey(lines, ' role="rowgroup"')}
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
