"use client";

import { useEffect, useMemo, useState } from "react";
import { useStoredPages } from "@/lib/page-storage";
import { type StoredPage } from "@/lib/pages";
import { createAuthenticatedClient } from "@/lib/supabase/client";
import { useTelegramSession } from "@/lib/telegram/session";

type SupabasePageRow = {
  book_id: string;
  page_number: number;
  status: "not_started" | "completed";
  colored_at: string | null;
  notes: string;
};

type RemotePagesState = {
  key: string | null;
  pages: StoredPage[];
};

export function usePagesRepository(bookId: string) {
  const session = useTelegramSession();
  const localPages = useStoredPages();
  const [remoteState, setRemoteState] = useState<RemotePagesState>({
    key: null,
    pages: [],
  });
  const remoteKey = session.kind === "telegram-authenticated" ? `${session.accessToken}:${bookId}` : null;

  useEffect(() => {
    let cancelled = false;

    if (session.kind !== "telegram-authenticated") {
      return;
    }

    void listSupabasePages(session.accessToken, bookId)
      .then((pages) => {
        if (!cancelled) {
          setRemoteState({ key: `${session.accessToken}:${bookId}`, pages });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRemoteState({ key: `${session.accessToken}:${bookId}`, pages: [] });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [bookId, session]);

  return useMemo(() => {
    if (session.kind === "checking") {
      return {
        pages: [] as StoredPage[],
        source: "loading" as const,
        loading: true,
      };
    }

    if (session.kind === "browser") {
      return {
        pages: localPages.filter((page) => page.bookId === bookId),
        source: "local" as const,
        loading: false,
      };
    }

    if (session.kind === "telegram-authenticated") {
      return {
        pages: remoteState.key === remoteKey ? remoteState.pages : [],
        source: "supabase" as const,
        loading: remoteState.key !== remoteKey,
      };
    }

    return {
      pages: [] as StoredPage[],
      source: "telegram-auth-failed" as const,
      loading: false,
    };
  }, [bookId, localPages, remoteKey, remoteState, session]);
}

async function listSupabasePages(accessToken: string, bookId: string) {
  const client = createAuthenticatedClient(accessToken);
  const { data, error } = await client
    .from("pages")
    .select("book_id, page_number, status, colored_at, notes")
    .eq("book_id", bookId)
    .order("page_number", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapSupabasePageRow);
}

function mapSupabasePageRow(row: SupabasePageRow): StoredPage {
  return {
    bookId: row.book_id,
    pageNumber: row.page_number,
    status: row.status,
    coloredAt: row.colored_at,
    notes: row.notes,
  };
}
