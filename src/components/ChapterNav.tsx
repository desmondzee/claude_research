import Link from "next/link";
import type { Book } from "@/lib/book";

type Props = {
  book: Book;
  currentSlug: string;
};

/**
 * The full table of contents, with only the open chapter showing its sections —
 * the reader's place in the book stays visible without the whole outline shouting.
 */
export default function ChapterNav({ book, currentSlug }: Props) {
  return (
    <nav aria-label="Table of contents" className="text-[0.8125rem]">
      <Link
        href={`/book/${book.slug}`}
        className="gothic block text-[0.625rem] uppercase tracking-[0.2em] text-ink-faint transition-colors hover:text-ai"
      >
        ← {book.title}
      </Link>

      {book.groups.map((group) => (
        <section key={group.title} className="mt-8">
          <h2 className="gothic text-[0.5625rem] font-medium uppercase tracking-[0.22em] text-ink-faint">
            {group.title}
          </h2>

          <ul className="mt-2.5">
            {group.chapters.map((chapter) => {
              const current = chapter.slug === currentSlug;

              return (
                <li key={chapter.slug}>
                  <Link
                    href={`/book/${book.slug}/${chapter.slug}`}
                    aria-current={current ? "page" : undefined}
                    className={`flex gap-2.5 border-l py-1.5 pl-3.5 leading-snug transition-colors ${
                      current
                        ? "border-ai text-ink"
                        : "border-hairline-soft text-ink-muted hover:border-hairline hover:text-ink"
                    }`}
                  >
                    <span className="gothic shrink-0 text-[0.5625rem] uppercase tracking-[0.14em] text-ink-faint">
                      {chapter.label
                        .replace(/^Chapter\s/, "")
                        .replace(/^Appendix\s/, "") || "·"}
                    </span>
                    <span>{chapter.title}</span>
                  </Link>

                  {current && chapter.sections.length > 0 && (
                    <ul className="mb-2 ml-3.5 border-l border-hairline-soft">
                      {chapter.sections.map((section) => (
                        <li key={section.anchor}>
                          <Link
                            href={`#${section.anchor}`}
                            className="block py-1 pl-3.5 text-[0.75rem] leading-snug text-ink-muted transition-colors hover:text-ai"
                          >
                            {section.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </nav>
  );
}
