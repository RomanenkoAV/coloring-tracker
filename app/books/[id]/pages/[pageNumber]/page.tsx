import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { books, getBookById } from "@/lib/books";

const coloredPageDate = "15.07.2026";

export function generateStaticParams() {
  return books.flatMap((book) =>
    Array.from({ length: book.totalPages }, (_, index) => ({
      id: book.id,
      pageNumber: String(index + 1),
    })),
  );
}

export default async function ColoringPage({
  params,
}: {
  params: Promise<{ id: string; pageNumber: string }>;
}) {
  const { id, pageNumber: pageNumberParam } = await params;
  const book = getBookById(id);
  const pageNumber = Number.parseInt(pageNumberParam, 10);

  if (
    !book ||
    !/^\d+$/.test(pageNumberParam) ||
    pageNumber < 1 ||
    pageNumber > book.totalPages
  ) {
    notFound();
  }

  const isColored = book.coloredPageNumbers.includes(pageNumber);

  return (
    <AppShell>
      <header className="flex items-start gap-3 px-5 pt-6 pb-4">
        <Link
          href={`/books/${book.id}`}
          aria-label="Назад"
          className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-zinc-700 shadow-sm ring-1 ring-zinc-200/80"
        >
          <BackIcon />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{book.title}</h1>
          <p className="mt-1 text-sm text-zinc-500">Страница {pageNumber}</p>
        </div>
      </header>

      <main className="flex flex-1 flex-col gap-4 px-5 pb-28">
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
              className={`rounded-xl px-2 py-2.5 text-center text-xs font-medium ${
                isColored
                  ? "bg-[#f7f5f2] text-zinc-500"
                  : "bg-white font-semibold text-zinc-900 shadow-sm ring-1 ring-zinc-200/70"
              }`}
            >
              Не раскрашено
            </button>
            <button
              type="button"
              className={`rounded-xl px-2 py-2.5 text-center text-xs font-medium ${
                isColored
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
            type="text"
            defaultValue={isColored ? coloredPageDate : ""}
            placeholder="Выберите дату"
            className="mt-3 w-full rounded-xl bg-[#f7f5f2] px-3 py-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400"
          />
        </section>

        <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200/70">
          <label className="block text-sm font-semibold" htmlFor="page-note">
            Заметка
          </label>
          <textarea
            id="page-note"
            rows={4}
            placeholder="Добавьте заметку"
            className="mt-3 w-full resize-none rounded-xl bg-[#f7f5f2] px-3 py-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400"
          />
        </section>

        <button
          type="button"
          className="rounded-2xl bg-zinc-900 py-3.5 text-sm font-semibold text-white"
        >
          Сохранить
        </button>
      </main>
    </AppShell>
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
