export const PAGE_COUNT = 100;

export type Book = {
  id: string;
  title: string;
  totalPages: number;
  coverUrl: string | null;
  createdAt: string;
};

export const baseBooks: Book[] = [
  {
    id: "princesses",
    title: "Princesses",
    totalPages: PAGE_COUNT,
    coverUrl: null,
    createdAt: "2026-07-15T00:00:00.000Z",
  },
  {
    id: "animals",
    title: "Animals",
    totalPages: PAGE_COUNT,
    coverUrl: null,
    createdAt: "2026-07-15T00:00:00.000Z",
  },
];

const seedColoredPageNumbers: Record<string, number[]> = {
  princesses: [1, 2, 3, 7],
  animals: Array.from({ length: 12 }, (_, index) => index + 1),
};

export function getBaseBookById(id: string) {
  return baseBooks.find((book) => book.id === id);
}

export function getSeedColoredPageNumbers(bookId: string) {
  return seedColoredPageNumbers[bookId] ?? [];
}

export function getProgressPercent(coloredCount: number, totalPages: number) {
  return Math.round((coloredCount / totalPages) * 100);
}

export function isValidPageNumber(value: string) {
  const pageNumber = Number.parseInt(value, 10);
  return /^\d+$/.test(value) && pageNumber >= 1 && pageNumber <= PAGE_COUNT;
}
