"use client";

import { useEffect, useState } from "react";
import { createAuthenticatedClient } from "@/lib/supabase/client";
import { useTelegramSession } from "@/lib/telegram/session";

export const MEDIA_BUCKET = "coloring-media";
export const COVER_SIGNED_URL_TTL_SECONDS = 60 * 60;
export const MAX_COVER_BYTES = 5 * 1024 * 1024;

const ALLOWED_COVER_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export type SafeErrorInfo = {
  code: string | null;
  message: string | null;
  details: string | null;
  hint: string | null;
};

export function validateCoverFile(file: File): SafeErrorInfo | null {
  const contentType = normalizeCoverContentType(file.type);

  if (!contentType) {
    return {
      code: null,
      message: "Можно загрузить только JPEG, PNG или WebP",
      details: null,
      hint: null,
    };
  }

  if (file.size > MAX_COVER_BYTES) {
    return {
      code: null,
      message: "Размер файла не должен превышать 5 МБ",
      details: null,
      hint: null,
    };
  }

  return null;
}

export function bookCoverObjectPath(userId: string, bookId: string) {
  if (!isPathSegment(userId) || !isPathSegment(bookId)) {
    throw new Error("Invalid cover path");
  }

  return `${userId}/books/${bookId}/cover`;
}

export function readTrustedUserId(accessToken: string) {
  const payload = readJwtPayload(accessToken);

  if (!isRecord(payload) || typeof payload.sub !== "string" || !isPathSegment(payload.sub)) {
    return null;
  }

  return payload.sub;
}

export async function uploadBookCover(accessToken: string, bookId: string, file: File) {
  const validationError = validateCoverFile(file);

  if (validationError) {
    throw validationError;
  }

  const userId = readTrustedUserId(accessToken);

  if (!userId) {
    throw {
      code: null,
      message: "Не удалось определить пользователя для загрузки обложки",
      details: null,
      hint: null,
    } satisfies SafeErrorInfo;
  }

  const path = bookCoverObjectPath(userId, bookId);
  const client = createAuthenticatedClient(accessToken);
  const { error } = await client.storage.from(MEDIA_BUCKET).upload(path, file, {
    upsert: true,
    contentType: normalizeCoverContentType(file.type) ?? file.type,
    cacheControl: String(COVER_SIGNED_URL_TTL_SECONDS),
  });

  if (error) {
    throw readStorageError(error);
  }

  return path;
}

export async function createCoverSignedUrl(accessToken: string, coverPath: string) {
  if (!coverPath || coverPath.includes("://")) {
    return null;
  }

  const client = createAuthenticatedClient(accessToken);
  const { data, error } = await client.storage
    .from(MEDIA_BUCKET)
    .createSignedUrl(coverPath, COVER_SIGNED_URL_TTL_SECONDS);

  if (error || !data?.signedUrl) {
    return null;
  }

  return data.signedUrl;
}

export function useSignedCoverUrl(coverPath: string | null) {
  const session = useTelegramSession();
  const [state, setState] = useState<{ key: string; url: string | null }>({
    key: "",
    url: null,
  });
  const requestKey =
    session.kind === "telegram-authenticated" && coverPath
      ? `${session.accessToken}:${coverPath}`
      : "";

  useEffect(() => {
    if (session.kind !== "telegram-authenticated" || !coverPath || !requestKey) {
      return;
    }

    let cancelled = false;

    void createCoverSignedUrl(session.accessToken, coverPath)
      .then((url) => {
        if (!cancelled) {
          setState({ key: requestKey, url });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setState({ key: requestKey, url: null });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [coverPath, requestKey, session]);

  if (!requestKey) {
    return null;
  }

  return state.key === requestKey ? state.url : null;
}

function normalizeCoverContentType(value: string) {
  if (value === "image/jpg") {
    return "image/jpeg";
  }

  if (ALLOWED_COVER_TYPES.has(value)) {
    return value;
  }

  return null;
}

function isPathSegment(value: string) {
  return value.trim() !== "" && !value.includes("/") && !value.includes("..") && !value.includes("\\");
}

function readJwtPayload(accessToken: string) {
  const parts = accessToken.split(".");

  if (parts.length !== 3) {
    return null;
  }

  try {
    const normalized = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    return JSON.parse(atob(padded)) as unknown;
  } catch {
    return null;
  }
}

function readStorageError(error: unknown): SafeErrorInfo {
  if (!isRecord(error)) {
    return { code: null, message: "Failed to upload cover", details: null, hint: null };
  }

  const codeValue = error.statusCode ?? error.code;
  const detailsValue = error.error;

  return {
    code: typeof codeValue === "string" || typeof codeValue === "number" ? String(codeValue) : null,
    message: typeof error.message === "string" ? error.message : "Failed to upload cover",
    details: typeof detailsValue === "string" ? detailsValue : null,
    hint: typeof error.hint === "string" ? error.hint : null,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
