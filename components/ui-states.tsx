"use client";

export function RetryButton({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
    >
      Повторить
    </button>
  );
}

export function LoadErrorCard({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <section className="rounded-2xl bg-white p-5 text-center shadow-sm ring-1 ring-zinc-200/70">
      <p className="text-sm font-medium text-rose-600" role="alert">
        {message}
      </p>
      <div className="mt-4 flex justify-center">
        <RetryButton onClick={onRetry} />
      </div>
    </section>
  );
}

export function BookCardSkeleton() {
  return (
    <div className="flex gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-zinc-200/70">
      <div className="h-[88px] w-[66px] shrink-0 animate-pulse rounded-xl bg-zinc-200" />
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-2">
        <div className="h-4 w-2/3 animate-pulse rounded bg-zinc-200" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-zinc-100" />
        <div className="mt-1 h-2 w-full animate-pulse rounded-full bg-zinc-100" />
      </div>
    </div>
  );
}

export function BookListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, index) => (
        <BookCardSkeleton key={index} />
      ))}
    </>
  );
}

export function StatsScreenSkeleton() {
  return (
    <>
      <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200/70">
        <div className="h-4 w-28 animate-pulse rounded bg-zinc-200" />
        <div className="mt-3 h-9 w-20 animate-pulse rounded bg-zinc-200" />
        <div className="mt-4 h-2 w-full animate-pulse rounded-full bg-zinc-100" />
        <div className="mt-4 grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="h-16 animate-pulse rounded-xl bg-zinc-100" />
          ))}
        </div>
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200/70">
        <div className="h-4 w-48 animate-pulse rounded bg-zinc-200" />
        <div className="mt-4 flex h-36 items-end gap-2">
          {Array.from({ length: 7 }, (_, index) => (
            <div key={index} className="h-full flex-1 animate-pulse rounded-lg bg-zinc-100" />
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <div className="h-4 w-36 animate-pulse rounded bg-zinc-200" />
        <BookListSkeleton count={2} />
      </section>
    </>
  );
}
