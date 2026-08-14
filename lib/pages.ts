import { getProgressPercent, type Book } from "@/lib/books";

export type PageStatus = "not_started" | "completed";

export type StoredPage = {
  bookId: string;
  pageNumber: number;
  status: PageStatus;
  coloredAt: string | null;
  notes: string;
};

export const seedColoredDate = "2026-07-15";

export function pageStorageKey(bookId: string, pageNumber: number) {
  return `${bookId}:${pageNumber}`;
}

export function getDefaultPageState(book: Book, pageNumber: number): StoredPage {
  const isSeedColored = book.coloredPageNumbers.includes(pageNumber);

  return {
    bookId: book.id,
    pageNumber,
    status: isSeedColored ? "completed" : "not_started",
    coloredAt: isSeedColored ? seedColoredDate : null,
    notes: "",
  };
}

export function resolvePage(
  book: Book,
  pageNumber: number,
  storedPages: StoredPage[],
): StoredPage {
  return (
    storedPages.find(
      (page) => page.bookId === book.id && page.pageNumber === pageNumber,
    ) ?? getDefaultPageState(book, pageNumber)
  );
}

export function getBookStats(book: Book, storedPages: StoredPage[]) {
  const pages = Array.from({ length: book.totalPages }, (_, index) =>
    resolvePage(book, index + 1, storedPages),
  );
  const coloredCount = pages.filter((page) => page.status === "completed").length;

  return {
    pages,
    coloredCount,
    remainingCount: book.totalPages - coloredCount,
    percent: getProgressPercent(coloredCount, book.totalPages),
  };
}
