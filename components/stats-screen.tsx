"use client";

import Link from "next/link";
import { useState } from "react";
import { useSignedCoverUrl } from "@/lib/data/media-repository";
import { useStatisticsRepository } from "@/lib/data/statistics-repository";
import type { ActivityDay, BookProgress } from "@/lib/statistics";

export function StatsScreen() {
  const { summary, books, activity, loading, source, error } = useStatisticsRepository();
  const isEmpty = !loading && source !== "loading" && summary.bookCount === 0;

  return (
    <>
      <header className="px-5 pt-6 pb-4">
        <h1 className="text-2xl font-semibold tracking-tight">Статистика</h1>
        <p className="mt-1 text-sm text-zinc-500">Coloring Tracker</p>
      </header>

      <main className="flex flex-1 flex-col gap-4 px-5 pb-28">
        {loading || source === "loading" ? (
          <p className="text-center text-sm text-zinc-500">Загружаем статистику...</p>
        ) : error ? (
          <p className="rounded-2xl bg-white p-4 text-center text-sm font-medium text-rose-600 shadow-sm ring-1 ring-zinc-200/70" role="alert">
            Не удалось загрузить данные
          </p>
        ) : (
          <>
            <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200/70">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-sm font-medium text-zinc-500">Общий прогресс</p>
                  <p className="mt-1 text-3xl font-semibold tracking-tight">{summary.progressPercent}%</p>
                </div>
                <p className="text-sm text-zinc-500">
                  {summary.completedPages} из {summary.totalPages}
                </p>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-zinc-100">
                <div
                  className="h-full rounded-full bg-rose-400"
                  style={{ width: `${summary.progressPercent}%` }}
                />
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-3">
                <SummaryStat label="Книги" value={summary.bookCount} />
                <SummaryStat label="Страниц" value={summary.totalPages} />
                <SummaryStat label="Раскрашено" value={summary.completedPages} />
                <SummaryStat label="Осталось" value={summary.remainingPages} />
              </dl>
            </section>

            <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200/70">
              <h2 className="text-sm font-semibold">Раскрашено за последние 7 дней</h2>
              <WeekActivityChart activity={activity} />
            </section>

            {isEmpty ? (
              <section className="rounded-2xl bg-white p-5 text-center shadow-sm ring-1 ring-zinc-200/70">
                <p className="text-sm font-semibold text-zinc-900">Пока нет книг</p>
                <p className="mt-2 text-sm text-zinc-500">
                  Добавьте книгу, чтобы видеть прогресс и активность.
                </p>
                <Link
                  href="/books/new"
                  className="mt-4 inline-flex rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white"
                >
                  Добавить книгу
                </Link>
              </section>
            ) : (
              <section className="flex flex-col gap-3">
                <h2 className="text-sm font-semibold text-zinc-900">Прогресс по книгам</h2>
                {books.map((item) => (
                  <StatsBookRow key={item.book.id} item={item} />
                ))}
              </section>
            )}
          </>
        )}
      </main>
    </>
  );
}

function SummaryStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-[#f7f5f2] px-3 py-2.5">
      <dt className="text-xs font-medium text-zinc-500">{label}</dt>
      <dd className="mt-0.5 text-lg font-semibold tracking-tight">{value}</dd>
    </div>
  );
}

function WeekActivityChart({ activity }: { activity: ActivityDay[] }) {
  const maxCount = Math.max(0, ...activity.map((day) => day.count));
  const chartMax = Math.max(maxCount, 1);

  return (
    <div className="mt-4 flex items-end gap-2">
      {activity.map((day) => {
        const heightPercent = Math.round((day.count / chartMax) * 100);

        return (
          <div key={day.date} className="flex min-w-0 flex-1 flex-col items-center gap-2">
            <span className="text-[11px] font-medium text-zinc-500">{day.count}</span>
            <div className="flex h-24 w-full items-end rounded-lg bg-zinc-100">
              <div
                className="w-full rounded-lg bg-rose-400"
                style={{ height: `${heightPercent}%` }}
                title={`${day.date}: ${day.count}`}
              />
            </div>
            <div className="text-center">
              <p className="text-[11px] font-medium capitalize text-zinc-600">{day.weekdayLabel}</p>
              <p className="text-[10px] text-zinc-400">{day.dayLabel}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StatsBookRow({ item }: { item: BookProgress }) {
  const coverSrc = useSignedCoverUrl(item.book.coverUrl);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const showCover = Boolean(coverSrc) && failedSrc !== coverSrc;

  return (
    <Link
      href={`/books/${item.book.id}`}
      className="flex gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-zinc-200/70"
    >
      <div
        className="flex h-[88px] w-[66px] shrink-0 items-center justify-center overflow-hidden rounded-xl bg-zinc-100 text-zinc-400"
        aria-hidden="true"
      >
        {showCover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverSrc ?? undefined}
            alt=""
            onError={() => {
              if (coverSrc) {
                setFailedSrc(coverSrc);
              }
            }}
            className="h-full w-full object-cover"
          />
        ) : (
          <CoverIcon />
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center">
        <h3 className="truncate text-base font-semibold">{item.book.title}</h3>
        <p className="mt-0.5 text-sm text-zinc-500">
          {item.completedPages} из {item.totalPages}
        </p>
        <div className="mt-2.5 flex items-center gap-2">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-100">
            <div
              className="h-full rounded-full bg-rose-400"
              style={{ width: `${item.percent}%` }}
            />
          </div>
          <span className="w-8 text-right text-xs font-medium text-zinc-500">{item.percent}%</span>
        </div>
      </div>
    </Link>
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
