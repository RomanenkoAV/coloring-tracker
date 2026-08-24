import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { AuthDebug } from "@/components/auth-debug";
import { BookList } from "@/components/book-list";

export default function Home() {
  return (
    <AppShell>
      <header className="flex items-start justify-between px-5 pt-6 pb-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Мои книги</h1>
          <p className="mt-1 text-sm text-zinc-500">Coloring Tracker</p>
        </div>
        <Link
          href="/stats"
          aria-label="Статистика"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-zinc-400 shadow-sm ring-1 ring-zinc-200/80"
        >
          <ChartIcon />
        </Link>
      </header>

      <main className="flex flex-1 flex-col gap-3 px-5 pb-28">
        <BookList />

        <Link
          href="/books/new"
          className="mt-1 flex min-h-[88px] items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-white/70 text-base font-medium text-zinc-600"
        >
          + Добавить книгу
        </Link>

        <AuthDebug />
      </main>
    </AppShell>
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
