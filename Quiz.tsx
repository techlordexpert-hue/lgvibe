"use client";
import { useState } from "react";
import type { Course } from "@/lib/types";

export default function Quiz({ course }: { course: Course }) {
  const qs = course.quiz;
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [done, setDone] = useState(false);

  if (!qs.length) return <p className="text-zinc-400">No quiz for this course yet. Generate one from the admin desk.</p>;

  const score = answers.filter((a, k) => a === qs[k]?.answer).length;
  const restart = () => { setI(0); setPicked(null); setAnswers([]); setDone(false); };

  const choose = (n: number) => { if (picked === null) setPicked(n); };
  const next = () => {
    const a = [...answers, picked]; setAnswers(a); setPicked(null);
    if (i + 1 >= qs.length) setDone(true); else setI(i + 1);
  };

  const report = () => {
    const pct = Math.round((score / qs.length) * 100);
    const body = [
      `LGVIBE quiz report`, `Course: ${course.title}`, `Date: ${new Date().toLocaleString()}`, `Score: ${score}/${qs.length} (${pct}%)`, "",
      ...qs.map((q, k) => `${k + 1}. ${q.q}\n   Your answer: ${answers[k] == null ? "(none)" : q.options[answers[k] as number]}\n   Correct answer: ${q.options[q.answer]}\n   ${answers[k] === q.answer ? "Correct" : "Incorrect"}. ${q.explanation}`),
    ].join("\n");
    const url = URL.createObjectURL(new Blob([body], { type: "text/plain" }));
    const a = document.createElement("a"); a.href = url; a.download = `lgvibe-quiz-${course.id}.txt`; a.click(); URL.revokeObjectURL(url);
  };

  if (done) {
    const pct = Math.round((score / qs.length) * 100);
    return (
      <section aria-label="Quiz report" className="mx-auto max-w-3xl">
        <div className={`rounded-2xl border p-6 ${pct >= 50 ? "border-emerald-500 bg-emerald-500/10" : "border-rose-500 bg-rose-500/10"}`}>
          <h2 className="text-2xl font-bold text-zinc-50">{score} of {qs.length} correct ({pct}%)</h2>
          <p className="mt-1 text-zinc-300">{pct >= 80 ? "Strong result. You are ready to move on." : pct >= 50 ? "Solid base. Review the missed questions below." : "Revisit the notes and try again."}</p>
          <div className="mt-4 flex gap-2">
            <button onClick={report} className="rounded-lg border border-indigo-500 bg-indigo-500/10 px-4 py-2 text-sm font-medium text-indigo-300 hover:bg-indigo-500/20">Download report</button>
            <button onClick={restart} className="rounded-lg border border-zinc-700 px-4 py-2 text-sm hover:border-zinc-500">Retake quiz</button>
          </div>
        </div>
        <ol className="mt-6 space-y-3">
          {qs.map((q, k) => {
            const ok = answers[k] === q.answer;
            return (
              <li key={q.id} className={`rounded-xl border p-4 ${ok ? "border-emerald-500/40 bg-emerald-500/5" : "border-rose-500/40 bg-rose-500/5"}`}>
                <p className="font-medium text-zinc-100">{k + 1}. {q.q}</p>
                <p className="mt-1 text-sm text-zinc-400">Your answer: <span className={ok ? "text-emerald-400" : "text-rose-400"}>{answers[k] == null ? "none" : q.options[answers[k] as number]}</span>{!ok && <> · Correct: <span className="text-emerald-400">{q.options[q.answer]}</span></>}</p>
                <p className="mt-1 text-sm text-zinc-500">{q.explanation}</p>
              </li>
            );
          })}
        </ol>
      </section>
    );
  }

  const q = qs[i];
  const cls = (n: number) => {
    if (picked === null) return "border-zinc-800 bg-zinc-900 hover:border-indigo-500";
    if (n === q.answer) return "border-emerald-500 bg-emerald-500/10 text-emerald-200";
    if (n === picked) return "border-rose-500 bg-rose-500/10 text-rose-200";
    return "border-zinc-800 bg-zinc-900 opacity-50";
  };

  return (
    <section aria-label="Quiz" className="mx-auto max-w-2xl">
      <h2 className="text-xl font-semibold text-zinc-50">{q.q}</h2>
      <div className="mt-5 space-y-3" role="group" aria-label="Answers">
        {q.options.map((o, n) => (
          <button key={n} onClick={() => choose(n)} disabled={picked !== null} className={`w-full rounded-xl border px-4 py-3 text-left transition-colors ${cls(n)}`}>{o}</button>
        ))}
      </div>
      {picked !== null && (
        <div className="mt-5" role="status">
          <p className={picked === q.answer ? "text-emerald-400" : "text-rose-400"}>{picked === q.answer ? "Correct." : `Incorrect. The answer is "${q.options[q.answer]}".`}</p>
          <p className="mt-1 text-sm text-zinc-400">{q.explanation}</p>
          <button onClick={next} className="mt-4 rounded-lg border border-indigo-500 bg-indigo-500/10 px-5 py-2 text-sm font-medium text-indigo-300 hover:bg-indigo-500/20">{i + 1 >= qs.length ? "See my report" : "Next question"}</button>
        </div>
      )}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-zinc-800 bg-zinc-950/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center gap-4">
          <span className="whitespace-nowrap text-sm text-zinc-300">Question {i + 1} of {qs.length}</span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-800" role="progressbar" aria-valuemin={0} aria-valuemax={qs.length} aria-valuenow={i + (picked !== null ? 1 : 0)}>
            <div className="h-full rounded-full bg-indigo-500 transition-all duration-300" style={{ width: `${((i + (picked !== null ? 1 : 0)) / qs.length) * 100}%` }} />
          </div>
          <span className="whitespace-nowrap text-sm text-emerald-400">{answers.filter((a, k) => a === qs[k].answer).length + (picked === q.answer ? 1 : 0)} correct</span>
        </div>
      </div>
    </section>
  );
}
