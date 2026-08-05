# Library

A reading room for long-form research. One volume today —
*Embodied Intelligence in 2026* — presented as a library so the next one is a file drop.

## Running it

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # every chapter prerendered as static HTML
```

The build fetches the two Google fonts once and self-hosts them, so it needs network access.

## Adding a volume

Drop a markdown file into `content/`. The filename becomes the URL slug.

The parser (`src/lib/book.ts`) expects:

- One `#` heading at the top — the book title — followed by a `###` subtitle line.
- A `## Table of Contents` section listing `**Part I — Name**` groups and their
  `- Chapter N: Title` entries. This drives the grouping on the index page.
- One `#` heading per chapter, named `Chapter N — Title`, `Appendix X — Title`, or anything
  else (which becomes a slug of its own).
- `##` headings inside a chapter become its sections, anchors, and search records.

Nothing else needs to change. Routes, the table of contents, the search index, word counts,
and reading times are all derived at build time.

## Layout

| Path | What it is |
|---|---|
| `content/` | The books, as markdown |
| `src/lib/book.ts` | The only module that knows about markdown |
| `src/lib/search-index.ts` | Flattens the books into search records |
| `src/app/page.tsx` | The shelf |
| `src/app/book/[book]/` | Title page and chapters |
| `src/app/search-index.json/` | The static search index the ⌘K overlay fetches |
| `src/app/globals.css` | Design tokens, both themes, and the reading column |

The design is documented in `docs/superpowers/specs/2026-08-05-library-site-design.md`.
