# Library Site — Design

**Date:** 2026-08-05
**Status:** Approved

## Purpose

A quiet, elegant reading site for the research documents in this repo. Today it holds one
volume — *Embodied Intelligence in 2026* (2,031 lines, ~218KB of markdown, ~20 chapters) —
but it presents as a library so a second volume is a file drop, not a redesign.

## Architecture

Next.js App Router, TypeScript, Tailwind v4. Fully static: every route is prerendered via
`generateStaticParams`. No database, no CMS, no client-side markdown.

### Routes

| Route | Purpose |
|---|---|
| `/` | The shelf. One entry per volume in `content/`. |
| `/book/[book]` | Front matter: title, "How to Read This Book", chapter index. |
| `/book/[book]/[chapter]` | A single chapter, with sidebar TOC. |

### Search

Build-time index, client-side query. `lib/book.ts` emits one record per `##` section
(`{ book, chapter, chapterSlug, anchor, title, text }`, text truncated to ~400 chars) into
`public/search-index.json`. A `⌘K` overlay fetches it lazily on first open, scores records by
substring match — title hits weighted above body hits — and lists the top 20 as links to
`/book/[book]/[chapter]#anchor`. No search library, no server.

### Dark mode

Sumi ink, not black: background `#171A1F`, text `#DCD8CE`, muted `#8B9099`, hairline `#2C323A`,
indigo lifted to `#8AA9D6` to hold contrast. Toggle in the header persists to `localStorage`
and sets `data-theme` on `<html>`; a small inline script in `<head>` applies the stored value
before first paint so there is no flash. **Day is the default** — a library is a daylit room —
and the OS preference is deliberately ignored. Night is opt-in and remembered.

### Content pipeline

`lib/book.ts` is the only module that knows about markdown.

- Reads `content/*.md` from disk at build time.
- Splits the document on `# Chapter N — Title` (h1) boundaries. Everything before the first
  chapter heading is front matter.
- Each chapter record: `{ number, slug, title, sections[], html }` where `sections` are the
  `##` headings with generated anchor ids.
- Renders body markdown to HTML with the remark/rehype chain (`remark-parse` →
  `remark-gfm` → `remark-rehype` → `rehype-slug` → `rehype-stringify`).
- Exported surface: `getBooks()`, `getBook(slug)`, `getChapter(bookSlug, chapterSlug)`.
  Consumers never see raw markdown.

Adding a book means adding a `.md` file. Nothing else changes.

## Visual direction — 静けさ

- **Palette.** Paper `#F7F4EC`, ink `#22252B` (cool, never brown-black), muted `#6E7178`,
  hairline `#DED8CA`. One accent, aizome indigo `#25446E`, used sparingly: the active TOC
  marker, link hover, the focused search panel.
- **Type.** Shippori Mincho for the book at a ~38rem measure, 1.85 line-height; Zen Kaku
  Gothic New, letterspaced and small, for navigation and labels — the mincho/gothic pairing
  of Japanese book design. Self-hosted via `next/font`.
- **Ma.** Asymmetric margins, large top padding, generous space above headings. Emptiness
  is structural, not leftover.
- **Surfaces.** Hairline rules instead of boxes. No shadows, no cards, no rounded corners,
  no borders used as containers.
- **Signature.** The shelf shows spines: each volume stands vertically on a hairline with its
  Latin title rotated as it is on a real book, and hovering lifts it out. The wordmark is that
  same idea as a hairline mark — three spines of differing heights standing on a shelf rule.
- **No Japanese glyphs.** The influence is structural, not decorative — vertical spines, ma,
  hairlines, the mincho/gothic pairing. No kanji appears in the interface.
- **Motion.** Opacity only, 400ms ease-out. Nothing slides or scales.

## Out of scope

Comments, auth, print stylesheets, pagination within chapters.

## Success criteria

- `npm run build` completes with all chapter routes prerendered.
- Homepage → book → chapter navigation works; chapter URLs are deep-linkable.
- Reading column holds its measure from 375px to 2560px without horizontal scroll.
- `⌘K` opens search; a query for a known heading returns it as the top result.
- Theme toggle persists across reloads with no flash of the wrong theme.
