import "server-only";

import { createHash } from "node:crypto";

export function telegramUserIdToUuid(telegramUserId: number) {
  if (!Number.isInteger(telegramUserId) || !Number.isFinite(telegramUserId)) {
    throw new Error("Invalid Telegram user id");
  }

  const digest = createHash("sha256")
    .update(`telegram:${telegramUserId}`)
    .digest();
  const bytes = Uint8Array.from(digest.subarray(0, 16));

  bytes[6] = (bytes[6] & 0x0f) | 0x80;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Buffer.from(bytes).toString("hex");

  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
