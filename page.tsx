"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { Course } from "@/lib/types";
import Notebook from "@/components/Notebook";
import Playground from "@/components/Playground";
import Quiz from "@/components/Quiz";
import TutorMe from "@/components/TutorMe";

const TABS = ["Notes", "Playground", "Quiz", "Tutor Me"] as const;
type Tab = (typeof TABS)[number];

export default function Home() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseId, setCourseId] = useState("");
  const [tab, setTab] = useState<Tab>("Notes");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/courses", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { courses: Course[] }) => {
        setCourses(d.courses);
        let saved = ""; try { saved = localStorage.getItem("lgvibe:course") ?? ""; } catch {}
        setCourseId(d.courses.some((c) => c.id === saved) ? saved : d.courses[0]?.id ?? "");
      })
      .catch(() => setError("Could not load courses. Check your connection and refresh."))
      .finally(() => setLoading(false));
  }, []);

  const course = courses.find((c) => c.id === courseId);
  const pick = (id: string) => { setCourseId(id); try { localStorage.setItem("lgvibe:course", id); } catch {} };

  return (
    <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 pb-24 pt-4 sm:px-6">
      <header className="flex flex-wrap items-center gap-3 border-b border-zinc-800 pb-4">
        <h1 className="mr-2 text-xl font-bold tracking-tight text-zinc-50">LGVIBE</h1>
        <select value={courseId} onChange={(e) => pick(e.target.value)} aria-label="Course"
          className="max-w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-indigo-500">
          {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
        <nav className="order-last flex w-full gap-1 overflow-x-auto sm:order-none sm:ml-4 sm:w-auto" aria-label="Sections">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)} aria-current={tab === t}
              className={`whitespace-nowrap rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${tab === t ? "border-indigo-500 bg-indigo-500/10 text-indigo-300" : "border-transparent text-zinc-400 hover:border-zinc-800 hover:text-zinc-100"}`}>
              {t}
            </button>
          ))}
        </nav>
        <Link href="/admin" className="ml-auto rounded-lg border border-zinc-800 px-3 py-2 text-sm text-zinc-400 hover:border-zinc-700 hover:text-zinc-100">Admin</Link>
      </header>

      <main className="flex-1 pt-6">
        {loading && <p className="text-zinc-500">Loading courses…</p>}
        {error && <p className="rounded-lg border border-rose-500 bg-rose-500/10 p-3 text-rose-300">{error}</p>}
        {!loading && !error && !course && <p className="text-zinc-400">No courses yet. Sign in to the admin desk and add one.</p>}
        {course && tab === "Notes" && <Notebook key={course.id} course={course} />}
        {course && tab === "Playground" && <Playground />}
        {course && tab === "Quiz" && <Quiz key={course.id + course.updatedAt} course={course} />}
        {course && tab === "Tutor Me" && <TutorMe key={course.id} course={course} />}
      </main>
    </div>
  );
}
