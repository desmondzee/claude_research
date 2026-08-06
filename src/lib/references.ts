import { getBooks } from "@/lib/book";
import { CURATED } from "@/lib/curated-references";

export type ReferenceKind =
  "paper" | "dataset" | "benchmark" | "system" | "lab" | "company" | "project";

export type Reference = {
  name: string;
  /** Other strings a reader might type, lowercase. */
  aliases: string[];
  kind: ReferenceKind;
  url: string;
  /** Searched and displayed. */
  note: string;
  /** Displayed only — where in the library this came up. */
  context: string;
};

/*
  Outlets that report on the field rather than belong to it. A link to one of these is
  never the canonical home page of the thing the section is about.
*/
const NOT_HOMEPAGES = new Set([
  "therobotreport.com",
  "techcrunch.com",
  "reuters.com",
  "spectrum.ieee.org",
  "prnewswire.com",
  "electrek.co",
  "docs.google.com",
  "news.mit.edu",
  "news.stanford.edu",
  "aboutamazon.com",
  "nature.com",
  "science.org",
  "mdpi.com",
  "frontiersin.org",
  "link.springer.com",
  "springer.com",
  "journals.plos.org",
  "sciencedirect.com",
  "jneuroengrehab.biomedcentral.com",
  "ieeexplore.ieee.org",
  "journals.sagepub.com",
  "dl.acm.org",
  "openreview.net",
  "iso.org",
  "pmc.ncbi.nlm.nih.gov",
  "ncbi.nlm.nih.gov",
  "arxiv.org",
  "en.wikipedia.org",
  "x.com",
  "twitter.com",
  "linkedin.com",
  "youtube.com",
]);

function host(url: string): string {
  const found = url.match(/^https?:\/\/([^/]+)/);
  if (!found) return "";
  return found[1].toLowerCase().replace(/^www\./, "");
}

function tokens(text: string): Set<string> {
  return new Set(text.toLowerCase().match(/[a-z0-9]+/g) ?? []);
}

function classify(name: string, domain: string): ReferenceKind {
  if (/\b(lab|laboratory|group|centre|center)\b/i.test(name)) return "lab";
  if (domain.includes(".edu")) return "lab";
  if (domain.endsWith("github.io")) return "project";
  return "company";
}

/**
 * The directory chapters profile one lab or company per section, and mark those sections
 * with bolded field labels (`**Data stance:**`, `**Thesis:**`). That marker is what
 * separates a real entity from an ordinary analytical section with a citation in it.
 */
function entitiesFrom(chapterMarkdown: string, context: string): Reference[] {
  const found: Reference[] = [];
  const sections = chapterMarkdown.split(/^#{2,3}\s+(.+)$/m);

  for (let i = 1; i < sections.length; i += 2) {
    const heading = sections[i].trim();
    const body = sections[i + 1] ?? "";

    const fieldLabels = body.match(/\*\*[A-Z][^*]{1,28}[.:]\*\*/g) ?? [];
    if (fieldLabels.length < 2) continue;

    // `2.1 Stanford Vision and Learning Lab (SVL) — Fei-Fei Li` → `Stanford Vision …(SVL)`
    const name = heading
      .replace(/^\d+(\.\d+)*\s+/, "")
      .split(/\s+—\s+/)[0]
      .trim();
    if (name.split(/\s+/).length > 6) continue;

    const links = [...body.matchAll(/\[[^\]]*\]\((https?:\/\/[^)]+)\)/g)].map(
      (match) => match[1],
    );
    /*
      Some entries are only ever cited through the trade press — the books never link
      Unitree's or Tesla's own site. Those still belong in the index; the result row shows
      the destination domain, so the reader can see it is a report rather than a homepage.
    */
    const own = links.filter((url) => !NOT_HOMEPAGES.has(host(url)));
    const candidates = own.length ? own : links;
    if (!candidates.length) continue;

    const first = candidates[0];
    const domain = host(first);

    /*
      Prefer the entity's front door over whichever page the prose happened to cite.
      A domain belongs to the entity if it shares a word with the section heading
      (`Figure AI` / `figure.ai`, and `Boston Dynamics` / `bostondynamics.com` by
      substring), or failing that if the section cites it more than once.
    */
    const label = domain.split(".")[0];
    const named = [...tokens(name)].some(
      (token) =>
        tokens(domain).has(token) ||
        (token.length > 3 && label.includes(token)),
    );

    const counts = new Map<string, number>();
    for (const url of candidates)
      counts.set(host(url), (counts.get(host(url)) ?? 0) + 1);
    const repeated = [...counts.entries()]
      .filter(([, count]) => count > 1)
      .sort((a, b) => b[1] - a[1])[0]?.[0];

    const home = named ? domain : repeated;

    found.push({
      name,
      aliases: [],
      kind: classify(name, domain),
      url: home ? `https://${home}/` : first,
      note: "",
      context,
    });
  }

  return found;
}

/** Every arXiv link the books cite, named by whatever the book called it. */
function papersFrom(markdown: string, context: string): Reference[] {
  const found: Reference[] = [];

  for (const match of markdown.matchAll(
    /\[([^\]]{1,60})\]\((https?:\/\/arxiv\.org\/[^)]+)\)/g,
  )) {
    const label = match[1].replace(/^\[|\]$/g, "").trim();
    if (!label || label.split(/\s+/).length > 8) continue;

    found.push({
      name: label,
      aliases: [],
      kind: "paper",
      url: match[2],
      // A bare `arXiv:2303.04137` is not a topic, so leave it out of the searched text.
      note: /^\[?arxiv:/i.test(label) ? "" : label,
      context,
    });
  }

  return found;
}

/** Two arXiv URLs point at the same paper if they carry the same identifier. */
function identity(reference: Reference): string {
  const arxiv = reference.url.match(/arxiv\.org\/(?:abs|pdf|html)\/([\d.]+)/i);
  return arxiv ? `arxiv:${arxiv[1]}` : reference.url.replace(/\/$/, "");
}

let cache: Promise<Reference[]> | null = null;

/**
 * Everything the library points at outside itself: the labs, companies and papers the
 * books cite, plus a hand-verified list of foundational work the books name without
 * linking. Derived from the books at build time, so a new book extends it for free.
 */
export function getReferences(): Promise<Reference[]> {
  cache ??= (async () => {
    const books = await getBooks();
    const harvested: Reference[] = [];

    for (const book of books) {
      for (const chapter of book.chapters) {
        const context = chapter.label
          ? `${book.title} · ${chapter.label}`
          : book.title;
        harvested.push(...entitiesFrom(chapter.markdown, context));
        harvested.push(...papersFrom(chapter.markdown, context));
      }
    }

    // Curated entries win: they carry real names and notes where the books have bare IDs.
    const byIdentity = new Map<string, Reference>();
    for (const reference of harvested) {
      if (!byIdentity.has(identity(reference)))
        byIdentity.set(identity(reference), reference);
    }
    for (const reference of CURATED) {
      byIdentity.set(identity(reference), reference);
    }

    // A name seen twice is the same thing cited twice.
    const byName = new Map<string, Reference>();
    for (const reference of byIdentity.values()) {
      const key = reference.name.toLowerCase();
      if (!byName.has(key)) byName.set(key, reference);
    }

    return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name));
  })();

  return cache;
}
