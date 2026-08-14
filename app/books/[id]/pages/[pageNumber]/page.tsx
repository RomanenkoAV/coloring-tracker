import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PageForm } from "@/components/page-form";
import { books, getBookById } from "@/lib/books";

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
        <PageForm book={book} pageNumber={pageNumber} />
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
