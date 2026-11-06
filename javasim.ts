// A small Java-subset interpreter used by the Playground console. It simulates output; it is not a JVM.
type K = "i" | "d" | "s" | "b" | "c";
type V = { k: K; v: number | string | boolean };
export type SimResult = { ok: boolean; out: string; error?: string };

const I = (v: number): V => ({ k: "i", v }), D = (v: number): V => ({ k: "d", v }), S = (v: string): V => ({ k: "s", v }), B = (v: boolean): V => ({ k: "b", v });
const fmt = (x: V) => (x.k === "d" && Number.isInteger(x.v as number) ? (x.v as number).toFixed(1) : String(x.v));
const num = (x: V) => (x.k === "c" ? (x.v as string).charCodeAt(0) : (x.v as number));
const isNum = (x: V) => x.k === "i" || x.k === "d" || x.k === "c";

function tokenize(s: string): string[] {
  return s.match(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])'|\d+\.\d+|\d+|[A-Za-z_]\w*|==|!=|<=|>=|&&|\|\||[-+*/%<>!(),.]/g) ?? [];
}
const unq = (t: string) => { try { return JSON.parse(t[0] === "'" ? `"${t.slice(1, -1).replace(/"/g, '\\"')}"` : t) as string; } catch { return t.slice(1, -1); } };

function evalExpr(src: string, env: Map<string, V>): V {
  const t = tokenize(src); let p = 0;
  const peek = () => t[p], next = () => t[p++];
  const expect = (x: string) => { if (next() !== x) throw new Error(`error: '${x}' expected in: ${src.trim()}`); };
  const args = (): V[] => { const a: V[] = []; if (peek() === ")") { next(); return a; } for (;;) { a.push(or()); if (peek() === ",") { next(); continue; } expect(")"); return a; } };
  const method = (v: V, m: string, a: V[]): V => {
    const s = String(v.v);
    switch (m) {
      case "length": return I(s.length);
      case "charAt": return { k: "c", v: s.charAt(num(a[0])) };
      case "toUpperCase": return S(s.toUpperCase());
      case "toLowerCase": return S(s.toLowerCase());
      case "equals": return B(s === String(a[0].v));
      case "isEmpty": return B(s.length === 0);
      case "substring": return S(s.substring(num(a[0]), a[1] ? num(a[1]) : undefined));
      default: throw new Error(`error: cannot find symbol: method ${m}()`);
    }
  };
  const post = (v: V): V => { while (peek() === ".") { next(); const m = next(); expect("("); v = method(v, m, args()); } return v; };
  function prim(): V {
    const x = next();
    if (x === undefined) throw new Error(`error: illegal start of expression: ${src.trim()}`);
    if (x === "(") { const v = or(); expect(")"); return post(v); }
    if (x === "-") { const v = prim(); return { k: v.k === "d" ? "d" : "i", v: -num(v) }; }
    if (x === "!") return B(!prim().v);
    if (x[0] === '"') return post(S(unq(x)));
    if (x[0] === "'") return { k: "c", v: unq(x) };
    if (/^\d+\.\d+$/.test(x)) return D(parseFloat(x));
    if (/^\d+$/.test(x)) return I(parseInt(x, 10));
    if (x === "true" || x === "false") return B(x === "true");
    if (x === "Math") {
      expect("."); const m = next();
      if (m === "PI") return D(Math.PI);
      expect("("); const a = args().map(num);
      switch (m) {
        case "sqrt": return D(Math.sqrt(a[0])); case "pow": return D(Math.pow(a[0], a[1])); case "abs": return D(Math.abs(a[0]));
        case "max": return D(Math.max(a[0], a[1])); case "min": return D(Math.min(a[0], a[1]));
        case "round": return I(Math.round(a[0])); case "floor": return D(Math.floor(a[0])); case "ceil": return D(Math.ceil(a[0]));
        default: throw new Error(`error: cannot find symbol: method Math.${m}()`);
      }
    }
    if (/^[A-Za-z_]/.test(x)) { const v = env.get(x); if (!v) throw new Error(`error: cannot find symbol: variable ${x}`); return post(v); }
    throw new Error(`error: illegal start of expression: ${x}`);
  }
  const bin = (ops: string[], sub: () => V, f: (op: string, a: V, b: V) => V) => () => { let a = sub(); while (ops.includes(peek())) { const op = next(); a = f(op, a, sub()); } return a; };
  const mul = bin(["*", "/", "%"], prim, (op, a, b) => {
    const d = a.k === "d" || b.k === "d"; const x = num(a), y = num(b);
    if (op !== "*" && y === 0 && !d) throw new Error("Exception in thread \"main\" java.lang.ArithmeticException: / by zero");
    const r = op === "*" ? x * y : op === "/" ? (d ? x / y : Math.trunc(x / y)) : x % y;
    return d ? D(r) : I(r);
  });
  const add = bin(["+", "-"], mul, (op, a, b) => {
    if (op === "+" && (a.k === "s" || b.k === "s")) return S(fmt(a) + fmt(b));
    if (!isNum(a) || !isNum(b)) throw new Error("error: bad operand types for binary operator");
    const r = op === "+" ? num(a) + num(b) : num(a) - num(b);
    return a.k === "d" || b.k === "d" ? D(r) : I(r);
  });
  const rel = bin(["<", ">", "<=", ">="], add, (op, a, b) => { const x = num(a), y = num(b); return B(op === "<" ? x < y : op === ">" ? x > y : op === "<=" ? x <= y : x >= y); });
  const eq = bin(["==", "!="], rel, (op, a, b) => { const same = isNum(a) && isNum(b) ? num(a) === num(b) : a.v === b.v; return B(op === "==" ? same : !same); });
  const and = bin(["&&"], eq, (_o, a, b) => B(Boolean(a.v) && Boolean(b.v)));
  const or: () => V = bin(["||"], and, (_o, a, b) => B(Boolean(a.v) || Boolean(b.v)));
  const v = or();
  if (p < t.length) throw new Error(`error: ';' expected near '${t[p]}'`);
  return v;
}

function splitTop(s: string, sep: string): string[] {
  const res: string[] = []; let cur = "", par = 0, inS: string | null = null;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inS) { cur += c; if (c === "\\") cur += s[++i] ?? ""; else if (c === inS) inS = null; continue; }
    if (c === '"' || c === "'") { inS = c; cur += c; continue; }
    if (c === "(") par++; if (c === ")") par--;
    if (c === sep && par === 0) { res.push(cur); cur = ""; } else cur += c;
  }
  res.push(cur);
  return res.map((x) => x.trim());
}

function splitStmts(code: string): string[] {
  const res: string[] = []; let cur = "", par = 0, br = 0, inS: string | null = null;
  for (let i = 0; i < code.length; i++) {
    const c = code[i]; cur += c;
    if (inS) { if (c === "\\") cur += code[++i] ?? ""; else if (c === inS) inS = null; continue; }
    if (c === '"' || c === "'") { inS = c; continue; }
    if (c === "(") par++; else if (c === ")") par--; else if (c === "{") br++;
    else if (c === "}") { br--; if (br === 0 && par === 0) { if (/^else\b/.test(code.slice(i + 1).trimStart())) continue; res.push(cur.trim()); cur = ""; } }
    else if (c === ";" && br === 0 && par === 0) { res.push(cur.trim().slice(0, -1)); cur = ""; }
  }
  if (cur.trim()) res.push(cur.trim());
  return res.filter(Boolean);
}

function readParen(s: string, from: number): [string, number] {
  let d = 0;
  for (let i = from; i < s.length; i++) { if (s[i] === "(") d++; else if (s[i] === ")") { d--; if (d === 0) return [s.slice(from + 1, i), i + 1]; } }
  throw new Error("error: ')' expected");
}
function readBlock(s: string, from: number): [string, number] {
  let i = from; while (s[i] === " " || s[i] === "\n" || s[i] === "\t" || s[i] === "\r") i++;
  if (s[i] !== "{") { const end = s.indexOf(";", i); return end < 0 ? [s.slice(i), s.length] : [s.slice(i, end), end + 1]; }
  let d = 0;
  for (let j = i; j < s.length; j++) { if (s[j] === "{") d++; else if (s[j] === "}") { d--; if (d === 0) return [s.slice(i + 1, j), j + 1]; } }
  throw new Error("error: reached end of file while parsing");
}

const TYPES = "int|long|double|float|boolean|char|String|var";
function coerce(type: string, val: V): V {
  if (type === "int" || type === "long") { if (val.k === "d") throw new Error("error: incompatible types: possible lossy conversion from double to int"); if (val.k === "s") throw new Error("error: incompatible types: String cannot be converted to int"); return { k: "i", v: num(val) }; }
  if (type === "double" || type === "float") { if (!isNum(val)) throw new Error("error: incompatible types: cannot convert to double"); return D(num(val)); }
  if (type === "String") { if (val.k !== "s") throw new Error(`error: incompatible types: cannot be converted to String`); return val; }
  if (type === "boolean") { if (val.k !== "b") throw new Error("error: incompatible types: cannot be converted to boolean"); return val; }
  if (type === "char") return { k: "c", v: String(val.v) };
  return val;
}
const kindName: Record<K, string> = { i: "int", d: "double", s: "String", b: "boolean", c: "char" };

export function runJava(source: string): SimResult {
  const src = source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "").replace(/\s\/\/[^"\n]*$/gm, "");
  let out = "", steps = 0;
  const env = new Map<string, V>();
  const guard = () => { if (++steps > 50000) throw new Error("Execution timed out (possible infinite loop)"); };

  const formatPrintf = (a: string[]): string => {
    const vals = a.map((x) => evalExpr(x, env)); const f = String(vals[0]?.v ?? ""); let n = 1;
    return f.replace(/%(\.\d+)?([dsfn%])/g, (_m, prec: string | undefined, c: string) => {
      if (c === "n") return "\n"; if (c === "%") return "%";
      const v = vals[n++]; if (!v) throw new Error("Exception in thread \"main\" java.util.MissingFormatArgumentException");
      return c === "f" ? num(v).toFixed(prec ? parseInt(prec.slice(1), 10) : 6) : String(v.v);
    });
  };

  const exec = (stmt: string): void => {
    guard();
    const s = stmt.trim(); let m: RegExpExecArray | null;
    if (!s || s === "return") return;
    if ((m = /^System\.out\.(println|print|printf)\s*\(([\s\S]*)\)$/.exec(s))) {
      if (m[1] === "printf") out += formatPrintf(splitTop(m[2], ","));
      else { const text = m[2].trim() ? fmt(evalExpr(m[2], env)) : ""; out += m[1] === "println" ? text + "\n" : text; }
      return;
    }
    if (/^if\b/.test(s)) {
      let rest = s;
      for (;;) {
        rest = rest.trim();
        if (/^if\b/.test(rest)) {
          const [cond, e1] = readParen(rest, rest.indexOf("(")); const [body, e2] = readBlock(rest, e1);
          if (evalExpr(cond, env).v) { run(body); return; }
          rest = rest.slice(e2).trim();
          if (/^else\b/.test(rest)) { rest = rest.replace(/^else\s*/, ""); continue; }
          return;
        }
        run(readBlock(rest, 0)[0]); return;
      }
    }
    if (/^for\b/.test(s)) {
      const [hdr, e] = readParen(s, s.indexOf("(")); const [init, cond, upd] = splitTop(hdr, ";"); const [body] = readBlock(s, e);
      exec(init);
      while (cond.trim() === "" || evalExpr(cond, env).v) { guard(); run(body); exec(upd); }
      return;
    }
    if (/^while\b/.test(s)) {
      const [cond, e] = readParen(s, s.indexOf("(")); const [body] = readBlock(s, e);
      while (evalExpr(cond, env).v) { guard(); run(body); }
      return;
    }
    if ((m = new RegExp(`^(?:final\\s+)?(${TYPES})\\s+([\\s\\S]+)$`).exec(s))) {
      for (const d of splitTop(m[2], ",")) {
        const dm = /^([A-Za-z_]\w*)\s*(?:=\s*([\s\S]+))?$/.exec(d);
        if (!dm) throw new Error(`error: unsupported declaration: ${s}`);
        const val = dm[2] ? evalExpr(dm[2], env) : m[1] === "String" ? S("null") : m[1] === "boolean" ? B(false) : m[1] === "double" || m[1] === "float" ? D(0) : I(0);
        env.set(dm[1], m[1] === "var" ? val : coerce(m[1], val));
      }
      return;
    }
    if ((m = /^([A-Za-z_]\w*)\s*(\+\+|--)$/.exec(s)) || (m = /^(\+\+|--)\s*([A-Za-z_]\w*)$/.exec(s))) {
      const name = /^[A-Za-z_]/.test(m[1]) ? m[1] : m[2]; const op = /^[A-Za-z_]/.test(m[1]) ? m[2] : m[1];
      const cur = env.get(name); if (!cur) throw new Error(`error: cannot find symbol: variable ${name}`);
      env.set(name, { k: cur.k, v: num(cur) + (op === "++" ? 1 : -1) }); return;
    }
    if ((m = /^([A-Za-z_]\w*)\s*(\+=|-=|\*=|\/=|%=|=)\s*([\s\S]+)$/.exec(s))) {
      const cur = env.get(m[1]); if (!cur) throw new Error(`error: cannot find symbol: variable ${m[1]}`);
      const val = m[2] === "=" ? evalExpr(m[3], env) : evalExpr(`${m[1]} ${m[2][0]} (${m[3]})`, env);
      env.set(m[1], cur.k === "s" || cur.k === "b" ? val : coerce(kindName[cur.k], val)); return;
    }
    throw new Error(`error: unsupported statement: ${s.slice(0, 60)}`);
  };
  const run = (code: string) => { for (const st of splitStmts(code)) exec(st); };

  try {
    if ((src.match(/{/g) ?? []).length !== (src.match(/}/g) ?? []).length) return { ok: false, out: "", error: "Main.java: error: reached end of file while parsing (unbalanced braces)" };
    if (!/\bclass\s+\w+/.test(src)) return { ok: false, out: "", error: "Main.java: error: class, interface, enum, or record expected" };
    const mm = /public\s+static\s+void\s+main\s*\(\s*String\s*(\[\s*\]\s*\w+|\w+\s*\[\s*\])\s*\)\s*{/.exec(src);
    if (!mm) return { ok: false, out: "", error: "error: no main method found. Declare: public static void main(String[] args)" };
    const [body] = readBlock(src, mm.index + mm[0].length - 1);
    run(body);
    return { ok: true, out };
  } catch (e) {
    return { ok: false, out, error: e instanceof Error ? e.message : String(e) };
  }
}
