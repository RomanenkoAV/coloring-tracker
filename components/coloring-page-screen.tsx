"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { PageForm } from "@/components/page-form";
import { useBook, useHasClientStorage } from "@/lib/book-storage";

export function ColoringPageScreen({
  bookId,
  pageNumber,
}: {
  bookId: string;
  pageNumber: number;
}) {
  const book = useBook(bookId);
  const hasClientStorage = useHasClientStorage();

  if (!book) {
    if (hasClientStorage) {
      notFound();
    }

    return (
      <>
        <header className="flex items-start gap-3 px-5 pt-6 pb-4">
          <BackLink href={`/books/${bookId}`} />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">&nbsp;</h1>
            <p className="mt-1 text-sm text-zinc-500">Страница {pageNumber}</p>
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 px-5 pb-28" />
      </>
    );
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
