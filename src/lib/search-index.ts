import { getBooks } from "@/lib/book";

export type SearchRecord = {
  /** `Embodied Intelligence in 2026` */
  book: string;
  bookSlug: string;
  /** `Chapter 2 — Stanford University` */
  chapter: string;
  chapterSlug: string;
  /** Section heading, or the chapter title for a chapter-level record. */
  title: string;
  anchor: string;
  text: string;
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

      // Split the chapter body on its `##` headings, in the same order as `chapter.sections`.
      const bodies = chapter.markdown.split(/^##\s+.+$/m).slice(1);
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

  return records;
}
