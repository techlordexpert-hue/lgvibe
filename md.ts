const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const inline = (s: string) =>
  esc(s).replace(/`([^`]+)`/g, "<code>$1</code>").replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>").replace(/\*([^*]+)\*/g, "<em>$1</em>");

/** Small, safe markdown subset: headings, bullet/numbered lists, bold, italic, inline code. */
export function mdToHtml(md: string): string {
  const out: string[] = [];
  let list: "ul" | "ol" | null = null;
  const close = () => { if (list) { out.push(`</${list}>`); list = null; } };
  for (const raw of md.split("\n")) {
    const line = raw.trimEnd();
    const h = /^(#{1,3})\s+(.*)$/.exec(line);
    const ul = /^\s*[-*]\s+(.*)$/.exec(line);
    const ol = /^\s*\d+\.\s+(.*)$/.exec(line);
    if (h) { close(); out.push(`<h${h[1].length}>${inline(h[2])}</h${h[1].length}>`); }
    else if (ul) { if (list !== "ul") { close(); out.push("<ul>"); list = "ul"; } out.push(`<li>${inline(ul[1])}</li>`); }
    else if (ol) { if (list !== "ol") { close(); out.push("<ol>"); list = "ol"; } out.push(`<li>${inline(ol[1])}</li>`); }
    else if (line.trim() === "") close();
    else { close(); out.push(`<p>${inline(line)}</p>`); }
  }
  close();
  return out.join("");
}

export function ytId(input: string): string | null {
  const s = (input || "").trim();
  if (!s) return null;
  if (/^[\w-]{11}$/.test(s)) return s;
  try {
    const u = new URL(s);
    if (u.hostname.includes("youtu.be")) return u.pathname.slice(1, 12) || null;
    const v = u.searchParams.get("v");
    if (v) return v.slice(0, 11);
    const m = /\/(embed|shorts|live)\/([\w-]{11})/.exec(u.pathname);
    return m ? m[2] : null;
  } catch { return null; }
}
