"use client";

import { useEffect, useState } from "react";

type DebugView =
  | { kind: "loading" }
  | { kind: "no-init-data" }
  | {
      kind: "result";
      telegramAuth: "success" | "failed";
      telegramStatus: number | null;
      telegramError: string | null;
      telegramMessage: string | null;
      supabaseStatus: number | null;
      supabaseOk: boolean | null;
      userId: number | null;
      sub: string | null;
      role: string | null;
    };

export function AuthDebug() {
  const [view, setView] = useState<DebugView>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;

    void runAuthDebug().then((nextView) => {
      if (!cancelled) {
        setView(nextView);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-3 text-xs text-zinc-600">
      <h2 className="text-sm font-semibold text-zinc-800">Auth Debug</h2>
      <p className="mt-1 text-[11px] text-zinc-400">Temporary diagnostic. Will be removed.</p>
      <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5">
        {view.kind === "loading" ? (
          <StatusRow label="Status" value="Checking Telegram…" />
        ) : null}
        {view.kind === "no-init-data" ? (
          <StatusRow label="Status" value="Telegram initData not available" />
        ) : null}
        {view.kind === "result" ? (
          <>
            <StatusRow label="Telegram auth" value={view.telegramAuth} />
            <StatusRow
              label="Telegram HTTP"
              value={view.telegramStatus === null ? "n/a" : String(view.telegramStatus)}
            />
            <StatusRow label="Telegram error" value={view.telegramError ?? "n/a"} />
            <StatusRow label="Telegram message" value={view.telegramMessage ?? "n/a"} />
            <StatusRow
              label="Supabase auth"
              value={view.supabaseStatus === null ? "n/a" : String(view.supabaseStatus)}
            />
            <StatusRow
              label="Supabase query ok"
              value={view.supabaseOk === null ? "n/a" : String(view.supabaseOk)}
            />
            <StatusRow label="User id" value={view.userId === null ? "n/a" : String(view.userId)} />
            <StatusRow label="sub" value={view.sub ?? "n/a"} />
            <StatusRow label="role" value={view.role ?? "n/a"} />
          </>
        ) : null}
      </dl>
    </section>
  );
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-zinc-400">{label}</dt>
      <dd className="break-all font-medium text-zinc-800">{value}</dd>
    </>
  );
}

async function runAuthDebug(): Promise<DebugView> {
  const webApp = window.Telegram?.WebApp;

  if (webApp) {
    webApp.ready();
  }

  const initData = webApp?.initData;

  if (typeof initData !== "string" || initData.trim() === "") {
    return { kind: "no-init-data" };
  }

  try {
    const telegramResponse = await fetch("/api/auth/telegram", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ initData }),
    });
    const telegramBody: unknown = await telegramResponse.json().catch(() => null);
    const telegramSession = readTelegramSession(telegramBody);

    const telegramError = readStringField(telegramBody, "error");
    const telegramMessage = readStringField(telegramBody, "message");

    if (!telegramResponse.ok || !telegramSession) {
      return {
        kind: "result",
        telegramAuth: "failed",
        telegramStatus: telegramResponse.status,
        telegramError,
        telegramMessage,
        supabaseStatus: null,
        supabaseOk: null,
        userId: readTelegramUserId(telegramBody),
        sub: null,
        role: null,
      };
    }

    const debugResponse = await fetch("/api/debug/supabase-auth", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ accessToken: telegramSession.accessToken }),
    });
    const debugBody: unknown = await debugResponse.json().catch(() => null);

    return {
      kind: "result",
      telegramAuth: "success",
      telegramStatus: telegramResponse.status,
      telegramError,
      telegramMessage,
      supabaseStatus: readSupabaseStatus(debugBody),
      supabaseOk: isRecord(debugBody) && debugBody.ok === true,
      userId: telegramSession.userId,
      sub: readTokenClaim(debugBody, "sub"),
      role: readTokenClaim(debugBody, "role"),
    };
  } catch {
    return {
      kind: "result",
      telegramAuth: "failed",
      telegramStatus: null,
      telegramError: null,
      telegramMessage: null,
      supabaseStatus: null,
      supabaseOk: null,
      userId: null,
      sub: null,
      role: null,
    };
  }
}

function readTelegramSession(value: unknown) {
  if (!isRecord(value) || value.ok !== true || !isRecord(value.session) || !isRecord(value.user)) {
    return null;
  }

  if (typeof value.session.accessToken !== "string" || value.session.accessToken.trim() === "") {
    return null;
  }

  if (typeof value.user.id !== "number" || !Number.isFinite(value.user.id)) {
    return null;
  }

  return {
    accessToken: value.session.accessToken,
    userId: value.user.id,
  };
}

function readStringField(value: unknown, key: "error" | "message") {
  if (!isRecord(value) || typeof value[key] !== "string" || value[key].trim() === "") {
    return null;
  }

  return value[key];
}

function readTelegramUserId(value: unknown) {
  if (!isRecord(value) || !isRecord(value.user) || typeof value.user.id !== "number") {
    return null;
  }

  return Number.isFinite(value.user.id) ? value.user.id : null;
}

function readSupabaseStatus(value: unknown) {
  if (!isRecord(value) || !isRecord(value.supabase) || typeof value.supabase.status !== "number") {
    return null;
  }

  return value.supabase.status;
}

function readTokenClaim(value: unknown, key: "sub" | "role") {
  if (!isRecord(value) || !isRecord(value.token) || typeof value.token[key] !== "string") {
    return null;
  }

  return value.token[key];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}
