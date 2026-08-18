"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import type { Book } from "@/lib/books";
import { useSignedMediaUrls } from "@/lib/data/media-repository";
import { usePagesRepository } from "@/lib/data/pages-repository";
import { getBookStats, type StoredPage } from "@/lib/pages";

type PageFilter = "all" | "completed" | "remaining";

export function BookDetails({ book }: { book: Book }) {
  const { pages } = usePagesRepository(book.id);
  const stats = getBookStats(book, pages);
  const [filter, setFilter] = useState<PageFilter>("all");
  const photoPaths = useMemo(
    () =>
      pages
        .filter((page) => page.status === "completed" && page.photoPath)
        .map((page) => page.photoPath),
    [pages],
  );
  const photoUrls = useSignedMediaUrls(photoPaths);

  const visiblePages = useMemo(() => {
    if (filter === "completed") {
      return stats.pages.filter((page) => page.status === "completed");
    }

    if (filter === "remaining") {
      return stats.pages.filter((page) => page.status !== "completed");
    }

    return stats.pages;
  }, [filter, stats.pages]);

  return (
    <>
      <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200/70">
        <div className="flex items-center justify-between text-sm">
          <p className="font-medium text-zinc-700">
            {stats.coloredCount} из {book.totalPages}
          </p>
          <p className="font-medium text-zinc-500">{stats.percent}%</p>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-100">
          <div
            className="h-full rounded-full bg-rose-400"
            style={{ width: `${stats.percent}%` }}
          />
        </div>
      </section>

      <div className="grid grid-cols-3 gap-2">
        <FilterButton active={filter === "all"} onClick={() => setFilter("all")}>
          Все {book.totalPages}
        </FilterButton>
        <FilterButton active={filter === "completed"} onClick={() => setFilter("completed")}>
          Раскрашено {stats.coloredCount}
        </FilterButton>
        <FilterButton active={filter === "remaining"} onClick={() => setFilter("remaining")}>
          Осталось {stats.remainingCount}
        </FilterButton>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {visiblePages.map((page) => (
          <PageGridCard
            key={page.pageNumber}
            bookId={book.id}
            page={page}
            photoUrl={page.photoPath ? (photoUrls[page.photoPath] ?? null) : null}
          />
        ))}
      </div>
    </>
  );
}

function PageGridCard({
  bookId,
  page,
  photoUrl,
}: {
  bookId: string;
  page: StoredPage;
  photoUrl: string | null;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const isColored = page.status === "completed";
  const showPhoto = isColored && Boolean(photoUrl) && failedSrc !== photoUrl;

  return (
    <Link
      href={`/books/${bookId}/pages/${page.pageNumber}`}
      className={`relative flex aspect-square flex-col items-center justify-center overflow-hidden rounded-xl ${
        showPhoto
          ? "bg-zinc-100 text-white"
          : isColored
            ? "bg-sky-100 text-blue-700"
            : "bg-white text-zinc-500 ring-1 ring-zinc-200/70"
      }`}
    >
      {showPhoto ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photoUrl ?? undefined}
            alt=""
            onError={() => {
              if (photoUrl) {
                setFailedSrc(photoUrl);
              }
            }}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <span className="absolute inset-x-1 bottom-1 z-10 rounded-md bg-black/45 px-1 py-0.5 text-center text-[11px] font-medium text-white">
            {page.pageNumber}
          </span>
        </>
      ) : (
        <>
          {isColored ? <CheckIcon /> : <span className="text-lg leading-none">+</span>}
          <span className="text-xs font-medium">{page.pageNumber}</span>
        </>
      )}
    </Link>
  );
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl px-2 py-2.5 text-center text-xs ${
        active
          ? "bg-white font-semibold text-zinc-900 shadow-sm ring-1 ring-zinc-200/70"
          : "bg-white/70 font-medium text-zinc-500"
      }`}
    >
      {children}
    </button>
  );
}

function CheckIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
