import fs from "node:fs";
import path from "node:path";
import Slugger from "github-slugger";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeKatex from "rehype-katex";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";

const CONTENT_DIR = path.join(process.cwd(), "content");

export type Section = {
  title: string;
  anchor: string;
};

export type Chapter = {
  /** Short URL slug: `chapter-4`, `appendix-b`, `closing-note`. */
  slug: string;
  /** Structural label: `Chapter 4`, `Appendix B`, or empty. */
  label: string;
  title: string;
  heading: string;
  sections: Section[];
  words: number;
  html: string;
  markdown: string;
};

export type Group = {
  title: string;
  chapters: Chapter[];
};

export type Book = {
  slug: string;
  title: string;
  subtitle: string;
  compiled: string;
  frontMatterHtml: string;
  chapters: Chapter[];
  groups: Group[];
  words: number;
};

/* Books carry `$…$` and `$$…$$`, so math is typeset at build time rather than shipped raw. */
const renderer = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkMath)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeRaw)
  .use(rehypeKatex, { throwOnError: false, strict: false })
  .use(rehypeSlug)
  .use(rehypeStringify, { allowDangerousHtml: true });

async function toHtml(markdown: string): Promise<string> {
  const file = await renderer.process(markdown);
  return String(file);
}

/**
 * Turns a chapter heading into a short slug and a structural label. Handles the two
 * conventions the library accepts: `Chapter 4 — Humanoid Manufacturers` and a bare
 * numbered heading like `4. Humanoid Manufacturers`.
 */
function identify(heading: string): {
  slug: string;
  label: string;
  title: string;
} {
  const [rawLabel, ...rest] = heading.split(/\s+—\s+/);
  const title = rest.join(" — ").trim();

  const chapter = rawLabel.match(/^Chapter\s+(\d+)$/i);
  if (chapter) {
    return {
      slug: `chapter-${chapter[1]}`,
      label: `Chapter ${chapter[1]}`,
      title,
    };
  }

  const appendix = rawLabel.match(/^Appendix\s+([A-Z])$/i);
  if (appendix) {
    const letter = appendix[1].toUpperCase();
    return {
      slug: `appendix-${letter.toLowerCase()}`,
      label: `Appendix ${letter}`,
      title,
    };
  }

  // `4. Humanoid Manufacturers` — the numbering carries the same information.
  const numbered = heading.match(/^(\d+)[.)]\s+(.+)$/);
  if (numbered) {
    return {
      slug: `chapter-${numbered[1]}`,
      label: `Chapter ${numbered[1]}`,
      title: numbered[2].trim(),
    };
  }

  return { slug: new Slugger().slug(heading), label: "", title: heading };
}

/** Counts prose the reader actually reads — link targets and markup don't count. */
function countWords(markdown: string): number {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[*_`#|>-]/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
}

/**
 * Reads the Parts (`**Part I — Orientation**`) out of the table of contents so the
 * index reflects the book's own structure rather than an invented one.
 */
function readGroups(tableOfContents: string, chapters: Chapter[]): Group[] {
  const byslug = new Map(chapters.map((chapter) => [chapter.slug, chapter]));
  const claimed = new Set<string>();
  const groups: Group[] = [];

  for (const line of tableOfContents.split("\n")) {
    const heading = line.match(/^\*\*(.+?)\*\*\s*$/);
    if (heading) {
      groups.push({
        title: heading[1].replace(/\s+—\s+/, " — "),
        chapters: [],
      });
      continue;
    }
    if (!groups.length) continue;

    const chapter = line.match(/^[-*]\s+Chapter\s+(\d+)\s*:/i);
    const appendix = line.match(/^[-*]\s+([A-Z])\s*:/);
    const slug = chapter
      ? `chapter-${chapter[1]}`
      : appendix
        ? `appendix-${appendix[1].toLowerCase()}`
        : null;
    if (!slug) continue;

    const found = byslug.get(slug);
    if (found && !claimed.has(slug)) {
      groups[groups.length - 1].chapters.push(found);
      claimed.add(slug);
    }
  }

  const leftover = chapters.filter((chapter) => !claimed.has(chapter.slug));
  if (leftover.length) {
    // A book with no Parts gets one unnamed run rather than a misleading "Closing".
    groups.push({
      title: groups.length ? "Closing" : "Contents",
      chapters: leftover,
    });
  }

  return groups.filter((group) => group.chapters.length > 0);
}

/**
 * The book uses `---` as a divider, but a `---` sitting directly under a paragraph is a
 * setext heading in CommonMark — which turns that paragraph into an `<h2>`. A blank line
 * before the rule keeps it a rule.
 */
function normalize(source: string): string {
  const lines = source.split("\n");
  const out: string[] = [];

  lines.forEach((line, index) => {
    const isRule = /^ {0,3}-{3,}\s*$/.test(line);
    if (isRule && index > 0 && lines[index - 1].trim() !== "") out.push("");
    out.push(line);
  });

  return out.join("\n");
}

/**
 * Lifts a chapter body's headings so its sections always render as `<h2>` whatever depth
 * they had in the source. Keeps the reading column identical across both book shapes.
 */
function promote(body: string, by: number): string {
  if (by <= 0) return body;
  let inFence = false;

  return body
    .split("\n")
    .map((line) => {
      if (/^```/.test(line)) inFence = !inFence;
      if (inFence) return line;
      const heading = line.match(/^(#{2,6})(\s+\S.*)$/);
      if (!heading) return line;
      const depth = Math.max(2, heading[1].length - by);
      return "#".repeat(depth) + heading[2];
    })
    .join("\n");
}

async function parse(slug: string, rawSource: string): Promise<Book> {
  const source = normalize(rawSource);
  const lines = source.split("\n");

  const headings = (depth: number) => {
    const found: number[] = [];
    const marker = new RegExp(`^#{${depth}}\\s+\\S`);
    let inFence = false;
    lines.forEach((line, index) => {
      if (/^```/.test(line)) inFence = !inFence;
      if (!inFence && marker.test(line)) found.push(index);
    });
    return found;
  };

  /*
    Books come in two shapes. Some give each chapter its own `#` under the book title;
    others keep a single `#` title and number their chapters at `##`. Chapters live one
    level below the title either way, so pick the depth that actually divides the book.
  */
  const tops = headings(1);
  const chapterDepth = tops.length > 1 ? 1 : 2;
  const breaks = chapterDepth === 1 ? tops : [tops[0], ...headings(2)];
  const strip = new RegExp(`^#{${chapterDepth}}\\s+`);
  const sectionMarker = new RegExp(`^#{${chapterDepth + 1}}\\s+\\S`);
  const sectionStrip = new RegExp(`^#{${chapterDepth + 1}}\\s+`);

  const title = lines[breaks[0]].replace(/^#\s+/, "").trim();
  const frontMatter = lines.slice(breaks[0] + 1, breaks[1] ?? lines.length);

  const chapters: Chapter[] = [];
  for (let i = 1; i < breaks.length; i++) {
    const heading = lines[breaks[i]].replace(strip, "").trim();
    const body = lines
      .slice(breaks[i] + 1, breaks[i + 1] ?? lines.length)
      .join("\n")
      .trim();
    const slugger = new Slugger();

    chapters.push({
      ...identify(heading),
      heading,
      sections: body
        .split("\n")
        .filter((line) => sectionMarker.test(line))
        .map((line) => {
          const sectionTitle = line.replace(sectionStrip, "").trim();
          return { title: sectionTitle, anchor: slugger.slug(sectionTitle) };
        }),
      words: countWords(body),
      html: await toHtml(promote(body, chapterDepth - 1)),
      markdown: body,
    });
  }

  const subtitle = (frontMatter.find((line) => /^###\s+/.test(line)) ?? "")
    .replace(/^###\s+/, "")
    .trim();
  // Take only the bolded run, so a trailing `· Evidence cut-off: …` stays out of the label.
  const compiled =
    (frontMatter.find((line) => /^\*\*Compiled/.test(line)) ?? "")
      .match(/^\*\*([^*]+)\*\*/)?.[1]
      .trim() ?? "";

  // Strip the title block and the markdown table of contents — the index page renders both.
  const tocStart = frontMatter.findIndex((line) =>
    /^##\s+Table of Contents/i.test(line),
  );
  const tocEnd =
    tocStart === -1
      ? -1
      : frontMatter.findIndex(
          (line, index) => index > tocStart && /^##?\s+\S/.test(line),
        );
  const tableOfContents =
    tocStart === -1
      ? ""
      : frontMatter
          .slice(tocStart, tocEnd === -1 ? undefined : tocEnd)
          .join("\n");

  const prose = frontMatter
    .filter((line, index) => {
      if (/^###\s+/.test(line) && line.includes(subtitle) && subtitle)
        return false;
      if (/^\*\*Compiled/.test(line)) return false;
      if (
        tocStart !== -1 &&
        index >= tocStart &&
        (tocEnd === -1 || index < tocEnd)
      )
        return false;
      return true;
    })
    .join("\n")
    .replace(/^\s*(-{3,}\s*)+/, "")
    .replace(/(\s*-{3,})+\s*$/, "")
    .trim();

  return {
    slug,
    title,
    subtitle,
    compiled,
    frontMatterHtml: await toHtml(prose),
    chapters,
    groups: readGroups(tableOfContents, chapters),
    words: chapters.reduce((total, chapter) => total + chapter.words, 0),
  };
}

let cache: Promise<Book[]> | null = null;

export function getBooks(): Promise<Book[]> {
  cache ??= (async () => {
    const files = fs
      .readdirSync(CONTENT_DIR)
      .filter((file) => file.endsWith(".md"))
      .sort();

    return Promise.all(
      files.map((file) =>
        parse(
          // Filenames become URLs, so normalise them: `A_Study_Of.md` → `a-study-of`.
          file
            .replace(/\.md$/, "")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, ""),
          fs.readFileSync(path.join(CONTENT_DIR, file), "utf8"),
        ),
      ),
    );
  })();

  return cache;
}

export async function getBook(slug: string): Promise<Book | undefined> {
  return (await getBooks()).find((book) => book.slug === slug);
}

export async function getChapter(bookSlug: string, chapterSlug: string) {
  const book = await getBook(bookSlug);
  if (!book) return undefined;

  const index = book.chapters.findIndex(
    (chapter) => chapter.slug === chapterSlug,
  );
  if (index === -1) return undefined;

  return {
    book,
    chapter: book.chapters[index],
    previous: book.chapters[index - 1],
    next: book.chapters[index + 1],
  };
}

export function readingMinutes(words: number): number {
  return Math.max(1, Math.round(words / 220));
}
