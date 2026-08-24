import { getProgressPercent, type Book } from "@/lib/books";
import { getBookStats, type StoredPage } from "@/lib/pages";

export type StatisticsSummary = {
  bookCount: number;
  totalPages: number;
  completedPages: number;
  remainingPages: number;
  progressPercent: number;
};

export type BookProgress = {
  book: Book;
  completedPages: number;
  totalPages: number;
  remainingPages: number;
  percent: number;
};

export type ActivityDay = {
  date: string;
  weekdayLabel: string;
  dayLabel: string;
  count: number;
};

export type AppStatistics = {
  summary: StatisticsSummary;
  books: BookProgress[];
  activity: ActivityDay[];
};

export function buildStatistics(
  books: Book[],
  storedPages: StoredPage[],
  now: Date = new Date(),
): AppStatistics {
  const orderedBooks = [...books].sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  const bookIds = new Set(orderedBooks.map((book) => book.id));
  const pages = storedPages.filter((page) => bookIds.has(page.bookId));
  const bookProgress = orderedBooks.map((book) => {
    const stats = getBookStats(book, pages);

    return {
      book,
      completedPages: stats.coloredCount,
      totalPages: book.totalPages,
      remainingPages: Math.max(book.totalPages - stats.coloredCount, 0),
      percent: stats.percent,
    };
  });

  const totalPages = orderedBooks.reduce((sum, book) => sum + book.totalPages, 0);
  const completedPages = bookProgress.reduce((sum, item) => sum + item.completedPages, 0);
  const remainingPages = Math.max(totalPages - completedPages, 0);

  return {
    summary: {
      bookCount: orderedBooks.length,
      totalPages,
      completedPages,
      remainingPages,
      progressPercent: totalPages > 0 ? getProgressPercent(completedPages, totalPages) : 0,
    },
    books: bookProgress,
    activity: buildWeekActivity(orderedBooks, pages, now),
  };
}

function buildWeekActivity(books: Book[], storedPages: StoredPage[], now: Date): ActivityDay[] {
  const days = getLast7LocalDays(now);
  const counts = new Map(days.map((day) => [day.date, 0]));

  for (const book of books) {
    const stats = getBookStats(book, storedPages);

    for (const page of stats.pages) {
      if (page.status !== "completed" || !page.coloredAt) {
        continue;
      }

      const dateKey = toLocalDateKey(page.coloredAt);
      if (!dateKey || !counts.has(dateKey)) {
        continue;
      }

      counts.set(dateKey, (counts.get(dateKey) ?? 0) + 1);
    }
  }

  return days.map((day) => ({
    ...day,
    count: counts.get(day.date) ?? 0,
  }));
}

function getLast7LocalDays(now: Date): Omit<ActivityDay, "count">[] {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() - (6 - index));

    return {
      date: formatLocalDateKey(date),
      weekdayLabel: date
        .toLocaleDateString("ru-RU", { weekday: "short" })
        .replace(".", ""),
      dayLabel: String(date.getDate()),
    };
  });
}

function toLocalDateKey(value: string) {
  const trimmed = value.trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return formatLocalDateKey(date);
}

function formatLocalDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
