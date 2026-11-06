"use client";
import { useState } from "react";
import Topology from "./Topology";
import CodeLab from "./CodeLab";

export default function Playground() {
  const [mode, setMode] = useState<"net" | "code">("net");
  return (
    <section aria-label="Playground">
      <div className="mb-4 inline-flex rounded-lg border border-zinc-800 bg-zinc-900 p-1">
        {([["net", "Network topology"], ["code", "Java console"]] as const).map(([k, label]) => (
          <button key={k} onClick={() => setMode(k)}
            className={`rounded-md px-4 py-2 text-sm font-medium ${mode === k ? "bg-indigo-500/15 text-indigo-300" : "text-zinc-400 hover:text-zinc-100"}`}>{label}</button>
        ))}
      </div>
      {mode === "net" ? <Topology /> : <CodeLab />}
    </section>
  );
}
