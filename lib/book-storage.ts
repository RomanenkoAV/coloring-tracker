"use client";

import { useMemo, useSyncExternalStore } from "react";
import {
  PAGE_COUNT,
  baseBooks,
  getBaseBookById,
  type Book,
} from "@/lib/books";

const STORAGE_KEY = "coloring-tracker:books";
const CHANGE_EVENT = "coloring-tracker-books-changed";

export function getUserBooks() {
  return readUserBooks();
}

export function getUserBookById(id: string) {
  return getUserBooks().find((book) => book.id === id) ?? null;
}

export function getAllBooks() {
  return mergeBooks(getUserBooks());
}

export function getBookById(id: string) {
  return getAllBooks().find((book) => book.id === id) ?? null;
}

export function saveUserBook(book: Book) {
  if (typeof window === "undefined") {
    return false;
  }

  const nextBook = normalizeBook({
    ...book,
    title: book.title.trim(),
    totalPages: PAGE_COUNT,
  });

  if (!nextBook || getBaseBookById(nextBook.id)) {
    return false;
  }

  const books = readUserBooks().filter((item) => item.id !== nextBook.id);
  books.push(nextBook);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
  window.dispatchEvent(new Event(CHANGE_EVENT));
  return true;
}

export function createUserBook(title: string) {
  const book: Book = {
    id: crypto.randomUUID(),
    title: title.trim(),
    totalPages: PAGE_COUNT,
    coverUrl: null,
    createdAt: new Date().toISOString(),
  };

  const saved = saveUserBook(book);
  return saved ? book : null;
}

export function useAllBooks() {
  const snapshot = useSyncExternalStore(
    subscribeToBookStorage,
    getBookStorageSnapshot,
    getServerBookStorageSnapshot,
  );

  return useMemo(
    () => mergeBooks(parseUserBooks(snapshot)),
    [snapshot],
  );
}

export function useBook(id: string) {
  return useAllBooks().find((book) => book.id === id);
}

export function useHasClientStorage() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

function mergeBooks(userBooks: Book[]) {
  const baseIds = new Set(baseBooks.map((book) => book.id));
  return [...baseBooks, ...userBooks.filter((book) => !baseIds.has(book.id))];
}

function subscribeToBookStorage(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(CHANGE_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(CHANGE_EVENT, onStoreChange);
  };
}

function getBookStorageSnapshot() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? "[]";
  } catch {
    return "[]";
  }
}

function getServerBookStorageSnapshot() {
  return "[]";
}

function readUserBooks() {
  if (typeof window === "undefined") {
    return [];
  }

  return parseUserBooks(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
}

function parseUserBooks(snapshot: string): Book[] {
  try {
    const parsed: unknown = JSON.parse(snapshot);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((item) => normalizeBook(item))
      .filter((book): book is Book => book !== null);
  } catch {
    return [];
  }
}

function normalizeBook(value: unknown): Book | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const book = value as Partial<Book>;

  if (
    typeof book.id !== "string" ||
    book.id.length === 0 ||
    book.id === "new" ||
    typeof book.title !== "string" ||
    book.title.trim().length === 0 ||
    (book.coverUrl !== null && typeof book.coverUrl !== "string") ||
    typeof book.createdAt !== "string"
  ) {
    return null;
  }

  return {
    id: book.id,
    title: book.title.trim(),
    totalPages: PAGE_COUNT,
    coverUrl: book.coverUrl,
    createdAt: book.createdAt,
  };
}
