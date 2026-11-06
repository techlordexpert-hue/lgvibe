import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { loadCourses, saveCourses } from "@/lib/courses";
import { generateQuiz } from "@/lib/quizgen";
import type { Course } from "@/lib/types";

export const dynamic = "force-dynamic";
const deny = () => NextResponse.json({ error: "Admin sign-in required." }, { status: 401 });
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) || `course-${Date.now()}`;

export async function GET() {
  return NextResponse.json({ courses: await loadCourses() }, { headers: { "Cache-Control": "no-store" } });
}

// Create or update a course.
export async function POST(req: Request) {
  if (!(await isAdmin())) return deny();
  const body = (await req.json().catch(() => null)) as { course?: Partial<Course> } | null;
  const c = body?.course;
  if (!c || typeof c.title !== "string" || !c.title.trim()) return NextResponse.json({ error: "A course needs a title." }, { status: 400 });
  const list = await loadCourses();
  const id = c.id && typeof c.id === "string" ? c.id : slug(c.title);
  const prev = list.find((x) => x.id === id);
  const next: Course = {
    id, title: c.title.trim(), description: String(c.description ?? ""), slideText: String(c.slideText ?? prev?.slideText ?? ""),
    units: Array.isArray(c.units) ? c.units : prev?.units ?? [], quiz: Array.isArray(c.quiz) ? c.quiz : prev?.quiz ?? [], updatedAt: Date.now(),
  };
  await saveCourses(prev ? list.map((x) => (x.id === id ? next : x)) : [...list, next]);
  return NextResponse.json({ course: next });
}

// Quiz actions: generate from slide text, or clear.
export async function PATCH(req: Request) {
  if (!(await isAdmin())) return deny();
  const { id, action } = (await req.json().catch(() => ({}))) as { id?: string; action?: string };
  const list = await loadCourses();
  const course = list.find((x) => x.id === id);
  if (!course) return NextResponse.json({ error: "Course not found." }, { status: 404 });
  if (action === "generateQuiz") {
    const quiz = generateQuiz(course.slideText, 10);
    if (!quiz.length) return NextResponse.json({ error: "Not enough definition-style sentences in the slide text to build questions." }, { status: 422 });
    course.quiz = quiz;
  } else if (action === "clearQuiz") course.quiz = [];
  else return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  course.updatedAt = Date.now();
  await saveCourses(list);
  return NextResponse.json({ course });
}

export async function DELETE(req: Request) {
  if (!(await isAdmin())) return deny();
  const id = new URL(req.url).searchParams.get("id");
  const list = await loadCourses();
  await saveCourses(list.filter((x) => x.id !== id));
  return NextResponse.json({ ok: true });
}
