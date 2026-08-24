"use client";

import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import { useState } from "react";
import { BookDetails } from "@/components/book-details";
import { getBaseBookById } from "@/lib/books";
import { useBookRepository } from "@/lib/data/books-repository";
import { useSignedCoverUrl } from "@/lib/data/media-repository";

export function BookScreen({ bookId }: { bookId: string }) {
  const router = useRouter();
  const { book, source, loading, deleteBook } = useBookRepository(bookId);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [deleteDebug, setDeleteDebug] = useState<{
    code: string | null;
    message: string | null;
    details: string | null;
    hint: string | null;
  } | null>(null);
  const canDelete =
    Boolean(book) &&
    ((source === "supabase") || (source === "local" && !getBaseBookById(bookId)));

  async function handleDelete() {
    if (!book || isDeleting) {
      return;
    }

    setIsDeleting(true);
    setDeleteError("");
    setDeleteDebug(null);
    const result = await deleteBook(book.id);
    setIsDeleting(false);

    if (!result.ok) {
      setDeleteError("Не удалось удалить книгу");
      setDeleteDebug(result.error);
      return;
    }

    router.push("/");
  }

  if (!book) {
    if (!loading && source !== "loading") {
      notFound();
    }

    return (
      <>
        <header className="flex items-start gap-3 px-5 pt-6 pb-4">
          <BackLink href="/" />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">&nbsp;</h1>
            <p className="mt-1 text-sm text-zinc-500">100 страниц</p>
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 px-5 pb-28" />
      </>
    );
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
                  setDeleteDebug(null);
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
                  <div className="mt-3 text-sm text-rose-600" role="alert">
                    <p className="font-medium">{deleteError}</p>
                    {deleteDebug ? (
                      <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[11px] text-zinc-600">
                        <dt>code</dt>
                        <dd className="break-all">{deleteDebug.code ?? "n/a"}</dd>
                        <dt>message</dt>
                        <dd className="break-all">{deleteDebug.message ?? "n/a"}</dd>
                        <dt>details</dt>
                        <dd className="break-all">{deleteDebug.details ?? "n/a"}</dd>
                        <dt>hint</dt>
                        <dd className="break-all">{deleteDebug.hint ?? "n/a"}</dd>
                      </dl>
                    ) : null}
                  </div>
                ) : null}
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={() => {
                      setConfirmingDelete(false);
                      setDeleteError("");
                      setDeleteDebug(null);
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
                    {isDeleting ? "Удаляем..." : "Удалить"}
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

function HeaderCover({ coverPath }: { coverPath: string | null }) {
  const coverSrc = useSignedCoverUrl(coverPath);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (!coverPath || !coverSrc || failedSrc === coverSrc) {
    return null;
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
