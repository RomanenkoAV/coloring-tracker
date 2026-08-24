"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { PageForm } from "@/components/page-form";
import { LoadErrorCard } from "@/components/ui-states";
import { useBookRepository } from "@/lib/data/books-repository";

export function ColoringPageScreen({
  bookId,
  pageNumber,
}: {
  bookId: string;
  pageNumber: number;
}) {
  const { book, source, loading, error, refetch } = useBookRepository(bookId);

  if (!book) {
    if (loading || source === "loading") {
      return <ColoringPageSkeleton bookId={bookId} pageNumber={pageNumber} />;
    }

    if (error) {
      return (
        <>
          <header className="flex items-start gap-3 px-5 pt-6 pb-4">
            <BackLink href={`/books/${bookId}`} />
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Страница</h1>
              <p className="mt-1 text-sm text-zinc-500">Страница {pageNumber}</p>
            </div>
          </header>
          <main className="flex flex-1 flex-col gap-4 px-5 pb-28">
            <LoadErrorCard message="Не удалось загрузить книгу" onRetry={refetch} />
          </main>
        </>
      );
    }

    notFound();
  }

  if (pageNumber < 1 || pageNumber > book.totalPages) {
    notFound();
  }

  return (
    <>
      <header className="flex items-start gap-3 px-5 pt-6 pb-4">
        <BackLink href={`/books/${book.id}`} />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{book.title}</h1>
          <p className="mt-1 text-sm text-zinc-500">Страница {pageNumber}</p>
        </div>
      </header>

      <main className="flex flex-1 flex-col gap-4 px-5 pb-28">
        <PageForm book={book} pageNumber={pageNumber} />
      </main>
    </>
  );
}

function ColoringPageSkeleton({ bookId, pageNumber }: { bookId: string; pageNumber: number }) {
  return (
    <>
      <header className="flex items-start gap-3 px-5 pt-6 pb-4">
        <BackLink href={`/books/${bookId}`} />
        <div>
          <div className="h-7 w-40 animate-pulse rounded bg-zinc-200" />
          <p className="mt-2 text-sm text-zinc-500">Страница {pageNumber}</p>
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 px-5 pb-28">
        <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200/70">
          <div className="aspect-[4/3] animate-pulse rounded-xl bg-zinc-200" />
          <div className="mt-3 h-4 w-48 animate-pulse rounded bg-zinc-100" />
          <div className="mt-3 h-11 w-full animate-pulse rounded-xl bg-zinc-100" />
        </section>
        <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200/70">
          <div className="h-4 w-16 animate-pulse rounded bg-zinc-200" />
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="h-10 animate-pulse rounded-xl bg-zinc-100" />
            <div className="h-10 animate-pulse rounded-xl bg-zinc-100" />
          </div>
        </section>
        <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200/70">
          <div className="h-4 w-24 animate-pulse rounded bg-zinc-200" />
          <div className="mt-3 h-11 w-full animate-pulse rounded-xl bg-zinc-100" />
        </section>
        <div className="h-12 w-full animate-pulse rounded-2xl bg-zinc-200" />
      </main>
    </>
  );
}

function BackLink({ href }: { href: string }) {
  return (
    <Link
      href={href}
      aria-label="Назад"
      className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-zinc-700 shadow-sm ring-1 ring-zinc-200/80"
    >
      <BackIcon />
    </Link>
  );
}

function BackIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}
