import "server-only";

import { SignJWT, importJWK, type JWK } from "jose";

export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;

type MintAccessTokenInput = {
  userId: string;
  telegramUserId: number;
};

type SigningJwk = JWK & {
  kid: string;
  kty: "EC";
  crv: "P-256";
  x: string;
  y: string;
  d: string;
};

export async function mintSupabaseAccessToken({
  userId,
  telegramUserId,
}: MintAccessTokenInput) {
  const key = parseSigningJwk(process.env.SUPABASE_JWT_SIGNING_JWK);
  const cryptoKey = await importJWK(key, "ES256");

  const accessToken = await new SignJWT({
    role: "authenticated",
    telegram_user_id: String(telegramUserId),
  })
    .setProtectedHeader({
      alg: "ES256",
      kid: key.kid,
      typ: "JWT",
    })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TOKEN_TTL_SECONDS}s`)
    .sign(cryptoKey);

  return {
    accessToken,
    expiresIn: ACCESS_TOKEN_TTL_SECONDS,
  };
}

function parseSigningJwk(rawJwk: string | undefined): SigningJwk {
  if (!rawJwk || rawJwk.trim() === "") {
    throw new Error("Supabase JWT signing is not configured");
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(rawJwk);
  } catch {
    throw new Error("Supabase JWT signing is not configured");
  }

  if (!isObject(parsed)) {
    throw new Error("Supabase JWT signing is not configured");
  }

  if (
    parsed.kty !== "EC" ||
    parsed.crv !== "P-256" ||
    !isNonEmptyString(parsed.kid) ||
    !isNonEmptyString(parsed.x) ||
    !isNonEmptyString(parsed.y) ||
    !isNonEmptyString(parsed.d)
  ) {
    throw new Error("Supabase JWT signing is not configured");
  }

  return {
    kty: "EC",
    crv: "P-256",
    kid: parsed.kid,
    x: parsed.x,
    y: parsed.y,
    d: parsed.d,
    alg: "ES256",
  };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}
