# Library

A reading room for long-form research, presented as a library so a new volume is a file drop.

## Running it

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # every chapter prerendered as static HTML
```

The build fetches the two Google fonts once and self-hosts them, so it needs network access.

## Adding a volume

Drop a markdown file into `content/`. The filename becomes the URL slug, normalised —
`A_Study_Of.md` serves at `/book/a-study-of`.

The parser (`src/lib/book.ts`) accepts two shapes and picks whichever divides the book:

- **Chapters at `#`.** A `#` book title, then one `#` per chapter. Sections are `##`.
- **Chapters at `##`.** A single `#` title, then `##` chapters. Sections are `###`, and they
  are lifted to `<h2>` on the page so both shapes read identically.

Beyond that it expects a `###` subtitle line under the title, and recognises chapter headings
named `Chapter N — Title`, `Appendix X — Title`, or `N. Title`. A `## Table of Contents`
listing `**Part I — Name**` groups with `- Chapter N: Title` entries will group the index;
without one, the chapters form a single run.

`$…$` and `$$…$$` are typeset with KaTeX at build time.

Nothing else needs to change. Routes, the table of contents, the search index, the reference
index, word counts, and reading times are all derived at build time.

## The reference index

Search covers the library and the work it cites. `src/lib/references.ts` harvests two things
from the books at build time:

- **Labs and companies** — the directory chapters profile one per section and mark those
  sections with bolded field labels (`**Data stance:**`, `**Thesis:**`). That marker is what
  separates a profile from an analytical section that merely carries a citation. The link is
  resolved to the entity's own front door where the books cite one, and to the reporting they
  do cite where they don't — the result row always shows the destination domain.
- **Papers** — every arXiv link the books carry, named by the label the prose gave it.

`src/lib/curated-references.ts` supplies proper names, aliases and notes for foundational work
the books cite by bare identifier (`arXiv:2303.04137` → *Diffusion Policy*). Every identifier
in that file was checked against its arXiv abstract page. **If you add an entry, verify the ID
the same way** — a plausible-looking arXiv ID that resolves to a different paper is worse than
no entry at all.

Reference results open in a new tab; results inside the library navigate in place.

## Layout

| Path | What it is |
|---|---|
| `content/` | The books, as markdown |
| `src/lib/book.ts` | The only module that knows about markdown |
| `src/lib/search-index.ts` | Flattens the books and references into search records |
| `src/lib/references.ts` | Harvests labs, companies and papers out of the books |
| `src/lib/curated-references.ts` | Verified arXiv links for work cited by bare identifier |
| `src/app/page.tsx` | The shelf |
| `src/app/book/[book]/` | Title page and chapters |
| `src/app/search-index.json/` | The static search index the ⌘K overlay fetches |
| `src/app/globals.css` | Design tokens, both themes, and the reading column |

The design is documented in `docs/superpowers/specs/2026-08-05-library-site-design.md`.
