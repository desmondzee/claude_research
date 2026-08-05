import Link from "next/link";
import SearchButton from "@/components/SearchButton";
import ThemeToggle from "@/components/ThemeToggle";
import { ShelfMark } from "@/components/marks";

export default function Masthead() {
  return (
    <header className="sticky top-0 z-40 border-b border-hairline bg-paper/85 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-[92rem] items-center justify-between px-6 sm:px-10">
        <Link
          href="/"
          className="flex items-center gap-3 py-3 text-ink transition-colors hover:text-ai"
        >
          <ShelfMark />
          <span className="gothic text-[0.6875rem] font-medium uppercase tracking-[0.16em] sm:tracking-[0.2em]">
            Robohouse ’26 Library
          </span>
        </Link>

        <div className="flex items-center gap-1">
          <SearchButton />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
