"use client";

import { useEffect, useState } from "react";
import { useTelegramSession } from "@/lib/telegram/session";

type SupabaseDebugState = {
  supabaseStatus: number | null;
  supabaseOk: boolean | null;
  sub: string | null;
  role: string | null;
};

export function AuthDebug() {
  const session = useTelegramSession();
  const [supabaseDebug, setSupabaseDebug] = useState<SupabaseDebugState>({
    supabaseStatus: null,
    supabaseOk: null,
    sub: null,
    role: null,
  });

  useEffect(() => {
    let cancelled = false;

    if (session.kind !== "telegram-authenticated") {
      return;
    }

    void fetch("/api/debug/supabase-auth", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ accessToken: session.accessToken }),
    })
      .then((response) => response.json().catch(() => null))
      .then((body: unknown) => {
        if (cancelled) {
          return;
        }

        setSupabaseDebug({
          supabaseStatus: readSupabaseStatus(body),
          supabaseOk: isRecord(body) && body.ok === true,
          sub: readTokenClaim(body, "sub"),
          role: readTokenClaim(body, "role"),
        });
      })
      .catch(() => {
        if (!cancelled) {
          setSupabaseDebug({
            supabaseStatus: null,
            supabaseOk: null,
            sub: null,
            role: null,
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [session]);

  return (
    <section className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-3 text-xs text-zinc-600">
      <h2 className="text-sm font-semibold text-zinc-800">Auth Debug</h2>
      <p className="mt-1 text-[11px] text-zinc-400">Temporary diagnostic. Will be removed.</p>
      <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5">
        {session.kind === "checking" ? (
          <StatusRow label="Status" value="Checking Telegram…" />
        ) : null}
        {session.kind === "browser" ? (
          <StatusRow label="Status" value="Telegram initData not available" />
        ) : null}
        {session.kind === "telegram-failed" ? (
          <>
            <StatusRow label="Telegram auth" value="failed" />
            <StatusRow
              label="Telegram HTTP"
              value={session.httpStatus === null ? "n/a" : String(session.httpStatus)}
            />
            <StatusRow label="Telegram error" value={session.error ?? "n/a"} />
            <StatusRow label="Telegram message" value={session.message ?? "n/a"} />
            <StatusRow
              label="User id"
              value={session.user === null ? "n/a" : String(session.user.id)}
            />
          </>
        ) : null}
        {session.kind === "telegram-authenticated" ? (
          <>
            <StatusRow label="Telegram auth" value="success" />
            <StatusRow label="Telegram HTTP" value={String(session.httpStatus)} />
            <StatusRow label="Telegram error" value="n/a" />
            <StatusRow label="Telegram message" value="n/a" />
            <StatusRow
              label="Supabase auth"
              value={supabaseDebug.supabaseStatus === null ? "n/a" : String(supabaseDebug.supabaseStatus)}
            />
            <StatusRow
              label="Supabase query ok"
              value={supabaseDebug.supabaseOk === null ? "n/a" : String(supabaseDebug.supabaseOk)}
            />
            <StatusRow label="User id" value={String(session.user.id)} />
            <StatusRow label="sub" value={supabaseDebug.sub ?? "n/a"} />
            <StatusRow label="role" value={supabaseDebug.role ?? "n/a"} />
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
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
