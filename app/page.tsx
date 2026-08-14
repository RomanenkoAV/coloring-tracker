import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { books, getProgressPercent } from "@/lib/books";

export default function Home() {
  return (
    <AppShell>
      <header className="flex items-start justify-between px-5 pt-6 pb-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Мои книги</h1>
          <p className="mt-1 text-sm text-zinc-500">Coloring Tracker</p>
        </div>
        <button
          type="button"
          aria-label="Статистика"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-zinc-400 shadow-sm ring-1 ring-zinc-200/80"
        >
          <ChartIcon />
        </button>
      </header>

      <main className="flex flex-1 flex-col gap-3 px-5 pb-28">
        {books.map((book) => {
          const coloredCount = book.coloredPageNumbers.length;
          const progress = getProgressPercent(coloredCount, book.totalPages);

          return (
            <Link
              key={book.id}
              href={`/books/${book.id}`}
              className="flex gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-zinc-200/70"
            >
              <div
                className="flex h-[88px] w-[66px] shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-400"
                aria-hidden="true"
              >
                <CoverIcon />
              </div>
              <div className="flex min-w-0 flex-1 flex-col justify-center">
                <h2 className="truncate text-base font-semibold">{book.title}</h2>
                <p className="mt-0.5 text-sm text-zinc-500">
                  {coloredCount} из {book.totalPages} страниц
                </p>
                <div className="mt-2.5 flex items-center gap-2">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-100">
                    <div
                      className="h-full rounded-full bg-rose-400"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-xs font-medium text-zinc-500">
                    {progress}%
                  </span>
                </div>
              </div>
            </Link>
          );
        })}

        <button
          type="button"
          className="mt-1 flex min-h-[88px] items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-white/70 text-base font-medium text-zinc-600"
        >
          + Добавить книгу
        </button>
      </main>
    </AppShell>
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

function ChartIcon() {
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
      <path d="M4 19V9" />
      <path d="M12 19V5" />
      <path d="M20 19v-7" />
    </svg>
  );
}
