export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-[#f7f5f2] text-zinc-900">
      {children}
      <nav className="fixed bottom-0 left-1/2 w-full max-w-[430px] -translate-x-1/2 border-t border-zinc-200 bg-white pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-2">
          <button
            type="button"
            className="flex flex-col items-center gap-1 py-3 text-xs font-semibold text-zinc-900"
          >
            <BooksIcon />
            Книги
          </button>
          <button
            type="button"
            className="flex flex-col items-center gap-1 py-3 text-xs font-medium text-zinc-400"
          >
            <ChartIcon />
            Статистика
          </button>
        </div>
      </nav>
    </div>
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
