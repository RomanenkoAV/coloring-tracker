/**
 * Temporary local diagnostic. Not used by the UI.
 * Checks that a Telegram session JWT is accepted by the Supabase Data API.
 */
import "server-only";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, debug: true }, { status: 400 });
  }

  if (!isObject(body) || typeof body.accessToken !== "string" || body.accessToken.trim() === "") {
    return Response.json({ ok: false, debug: true }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !publishableKey) {
    return Response.json({ ok: false, debug: true }, { status: 500 });
  }

  const accessToken = body.accessToken.trim();
  const tokenClaims = readJwtClaims(accessToken);

  try {
    const supabaseResponse = await fetch(`${supabaseUrl.replace(/\/$/, "")}/rest/v1/books?select=id,user_id`, {
      method: "GET",
      headers: {
        apikey: publishableKey,
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    const supabaseBody: unknown = await supabaseResponse.json().catch(() => null);

    if (!supabaseResponse.ok) {
      return Response.json({
        ok: false,
        debug: true,
        token: tokenClaims,
        supabase: {
          status: supabaseResponse.status,
          error: sanitizeSupabaseError(supabaseBody),
        },
      });
    }

    const books = Array.isArray(supabaseBody) ? supabaseBody : [];

    return Response.json({
      ok: true,
      debug: true,
      token: tokenClaims,
      supabase: {
        status: supabaseResponse.status,
        rowCount: books.length,
        books,
      },
    });
  } catch {
    return Response.json({ ok: false, debug: true }, { status: 500 });
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function readJwtClaims(accessToken: string) {
  const parts = accessToken.split(".");

  if (parts.length !== 3) {
    return null;
  }

  try {
    const payload: unknown = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));

    if (!isObject(payload)) {
      return null;
    }

    return {
      sub: typeof payload.sub === "string" ? payload.sub : null,
      role: typeof payload.role === "string" ? payload.role : null,
    };
  } catch {
    return null;
  }
}

function sanitizeSupabaseError(value: unknown) {
  if (!isObject(value)) {
    return { message: "Request failed" };
  }

  return {
    code: typeof value.code === "string" ? value.code : null,
    message: typeof value.message === "string" ? value.message : "Request failed",
  };
}
