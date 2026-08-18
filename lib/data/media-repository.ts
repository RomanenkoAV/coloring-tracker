"use client";

import { useEffect, useState } from "react";
import { createAuthenticatedClient } from "@/lib/supabase/client";
import { useTelegramSession } from "@/lib/telegram/session";

export const MEDIA_BUCKET = "coloring-media";
export const COVER_SIGNED_URL_TTL_SECONDS = 60 * 60;
export const MEDIA_SIGNED_URL_TTL_SECONDS = COVER_SIGNED_URL_TTL_SECONDS;
export const MAX_COVER_BYTES = 5 * 1024 * 1024;
export const MAX_MEDIA_BYTES = MAX_COVER_BYTES;

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export type SafeErrorInfo = {
  code: string | null;
  message: string | null;
  details: string | null;
  hint: string | null;
};

export function validateCoverFile(file: File) {
  return validateImageFile(file);
}

export function validateImageFile(file: File): SafeErrorInfo | null {
  const contentType = normalizeImageContentType(file.type);

  if (!contentType) {
    return {
      code: null,
      message: "Можно загрузить только JPEG, PNG или WebP",
      details: null,
      hint: null,
    };
  }

  if (file.size > MAX_MEDIA_BYTES) {
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

export function pagePhotoObjectPath(userId: string, bookId: string, pageNumber: number) {
  const pageSegment = String(pageNumber);

  if (
    !isPathSegment(userId) ||
    !isPathSegment(bookId) ||
    !Number.isInteger(pageNumber) ||
    pageNumber < 1 ||
    !isPathSegment(pageSegment)
  ) {
    throw new Error("Invalid page photo path");
  }

  return `${userId}/books/${bookId}/pages/${pageSegment}`;
}

export function readTrustedUserId(accessToken: string) {
  const payload = readJwtPayload(accessToken);

  if (!isRecord(payload) || typeof payload.sub !== "string" || !isPathSegment(payload.sub)) {
    return null;
  }

  return payload.sub;
}

export async function uploadBookCover(accessToken: string, bookId: string, file: File) {
  return uploadMediaObject(accessToken, file, (userId) => bookCoverObjectPath(userId, bookId));
}

export async function uploadPagePhoto(
  accessToken: string,
  bookId: string,
  pageNumber: number,
  file: File,
) {
  return uploadMediaObject(accessToken, file, (userId) =>
    pagePhotoObjectPath(userId, bookId, pageNumber),
  );
}

export async function createCoverSignedUrl(accessToken: string, coverPath: string) {
  return createSignedMediaUrl(accessToken, coverPath);
}

export async function createSignedMediaUrl(accessToken: string, objectPath: string) {
  if (!objectPath || objectPath.includes("://")) {
    return null;
  }

  const client = createAuthenticatedClient(accessToken);
  const { data, error } = await client.storage
    .from(MEDIA_BUCKET)
    .createSignedUrl(objectPath, MEDIA_SIGNED_URL_TTL_SECONDS);

  if (error || !data?.signedUrl) {
    return null;
  }

  return data.signedUrl;
}

export function useSignedCoverUrl(coverPath: string | null) {
  return useSignedMediaUrl(coverPath);
}

export function useSignedMediaUrl(objectPath: string | null) {
  const session = useTelegramSession();
  const [state, setState] = useState<{ key: string; url: string | null }>({
    key: "",
    url: null,
  });
  const requestKey =
    session.kind === "telegram-authenticated" && objectPath
      ? `${session.accessToken}:${objectPath}`
      : "";

  useEffect(() => {
    if (session.kind !== "telegram-authenticated" || !objectPath || !requestKey) {
      return;
    }

    let cancelled = false;

    void createSignedMediaUrl(session.accessToken, objectPath)
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
  }, [objectPath, requestKey, session]);

  if (!requestKey) {
    return null;
  }

  return state.key === requestKey ? state.url : null;
}

async function uploadMediaObject(
  accessToken: string,
  file: File,
  buildPath: (userId: string) => string,
) {
  const validationError = validateImageFile(file);

  if (validationError) {
    throw validationError;
  }

  const userId = readTrustedUserId(accessToken);

  if (!userId) {
    throw {
      code: null,
      message: "Не удалось определить пользователя для загрузки файла",
      details: null,
      hint: null,
    } satisfies SafeErrorInfo;
  }

  const path = buildPath(userId);
  const client = createAuthenticatedClient(accessToken);
  const { error } = await client.storage.from(MEDIA_BUCKET).upload(path, file, {
    upsert: true,
    contentType: normalizeImageContentType(file.type) ?? file.type,
    cacheControl: String(MEDIA_SIGNED_URL_TTL_SECONDS),
  });

  if (error) {
    throw readStorageError(error);
  }

  return path;
}

function normalizeImageContentType(value: string) {
  if (value === "image/jpg") {
    return "image/jpeg";
  }

  if (ALLOWED_IMAGE_TYPES.has(value)) {
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
    return { code: null, message: "Failed to upload file", details: null, hint: null };
  }

  const codeValue = error.statusCode ?? error.code;
  const detailsValue = error.error;

  return {
    code: typeof codeValue === "string" || typeof codeValue === "number" ? String(codeValue) : null,
    message: typeof error.message === "string" ? error.message : "Failed to upload file",
    details: typeof detailsValue === "string" ? detailsValue : null,
    hint: typeof error.hint === "string" ? error.hint : null,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
