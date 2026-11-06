"use client";
import { useEffect, useMemo, useState } from "react";
import type { Course } from "@/lib/types";
import { mdToHtml, ytId } from "@/lib/md";

export default function TutorMe({ course }: { course: Course }) {
  const flat = useMemo(() => course.units.flatMap((u) => u.topics.map((t) => ({ ...t, unit: u.title }))), [course]);
  const [sel, setSel] = useState(flat[0]?.id ?? "");
  const [done, setDone] = useState<string[]>([]);
  const key = `lgvibe:progress:${course.id}`;

  useEffect(() => { try { setDone(JSON.parse(localStorage.getItem(key) ?? "[]")); } catch {} }, [key]);
  const toggle = (id: string) => setDone((d) => { const n = d.includes(id) ? d.filter((x) => x !== id) : [...d, id]; try { localStorage.setItem(key, JSON.stringify(n)); } catch {} return n; });

  const idx = flat.findIndex((t) => t.id === sel);
  const cur = flat[idx];
  if (!cur) return <p className="text-zinc-400">This course has no syllabus yet.</p>;
  const id = ytId(cur.youtube);
  const pct = Math.round((done.filter((d) => flat.some((t) => t.id === d)).length / flat.length) * 100);

  return (
    <section aria-label="Tutor Me" className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div>
        <div className="aspect-video overflow-hidden rounded-xl border border-zinc-800 bg-black">
          {id ? (
            <iframe key={id} src={`https://www.youtube-nocookie.com/embed/${id}?rel=0`} title={cur.title} className="h-full w-full"
              allow="accelerometer; encrypted-media; picture-in-picture; fullscreen" allowFullScreen />
          ) : (
            <div className="flex h-full items-center justify-center p-6 text-center text-zinc-500">No video is mapped to this topic yet. An admin can add a YouTube link in the Video Mapping tab.</div>
          )}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm text-zinc-500">{cur.unit}</p>
            <h2 className="text-xl font-semibold text-zinc-50">{cur.title}</h2>
          </div>
          <button onClick={() => toggle(cur.id)} className={`rounded-lg border px-4 py-2 text-sm font-medium ${done.includes(cur.id) ? "border-emerald-500 bg-emerald-500/10 text-emerald-300" : "border-zinc-700 text-zinc-300 hover:border-indigo-500"}`}>{done.includes(cur.id) ? "Completed" : "Mark complete"}</button>
        </div>
        <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900 p-5 text-zinc-300 [&_h1]:mb-2 [&_h1]:text-lg [&_h1]:font-semibold [&_h1]:text-zinc-100 [&_h2]:font-semibold [&_li]:ml-5 [&_li]:list-disc [&_ol_li]:list-decimal [&_p]:mb-2 [&_code]:rounded [&_code]:bg-zinc-800 [&_code]:px-1"
          dangerouslySetInnerHTML={{ __html: mdToHtml(cur.summary) }} />
        <div className="mt-4 flex justify-between">
          <button disabled={idx === 0} onClick={() => setSel(flat[idx - 1].id)} className="rounded-lg border border-zinc-800 px-4 py-2 text-sm hover:border-indigo-500 disabled:opacity-30">Previous topic</button>
          <button disabled={idx === flat.length - 1} onClick={() => setSel(flat[idx + 1].id)} className="rounded-lg border border-zinc-800 px-4 py-2 text-sm hover:border-indigo-500 disabled:opacity-30">Next topic</button>
        </div>
      </div>

      <aside className="h-fit rounded-xl border border-zinc-800 bg-zinc-900 lg:sticky lg:top-4" aria-label="Syllabus">
        <div className="border-b border-zinc-800 p-4">
          <p className="font-medium text-zinc-100">{course.title}</p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-800"><div className="h-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} /></div>
          <p className="mt-1 text-xs text-zinc-500">{pct}% complete</p>
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {course.units.map((u) => (
            <details key={u.id} open className="mb-1">
              <summary className="cursor-pointer rounded-lg px-3 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-800">{u.title}</summary>
              <ul>
                {u.topics.map((t) => (
                  <li key={t.id}>
                    <button onClick={() => setSel(t.id)} aria-current={t.id === sel}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm ${t.id === sel ? "bg-indigo-500/10 text-indigo-300" : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"}`}>
                      <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs ${done.includes(t.id) ? "border-emerald-500 bg-emerald-500/20 text-emerald-300" : "border-zinc-700"}`}>{done.includes(t.id) ? "✓" : ""}</span>
                      <span className="flex-1">{t.title}</span>
                      {!ytId(t.youtube) && <span className="text-xs text-zinc-600">no video</span>}
                    </button>
                  </li>
                ))}
              </ul>
            </details>
          ))}
        </div>
      </aside>
    </section>
  );
}
