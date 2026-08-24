"use client";

import { useMemo } from "react";
import { useBooksRepository } from "@/lib/data/books-repository";
import { useAllPagesRepository, type PostgrestErrorInfo } from "@/lib/data/pages-repository";
import { buildStatistics, type AppStatistics } from "@/lib/statistics";

type StatisticsSource = "loading" | "local" | "supabase" | "telegram-auth-failed";

type UseStatisticsRepositoryResult = AppStatistics & {
  source: StatisticsSource;
  loading: boolean;
  error: PostgrestErrorInfo | null;
};

export function useStatisticsRepository(): UseStatisticsRepositoryResult {
  const booksState = useBooksRepository();
  const pagesState = useAllPagesRepository();
  const statistics = useMemo(
    () => buildStatistics(booksState.books, pagesState.pages),
    [booksState.books, pagesState.pages],
  );

  return {
    ...statistics,
    source: booksState.source,
    loading: booksState.loading || pagesState.loading,
    error: pagesState.error,
  };
}
