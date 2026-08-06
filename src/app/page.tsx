import Link from "next/link";
import { getBooks, readingMinutes } from "@/lib/book";

export default async function ShelfPage() {
  const books = await getBooks();

  return (
    <div className="mx-auto max-w-[92rem] px-6 sm:px-10">
      {/*
        Three blocks in one grid. Narrow screens read them in source order — thesis, shelf,
        then the volume's details — so the book is in view without scrolling. From `md` the
        shelf moves into its own column and the details sit under the thesis, as on desktop.
      */}
      <div className="grid gap-y-14 pt-14 pb-20 md:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] md:gap-x-14 md:gap-y-12 md:pt-[12vh] md:pb-24 lg:grid-cols-[minmax(0,30rem)_minmax(0,1fr)] lg:gap-x-24 lg:pt-[14vh] lg:pb-28">
        <section className="fade-in md:col-start-1 md:row-start-1">
          <p className="eyebrow">Collection</p>
          <h1 className="mt-6 font-mincho text-[2rem] leading-[1.2] sm:text-[2.5rem] sm:leading-[1.18] lg:text-[3rem] lg:leading-[1.16]">
            A reading room for long-form research.
          </h1>
          {/* Space scales with the type it separates: a 48px headline needs more than a label. */}
          <p className="mt-8 text-ink-muted lg:mt-10">Start anywhere.</p>
        </section>

        {/* The shelf: volumes stand on a hairline, as spines. */}
        <section
          aria-label="The shelf"
          className="md:col-start-2 md:row-span-2 md:row-start-1 md:self-start"
        >
          {/*
            The rule runs the full column, ending on the same right margin as the masthead —
            it gives the page an edge, and reads as a shelf with room for what comes next.
          */}
          <ul className="flex flex-wrap items-end gap-5 border-b border-hairline">
            {books.map((book, index) => (
              <li
                key={book.slug}
                className="fade-in"
                style={{ animationDelay: `${140 + index * 90}ms` }}
              >
                <Link
                  href={`/book/${book.slug}`}
                  className="spine"
                  aria-label={`${book.title} — ${book.chapters.length} chapters`}
                >
                  <span className="spine__title font-mincho">{book.title}</span>
                  <span className="spine__meta">
                    {book.chapters.length} ch.
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <dl className="fade-in border-t border-hairline pt-6 md:col-start-1 md:row-start-2 md:self-start">
          {books.map((book) => (
            <div
              key={book.slug}
              className="mt-7 border-t border-hairline-soft pt-7 first:mt-0 first:border-t-0 first:pt-0"
            >
              <dt className="gothic text-[0.625rem] uppercase tracking-[0.2em] text-ink-faint">
                {book.compiled || "Volume"}
              </dt>
              <dd className="mt-2.5 text-[0.9375rem] leading-relaxed text-ink-muted">
                {book.subtitle}
              </dd>
              <dd className="gothic mt-2.5 text-[0.625rem] uppercase tracking-[0.16em] text-ink-faint">
                {book.chapters.length} chapters · {book.words.toLocaleString()}{" "}
                words · about {readingMinutes(book.words)} minutes
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
