import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getBook, getBooks, readingMinutes } from "@/lib/book";

export async function generateStaticParams() {
  return (await getBooks()).map((book) => ({ book: book.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/book/[book]">): Promise<Metadata> {
  const book = await getBook((await params).book);
  return book ? { title: book.title, description: book.subtitle } : {};
}

export default async function BookPage({ params }: PageProps<"/book/[book]">) {
  const book = await getBook((await params).book);
  if (!book) notFound();

  return (
    <article className="mx-auto max-w-[92rem] px-6 pb-32 sm:px-10">
      {/* Title page */}
      <header className="fade-in grid gap-10 pt-20 sm:pt-28 lg:grid-cols-[minmax(0,42rem)_minmax(0,1fr)] lg:gap-20">
        <div>
          <p className="eyebrow">{book.compiled || "Volume"}</p>
          <h1 className="mt-6 font-mincho text-[2.5rem] leading-[1.18] sm:text-[3.5rem] sm:leading-[1.12]">
            {book.title}
          </h1>
          <p className="mt-8 max-w-xl text-lg leading-relaxed text-ink-muted">
            {book.subtitle}
          </p>
        </div>

        {/* Held to the right margin so it lines up with the contents column below it. */}
        <dl className="gothic self-end border-t border-hairline pt-5 text-[0.6875rem] uppercase tracking-[0.16em] text-ink-faint lg:ml-auto lg:w-[20rem] lg:border-t-0 lg:border-l lg:border-hairline lg:pt-0 lg:pl-8">
          <div className="flex justify-between gap-6 py-1.5">
            <dt>Chapters</dt>
            <dd className="text-ink-muted">{book.chapters.length}</dd>
          </div>
          <div className="flex justify-between gap-6 py-1.5">
            <dt>Words</dt>
            <dd className="text-ink-muted">{book.words.toLocaleString()}</dd>
          </div>
          <div className="flex justify-between gap-6 py-1.5">
            <dt>Reading</dt>
            <dd className="text-ink-muted">{readingMinutes(book.words)} min</dd>
          </div>
        </dl>
      </header>

      {/* Books that open straight into their first chapter get the contents full width. */}
      <div
        className={`mt-20 grid gap-16 lg:mt-28 lg:gap-24 ${
          book.frontMatterHtml
            ? "lg:grid-cols-[minmax(0,34rem)_minmax(0,1fr)]"
            : ""
        }`}
      >
        {book.frontMatterHtml && (
          /* Front matter, as the author wrote it */
          <section
            className="prose fade-in"
            style={{ animationDelay: "100ms" }}
            dangerouslySetInnerHTML={{ __html: book.frontMatterHtml }}
          />
        )}

        {/* Contents, grouped by the book's own Parts */}
        <nav
          aria-label="Contents"
          className="fade-in"
          style={{ animationDelay: "180ms" }}
        >
          <p className="eyebrow">Contents</p>

          {book.groups.map((group) => (
            <section key={group.title} className="mt-10 first:mt-8">
              {/* A book with no Parts has one run, and naming it repeats the heading above. */}
              {book.groups.length > 1 && (
                <h2 className="gothic text-[0.6875rem] font-medium uppercase tracking-[0.2em] text-ink-muted">
                  {group.title}
                </h2>
              )}

              <ul className="mt-3 border-t border-hairline-soft">
                {group.chapters.map((chapter) => (
                  <li
                    key={chapter.slug}
                    className="border-b border-hairline-soft"
                  >
                    <Link
                      href={`/book/${book.slug}/${chapter.slug}`}
                      className="group flex items-baseline gap-5 py-4 transition-colors hover:text-ai"
                    >
                      <span className="gothic w-20 shrink-0 text-[0.625rem] uppercase tracking-[0.16em] text-ink-faint transition-colors group-hover:text-ai">
                        {chapter.label || "—"}
                      </span>
                      <span className="flex-1 leading-snug">
                        {chapter.title}
                      </span>
                      <span className="gothic shrink-0 text-[0.625rem] tracking-[0.1em] text-ink-faint">
                        {readingMinutes(chapter.words)}′
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </nav>
      </div>
    </article>
  );
}
