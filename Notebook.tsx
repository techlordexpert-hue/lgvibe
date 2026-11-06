"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Course } from "@/lib/types";
import { mdToHtml } from "@/lib/md";

function Editable({ storageKey, initial, placeholder, className }: { storageKey: string; initial: string; placeholder?: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let saved: string | null = null;
    try { saved = localStorage.getItem(storageKey); } catch {}
    if (ref.current) ref.current.innerHTML = saved ?? initial;
  }, [storageKey, initial]);
  return (
    <div ref={ref} contentEditable suppressContentEditableWarning spellCheck data-placeholder={placeholder}
      aria-label={placeholder ?? "Editable page"} className={`editable notebook-ink min-h-[24rem] outline-none ${className ?? ""}`}
      onInput={(e) => { try { localStorage.setItem(storageKey, e.currentTarget.innerHTML); } catch {} }} />
  );
}

export default function Notebook({ course }: { course: Course }) {
  const pages = useMemo(() => course.units.flatMap((u) => u.topics.map((t) => ({ unit: u.title, ...t }))), [course]);
  const [i, setI] = useState(0);
  const [dir, setDir] = useState(1);
  const [rev, setRev] = useState(0);
  const page = pages[i];

  if (!page) return <p className="text-zinc-400">This course has no topics yet. Add units and topics from the admin desk.</p>;

  const go = (n: number) => { if (n < 0 || n >= pages.length) return; setDir(n > i ? 1 : -1); setI(n); };
  const fmt = (cmd: string, val?: string) => document.execCommand(cmd, false, val);
  const base = `lgvibe:nb:${course.id}:${page.id}`;
  const reset = () => { try { localStorage.removeItem(`${base}:left`); localStorage.removeItem(`${base}:right`); } catch {} setRev((r) => r + 1); };

  const Tool = ({ label, onClick }: { label: string; onClick: () => void }) => (
    <button onMouseDown={(e) => e.preventDefault()} onClick={onClick}
      className="rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-300 hover:border-indigo-500 hover:text-white">{label}</button>
  );

  return (
    <section aria-label="Digital notebook">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Tool label="Highlight" onClick={() => fmt("hiliteColor", "rgba(250,204,21,0.35)")} />
        <Tool label="Clear highlight" onClick={() => fmt("hiliteColor", "transparent")} />
        <Tool label="Bold" onClick={() => fmt("bold")} />
        <Tool label="Underline" onClick={() => fmt("underline")} />
        <button onClick={reset} className="ml-auto rounded-md border border-zinc-800 px-3 py-1.5 text-sm text-zinc-400 hover:border-rose-500 hover:text-rose-300">Reset this page</button>
      </div>

      <div className="relative [perspective:1800px]">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div key={`${page.id}-${rev}`} custom={dir}
            initial={{ rotateY: dir > 0 ? -75 : 75, opacity: 0, transformOrigin: dir > 0 ? "left center" : "right center" }}
            animate={{ rotateY: 0, opacity: 1, transformOrigin: "center center" }}
            exit={{ rotateY: dir > 0 ? 75 : -75, opacity: 0, transformOrigin: dir > 0 ? "right center" : "left center" }}
            transition={{ duration: 0.45, ease: "easeInOut" }}
            className="grid overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl md:grid-cols-2">
            <div className="p-6 sm:p-8">
              <p className="mb-2 text-sm text-zinc-500">{page.unit}</p>
              <Editable storageKey={`${base}:left`} initial={mdToHtml(page.summary)} />
            </div>
            <div className="ruled border-t border-zinc-800 bg-zinc-950/40 p-6 sm:p-8 md:border-l md:border-t-0">
              <p className="mb-2 text-sm text-zinc-500">My notes</p>
              <Editable storageKey={`${base}:right`} initial="" placeholder="Write your own notes here…" />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <button onClick={() => go(i - 1)} disabled={i === 0} className="rounded-lg border border-zinc-800 px-4 py-2 text-sm hover:border-indigo-500 disabled:opacity-30">Previous page</button>
        <span className="text-sm text-zinc-400">{page.title} · {i + 1} of {pages.length}</span>
        <button onClick={() => go(i + 1)} disabled={i === pages.length - 1} className="rounded-lg border border-zinc-800 px-4 py-2 text-sm hover:border-indigo-500 disabled:opacity-30">Next page</button>
      </div>
    </section>
  );
}
