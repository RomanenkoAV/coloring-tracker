"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { saveStoredPage, useStoredPages } from "@/lib/page-storage";
import { type StoredPage } from "@/lib/pages";
import { uploadPagePhoto } from "@/lib/data/media-repository";
import { createAuthenticatedClient } from "@/lib/supabase/client";
import { useTelegramSession } from "@/lib/telegram/session";

type SupabasePageRow = {
  book_id: string;
  page_number: number;
  status: "not_started" | "completed";
  colored_at: string | null;
  notes: string | null;
  photo_path: string | null;
};

export type PostgrestErrorInfo = {
  code: string | null;
  message: string | null;
  details: string | null;
  hint: string | null;
};

type PagesSource = "loading" | "local" | "supabase" | "telegram-auth-failed";

type SavePageResult = {
  page: StoredPage | null;
  error: PostgrestErrorInfo | null;
};

type UsePagesRepositoryResult = {
  pages: StoredPage[];
  source: PagesSource;
  loading: boolean;
  error: PostgrestErrorInfo | null;
  refetch: () => void;
  savePage: (page: StoredPage, photoFile?: File | null) => Promise<SavePageResult>;
};

type RemotePagesState = {
  key: string | null;
  pages: StoredPage[];
  error: PostgrestErrorInfo | null;
};

export function usePagesRepository(bookId: string): UsePagesRepositoryResult {
  const session = useTelegramSession();
  const localPages = useStoredPages();
  const [remoteState, setRemoteState] = useState<RemotePagesState>({
    key: null,
    pages: [],
    error: null,
  });
  const [retryCount, setRetryCount] = useState(0);
  const remoteKey = session.kind === "telegram-authenticated" ? `${session.accessToken}:${bookId}` : null;

  useEffect(() => {
    let cancelled = false;

    if (session.kind !== "telegram-authenticated") {
      return;
    }

    void listSupabasePages(session.accessToken, bookId)
      .then((pages) => {
        if (!cancelled) {
          setRemoteState({ key: `${session.accessToken}:${bookId}`, pages, error: null });
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setRemoteState({
            key: `${session.accessToken}:${bookId}`,
            pages: [],
            error: readPostgrestError(error),
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [bookId, session, retryCount]);

  const refetch = useCallback(() => {
    if (session.kind !== "telegram-authenticated") {
      return;
    }

    setRemoteState({ key: null, pages: [], error: null });
    setRetryCount((current) => current + 1);
  }, [session]);

  const savePage = useCallback(async (page: StoredPage, photoFile?: File | null): Promise<SavePageResult> => {
    const nextPage = normalizePageForSave(page);

    if (session.kind === "telegram-authenticated") {
      let pageToSave = nextPage;

      if (photoFile) {
        try {
          const photoPath = await uploadPagePhoto(
            session.accessToken,
            nextPage.bookId,
            nextPage.pageNumber,
            photoFile,
          );
          pageToSave = { ...nextPage, photoPath };
        } catch (error) {
          return { page: null, error: readPostgrestError(error) };
        }
      }

      try {
        const saved = await upsertSupabasePage(session.accessToken, pageToSave);
        setRemoteState((current) => ({
          key: `${session.accessToken}:${bookId}`,
          pages: mergePage(current.key === `${session.accessToken}:${bookId}` ? current.pages : [], saved),
          error: null,
        }));
        return { page: saved, error: null };
      } catch (error) {
        return { page: null, error: readPostgrestError(error) };
      }
    }

    if (session.kind === "browser") {
      saveStoredPage(nextPage);
      return { page: nextPage, error: null };
    }

    return {
      page: null,
      error: { code: null, message: "Telegram session is not ready", details: null, hint: null },
    };
  }, [bookId, session]);

  return useMemo(() => {
    if (session.kind === "checking") {
      return {
        pages: [] as StoredPage[],
        source: "loading" as const,
        loading: true,
        error: null,
        refetch,
        savePage,
      };
    }

    if (session.kind === "browser") {
      return {
        pages: localPages.filter((page) => page.bookId === bookId),
        source: "local" as const,
        loading: false,
        error: null,
        refetch,
        savePage,
      };
    }

    if (session.kind === "telegram-authenticated") {
      return {
        pages: remoteState.key === remoteKey ? remoteState.pages : [],
        source: "supabase" as const,
        loading: remoteState.key !== remoteKey,
        error: remoteState.key === remoteKey ? remoteState.error : null,
        refetch,
        savePage,
      };
    }

    return {
      pages: [] as StoredPage[],
      source: "telegram-auth-failed" as const,
      loading: false,
      error: null,
      refetch,
      savePage,
    };
  }, [bookId, localPages, refetch, remoteKey, remoteState, savePage, session]);
}

type UseAllPagesRepositoryResult = {
  pages: StoredPage[];
  source: PagesSource;
  loading: boolean;
  error: PostgrestErrorInfo | null;
  refetch: () => void;
};

export function useAllPagesRepository(): UseAllPagesRepositoryResult {
  const session = useTelegramSession();
  const localPages = useStoredPages();
  const [remoteState, setRemoteState] = useState<{
    key: string | null;
    pages: StoredPage[];
    error: PostgrestErrorInfo | null;
  }>({
    key: null,
    pages: [],
    error: null,
  });
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    if (session.kind !== "telegram-authenticated") {
      return;
    }

    void listAllSupabasePages(session.accessToken)
      .then((pages) => {
        if (!cancelled) {
          setRemoteState({ key: session.accessToken, pages, error: null });
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setRemoteState({
            key: session.accessToken,
            pages: [],
            error: readPostgrestError(error),
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [session, retryCount]);

  const refetch = useCallback(() => {
    if (session.kind !== "telegram-authenticated") {
      return;
    }

    setRemoteState({ key: null, pages: [], error: null });
    setRetryCount((current) => current + 1);
  }, [session]);

  return useMemo(() => {
    if (session.kind === "checking") {
      return {
        pages: [] as StoredPage[],
        source: "loading" as const,
        loading: true,
        error: null,
        refetch,
      };
    }

    if (session.kind === "browser") {
      return {
        pages: localPages,
        source: "local" as const,
        loading: false,
        error: null,
        refetch,
      };
    }

    if (session.kind === "telegram-authenticated") {
      return {
        pages: remoteState.key === session.accessToken ? remoteState.pages : [],
        source: "supabase" as const,
        loading: remoteState.key !== session.accessToken,
        error: remoteState.key === session.accessToken ? remoteState.error : null,
        refetch,
      };
    }

    return {
      pages: [] as StoredPage[],
      source: "telegram-auth-failed" as const,
      loading: false,
      error: null,
      refetch,
    };
  }, [localPages, refetch, remoteState, session]);
}

async function listSupabasePages(accessToken: string, bookId: string) {
  const client = createAuthenticatedClient(accessToken);
  const { data, error } = await client
    .from("pages")
    .select("book_id, page_number, status, colored_at, notes, photo_path")
    .eq("book_id", bookId)
    .order("page_number", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapSupabasePageRow);
}

async function listAllSupabasePages(accessToken: string) {
  const client = createAuthenticatedClient(accessToken);
  const { data, error } = await client
    .from("pages")
    .select("book_id, page_number, status, colored_at, notes, photo_path")
    .order("page_number", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapSupabasePageRow);
}

async function upsertSupabasePage(accessToken: string, page: StoredPage) {
  const client = createAuthenticatedClient(accessToken);
  const payload = {
    book_id: page.bookId,
    page_number: page.pageNumber,
    status: page.status,
    colored_at: page.status === "completed" ? page.coloredAt : null,
    notes: page.notes,
    photo_path: page.photoPath,
  };
  const { data, error } = await client
    .from("pages")
    .upsert(payload, { onConflict: "book_id,page_number" })
    .select("book_id, page_number, status, colored_at, notes, photo_path")
    .single();

  if (error || !data) {
    throw error ?? new Error("Failed to save page");
  }

  return mapSupabasePageRow(data);
}

function mapSupabasePageRow(row: SupabasePageRow): StoredPage {
  return {
    bookId: row.book_id,
    pageNumber: row.page_number,
    status: row.status,
    coloredAt: toDateValue(row.colored_at),
    notes: row.notes ?? "",
    photoPath: row.photo_path ?? null,
  };
}

function normalizePageForSave(page: StoredPage): StoredPage {
  return {
    bookId: page.bookId,
    pageNumber: page.pageNumber,
    status: page.status,
    coloredAt: page.status === "completed" ? page.coloredAt : null,
    notes: page.notes,
    photoPath: page.photoPath ?? null,
  };
}

function mergePage(pages: StoredPage[], next: StoredPage) {
  return [
    ...pages.filter(
      (page) => !(page.bookId === next.bookId && page.pageNumber === next.pageNumber),
    ),
    next,
  ];
}

function toDateValue(value: string | null) {
  if (!value) {
    return null;
  }

  return value.slice(0, 10);
}

function readPostgrestError(error: unknown): PostgrestErrorInfo {
  if (!isRecord(error)) {
    return { code: null, message: "Failed to save page", details: null, hint: null };
  }

  const codeValue = error.statusCode ?? error.code;

  return {
    code: typeof codeValue === "string" || typeof codeValue === "number" ? String(codeValue) : null,
    message: typeof error.message === "string" ? error.message : "Failed to save page",
    details: typeof error.details === "string" ? error.details : typeof error.error === "string" ? error.error : null,
    hint: typeof error.hint === "string" ? error.hint : null,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
