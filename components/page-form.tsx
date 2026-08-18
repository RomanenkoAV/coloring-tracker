"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import type { Book } from "@/lib/books";
import { useSignedMediaUrl, validateImageFile } from "@/lib/data/media-repository";
import { usePagesRepository } from "@/lib/data/pages-repository";
import { getDefaultPageState, resolvePage, type StoredPage } from "@/lib/pages";

export function PageForm({
  book,
  pageNumber,
}: {
  book: Book;
  pageNumber: number;
}) {
  const { pages, source, loading, savePage } = usePagesRepository(book.id);
  const savedPage = resolvePage(book, pageNumber, pages);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoPreviewRef = useRef<string | null>(null);
  const [draft, setDraft] = useState<StoredPage | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [showSaved, setShowSaved] = useState(false);
  const [error, setError] = useState("");
  const [saveDebug, setSaveDebug] = useState<{
    code: string | null;
    message: string | null;
    details: string | null;
    hint: string | null;
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const page = draft ?? savedPage;
  const signedPhotoUrl = useSignedMediaUrl(page.photoPath);
  const displayPhotoSrc = photoPreview ?? (signedPhotoUrl && signedPhotoUrl !== failedSrc ? signedPhotoUrl : null);
  const isBusy = isSaving || loading || source === "loading";

  useEffect(() => {
    return () => {
      if (photoPreviewRef.current) {
        URL.revokeObjectURL(photoPreviewRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!showSaved) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setShowSaved(false);
    }, 2000);

    return () => window.clearTimeout(timeoutId);
  }, [showSaved]);

  function clearError() {
    if (error) {
      setError("");
      setSaveDebug(null);
    }
  }

  function replacePhotoPreview(file: File) {
    if (photoPreviewRef.current) {
      URL.revokeObjectURL(photoPreviewRef.current);
    }

    const previewUrl = URL.createObjectURL(file);
    photoPreviewRef.current = previewUrl;
    setPhotoPreview(previewUrl);
  }

  function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";

    if (!file) {
      return;
    }

    const validationError = validateImageFile(file);

    if (validationError) {
      setError(validationError.message ?? "Не удалось выбрать фото");
      setSaveDebug(validationError);
      return;
    }

    setPhotoFile(file);
    replacePhotoPreview(file);
    clearError();
  }

  function updateDraft(patch: Partial<StoredPage>) {
    const current = draft ?? savedPage ?? getDefaultPageState(book, pageNumber);
    const nextStatus = patch.status ?? current.status;

    setDraft({
      ...current,
      ...patch,
      coloredAt:
        nextStatus === "not_started" ? null : (patch.coloredAt ?? current.coloredAt),
    });
    clearError();
  }

  async function handleSave() {
    if (isBusy) {
      return;
    }

    const nextPage: StoredPage = {
      bookId: book.id,
      pageNumber,
      status: page.status,
      coloredAt: page.status === "completed" ? page.coloredAt : null,
      notes: page.notes,
      photoPath: page.photoPath ?? null,
    };

    setIsSaving(true);
    const result = await savePage(nextPage, photoFile);
    setIsSaving(false);

    if (!result.page) {
      setShowSaved(false);
      setError(
        source === "telegram-auth-failed"
          ? "Сначала войдите через Telegram"
          : "Не удалось сохранить страницу",
      );
      setSaveDebug(result.error);
      return;
    }

    setDraft(result.page);
    setPhotoFile(null);
    setShowSaved(true);
    setError("");
    setSaveDebug(null);
  }

  return (
    <>
      <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200/70">
        <div className="flex aspect-[4/3] flex-col items-center justify-center overflow-hidden rounded-xl bg-zinc-100 text-zinc-400">
          {displayPhotoSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={displayPhotoSrc}
              alt=""
              onError={() => {
                if (!photoPreview && signedPhotoUrl) {
                  setFailedSrc(signedPhotoUrl);
                }
              }}
              className="h-full w-full object-cover"
            />
          ) : (
            <>
              <PhotoIcon />
              <p className="mt-2 text-sm font-medium">Фото ещё нет</p>
            </>
          )}
        </div>
        <p className="mt-3 text-sm text-zinc-500">Добавьте фото раскрашенной страницы</p>
        <input
          ref={fileInputRef}
          id="page-photo"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handlePhotoChange}
        />
        <button
          type="button"
          disabled={isBusy}
          onClick={() => fileInputRef.current?.click()}
          className="mt-3 flex w-full items-center justify-center rounded-xl bg-[#f7f5f2] py-3 text-sm font-medium text-zinc-700 disabled:opacity-60"
        >
          {displayPhotoSrc ? "Заменить фото" : "+ Добавить фото"}
        </button>
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200/70">
        <h2 className="text-sm font-semibold">Статус</h2>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            aria-pressed={page.status === "not_started"}
            disabled={isBusy}
            onClick={() => updateDraft({ status: "not_started" })}
            className={`rounded-xl px-2 py-2.5 text-center text-xs font-medium disabled:opacity-60 ${
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
            disabled={isBusy}
            onClick={() => updateDraft({ status: "completed" })}
            className={`rounded-xl px-2 py-2.5 text-center text-xs font-medium disabled:opacity-60 ${
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
          disabled={isBusy || page.status !== "completed"}
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
          disabled={isBusy}
          onChange={(event) => updateDraft({ notes: event.target.value })}
          className="mt-3 w-full resize-none rounded-xl bg-[#f7f5f2] px-3 py-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 disabled:text-zinc-400"
        />
      </section>

      {showSaved ? (
        <p className="text-center text-sm font-medium text-emerald-700" aria-live="polite">
          Сохранено
        </p>
      ) : null}
      {error ? (
        <div className="text-center text-sm text-rose-600" role="alert">
          <p className="font-medium">{error}</p>
          {saveDebug ? (
            <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-left text-[11px] text-zinc-600">
              <dt>code</dt>
              <dd className="break-all">{saveDebug.code ?? "n/a"}</dd>
              <dt>message</dt>
              <dd className="break-all">{saveDebug.message ?? "n/a"}</dd>
              <dt>details</dt>
              <dd className="break-all">{saveDebug.details ?? "n/a"}</dd>
              <dt>hint</dt>
              <dd className="break-all">{saveDebug.hint ?? "n/a"}</dd>
            </dl>
          ) : null}
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => void handleSave()}
        disabled={isBusy}
        className="rounded-2xl bg-zinc-900 py-3.5 text-sm font-semibold text-white disabled:opacity-60"
      >
        {isSaving ? "Сохраняем..." : "Сохранить"}
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
