"use client";

import { useEffect, useState } from "react";
import type { Book } from "@/lib/books";
import { saveStoredPage, useStoredPages } from "@/lib/page-storage";
import { resolvePage, type StoredPage } from "@/lib/pages";

export function PageForm({
  book,
  pageNumber,
}: {
  book: Book;
  pageNumber: number;
}) {
  const storedPages = useStoredPages();
  const savedPage = resolvePage(book, pageNumber, storedPages);
  const [draft, setDraft] = useState<StoredPage | null>(null);
  const [showSaved, setShowSaved] = useState(false);
  const page = draft ?? savedPage;

  useEffect(() => {
    if (!showSaved) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setShowSaved(false);
    }, 2000);

    return () => window.clearTimeout(timeoutId);
  }, [showSaved]);

  function updateDraft(patch: Partial<StoredPage>) {
    const current = draft ?? savedPage;
    const nextStatus = patch.status ?? current.status;

    setDraft({
      ...current,
      ...patch,
      coloredAt:
        nextStatus === "not_started" ? null : (patch.coloredAt ?? current.coloredAt),
    });
  }

  function handleSave() {
    const nextPage: StoredPage = {
      bookId: book.id,
      pageNumber,
      status: page.status,
      coloredAt: page.status === "completed" ? page.coloredAt : null,
      notes: page.notes,
    };

    saveStoredPage(nextPage);
    setDraft(nextPage);
    setShowSaved(true);
  }

  return (
    <>
      <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200/70">
        <div className="flex aspect-[4/3] flex-col items-center justify-center rounded-xl bg-zinc-100 text-zinc-400">
          <PhotoIcon />
          <p className="mt-2 text-sm font-medium">Фото ещё нет</p>
        </div>
        <p className="mt-3 text-sm text-zinc-500">
          Добавьте фото раскрашенной страницы
        </p>
        <button
          type="button"
          className="mt-3 flex w-full items-center justify-center rounded-xl bg-[#f7f5f2] py-3 text-sm font-medium text-zinc-700"
        >
          + Добавить фото
        </button>
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200/70">
        <h2 className="text-sm font-semibold">Статус</h2>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            aria-pressed={page.status === "not_started"}
            onClick={() => updateDraft({ status: "not_started" })}
            className={`rounded-xl px-2 py-2.5 text-center text-xs font-medium ${
              page.status === "not_started"
                ? "bg-white font-semibold text-zinc-900 shadow-sm ring-1 ring-zinc-200/70"
                : "bg-[#f7f5f2] text-zinc-500"
            }`}
          >
            Не раскрашено
          </button>
          <button
            type="button"
            aria-pressed={page.status === "completed"}
            onClick={() => updateDraft({ status: "completed" })}
            className={`rounded-xl px-2 py-2.5 text-center text-xs font-medium ${
              page.status === "completed"
                ? "bg-white font-semibold text-zinc-900 shadow-sm ring-1 ring-zinc-200/70"
                : "bg-[#f7f5f2] text-zinc-500"
            }`}
          >
            Готово
          </button>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200/70">
        <label className="block text-sm font-semibold" htmlFor="colored-date">
          Раскрашено
        </label>
        <input
          id="colored-date"
          type="date"
          value={page.status === "completed" ? (page.coloredAt ?? "") : ""}
          disabled={page.status !== "completed"}
          onChange={(event) => updateDraft({ coloredAt: event.target.value || null })}
          className="mt-3 w-full rounded-xl bg-[#f7f5f2] px-3 py-3 text-sm text-zinc-900 outline-none disabled:text-zinc-400"
        />
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200/70">
        <label className="block text-sm font-semibold" htmlFor="page-note">
          Заметка
        </label>
        <textarea
          id="page-note"
          rows={4}
          value={page.notes}
          placeholder="Добавьте заметку"
          onChange={(event) => updateDraft({ notes: event.target.value })}
          className="mt-3 w-full resize-none rounded-xl bg-[#f7f5f2] px-3 py-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400"
        />
      </section>

      {showSaved ? (
        <p className="text-center text-sm font-medium text-emerald-700" aria-live="polite">
          Сохранено
        </p>
      ) : null}

      <button
        type="button"
        onClick={handleSave}
        className="rounded-2xl bg-zinc-900 py-3.5 text-sm font-semibold text-white"
      >
        Сохранить
      </button>
    </>
  );
}

function PhotoIcon() {
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
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="8.5" cy="10.5" r="1.5" />
      <path d="m21 15-5-5-8 8" />
    </svg>
  );
}
