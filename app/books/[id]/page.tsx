import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { books, getBookById, getProgressPercent } from "@/lib/books";

export function generateStaticParams() {
  return books.map((book) => ({ id: book.id }));
}

export default async function BookPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const book = getBookById(id);

  if (!book) {
    notFound();
  }

  const coloredCount = book.coloredPageNumbers.length;
  const remainingCount = book.totalPages - coloredCount;
  const progress = getProgressPercent(coloredCount, book.totalPages);
  const coloredPages = new Set(book.coloredPageNumbers);
  const pages = Array.from({ length: book.totalPages }, (_, index) => index + 1);

  return (
    <AppShell>
      <header className="flex items-start gap-3 px-5 pt-6 pb-4">
        <Link
          href="/"
          aria-label="Назад"
          className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-zinc-700 shadow-sm ring-1 ring-zinc-200/80"
        >
          <BackIcon />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{book.title}</h1>
          <p className="mt-1 text-sm text-zinc-500">{book.totalPages} страниц</p>
        </div>
      </header>

      <main className="flex flex-1 flex-col gap-4 px-5 pb-28">
        <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200/70">
          <div className="flex items-center justify-between text-sm">
            <p className="font-medium text-zinc-700">
              {coloredCount} из {book.totalPages}
            </p>
            <p className="font-medium text-zinc-500">{progress}%</p>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-100">
            <div
              className="h-full rounded-full bg-rose-400"
              style={{ width: `${progress}%` }}
            />
          </div>
        </section>

        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-white px-2 py-2.5 text-center text-xs font-semibold text-zinc-900 shadow-sm ring-1 ring-zinc-200/70">
            Все {book.totalPages}
          </div>
          <div className="rounded-xl bg-white/70 px-2 py-2.5 text-center text-xs font-medium text-zinc-500">
            Раскрашено {coloredCount}
          </div>
          <div className="rounded-xl bg-white/70 px-2 py-2.5 text-center text-xs font-medium text-zinc-500">
            Осталось {remainingCount}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {pages.map((page) => {
            const isColored = coloredPages.has(page);

            return (
              <Link
                key={page}
                href={`/books/${book.id}/pages/${page}`}
                className={`flex aspect-square flex-col items-center justify-center gap-1 rounded-xl ${
                  isColored
                    ? "bg-sky-100 text-blue-700"
                    : "bg-white text-zinc-500 ring-1 ring-zinc-200/70"
                }`}
              >
                {isColored ? <CheckIcon /> : <span className="text-lg leading-none">+</span>}
                <span className="text-xs font-medium">{page}</span>
              </Link>
            );
          })}
        </div>
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
