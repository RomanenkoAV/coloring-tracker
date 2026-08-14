import { createHmac, timingSafeEqual } from "node:crypto";

const MAX_INIT_DATA_AGE_SECONDS = 24 * 60 * 60;

export type TelegramUser = {
  id: number;
  first_name: string;
  last_name: string | null;
  username: string | null;
  language_code: string | null;
};

export type ValidateInitDataResult =
  | { ok: true; user: TelegramUser }
  | { ok: false };

export function validateTelegramInitData(initData: string): ValidateInitDataResult {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (!botToken) {
    throw new Error("Telegram is not configured");
  }

  const params = new URLSearchParams(initData);
  const hash = params.get("hash");

  if (!hash || !/^[0-9a-fA-F]{64}$/.test(hash)) {
    return { ok: false };
  }

  const pairs: string[] = [];

  for (const [key, value] of params.entries()) {
    if (key === "hash" || key === "signature") {
      continue;
    }

    pairs.push(`${key}=${value}`);
  }

  pairs.sort();
  const dataCheckString = pairs.join("\n");

  const secretKey = createHmac("sha256", "WebAppData").update(botToken).digest();
  const computedHash = createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  if (!safeEqualHex(hash, computedHash)) {
    return { ok: false };
  }

  const authDate = Number(params.get("auth_date"));
  const now = Math.floor(Date.now() / 1000);

  if (
    !Number.isInteger(authDate) ||
    authDate <= 0 ||
    now - authDate > MAX_INIT_DATA_AGE_SECONDS
  ) {
    return { ok: false };
  }

  const user = parseTelegramUser(params.get("user"));

  if (!user) {
    return { ok: false };
  }

  return { ok: true, user };
}

function parseTelegramUser(rawUser: string | null): TelegramUser | null {
  if (!rawUser) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(rawUser);

    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    const user = parsed as Record<string, unknown>;

    if (typeof user.id !== "number" || !Number.isFinite(user.id) || typeof user.first_name !== "string") {
      return null;
    }

    return {
      id: user.id,
      first_name: user.first_name,
      last_name: typeof user.last_name === "string" ? user.last_name : null,
      username: typeof user.username === "string" ? user.username : null,
      language_code: typeof user.language_code === "string" ? user.language_code : null,
    };
  } catch {
    return null;
  }
}

function safeEqualHex(left: string, right: string) {
  const leftBuffer = Buffer.from(left, "hex");
  const rightBuffer = Buffer.from(right, "hex");

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}
