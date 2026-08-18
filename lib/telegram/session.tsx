"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type TelegramUser = {
  id: number;
  first_name: string;
  last_name: string | null;
  username: string | null;
  language_code: string | null;
};

type ValidateInitDataError =
  | "invalid_hash"
  | "hash_mismatch"
  | "invalid_auth_date"
  | "expired"
  | "invalid_user";

type TelegramSessionState =
  | { kind: "checking" }
  | { kind: "browser" }
  | {
      kind: "telegram-failed";
      httpStatus: number | null;
      error: ValidateInitDataError | null;
      message: string | null;
      user: TelegramUser | null;
    }
  | {
      kind: "telegram-authenticated";
      httpStatus: number;
      user: TelegramUser;
      accessToken: string;
      expiresIn: number;
    };

type TelegramAuthResponse = {
  ok: true;
  user: TelegramUser;
  session: {
    accessToken: string;
    expiresIn: number;
  };
};

const TelegramSessionContext = createContext<TelegramSessionState>({ kind: "checking" });

export function TelegramSessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<TelegramSessionState>({ kind: "checking" });

  useEffect(() => {
    let cancelled = false;

    void authenticateTelegram().then((nextState) => {
      if (!cancelled) {
        setState(nextState);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(() => state, [state]);

  return (
    <TelegramSessionContext.Provider value={value}>
      {children}
    </TelegramSessionContext.Provider>
  );
}

export function useTelegramSession() {
  return useContext(TelegramSessionContext);
}

async function authenticateTelegram(): Promise<TelegramSessionState> {
  const webApp = window.Telegram?.WebApp;

  if (webApp) {
    webApp.ready();
  }

  const initData = webApp?.initData;

  if (typeof initData !== "string" || initData.trim() === "") {
    return { kind: "browser" };
  }

  try {
    const response = await fetch("/api/auth/telegram", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ initData }),
    });
    const body: unknown = await response.json().catch(() => null);
    const success = readSuccessResponse(body);

    if (response.ok && success) {
      return {
        kind: "telegram-authenticated",
        httpStatus: response.status,
        user: success.user,
        accessToken: success.session.accessToken,
        expiresIn: success.session.expiresIn,
      };
    }

    return {
      kind: "telegram-failed",
      httpStatus: response.status,
      error: readValidateError(body),
      message: readStringField(body, "message"),
      user: readTelegramUser(body),
    };
  } catch {
    return {
      kind: "telegram-failed",
      httpStatus: null,
      error: null,
      message: null,
      user: null,
    };
  }
}

function readSuccessResponse(value: unknown): TelegramAuthResponse | null {
  if (!isRecord(value) || value.ok !== true || !isRecord(value.user) || !isRecord(value.session)) {
    return null;
  }

  const user = parseTelegramUser(value.user);

  if (
    !user ||
    typeof value.session.accessToken !== "string" ||
    value.session.accessToken.trim() === "" ||
    typeof value.session.expiresIn !== "number" ||
    !Number.isFinite(value.session.expiresIn)
  ) {
    return null;
  }

  return {
    ok: true,
    user,
    session: {
      accessToken: value.session.accessToken,
      expiresIn: value.session.expiresIn,
    },
  };
}

function readValidateError(value: unknown): ValidateInitDataError | null {
  if (!isRecord(value) || typeof value.error !== "string") {
    return null;
  }

  switch (value.error) {
    case "invalid_hash":
    case "hash_mismatch":
    case "invalid_auth_date":
    case "expired":
    case "invalid_user":
      return value.error;
    default:
      return null;
  }
}

function readStringField(value: unknown, key: "message") {
  if (!isRecord(value) || typeof value[key] !== "string" || value[key].trim() === "") {
    return null;
  }

  return value[key];
}

function readTelegramUser(value: unknown) {
  if (!isRecord(value) || !isRecord(value.user)) {
    return null;
  }

  return parseTelegramUser(value.user);
}

function parseTelegramUser(value: Record<string, unknown>): TelegramUser | null {
  if (typeof value.id !== "number" || !Number.isFinite(value.id) || typeof value.first_name !== "string") {
    return null;
  }

  return {
    id: value.id,
    first_name: value.first_name,
    last_name: typeof value.last_name === "string" ? value.last_name : null,
    username: typeof value.username === "string" ? value.username : null,
    language_code: typeof value.language_code === "string" ? value.language_code : null,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
