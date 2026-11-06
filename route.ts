import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { COOKIE, SESSION_TTL, isAdmin, passphraseMatches } from "@/lib/auth";
import { loadCourses } from "@/lib/courses";
import { hasRedis, store } from "@/lib/redis";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ authed: false });
  const courses = await loadCourses();
  return NextResponse.json({
    authed: true,
    state: {
      storage: hasRedis ? "Upstash Redis" : "In-memory (set Upstash env vars to persist)",
      lastLogin: await store.get<number>("lgvibe:admin:lastLogin"),
      totalLogins: (await store.get<number>("lgvibe:admin:logins")) ?? 0,
      courses: courses.length,
      topics: courses.reduce((n, c) => n + c.units.reduce((m, u) => m + u.topics.length, 0), 0),
      mappedVideos: courses.reduce((n, c) => n + c.units.reduce((m, u) => m + u.topics.filter((t) => t.youtube).length, 0), 0),
      questions: courses.reduce((n, c) => n + c.quiz.length, 0),
      slideChars: courses.reduce((n, c) => n + c.slideText.length, 0),
    },
  });
}

export async function POST(req: Request) {
  const ip = (req.headers.get("x-forwarded-for") ?? "local").split(",")[0].trim();
  const attempts = await store.incr(`lgvibe:attempts:${ip}`, 900);
  if (attempts > 10) return NextResponse.json({ error: "Too many attempts. Try again in 15 minutes." }, { status: 429 });
  const { passphrase } = (await req.json().catch(() => ({}))) as { passphrase?: string };
  if (typeof passphrase !== "string" || !passphraseMatches(passphrase)) return NextResponse.json({ error: "Incorrect passphrase." }, { status: 401 });
  const token = randomUUID();
  await store.set(`lgvibe:session:${token}`, "ok", SESSION_TTL);
  await store.set("lgvibe:admin:lastLogin", Date.now());
  await store.set("lgvibe:admin:logins", ((await store.get<number>("lgvibe:admin:logins")) ?? 0) + 1);
  await store.del(`lgvibe:attempts:${ip}`);
  const res = NextResponse.json({ authed: true });
  res.cookies.set(COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: SESSION_TTL });
  return res;
}

export async function DELETE() {
  const token = cookies().get(COOKIE)?.value;
  if (token) await store.del(`lgvibe:session:${token}`);
  const res = NextResponse.json({ authed: false });
  res.cookies.set(COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
