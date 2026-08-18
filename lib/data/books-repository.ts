"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createUserBook, useAllBooks } from "@/lib/book-storage";
import { PAGE_COUNT, type Book } from "@/lib/books";
import {
  uploadBookCover as uploadCoverObject,
  type SafeErrorInfo,
} from "@/lib/data/media-repository";
import { createAuthenticatedClient } from "@/lib/supabase/client";
import { useTelegramSession } from "@/lib/telegram/session";

type SupabaseBookRow = {
  id: string;
  title: string;
  total_pages: number;
  cover_path: string | null;
  created_at: string;
};

export type PostgrestErrorInfo = SafeErrorInfo;

type BooksSource = "loading" | "local" | "supabase" | "telegram-auth-failed";

type CreateBookResult = {
  book: Book | null;
  error: PostgrestErrorInfo | null;
  coverError: PostgrestErrorInfo | null;
};

type UseBooksRepositoryResult = {
  books: Book[];
  source: BooksSource;
  loading: boolean;
  createBook: (title: string, coverFile?: File | null) => Promise<CreateBookResult>;
  uploadBookCover: (bookId: string, file: File) => Promise<CreateBookResult>;
};

type RemoteBooksState = {
  key: string | null;
  books: Book[];
};

export function useBooksRepository(): UseBooksRepositoryResult {
  const session = useTelegramSession();
  const localBooks = useAllBooks();
  const [remoteState, setRemoteState] = useState<RemoteBooksState>({
    key: null,
    books: [],
  });

  useEffect(() => {
    let cancelled = false;

    if (session.kind !== "telegram-authenticated") {
      return;
    }

    void listSupabaseBooks(session.accessToken)
      .then((books) => {
        if (!cancelled) {
          setRemoteState({ key: session.accessToken, books });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRemoteState({ key: session.accessToken, books: [] });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [session]);

  const createBook = useCallback(async (title: string, coverFile?: File | null) => {
    if (session.kind === "telegram-authenticated") {
      let book: Book;

      try {
        book = await insertSupabaseBook(session.accessToken, title);
      } catch (error) {
        return { book: null, error: readPostgrestError(error), coverError: null };
      }

      setRemoteState((current) => ({
        key: session.accessToken,
        books: mergeBook(current.books, book),
      }));

      if (!coverFile) {
        return { book, error: null, coverError: null };
      }

      try {
        const withCover = await attachSupabaseBookCover(session.accessToken, book.id, coverFile);
        setRemoteState((current) => ({
          key: session.accessToken,
          books: mergeBook(current.books, withCover),
        }));
        return { book: withCover, error: null, coverError: null };
      } catch (error) {
        return { book, error: null, coverError: readPostgrestError(error) };
      }
    }

    if (session.kind === "browser") {
      const book = createUserBook(title);
      return {
        book,
        error: book ? null : { code: null, message: "Failed to create book", details: null, hint: null },
        coverError: null,
      };
    }

    return {
      book: null,
      error: { code: null, message: "Telegram session is not ready", details: null, hint: null },
      coverError: null,
    };
  }, [session]);

  const uploadBookCover = useCallback(async (bookId: string, file: File) => {
    if (session.kind !== "telegram-authenticated") {
      return {
        book: null,
        error: null,
        coverError: { code: null, message: "Cover upload is only available in Telegram", details: null, hint: null },
      };
    }

    try {
      const book = await attachSupabaseBookCover(session.accessToken, bookId, file);
      setRemoteState((current) => ({
        key: session.accessToken,
        books: mergeBook(current.books, book),
      }));
      return { book, error: null, coverError: null };
    } catch (error) {
      return { book: null, error: null, coverError: readPostgrestError(error) };
    }
  }, [session]);

  return useMemo(() => {
    if (session.kind === "checking") {
      return {
        books: [],
        source: "loading" as const,
        loading: true,
        createBook,
        uploadBookCover,
      };
    }

    if (session.kind === "browser") {
      return {
        books: localBooks,
        source: "local" as const,
        loading: false,
        createBook,
        uploadBookCover,
      };
    }

    if (session.kind === "telegram-authenticated") {
      return {
        books: remoteState.key === session.accessToken ? remoteState.books : [],
        source: "supabase" as const,
        loading: remoteState.key !== session.accessToken,
        createBook,
        uploadBookCover,
      };
    }

    return {
      books: [],
      source: "telegram-auth-failed" as const,
      loading: false,
      createBook,
      uploadBookCover,
    };
  }, [createBook, localBooks, remoteState, session, uploadBookCover]);
}

export function useBookRepository(bookId: string) {
  const booksState = useBooksRepository();

  return {
    ...booksState,
    book: booksState.books.find((book) => book.id === bookId) ?? null,
  };
}

async function listSupabaseBooks(accessToken: string) {
  const client = createAuthenticatedClient(accessToken);
  const { data, error } = await client
    .from("books")
    .select("id, title, total_pages, cover_path, created_at")
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapSupabaseBookRow);
}

async function insertSupabaseBook(accessToken: string, title: string) {
  const client = createAuthenticatedClient(accessToken);
  const payload = {
    id: crypto.randomUUID(),
    title: title.trim(),
    total_pages: PAGE_COUNT,
    cover_path: null,
    created_at: new Date().toISOString(),
  };
  const { data, error } = await client
    .from("books")
    .insert(payload)
    .select("id, title, total_pages, cover_path, created_at")
    .single();

  if (error || !data) {
    throw error ?? new Error("Failed to create book");
  }

  return mapSupabaseBookRow(data);
}

async function attachSupabaseBookCover(accessToken: string, bookId: string, file: File) {
  const coverPath = await uploadCoverObject(accessToken, bookId, file);
  return updateSupabaseBookCoverPath(accessToken, bookId, coverPath);
}

async function updateSupabaseBookCoverPath(accessToken: string, bookId: string, coverPath: string) {
  const client = createAuthenticatedClient(accessToken);
  const { data, error } = await client
    .from("books")
    .update({ cover_path: coverPath })
    .eq("id", bookId)
    .select("id, title, total_pages, cover_path, created_at")
    .single();

  if (error || !data) {
    throw error ?? new Error("Failed to save cover path");
  }

  return mapSupabaseBookRow(data);
}

function mergeBook(books: Book[], next: Book) {
  const remaining = books.filter((book) => book.id !== next.id);
  return [...remaining, next];
}

function mapSupabaseBookRow(row: SupabaseBookRow): Book {
  return {
    id: row.id,
    title: row.title,
    totalPages: PAGE_COUNT,
    coverUrl: row.cover_path,
    createdAt: row.created_at,
  };
}

function readPostgrestError(error: unknown): PostgrestErrorInfo {
  if (!isRecord(error)) {
    return { code: null, message: "Failed to create book", details: null, hint: null };
  }

  const codeValue = error.statusCode ?? error.code;

  return {
    code: typeof codeValue === "string" || typeof codeValue === "number" ? String(codeValue) : null,
    message: typeof error.message === "string" ? error.message : "Failed to create book",
    details: typeof error.details === "string" ? error.details : typeof error.error === "string" ? error.error : null,
    hint: typeof error.hint === "string" ? error.hint : null,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
