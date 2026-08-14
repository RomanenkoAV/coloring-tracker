export type Book = {
  id: string;
  title: string;
  totalPages: number;
  coloredPageNumbers: number[];
};

export const books: Book[] = [
  {
    id: "princesses",
    title: "Princesses",
    totalPages: 100,
    coloredPageNumbers: [1, 2, 3, 7],
  },
  {
    id: "animals",
    title: "Animals",
    totalPages: 100,
    coloredPageNumbers: Array.from({ length: 12 }, (_, index) => index + 1),
  },
];

export function getBookById(id: string) {
  return books.find((book) => book.id === id);
}

export function getProgressPercent(coloredCount: number, totalPages: number) {
  return Math.round((coloredCount / totalPages) * 100);
}
