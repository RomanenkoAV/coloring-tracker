"use client";

import { useMemo, useSyncExternalStore } from "react";
import {
  pageStorageKey,
  type PageStatus,
  type StoredPage,
} from "@/lib/pages";

const STORAGE_KEY = "coloring-tracker:pages";
const CHANGE_EVENT = "coloring-tracker-pages-changed";

export function getStoredPage(bookId: string, pageNumber: number) {
  return readAll()[pageStorageKey(bookId, pageNumber)] ?? null;
}

export function saveStoredPage(page: StoredPage) {
  if (typeof window === "undefined") {
    return;
  }

  const pages = readAll();
  pages[pageStorageKey(page.bookId, page.pageNumber)] = page;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(pages));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function getStoredPagesByBook(bookId: string) {
  return Object.values(readAll()).filter((page) => page.bookId === bookId);
}

export function deleteStoredPagesForBook(bookId: string) {
  if (typeof window === "undefined") {
    return;
  }

  const remaining = Object.fromEntries(
    Object.entries(readAll()).filter(([, page]) => page.bookId !== bookId),
  );
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function subscribeToPageStorage(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(CHANGE_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(CHANGE_EVENT, onStoreChange);
  };
}

export function getPageStorageSnapshot() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? "{}";
  } catch {
    return "{}";
  }
}

export function getServerPageStorageSnapshot() {
  return "{}";
}

export function parsePageStorageSnapshot(snapshot: string): StoredPage[] {
  try {
    const parsed: unknown = JSON.parse(snapshot);

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return [];
    }

    return Object.values(parsed)
      .filter(isStoredPage)
      .map(normalizeStoredPage);
  } catch {
    return [];
  }
}

export function useStoredPages() {
  const snapshot = useSyncExternalStore(
    subscribeToPageStorage,
    getPageStorageSnapshot,
    getServerPageStorageSnapshot,
  );

  return useMemo(() => parsePageStorageSnapshot(snapshot), [snapshot]);
}

function readAll(): Record<string, StoredPage> {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const parsed: unknown = JSON.parse(
      window.localStorage.getItem(STORAGE_KEY) ?? "{}",
    );

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }

    return Object.fromEntries(
      Object.entries(parsed)
        .filter(([, page]) => isStoredPage(page))
        .map(([key, page]) => [key, normalizeStoredPage(page as StoredPage)]),
    );
  } catch {
    return {};
  }
}

function normalizeStoredPage(page: StoredPage): StoredPage {
  return {
    ...page,
    photoPath: page.photoPath ?? null,
  };
}

function isStoredPage(value: unknown): value is StoredPage {
  if (!value || typeof value !== "object") {
    return false;
  }

  const page = value as Partial<StoredPage>;

  return (
    typeof page.bookId === "string" &&
    Number.isInteger(page.pageNumber) &&
    isPageStatus(page.status) &&
    (page.coloredAt === null || typeof page.coloredAt === "string") &&
    typeof page.notes === "string" &&
    (page.photoPath === undefined || page.photoPath === null || typeof page.photoPath === "string")
  );
}

function isPageStatus(value: unknown): value is PageStatus {
  return value === "not_started" || value === "completed";
}
