"use client";

import type { ReactNode } from "react";
import { TelegramSessionProvider } from "@/lib/telegram/session";

export function AppProviders({ children }: { children: ReactNode }) {
  return <TelegramSessionProvider>{children}</TelegramSessionProvider>;
}
