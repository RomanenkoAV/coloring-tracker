"use client";

import Link from "next/link";
import { useState } from "react";
import { BookListSkeleton, LoadErrorCard } from "@/components/ui-states";
import type { Book } from "@/lib/books";
import { useBooksRepository } from "@/lib/data/books-repository";
import { useSignedCoverUrl } from "@/lib/data/media-repository";
import { usePagesRepository } from "@/lib/data/pages-repository";
import { getBookStats } from "@/lib/pages";

export function BookList() {
  const { books, source, loading, error, refetch } = useBooksRepository();

  if (loading || source === "loading") {
    return <BookListSkeleton count={3} />;
  }

  if (error) {
    return <LoadErrorCard message="Не удалось загрузить книги" onRetry={refetch} />;
  }

  if (books.length === 0) {
    return (
      <section className="rounded-2xl bg-white p-5 text-center shadow-sm ring-1 ring-zinc-200/70">
        <p className="text-sm font-semibold text-zinc-900">Пока нет книг</p>
        <p className="mt-2 text-sm text-zinc-500">Добавьте первую книгу, чтобы начать отслеживать прогресс.</p>
      </section>
    );
  }

  return (
    <>
      {books.map((book) => (
        <BookListItem key={book.id} book={book} />
      ))}
    </>
  );
}

function BookListItem({ book }: { book: Book }) {
  const { pages, loading: pagesLoading } = usePagesRepository(book.id);
  const { url: coverSrc, loading: coverLoading } = useSignedCoverUrl(book.coverUrl);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const stats = getBookStats(book, pages);
  const showCover = Boolean(coverSrc) && failedSrc !== coverSrc;

  return (
    <Link
      href={`/books/${book.id}`}
      className="flex gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-zinc-200/70"
    >
      <div
        className="flex h-[88px] w-[66px] shrink-0 items-center justify-center overflow-hidden rounded-xl bg-zinc-100 text-zinc-400"
        aria-hidden="true"
      >
        {coverLoading && book.coverUrl ? (
          <div className="h-full w-full animate-pulse bg-zinc-200" />
        ) : showCover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverSrc ?? undefined}
            alt=""
            onError={() => {
              if (coverSrc) {
                setFailedSrc(coverSrc);
              }
            }}
            className="h-full w-full object-cover"
          />
        ) : (
          <CoverIcon />
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center">
        <h2 className="truncate text-base font-semibold">{book.title}</h2>
        {pagesLoading ? (
          <>
            <div className="mt-1.5 h-3 w-28 animate-pulse rounded bg-zinc-100" />
            <div className="mt-2.5 h-2 w-full animate-pulse rounded-full bg-zinc-100" />
          </>
        ) : (
          <>
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
              <span className="w-8 text-right text-xs font-medium text-zinc-500">{stats.percent}%</span>
            </div>
          </>
        )}
      </div>
    </Link>
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
