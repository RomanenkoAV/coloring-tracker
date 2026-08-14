import { validateTelegramInitData } from "@/lib/telegram/validate-init-data";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false }, { status: 400 });
  }

  if (!isObject(body) || typeof body.initData !== "string" || body.initData.trim() === "") {
    return Response.json({ ok: false }, { status: 400 });
  }

  try {
    const result = validateTelegramInitData(body.initData);

    if (!result.ok) {
      return Response.json({ ok: false }, { status: 401 });
    }

    return Response.json({ ok: true, user: result.user });
  } catch {
    return Response.json({ ok: false }, { status: 500 });
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}
