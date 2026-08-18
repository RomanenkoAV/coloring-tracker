"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createUserBook, useAllBooks } from "@/lib/book-storage";
import { PAGE_COUNT, type Book } from "@/lib/books";
import { createAuthenticatedClient } from "@/lib/supabase/client";
import { useTelegramSession } from "@/lib/telegram/session";

type SupabaseBookRow = {
  id: string;
  title: string;
  total_pages: number;
  cover_path: string | null;
  created_at: string;
};

export type PostgrestErrorInfo = {
  code: string | null;
  message: string | null;
  details: string | null;
  hint: string | null;
};

type BooksSource = "loading" | "local" | "supabase" | "telegram-auth-failed";

type UseBooksRepositoryResult = {
  books: Book[];
  source: BooksSource;
  loading: boolean;
  createBook: (title: string) => Promise<{ book: Book | null; error: PostgrestErrorInfo | null }>;
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

  const createBook = useCallback(async (title: string) => {
    if (session.kind === "telegram-authenticated") {
      try {
        const book = await insertSupabaseBook(session.accessToken, title);
        setRemoteState((current) => ({
          key: session.accessToken,
          books: [...current.books, book],
        }));
        return { book, error: null };
      } catch (error) {
        return { book: null, error: readPostgrestError(error) };
      }
    }

    if (session.kind === "browser") {
      const book = createUserBook(title);
      return {
        book,
        error: book ? null : { code: null, message: "Failed to create book", details: null, hint: null },
      };
    }

    return { book: null, error: { code: null, message: "Telegram session is not ready", details: null, hint: null } };
  }, [session]);

  return useMemo(() => {
    if (session.kind === "checking") {
      return {
        books: [],
        source: "loading" as const,
        loading: true,
        createBook,
      };
    }

    if (session.kind === "browser") {
      return {
        books: localBooks,
        source: "local" as const,
        loading: false,
        createBook,
      };
    }

    if (session.kind === "telegram-authenticated") {
      return {
        books: remoteState.key === session.accessToken ? remoteState.books : [],
        source: "supabase" as const,
        loading: remoteState.key !== session.accessToken,
        createBook,
      };
    }

    return {
      books: [],
      source: "telegram-auth-failed" as const,
      loading: false,
      createBook,
    };
  }, [createBook, localBooks, remoteState, session]);
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

  return {
    code: typeof error.code === "string" ? error.code : null,
    message: typeof error.message === "string" ? error.message : "Failed to create book",
    details: typeof error.details === "string" ? error.details : null,
    hint: typeof error.hint === "string" ? error.hint : null,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
