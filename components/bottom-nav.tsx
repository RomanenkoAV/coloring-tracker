"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function BottomNav() {
  const pathname = usePathname();
  const statsActive = pathname === "/stats";

  return (
    <nav className="fixed bottom-0 left-1/2 w-full max-w-[430px] -translate-x-1/2 border-t border-zinc-200 bg-white pb-[env(safe-area-inset-bottom)]">
      <div className="grid grid-cols-2">
        <Link
          href="/"
          aria-current={!statsActive ? "page" : undefined}
          className={`flex flex-col items-center gap-1 py-3 text-xs ${
            statsActive ? "font-medium text-zinc-400" : "font-semibold text-zinc-900"
          }`}
        >
          <BooksIcon />
          Книги
        </Link>
        <Link
          href="/stats"
          aria-current={statsActive ? "page" : undefined}
          className={`flex flex-col items-center gap-1 py-3 text-xs ${
            statsActive ? "font-semibold text-zinc-900" : "font-medium text-zinc-400"
          }`}
        >
          <ChartIcon />
          Статистика
        </Link>
      </div>
    </nav>
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

function BooksIcon() {
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
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}
