import "server-only";

import { randomBytes, timingSafeEqual } from "node:crypto";

export function createOAuthState(): string {
  return randomBytes(32).toString("base64url");
}

export function statesMatch(expected: string, received: string): boolean {
  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(received);
  if (expectedBuffer.length !== receivedBuffer.length) return false;
  return timingSafeEqual(expectedBuffer, receivedBuffer);
}

export function safeReturnTo(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/data";
  return value;
}
