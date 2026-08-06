import { getBooks } from "@/lib/book";
import { getReferences } from "@/lib/references";

export type SearchRecord = {
  /** `Embodied Intelligence in 2026`, or the reference's kind for outward links. */
  book: string;
  bookSlug: string;
  /** `Chapter 2 — Stanford University`, or where a reference was cited. */
  chapter: string;
  chapterSlug: string;
  /** Section heading, chapter title, or reference name. */
  title: string;
  anchor: string;
  text: string;
  /** Present only on outward links — papers, labs and companies the books cite. */
  url?: string;
  aliases?: string[];
};

/** Reduces markdown to plain prose so matches land on words the reader can see. */
function strip(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^\s*[|>#-]+\s*/gm, " ")
    .replace(/[*_`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export async function buildSearchIndex(): Promise<SearchRecord[]> {
  const books = await getBooks();
  const records: SearchRecord[] = [];

  for (const book of books) {
    for (const chapter of book.chapters) {
      const chapterName = chapter.label
        ? `${chapter.label} — ${chapter.title}`
        : chapter.title;

      records.push({
        book: book.title,
        bookSlug: book.slug,
        chapter: chapterName,
        chapterSlug: chapter.slug,
        title: chapter.title,
        anchor: "",
        text: strip(chapter.markdown).slice(0, 400),
      });

      // Split the chapter body on its headings, in the same order as `chapter.sections`.
      const bodies = chapter.markdown.split(/^#{2,3}\s+.+$/m).slice(1);
      chapter.sections.forEach((section, index) => {
        records.push({
          book: book.title,
          bookSlug: book.slug,
          chapter: chapterName,
          chapterSlug: chapter.slug,
          title: section.title,
          anchor: section.anchor,
          text: strip(bodies[index] ?? "").slice(0, 400),
        });
      });
    }
  }

  // Outward links: the papers, labs and companies the library points at.
  for (const reference of await getReferences()) {
    records.push({
      book: reference.kind,
      bookSlug: "",
      chapter: reference.context,
      chapterSlug: "",
      title: reference.name,
      anchor: "",
      text: reference.note,
      url: reference.url,
      aliases: reference.aliases,
    });
  }

  return records;
}
