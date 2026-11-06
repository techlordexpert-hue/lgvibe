import type { Question } from "./types";

const STOP = new Set(["between", "through", "because", "another", "should", "before", "during", "within", "without", "which", "their", "there", "these", "those", "called", "using", "where", "while", "about", "other", "across"]);

function hash(s: string): number { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function rng(seed: number) { return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function shuffle<T>(arr: T[], r: () => number): T[] { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

/** Builds fill-in-the-blank multiple choice questions from definition-style sentences in the slide text. */
export function generateQuiz(text: string, max = 10): Question[] {
  const flat = text.replace(/\s+/g, " ");
  const sentences = flat.split(/(?<=[.!?])\s+/).map((s) => s.trim())
    .filter((s) => s.length > 40 && s.length < 260 && /\b(is|are|refers to|means|uses|provides|allows|has|have)\b/i.test(s));
  const vocab = Array.from(new Set((flat.match(/[A-Za-z][A-Za-z-]{5,}/g) ?? []).map((w) => w.toLowerCase()).filter((w) => !STOP.has(w))));
  const out: Question[] = [];
  const usedKeys = new Set<string>();
  for (const s of sentences) {
    if (out.length >= max) break;
    const cands = (s.match(/[A-Za-z][A-Za-z-]{5,}/g) ?? []).filter((w) => !STOP.has(w.toLowerCase()) && !usedKeys.has(w.toLowerCase()));
    if (!cands.length) continue;
    const key = [...cands].sort((a, b) => b.length - a.length)[0];
    const lower = key.toLowerCase();
    const pool = vocab.filter((w) => w !== lower && Math.abs(w.length - key.length) <= 4);
    if (pool.length < 3) continue;
    const r = rng(hash(s));
    const distractors = shuffle(pool, r).slice(0, 3);
    const cap = (w: string) => (key[0] === key[0].toUpperCase() ? w[0].toUpperCase() + w.slice(1) : w);
    const options = shuffle([key, ...distractors.map(cap)], r);
    usedKeys.add(lower);
    out.push({
      id: `g${out.length + 1}-${hash(s).toString(36)}`,
      q: `Fill in the blank: ${s.replace(new RegExp(`\\b${key}\\b`), "_____")}`,
      options, answer: options.indexOf(key), explanation: s,
    });
  }
  return out;
}
