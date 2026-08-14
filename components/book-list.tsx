"use client";

import Link from "next/link";
import { books } from "@/lib/books";
import { useStoredPages } from "@/lib/page-storage";
import { getBookStats } from "@/lib/pages";

export function BookList() {
  const storedPages = useStoredPages();

  return (
    <>
      {books.map((book) => {
        const stats = getBookStats(book, storedPages);

        return (
          <Link
            key={book.id}
            href={`/books/${book.id}`}
            className="flex gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-zinc-200/70"
          >
            <div
              className="flex h-[88px] w-[66px] shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-400"
              aria-hidden="true"
            >
              <CoverIcon />
            </div>
            <div className="flex min-w-0 flex-1 flex-col justify-center">
              <h2 className="truncate text-base font-semibold">{book.title}</h2>
              <p className="mt-0.5 text-sm text-zinc-500">
                {stats.coloredCount} из {book.totalPages} страниц
              </p>
              <div className="mt-2.5 flex items-center gap-2">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-100">
                  <div
                    className="h-full rounded-full bg-rose-400"
                    style={{ width: `${stats.percent}%` }}
                  />
                </div>
                <span className="w-8 text-right text-xs font-medium text-zinc-500">
                  {stats.percent}%
                </span>
              </div>
            </div>
          </Link>
        );
      })}
    </>
  );
}

function CoverIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}
