"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { Course, Topic, Unit } from "@/lib/types";
import { ytId } from "@/lib/md";

type State = Record<string, string | number | null>;
const input = "w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500";
const btn = "rounded-lg border px-4 py-2 text-sm font-medium transition-colors";
const primary = `${btn} border-indigo-500 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20`;
const uid = () => Math.random().toString(36).slice(2, 8);

export default function Admin() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [state, setState] = useState<State | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selId, setSelId] = useState("");
  const [tab, setTab] = useState<"Courses" | "Video Mapping" | "Global State">("Courses");
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null);
  const [draft, setDraft] = useState<Course | null>(null);
  const [newTitle, setNewTitle] = useState("");

  const note = (ok: boolean, text: string) => { setToast({ ok, text }); setTimeout(() => setToast(null), 3500); };

  const refresh = useCallback(async () => {
    const a = (await (await fetch("/api/admin", { cache: "no-store" })).json()) as { authed: boolean; state?: State };
    setAuthed(a.authed); setState(a.state ?? null);
    if (a.authed) {
      const c = (await (await fetch("/api/courses", { cache: "no-store" })).json()) as { courses: Course[] };
      setCourses(c.courses);
      setSelId((s) => (c.courses.some((x) => x.id === s) ? s : c.courses[0]?.id ?? ""));
    }
  }, []);
  useEffect(() => { refresh().catch(() => setAuthed(false)); }, [refresh]);
  useEffect(() => { setDraft(courses.find((c) => c.id === selId) ? structuredClone(courses.find((c) => c.id === selId) as Course) : null); }, [selId, courses]);

  const login = async (e: React.FormEvent) => {
    e.preventDefault(); setErr("");
    const r = await fetch("/api/admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ passphrase: pass }) });
    if (!r.ok) { setErr(((await r.json()) as { error: string }).error); return; }
    setPass(""); await refresh();
  };
  const logout = async () => { await fetch("/api/admin", { method: "DELETE" }); setAuthed(false); setState(null); };

  const save = async (c: Course) => {
    const r = await fetch("/api/courses", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ course: c }) });
    const d = (await r.json()) as { course?: Course; error?: string };
    if (!r.ok) return note(false, d.error ?? "Save failed.");
    note(true, "Saved."); setSelId((d.course as Course).id); await refresh();
  };
  const quizAction = async (action: "generateQuiz" | "clearQuiz") => {
    if (!draft) return;
    await save(draft);
    const r = await fetch("/api/courses", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: draft.id, action }) });
    const d = (await r.json()) as { course?: Course; error?: string };
    if (!r.ok) return note(false, d.error ?? "Failed.");
    note(true, action === "generateQuiz" ? `Generated ${d.course?.quiz.length} questions.` : "Quiz cleared."); await refresh();
  };
  const addCourse = async () => {
    if (!newTitle.trim()) return;
    await save({ id: "", title: newTitle.trim(), description: "", slideText: "", units: [], quiz: [], updatedAt: 0 });
    setNewTitle("");
  };
  const removeCourse = async () => {
    if (!draft || !confirm(`Delete "${draft.title}"? This cannot be undone.`)) return;
    await fetch(`/api/courses?id=${encodeURIComponent(draft.id)}`, { method: "DELETE" });
    note(true, "Course deleted."); await refresh();
  };

  const edit = (fn: (c: Course) => void) => setDraft((d) => { if (!d) return d; const n = structuredClone(d); fn(n); return n; });
  const editTopic = (ui: number, ti: number, patch: Partial<Topic>) => edit((c) => { Object.assign(c.units[ui].topics[ti], patch); });

  if (authed === null) return <main className="p-10 text-zinc-500">Loading…</main>;

  if (!authed) {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <form onSubmit={login} className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center shadow-2xl">
          <img src="/avatar.svg" alt="" className="mx-auto mb-4 h-16 w-16 rounded-2xl" />
          <h1 className="text-xl font-semibold text-zinc-50">Admin desk</h1>
          <p className="mt-1 text-sm text-zinc-500">Enter the passphrase to continue.</p>
          <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="Passphrase" autoFocus autoComplete="current-password" aria-label="Passphrase" className={`${input} mt-6 text-center`} />
          {err && <p role="alert" className="mt-3 rounded-lg border border-rose-500 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{err}</p>}
          <button className={`${primary} mt-4 w-full`}>Unlock</button>
          <Link href="/" className="mt-4 inline-block text-sm text-zinc-500 hover:text-zinc-300">Back to LGVIBE</Link>
        </form>
      </main>
    );
  }

  const topicsFlat = draft?.units.flatMap((u, ui) => u.topics.map((t, ti) => ({ u, t, ui, ti }))) ?? [];

  return (
    <main className="mx-auto max-w-6xl p-4 sm:p-6">
      <header className="flex flex-wrap items-center gap-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
        <img src="/avatar.svg" alt="Admin avatar" className="h-16 w-16 rounded-2xl border border-zinc-800" />
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-semibold text-zinc-50 sm:text-xl">Good Morning Mr. Lord, my desk is clear. Ready to scale course architectures.</h1>
        </div>
        <Link href="/" className={`${btn} border-zinc-800 text-zinc-300 hover:border-zinc-600`}>View site</Link>
        <button onClick={logout} className={`${btn} border-zinc-800 text-zinc-400 hover:border-rose-500 hover:text-rose-300`}>Sign out</button>
      </header>

      <nav className="mt-5 flex gap-1" aria-label="Control center">
        {(["Courses", "Video Mapping", "Global State"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`rounded-lg border px-4 py-2 text-sm ${tab === t ? "border-indigo-500 bg-indigo-500/10 text-indigo-300" : "border-transparent text-zinc-400 hover:text-zinc-100"}`}>{t}</button>
        ))}
      </nav>
      {toast && <p role="status" className={`mt-4 rounded-lg border px-4 py-2 text-sm ${toast.ok ? "border-emerald-500 bg-emerald-500/10 text-emerald-300" : "border-rose-500 bg-rose-500/10 text-rose-300"}`}>{toast.text}</p>}

      {tab === "Global State" && state && (
        <section className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(state).map(([k, v]) => (
            <div key={k} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
              <p className="text-sm text-zinc-500">{k.replace(/([A-Z])/g, " $1").toLowerCase()}</p>
              <p className="mt-1 break-words text-lg font-semibold text-zinc-100">{k === "lastLogin" && v ? new Date(v as number).toLocaleString() : String(v ?? "never")}</p>
            </div>
          ))}
        </section>
      )}

      {tab !== "Global State" && (
        <div className="mt-5 grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="h-fit rounded-xl border border-zinc-800 bg-zinc-900 p-3">
            <ul className="space-y-1">
              {courses.map((c) => (
                <li key={c.id}><button onClick={() => setSelId(c.id)} className={`w-full rounded-lg px-3 py-2 text-left text-sm ${c.id === selId ? "bg-indigo-500/10 text-indigo-300" : "text-zinc-400 hover:bg-zinc-800"}`}>{c.title}</button></li>
              ))}
            </ul>
            <div className="mt-3 border-t border-zinc-800 pt-3">
              <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addCourse()} placeholder="New course title" aria-label="New course title" className={input} />
              <button onClick={addCourse} className={`${primary} mt-2 w-full`}>Add course</button>
            </div>
          </aside>

          {!draft ? <p className="text-zinc-500">Add a course to get started.</p> : tab === "Video Mapping" ? (
            <section className="space-y-3">
              {topicsFlat.length === 0 && <p className="text-zinc-500">Add topics in the Courses tab first.</p>}
              {topicsFlat.map(({ u, t, ui, ti }) => {
                const ok = ytId(t.youtube);
                return (
                  <div key={t.id} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                    <p className="text-sm text-zinc-500">{u.title}</p>
                    <p className="font-medium text-zinc-100">{t.title}</p>
                    <input value={t.youtube} onChange={(e) => editTopic(ui, ti, { youtube: e.target.value })} placeholder="YouTube link or video ID" aria-label={`YouTube link for ${t.title}`} className={`${input} mt-2`} />
                    {t.youtube && <p className={`mt-1 text-sm ${ok ? "text-emerald-400" : "text-rose-400"}`}>{ok ? `Video ID ${ok}` : "That is not a valid YouTube link."}</p>}
                  </div>
                );
              })}
              {topicsFlat.length > 0 && <button onClick={() => save(draft)} className={primary}>Save video mapping</button>}
            </section>
          ) : (
            <section className="space-y-5">
              <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 space-y-3">
                <input value={draft.title} onChange={(e) => edit((c) => { c.title = e.target.value; })} aria-label="Course title" className={`${input} font-semibold`} />
                <input value={draft.description} onChange={(e) => edit((c) => { c.description = e.target.value; })} placeholder="Short description" aria-label="Description" className={input} />
                <label className="block text-sm text-zinc-400">Slide text (feeds the quiz generator)
                  <textarea value={draft.slideText} onChange={(e) => edit((c) => { c.slideText = e.target.value; })} rows={7} className={`${input} mt-1`} placeholder="Paste text from lecture slides here." />
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  <button onClick={() => save(draft)} className={primary}>Save course</button>
                  <button onClick={() => quizAction("generateQuiz")} className={`${btn} border-emerald-500 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20`}>Generate quiz from slide text</button>
                  <button onClick={() => quizAction("clearQuiz")} className={`${btn} border-zinc-800 text-zinc-400 hover:border-rose-500 hover:text-rose-300`}>Clear quiz ({draft.quiz.length})</button>
                  <button onClick={removeCourse} className={`${btn} ml-auto border-zinc-800 text-zinc-400 hover:border-rose-500 hover:text-rose-300`}>Delete course</button>
                </div>
              </div>

              {draft.units.map((u: Unit, ui) => (
                <div key={u.id} className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 space-y-3">
                  <div className="flex gap-2">
                    <input value={u.title} onChange={(e) => edit((c) => { c.units[ui].title = e.target.value; })} aria-label="Unit title" className={`${input} font-medium`} />
                    <button onClick={() => edit((c) => { c.units.splice(ui, 1); })} className={`${btn} border-zinc-800 text-zinc-400 hover:border-rose-500 hover:text-rose-300`}>Remove unit</button>
                  </div>
                  {u.topics.map((t, ti) => (
                    <div key={t.id} className="space-y-2 rounded-lg border border-zinc-800 bg-zinc-950 p-3">
                      <div className="flex gap-2">
                        <input value={t.title} onChange={(e) => editTopic(ui, ti, { title: e.target.value })} aria-label="Topic title" className={input} />
                        <button onClick={() => edit((c) => { c.units[ui].topics.splice(ti, 1); })} className="text-sm text-zinc-500 hover:text-rose-300">Remove</button>
                      </div>
                      <textarea value={t.summary} onChange={(e) => editTopic(ui, ti, { summary: e.target.value })} rows={5} aria-label="Summary in markdown" placeholder="Summary in markdown: # heading, - bullets, **bold**" className={`${input} font-mono`} />
                    </div>
                  ))}
                  <button onClick={() => edit((c) => { c.units[ui].topics.push({ id: uid(), title: "New topic", summary: "", youtube: "" }); })} className={`${btn} border-zinc-800 text-zinc-300 hover:border-indigo-500`}>Add topic</button>
                </div>
              ))}
              <button onClick={() => edit((c) => { c.units.push({ id: uid(), title: `Unit ${c.units.length + 1}`, topics: [] }); })} className={`${btn} border-zinc-800 text-zinc-300 hover:border-indigo-500`}>Add unit</button>
            </section>
          )}
        </div>
      )}
    </main>
  );
}
