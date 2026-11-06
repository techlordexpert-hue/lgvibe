import { Redis } from "@upstash/redis";

const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
export const hasRedis = Boolean(url && token);
const redis = hasRedis ? new Redis({ url: url as string, token: token as string }) : null;

// Local-dev fallback so the app runs before Upstash is configured. On Vercel, set the env vars.
type Entry = { v: unknown; exp?: number };
const g = globalThis as unknown as { __lgvibeMem?: Map<string, Entry> };
const mem: Map<string, Entry> = (g.__lgvibeMem ??= new Map());

export const store = {
  async get<T>(key: string): Promise<T | null> {
    if (redis) return ((await redis.get<T>(key)) ?? null) as T | null;
    const e = mem.get(key);
    if (!e) return null;
    if (e.exp && e.exp < Date.now()) { mem.delete(key); return null; }
    return e.v as T;
  },
  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    if (redis) { if (ttlSeconds) await redis.set(key, value, { ex: ttlSeconds }); else await redis.set(key, value); return; }
    mem.set(key, { v: value, exp: ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined });
  },
  async del(key: string): Promise<void> {
    if (redis) { await redis.del(key); return; }
    mem.delete(key);
  },
  async incr(key: string, ttlSeconds: number): Promise<number> {
    if (redis) { const n = await redis.incr(key); if (n === 1) await redis.expire(key, ttlSeconds); return n; }
    const cur = ((await this.get<number>(key)) ?? 0) + 1;
    const e = mem.get(key);
    mem.set(key, { v: cur, exp: e?.exp ?? Date.now() + ttlSeconds * 1000 });
    return cur;
  },
};
