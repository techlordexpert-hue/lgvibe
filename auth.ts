import { cookies } from "next/headers";
import { createHash, timingSafeEqual } from "crypto";
import { store } from "./redis";

export const COOKIE = "lgvibe_admin";
export const SESSION_TTL = 60 * 60 * 8;

export async function isAdmin(): Promise<boolean> {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return false;
  return (await store.get<string>(`lgvibe:session:${token}`)) === "ok";
}

export function passphraseMatches(input: string): boolean {
  const expected = process.env.ADMIN_PASSPHRASE || "@12345@";
  const a = createHash("sha256").update(input).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}
