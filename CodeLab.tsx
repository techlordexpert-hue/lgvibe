"use client";
import { useRef, useState } from "react";
import { runJava } from "@/lib/javasim";

const SAMPLES: Record<string, string> = {
  "Hello, loops": `public class Main {
    public static void main(String[] args) {
        String course = "Java OOP";
        System.out.println("Welcome to " + course);
        int sum = 0;
        for (int i = 1; i <= 5; i++) {
            sum += i;
            System.out.println("i = " + i + ", running sum = " + sum);
        }
        double avg = sum / 5.0;
        System.out.printf("Average: %.2f%n", avg);
        if (sum > 10) {
            System.out.println("Sum is greater than 10");
        } else {
            System.out.println("Sum is 10 or less");
        }
    }
}`,
  "Grade checker": `public class Main {
    public static void main(String[] args) {
        int score = 72;
        if (score >= 70) {
            System.out.println("Grade: A");
        } else if (score >= 60) {
            System.out.println("Grade: B");
        } else {
            System.out.println("Grade: C");
        }
        int n = 3;
        while (n > 0) {
            System.out.println("Countdown: " + n);
            n--;
        }
    }
}`,
};

type Line = { tone: "info" | "out" | "ok" | "err"; text: string };
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function CodeLab() {
  const [name, setName] = useState("Hello, loops");
  const [code, setCode] = useState(SAMPLES["Hello, loops"]);
  const [lines, setLines] = useState<Line[]>([{ tone: "info", text: "Press Run to compile and execute Main.java." }]);
  const [running, setRunning] = useState(false);
  const gutter = useRef<HTMLDivElement>(null);

  const run = async () => {
    setRunning(true); const t0 = performance.now(); const ms = () => `${Math.round(performance.now() - t0)} ms`;
    setLines([{ tone: "info", text: "$ javac Main.java" }]); await sleep(250);
    const res = runJava(code);
    if (res.error && /^(Main\.java: )?error/.test(res.error)) {
      setLines((l) => [...l, { tone: "err", text: res.error as string }, { tone: "err", text: "Compilation failed." }]); setRunning(false); return;
    }
    setLines((l) => [...l, { tone: "ok", text: `Compiled successfully (${ms()})`, }, { tone: "info", text: "$ java Main" }]); await sleep(250);
    const out = res.out.replace(/\n$/, "");
    setLines((l) => [...l, ...(out ? out.split("\n").map((t) => ({ tone: "out" as const, text: t })) : []),
      res.ok ? { tone: "ok", text: `Process finished with exit code 0 (${ms()})` } : { tone: "err", text: res.error as string },
      ...(res.ok ? [] : [{ tone: "err" as const, text: "Process finished with exit code 1" }])]);
    setRunning(false);
  };

  const count = code.split("\n").length;
  const color = { info: "text-zinc-500", out: "text-zinc-100", ok: "text-emerald-400", err: "text-rose-400" };

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
      <div className="flex flex-wrap items-center gap-2 border-b border-zinc-800 px-4 py-2">
        <span className="mr-2 text-sm text-zinc-400">Main.java</span>
        <select value={name} onChange={(e) => { setName(e.target.value); setCode(SAMPLES[e.target.value]); }} aria-label="Sample program"
          className="rounded-md border border-zinc-800 bg-zinc-950 px-2 py-1 text-sm">
          {Object.keys(SAMPLES).map((k) => <option key={k}>{k}</option>)}
        </select>
        <button onClick={run} disabled={running} className="ml-auto rounded-lg border border-emerald-500 bg-emerald-500/10 px-4 py-1.5 text-sm font-medium text-emerald-300 hover:bg-emerald-500/20 disabled:opacity-50">{running ? "Running…" : "Run"}</button>
      </div>
      <div className="flex h-80 bg-zinc-950 font-mono text-sm leading-6">
        <div ref={gutter} aria-hidden className="w-12 select-none overflow-hidden py-3 pr-2 text-right text-zinc-600">
          {Array.from({ length: count }, (_, i) => <div key={i}>{i + 1}</div>)}
        </div>
        <textarea value={code} onChange={(e) => setCode(e.target.value)} spellCheck={false} aria-label="Java source code"
          onScroll={(e) => { if (gutter.current) gutter.current.scrollTop = e.currentTarget.scrollTop; }}
          onKeyDown={(e) => { if (e.key === "Tab") { e.preventDefault(); const t = e.currentTarget, s = t.selectionStart; setCode(code.slice(0, s) + "    " + code.slice(t.selectionEnd)); requestAnimationFrame(() => { t.selectionStart = t.selectionEnd = s + 4; }); } }}
          className="flex-1 resize-none whitespace-pre bg-transparent py-3 pl-2 text-zinc-100 outline-none" />
      </div>
      <div className="h-52 overflow-auto border-t border-zinc-800 bg-black/40 p-4 font-mono text-sm" role="log" aria-live="polite">
        {lines.map((l, i) => <div key={i} className={color[l.tone]}>{l.text || " "}</div>)}
      </div>
      <p className="border-t border-zinc-800 px-4 py-2 text-xs text-zinc-500">Simulated console: supports variables, arithmetic, strings, if/else, for, while, println, print and printf.</p>
    </div>
  );
}
