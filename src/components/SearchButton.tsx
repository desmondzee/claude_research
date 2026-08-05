"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { NarrowMark } from "@/components/marks";
import type { SearchRecord } from "@/lib/search-index";

type Hit = SearchRecord & { score: number; snippet: string };

const LIMIT = 20;

/** Real entry points into the book, not placeholders — each returns section-level hits. */
const SUGGESTIONS = [
  "imitation learning",
  "teleoperation",
  "the data bottleneck",
  "humanoid",
  "world models",
];

function snippetFor(text: string, term: string): string {
  const at = text.toLowerCase().indexOf(term);
  if (at === -1) return text.slice(0, 150);
  const from = Math.max(0, at - 60);
  return (from > 0 ? "…" : "") + text.slice(from, from + 170).trim() + "…";
}

function search(records: SearchRecord[], query: string): Hit[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return [];

  const hits: Hit[] = [];

  for (const record of records) {
    const title = record.title.toLowerCase();
    const chapter = record.chapter.toLowerCase();
    const text = record.text.toLowerCase();
    let score = 0;
    let matchedAll = true;

    for (const term of terms) {
      let termScore = 0;
      if (title.includes(term)) termScore += title.startsWith(term) ? 16 : 10;
      if (chapter.includes(term)) termScore += 4;
      if (text.includes(term)) termScore += 1;
      if (termScore === 0) {
        matchedAll = false;
        break;
      }
      score += termScore;
    }

    if (!matchedAll) continue;
    // Section-level hits beat whole-chapter hits — they land the reader closer.
    if (record.anchor) score += 1;
    hits.push({ ...record, score, snippet: snippetFor(record.text, terms[0]) });
  }

  return hits.sort((a, b) => b.score - a.score).slice(0, LIMIT);
}

function href(hit: SearchRecord): string {
  return `/book/${hit.bookSlug}/${hit.chapterSlug}${hit.anchor ? `#${hit.anchor}` : ""}`;
}

export default function SearchButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [records, setRecords] = useState<SearchRecord[] | null>(null);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const hits = records ? search(records, query) : [];
  const sectionCount = records?.filter((record) => record.anchor).length ?? 0;
  const chapterCount = (records?.length ?? 0) - sectionCount;

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setActive(0);
  }, []);

  // Fetch the index once, on first open.
  useEffect(() => {
    if (!open || records) return;
    let cancelled = false;
    fetch("/search-index.json")
      .then((response) => response.json())
      .then((data: SearchRecord[]) => {
        if (!cancelled) setRecords(data);
      })
      .catch(() => {
        if (!cancelled) setRecords([]);
      });
    return () => {
      cancelled = true;
    };
  }, [open, records]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        if (open) close();
        else setOpen(true);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, close]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    listRef.current?.children[active]?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const go = useCallback(
    (hit: Hit) => {
      close();
      router.push(href(hit));
    },
    [close, router],
  );

  function onInputKeyDown(event: React.KeyboardEvent) {
    if (event.key === "Escape") close();
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) => Math.min(index + 1, hits.length - 1));
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => Math.max(index - 1, 0));
    }
    if (event.key === "Enter" && hits[active]) {
      event.preventDefault();
      go(hits[active]);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search"
        className="gothic flex h-9 items-center gap-2 px-3 text-[0.6875rem] font-medium uppercase tracking-[0.18em] text-ink-faint transition-colors hover:text-ink"
      >
        {/* The wordmark needs the room on small screens, so the label drops to its mark. */}
        <span className="sm:hidden">
          <NarrowMark />
        </span>
        <span className="hidden sm:inline">Search</span>
        <kbd className="hidden text-[0.625rem] tracking-normal text-ink-faint sm:inline">
          ⌘K
        </kbd>
      </button>

      {/*
        Portalled to the body: the masthead sets a backdrop-filter, which would make it the
        containing block for `position: fixed` and collapse the overlay into the header.
      */}
      {open &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Search the library"
            className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh]"
          >
            <button
              type="button"
              aria-label="Close search"
              onClick={close}
              className="scrim absolute inset-0"
            />

            <div className="panel relative flex max-h-[70vh] w-full max-w-2xl flex-col">
              <div className="flex items-center gap-3.5 border-b border-hairline px-5">
                <span className="text-ink-faint">
                  <NarrowMark />
                </span>
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setActive(0);
                  }}
                  onKeyDown={onInputKeyDown}
                  placeholder="Search chapters and sections"
                  aria-label="Search chapters and sections"
                  className="h-14 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-ink-faint"
                />
                <kbd className="gothic text-[0.625rem] uppercase tracking-[0.16em] text-ink-faint">
                  Esc
                </kbd>
              </div>

              {query && (
                <ul ref={listRef} className="overflow-y-auto py-1">
                  {hits.map((hit, index) => (
                    <li key={`${hit.chapterSlug}-${hit.anchor}-${index}`}>
                      <button
                        type="button"
                        onClick={() => go(hit)}
                        onMouseMove={() => setActive(index)}
                        className={`block w-full px-5 py-3 text-left transition-colors ${
                          index === active ? "bg-paper-sunk" : ""
                        }`}
                      >
                        <span className="gothic block text-[0.625rem] uppercase tracking-[0.16em] text-ink-faint">
                          {hit.chapter}
                        </span>
                        <span className="mt-1 block text-[0.9375rem] leading-snug text-ink">
                          {hit.title}
                        </span>
                        <span className="mt-1 block truncate text-[0.8125rem] leading-snug text-ink-muted">
                          {hit.snippet}
                        </span>
                      </button>
                    </li>
                  ))}

                  {records && hits.length === 0 && (
                    <li className="gothic px-5 py-6 text-[0.8125rem] text-ink-muted">
                      Nothing matches “{query}”. Try a lab, a company, or a term
                      from the glossary.
                    </li>
                  )}

                  {!records && (
                    <li className="gothic px-5 py-6 text-[0.8125rem] text-ink-faint">
                      Opening the index…
                    </li>
                  )}
                </ul>
              )}

              {/* Empty is an invitation: name what's searchable, and offer a way in. */}
              {!query && (
                <div className="px-5 py-5">
                  <p className="eyebrow">Start with</p>
                  <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
                    {SUGGESTIONS.map((suggestion) => (
                      <li key={suggestion}>
                        <button
                          type="button"
                          onClick={() => setQuery(suggestion)}
                          className="text-[0.9375rem] text-ink-muted transition-colors hover:text-ai"
                        >
                          {suggestion}
                        </button>
                      </li>
                    ))}
                  </ul>
                  <p className="gothic mt-5 text-[0.625rem] uppercase tracking-[0.16em] text-ink-faint">
                    {records
                      ? `${sectionCount} sections across ${chapterCount} chapters`
                      : "Searching titles and opening lines"}
                  </p>
                </div>
              )}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
