import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ChapterNav from "@/components/ChapterNav";
import { getBooks, getChapter, readingMinutes } from "@/lib/book";

export async function generateStaticParams() {
  const books = await getBooks();
  return books.flatMap((book) =>
    book.chapters.map((chapter) => ({
      book: book.slug,
      chapter: chapter.slug,
    })),
  );
}

export async function generateMetadata({
  params,
}: PageProps<"/book/[book]/[chapter]">): Promise<Metadata> {
  const { book, chapter } = await params;
  const found = await getChapter(book, chapter);
  return found ? { title: `${found.chapter.title} · ${found.book.title}` } : {};
}

export default async function ChapterPage({
  params,
}: PageProps<"/book/[book]/[chapter]">) {
  const { book: bookSlug, chapter: chapterSlug } = await params;
  const found = await getChapter(bookSlug, chapterSlug);
  if (!found) notFound();

  const { book, chapter, previous, next } = found;

  return (
    <div className="mx-auto max-w-[92rem] px-6 sm:px-10">
      <div className="lg:grid lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-16 xl:grid-cols-[18rem_minmax(0,1fr)] xl:gap-24">
        {/* Contents — a sticky rail on desktop, folded away on small screens */}
        <div className="hidden lg:block">
          <div className="sticky top-16 max-h-[calc(100vh-4rem)] overflow-y-auto border-r border-hairline-soft py-12 pr-8">
            <ChapterNav book={book} currentSlug={chapter.slug} />
          </div>
        </div>

        <details className="border-b border-hairline py-4 lg:hidden">
          <summary className="gothic cursor-pointer list-none text-[0.6875rem] uppercase tracking-[0.2em] text-ink-faint">
            Contents
          </summary>
          <div className="pt-6">
            <ChapterNav book={book} currentSlug={chapter.slug} />
          </div>
        </details>

        <article className="min-w-0 py-14 lg:py-20">
          <header className="fade-in max-w-[38rem]">
            {chapter.label && <p className="eyebrow">{chapter.label}</p>}
            <h1 className="mt-5 font-mincho text-[2rem] leading-[1.22] sm:text-[2.75rem] sm:leading-[1.18]">
              {chapter.title}
            </h1>
            <p className="gothic mt-6 border-t border-hairline pt-4 text-[0.625rem] uppercase tracking-[0.18em] text-ink-faint">
              {chapter.sections.length > 0 &&
                `${chapter.sections.length} sections · `}
              about {readingMinutes(chapter.words)} minutes
            </p>
          </header>

          <div
            className="prose fade-in mt-14 max-w-[38rem]"
            style={{ animationDelay: "90ms" }}
            dangerouslySetInnerHTML={{ __html: chapter.html }}
          />

          {/* Turn the page */}
          <nav
            aria-label="Chapter navigation"
            className="mt-24 flex max-w-[38rem] flex-col gap-8 border-t border-hairline pt-8 sm:flex-row"
          >
            <div className="flex-1">
              {previous && (
                <Link
                  href={`/book/${book.slug}/${previous.slug}`}
                  className="group block transition-colors hover:text-ai"
                >
                  <span className="gothic block text-[0.625rem] uppercase tracking-[0.18em] text-ink-faint">
                    ← Previous
                  </span>
                  <span className="mt-2 block leading-snug">
                    {previous.title}
                  </span>
                </Link>
              )}
            </div>

            <div className="flex-1 sm:text-right">
              {next && (
                <Link
                  href={`/book/${book.slug}/${next.slug}`}
                  className="group block transition-colors hover:text-ai"
                >
                  <span className="gothic block text-[0.625rem] uppercase tracking-[0.18em] text-ink-faint">
                    Next →
                  </span>
                  <span className="mt-2 block leading-snug">{next.title}</span>
                </Link>
              )}
            </div>
          </nav>
        </article>
      </div>
    </div>
  );
}
