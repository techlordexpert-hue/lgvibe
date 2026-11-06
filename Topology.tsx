"use client";
import { useCallback, useEffect, useRef, useState } from "react";

type Kind = "router" | "switch" | "pc";
type NodeT = { id: number; kind: Kind; label: string; x: number; y: number };
type Tool = "select" | Kind | "link" | "ping";
const COLORS: Record<Kind, string> = { router: "#6366f1", switch: "#10b981", pc: "#a1a1aa" };
const PREFIX: Record<Kind, string> = { router: "R", switch: "SW", pc: "PC" };
const R = 26;

export default function Topology() {
  const wrap = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState({ w: 800, h: 480 });
  const [nodes, setNodes] = useState<NodeT[]>([]);
  const [links, setLinks] = useState<[number, number][]>([]);
  const [tool, setTool] = useState<Tool>("router");
  const [pending, setPending] = useState<number | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [path, setPath] = useState<number[]>([]);
  const [msg, setMsg] = useState<{ tone: "ok" | "err" | "info"; text: string }>({ tone: "info", text: "Pick a device, then click the canvas to place it." });
  const drag = useRef<number | null>(null);
  const counter = useRef<Record<Kind, number>>({ router: 0, switch: 0, pc: 0 });

  useEffect(() => {
    const el = wrap.current; if (!el) return;
    const ro = new ResizeObserver((e) => setSize({ w: Math.max(300, Math.floor(e[0].contentRect.width)), h: 480 }));
    ro.observe(el); return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const c = cv.current; if (!c) return;
    const dpr = window.devicePixelRatio || 1;
    c.width = size.w * dpr; c.height = size.h * dpr;
    const g = c.getContext("2d"); if (!g) return;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.fillStyle = "#09090b"; g.fillRect(0, 0, size.w, size.h);
    g.strokeStyle = "#18181b"; g.lineWidth = 1;
    for (let x = 0; x < size.w; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, size.h); g.stroke(); }
    for (let y = 0; y < size.h; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(size.w, y); g.stroke(); }
    const byId = new Map(nodes.map((n) => [n.id, n]));
    const onPath = (a: number, b: number) => { const i = path.indexOf(a); return i >= 0 && (path[i + 1] === b || path[i - 1] === b); };
    for (const [a, b] of links) {
      const A = byId.get(a), B = byId.get(b); if (!A || !B) continue;
      g.strokeStyle = onPath(a, b) ? "#10b981" : "#52525b"; g.lineWidth = onPath(a, b) ? 4 : 2.5;
      g.beginPath(); g.moveTo(A.x, A.y); g.lineTo(B.x, B.y); g.stroke();
    }
    g.textAlign = "center";
    for (const n of nodes) {
      g.fillStyle = "#18181b"; g.strokeStyle = n.id === selected || n.id === pending ? "#6366f1" : path.includes(n.id) ? "#10b981" : COLORS[n.kind]; g.lineWidth = n.id === selected || n.id === pending ? 4 : 2.5;
      g.beginPath();
      if (n.kind === "router") g.arc(n.x, n.y, R, 0, Math.PI * 2); else g.roundRect(n.x - R, n.y - R + (n.kind === "pc" ? 4 : 8), R * 2, n.kind === "pc" ? R * 1.5 : R * 1.2, 8);
      g.fill(); g.stroke();
      g.fillStyle = "#e4e4e7"; g.font = "600 14px ui-sans-serif, system-ui"; g.textBaseline = "middle";
      g.fillText(n.kind === "router" ? "R" : n.kind === "switch" ? "SW" : "PC", n.x, n.y + (n.kind === "router" ? 0 : 14));
      g.fillStyle = "#a1a1aa"; g.font = "13px ui-sans-serif, system-ui"; g.fillText(n.label, n.x, n.y + R + 18);
    }
  }, [nodes, links, size, selected, pending, path]);

  const hit = useCallback((x: number, y: number) => nodes.find((n) => Math.hypot(n.x - x, n.y - y) <= R + 4)?.id ?? null, [nodes]);
  const pos = (e: React.PointerEvent) => { const r = cv.current!.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  const name = (id: number) => nodes.find((n) => n.id === id)?.label ?? "?";

  const bfs = (from: number, to: number): number[] => {
    const prev = new Map<number, number>([[from, -1]]); const q = [from];
    while (q.length) {
      const cur = q.shift() as number; if (cur === to) break;
      for (const [a, b] of links) { const nb = a === cur ? b : b === cur ? a : null; if (nb !== null && !prev.has(nb)) { prev.set(nb, cur); q.push(nb); } }
    }
    if (!prev.has(to)) return [];
    const p: number[] = []; for (let c = to; c !== -1; c = prev.get(c) as number) p.unshift(c); return p;
  };

  const down = (e: React.PointerEvent) => {
    const { x, y } = pos(e); const h = hit(x, y); setPath([]);
    if (tool === "select") { setSelected(h); drag.current = h; if (h !== null) (e.target as Element).setPointerCapture(e.pointerId); return; }
    if (tool === "router" || tool === "switch" || tool === "pc") {
      if (h !== null) { setSelected(h); return; }
      const n = ++counter.current[tool];
      const node: NodeT = { id: Date.now() + n, kind: tool, label: `${PREFIX[tool]}${n}`, x, y };
      setNodes((p) => [...p, node]); setSelected(node.id); setMsg({ tone: "info", text: `${node.label} added.` }); return;
    }
    if (h === null) { setPending(null); return; }
    if (pending === null) { setPending(h); setMsg({ tone: "info", text: `${name(h)} selected. Click another device to ${tool === "link" ? "connect" : "ping"}.` }); return; }
    if (pending === h) { setPending(null); return; }
    if (tool === "link") {
      if (links.some(([a, b]) => (a === pending && b === h) || (a === h && b === pending))) setMsg({ tone: "err", text: "Those devices are already linked." });
      else { setLinks((l) => [...l, [pending, h]]); setMsg({ tone: "ok", text: `Linked ${name(pending)} to ${name(h)}.` }); }
    } else {
      const p = bfs(pending, h);
      if (p.length) { setPath(p); setMsg({ tone: "ok", text: `Reply from ${name(h)}: ${p.map(name).join(" → ")} (${p.length - 1} hop${p.length === 2 ? "" : "s"}).` }); }
      else setMsg({ tone: "err", text: `Request timed out: no route from ${name(pending)} to ${name(h)}.` });
    }
    setPending(null);
  };
  const move = (e: React.PointerEvent) => { if (drag.current === null) return; const { x, y } = pos(e); setNodes((p) => p.map((n) => (n.id === drag.current ? { ...n, x, y } : n))); };
  const up = () => { drag.current = null; };
  const del = () => { if (selected === null) return; setNodes((p) => p.filter((n) => n.id !== selected)); setLinks((l) => l.filter(([a, b]) => a !== selected && b !== selected)); setSelected(null); setPath([]); };
  const clear = () => { setNodes([]); setLinks([]); setSelected(null); setPending(null); setPath([]); counter.current = { router: 0, switch: 0, pc: 0 }; setMsg({ tone: "info", text: "Canvas cleared." }); };

  const tools: [Tool, string][] = [["select", "Move"], ["router", "Router"], ["switch", "Switch"], ["pc", "PC"], ["link", "Draw link"], ["ping", "Ping"]];
  const tone = msg.tone === "ok" ? "border-emerald-500 bg-emerald-500/10 text-emerald-300" : msg.tone === "err" ? "border-rose-500 bg-rose-500/10 text-rose-300" : "border-zinc-800 bg-zinc-900 text-zinc-300";

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2">
        {tools.map(([k, label]) => (
          <button key={k} onClick={() => { setTool(k); setPending(null); }}
            className={`rounded-lg border px-3 py-2 text-sm ${tool === k ? "border-indigo-500 bg-indigo-500/10 text-indigo-300" : "border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-700"}`}>{label}</button>
        ))}
        <button onClick={del} disabled={selected === null} className="rounded-lg border border-zinc-800 px-3 py-2 text-sm hover:border-rose-500 hover:text-rose-300 disabled:opacity-30">Delete selected</button>
        <button onClick={clear} className="rounded-lg border border-zinc-800 px-3 py-2 text-sm text-zinc-400 hover:border-rose-500 hover:text-rose-300">Clear</button>
      </div>
      <div ref={wrap} className="overflow-hidden rounded-xl border border-zinc-800">
        <canvas ref={cv} style={{ width: size.w, height: size.h, touchAction: "none", cursor: tool === "select" ? "grab" : "crosshair" }}
          onPointerDown={down} onPointerMove={move} onPointerUp={up} aria-label="Network topology canvas" />
      </div>
      <p role="status" className={`mt-3 rounded-lg border px-4 py-2 text-sm ${tone}`}>{msg.text}</p>
    </div>
  );
}
