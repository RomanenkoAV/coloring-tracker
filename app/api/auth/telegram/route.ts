import { mintSupabaseAccessToken } from "@/lib/supabase/mint-access-token";
import { telegramUserIdToUuid } from "@/lib/telegram/user-id";
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
      return Response.json({ ok: false, error: result.error }, { status: 401 });
    }

    const userId = telegramUserIdToUuid(result.user.id);
    const session = await mintSupabaseAccessToken({
      userId,
      telegramUserId: result.user.id,
    });

    return Response.json({
      ok: true,
      user: result.user,
      session,
    });
  } catch {
    return Response.json({ ok: false }, { status: 500 });
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}
