"use client";

import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import { useState } from "react";
import { BookDetails } from "@/components/book-details";
import { LoadErrorCard } from "@/components/ui-states";
import { getBaseBookById } from "@/lib/books";
import { useBookRepository } from "@/lib/data/books-repository";
import { useSignedCoverUrl } from "@/lib/data/media-repository";

export function BookScreen({ bookId }: { bookId: string }) {
  const router = useRouter();
  const { book, source, loading, error, refetch, deleteBook } = useBookRepository(bookId);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const canDelete =
    Boolean(book) &&
    ((source === "supabase") || (source === "local" && !getBaseBookById(bookId)));

  async function handleDelete() {
    if (!book || isDeleting) {
      return;
    }

    setIsDeleting(true);
    setDeleteError("");
    const result = await deleteBook(book.id);

    if (!result.ok) {
      setIsDeleting(false);
      setDeleteError("Не удалось удалить книгу");
      return;
    }

    router.replace("/");
  }

  if (!book) {
    if (loading || source === "loading" || isDeleting) {
      return <BookScreenSkeleton />;
    }

    if (error) {
      return (
        <>
          <header className="flex items-start gap-3 px-5 pt-6 pb-4">
            <BackLink href="/" />
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Книга</h1>
              <p className="mt-1 text-sm text-zinc-500">100 страниц</p>
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

  return (
    <>
      <header className="flex items-start gap-3 px-5 pt-6 pb-4">
        <BackLink href="/" />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-semibold tracking-tight">{book.title}</h1>
          <p className="mt-1 text-sm text-zinc-500">{book.totalPages} страниц</p>
        </div>
        <HeaderCover coverPath={book.coverUrl} />
      </header>

      <main className="flex flex-1 flex-col gap-4 px-5 pb-28">
        <BookDetails book={book} />

        {canDelete ? (
          <section className="mt-2">
            {!confirmingDelete ? (
              <button
                type="button"
                onClick={() => {
                  setConfirmingDelete(true);
                  setDeleteError("");
                }}
                className="w-full rounded-2xl bg-white py-3.5 text-sm font-semibold text-rose-600 shadow-sm ring-1 ring-zinc-200/70"
              >
                Удалить книгу
              </button>
            ) : (
              <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200/70">
                <p className="text-sm font-semibold text-zinc-900">Удалить книгу?</p>
                <p className="mt-2 text-sm text-zinc-600">
                  Удалить книгу и все связанные страницы и фотографии? Это действие нельзя отменить.
                </p>
                {deleteError ? (
                  <p className="mt-3 text-sm font-medium text-rose-600" role="alert">
                    {deleteError}
                  </p>
                ) : null}
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={() => {
                      if (isDeleting) {
                        return;
                      }
                      setConfirmingDelete(false);
                      setDeleteError("");
                    }}
                    className="rounded-xl bg-[#f7f5f2] py-3 text-sm font-medium text-zinc-700 disabled:opacity-60"
                  >
                    Отмена
                  </button>
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={() => void handleDelete()}
                    className="rounded-xl bg-rose-600 py-3 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {isDeleting ? "Удаляем…" : "Удалить"}
                  </button>
                </div>
              </div>
            )}
          </section>
        ) : null}
      </main>
    </>
  );
}

function BookScreenSkeleton() {
  return (
    <>
      <header className="flex items-start gap-3 px-5 pt-6 pb-4">
        <div className="mt-0.5 h-10 w-10 shrink-0 animate-pulse rounded-full bg-zinc-200" />
        <div className="min-w-0 flex-1">
          <div className="h-7 w-40 animate-pulse rounded bg-zinc-200" />
          <div className="mt-2 h-4 w-24 animate-pulse rounded bg-zinc-100" />
        </div>
        <div className="h-20 w-20 shrink-0 animate-pulse rounded-xl bg-zinc-200" />
      </header>
      <main className="flex flex-1 flex-col gap-4 px-5 pb-28">
        <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200/70">
          <div className="flex items-center justify-between">
            <div className="h-4 w-24 animate-pulse rounded bg-zinc-200" />
            <div className="h-4 w-10 animate-pulse rounded bg-zinc-100" />
          </div>
          <div className="mt-3 h-2 w-full animate-pulse rounded-full bg-zinc-100" />
        </section>
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="h-10 animate-pulse rounded-xl bg-zinc-200" />
          ))}
        </div>
        <div className="grid grid-cols-4 gap-2">
          {Array.from({ length: 12 }, (_, index) => (
            <div key={index} className="aspect-square animate-pulse rounded-xl bg-zinc-200" />
          ))}
        </div>
      </main>
    </>
  );
}

function HeaderCover({ coverPath }: { coverPath: string | null }) {
  const { url: coverSrc, loading } = useSignedCoverUrl(coverPath);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (!coverPath) {
    return null;
  }

  if (loading) {
    return (
      <div
        className="h-20 w-20 shrink-0 animate-pulse rounded-xl bg-zinc-200 ring-1 ring-zinc-200/70"
        aria-hidden="true"
      />
    );
  }

  if (!coverSrc || failedSrc === coverSrc) {
    return (
      <div
        className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-400 ring-1 ring-zinc-200/70"
        aria-hidden="true"
      >
        <CoverPlaceholderIcon />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={coverSrc}
      alt=""
      onError={() => setFailedSrc(coverSrc)}
      className="h-20 w-20 shrink-0 rounded-xl object-cover ring-1 ring-zinc-200/70"
    />
  );
}

function CoverPlaceholderIcon() {
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
