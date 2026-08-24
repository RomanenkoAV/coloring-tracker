"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { PAGE_COUNT, type Book } from "@/lib/books";
import { useBooksRepository } from "@/lib/data/books-repository";
import { validateCoverFile } from "@/lib/data/media-repository";

export function NewBookForm() {
  const router = useRouter();
  const { createBook, uploadBookCover, source } = useBooksRepository();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverPreviewRef = useRef<string | null>(null);
  const [title, setTitle] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [savedBook, setSavedBook] = useState<Book | null>(null);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    return () => {
      if (coverPreviewRef.current) {
        URL.revokeObjectURL(coverPreviewRef.current);
      }
    };
  }, []);

  function replaceCoverPreview(file: File) {
    if (coverPreviewRef.current) {
      URL.revokeObjectURL(coverPreviewRef.current);
    }

    const previewUrl = URL.createObjectURL(file);
    coverPreviewRef.current = previewUrl;
    setCoverPreview(previewUrl);
  }

  function clearError() {
    if (error) {
      setError("");
    }
  }

  function handleCoverChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";

    if (!file) {
      return;
    }

    const validationError = validateCoverFile(file);

    if (validationError) {
      setError(validationError.message ?? "Не удалось загрузить изображение");
      return;
    }

    setCoverFile(file);
    replaceCoverPreview(file);
    clearError();
  }

  async function saveBook() {
    const nextTitle = title.trim();

    if (!nextTitle) {
      setError("Введите название книги");
      return;
    }

    setIsSaving(true);

    if (savedBook) {
      if (!coverFile) {
        setIsSaving(false);
        router.push("/");
        return;
      }

      const retry = await uploadBookCover(savedBook.id, coverFile);
      setIsSaving(false);

      if (retry.coverError) {
        setError("Не удалось загрузить изображение");
        return;
      }

      router.push("/");
      return;
    }

    const result = await createBook(nextTitle, coverFile);
    setIsSaving(false);

    if (!result.book) {
      setError(source === "telegram-auth-failed" ? "Сначала войдите через Telegram" : "Не удалось сохранить книгу");
      return;
    }

    if (result.coverError) {
      setSavedBook(result.book);
      setError("Не удалось загрузить изображение");
      return;
    }

    router.push("/");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void saveBook();
  }

  return (
    <>
      <header className="flex items-start gap-3 px-5 pt-6 pb-4">
        <Link
          href="/"
          aria-label="Назад"
          className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-zinc-700 shadow-sm ring-1 ring-zinc-200/80"
        >
          <BackIcon />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Добавить книгу</h1>
          <p className="mt-1 text-sm text-zinc-500">{PAGE_COUNT} страниц</p>
        </div>
      </header>

      <main className="flex flex-1 flex-col px-5 pb-28">
        <form className="flex flex-1 flex-col gap-4" onSubmit={handleSubmit}>
          <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200/70">
            <label className="block text-sm font-semibold" htmlFor="book-title">
              Название книги
            </label>
            <input
              id="book-title"
              type="text"
              value={title}
              disabled={Boolean(savedBook)}
              onChange={(event) => {
                setTitle(event.target.value);
                clearError();
              }}
              className="mt-3 w-full rounded-xl bg-[#f7f5f2] px-3 py-3 text-sm text-zinc-900 outline-none disabled:text-zinc-400"
            />
            {error ? (
              <p className="mt-2 text-sm text-rose-600" role="alert">
                {error}
              </p>
            ) : null}
          </section>

          <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200/70">
            <div className="flex aspect-[4/3] flex-col items-center justify-center overflow-hidden rounded-xl bg-zinc-100 text-zinc-400">
              {coverPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={coverPreview} alt="" className="h-full w-full object-cover" />
              ) : (
                <>
                  <CoverIcon />
                  <p className="mt-2 text-sm font-medium">Обложки пока нет</p>
                </>
              )}
            </div>
            <input
              ref={fileInputRef}
              id="book-cover"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleCoverChange}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-3 flex w-full items-center justify-center rounded-xl bg-[#f7f5f2] py-3 text-sm font-medium text-zinc-700"
            >
              {coverFile ? "Заменить обложку" : "Добавить обложку"}
            </button>
          </section>

          <button
            type="submit"
            disabled={isSaving}
            className="mt-auto rounded-2xl bg-zinc-900 py-3.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {isSaving ? "Сохраняем..." : savedBook ? "Повторить загрузку обложки" : "Сохранить книгу"}
          </button>
        </form>
      </main>
    </>
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

function CoverIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}
