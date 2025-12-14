import { useMemo, useState } from "react";
import { Calculator, ClipboardCopy } from "lucide-react";
import { SEO } from "@/components/SEO";

type Mode = "basic" | "scientific";
type AngleMode = "deg" | "rad";

type Tok =
  | { t: "num"; v: number }
  | { t: "id"; v: string }
  | { t: "op"; v: string }
  | { t: "lpar" }
  | { t: "rpar" }
  | { t: "comma" }
  | { t: "func"; v: string };

function tokenize(input: string): Tok[] {
  const out: Tok[] = [];
  let i = 0;
  while (i < input.length) {
    const ch = input[i];
    if (/\s/.test(ch)) { i++; continue; }
    if (/[0-9.]/.test(ch)) {
      let s = ch; i++;
      while (i < input.length && /[0-9.]/.test(input[i])) { s += input[i]; i++; }
      const v = Number(s);
      if (!isNaN(v)) out.push({ t: "num", v });
      else return [];
      continue;
    }
    if (/[A-Za-z_]/.test(ch)) {
      let s = ch; i++;
      while (i < input.length && /[A-Za-z0-9_]/.test(input[i])) { s += input[i]; i++; }
      out.push({ t: "id", v: s.toLowerCase() });
      continue;
    }
    if (ch === "+" || ch === "-" || ch === "*" || ch === "/" || ch === "^") {
      out.push({ t: "op", v: ch }); i++; continue;
    }
    if (ch === "(") { out.push({ t: "lpar" }); i++; continue; }
    if (ch === ")") { out.push({ t: "rpar" }); i++; continue; }
    if (ch === ",") { out.push({ t: "comma" }); i++; continue; }
    return [];
  }
  return out;
}

type Assoc = "L" | "R";
type OpDef = { prec: number; assoc: Assoc; arity: number; fn: (...args: number[]) => number };

function ops(): Record<string, OpDef> {
  return {
    "+": { prec: 2, assoc: "L", arity: 2, fn: (a, b) => a + b },
    "-": { prec: 2, assoc: "L", arity: 2, fn: (a, b) => a - b },
    "*": { prec: 3, assoc: "L", arity: 2, fn: (a, b) => a * b },
    "/": { prec: 3, assoc: "L", arity: 2, fn: (a, b) => a / b },
    "^": { prec: 4, assoc: "R", arity: 2, fn: (a, b) => Math.pow(a, b) },
    "u+": { prec: 5, assoc: "R", arity: 1, fn: (a) => +a },
    "u-": { prec: 5, assoc: "R", arity: 1, fn: (a) => -a },
  };
}

type FnDef = { arity: number; fn: (...args: number[]) => number };

function functions(angle: AngleMode): Record<string, FnDef> {
  const toRad = (x: number) => angle === "deg" ? x * Math.PI / 180 : x;
  const fromRad = (x: number) => angle === "deg" ? x * 180 / Math.PI : x;
  return {
    sin: { arity: 1, fn: (x) => Math.sin(toRad(x)) },
    cos: { arity: 1, fn: (x) => Math.cos(toRad(x)) },
    tan: { arity: 1, fn: (x) => Math.tan(toRad(x)) },
    asin: { arity: 1, fn: (x) => fromRad(Math.asin(x)) },
    acos: { arity: 1, fn: (x) => fromRad(Math.acos(x)) },
    atan: { arity: 1, fn: (x) => fromRad(Math.atan(x)) },
    ln: { arity: 1, fn: (x) => Math.log(x) },
    log: { arity: 1, fn: (x) => Math.log10(x) },
    sqrt: { arity: 1, fn: (x) => Math.sqrt(x) },
    abs: { arity: 1, fn: (x) => Math.abs(x) },
    floor: { arity: 1, fn: (x) => Math.floor(x) },
    ceil: { arity: 1, fn: (x) => Math.ceil(x) },
    round: { arity: 1, fn: (x) => Math.round(x) },
    pow: { arity: 2, fn: (a, b) => Math.pow(a, b) },
  };
}

function toRpn(tokens: Tok[], angle: AngleMode): Tok[] | null {
  const out: Tok[] = [];
  const st: Tok[] = [];
  const opDefs = ops();
  const fns = functions(angle);
  let prev: Tok | null = null;
  const ts: Tok[] = tokens.map((t) => {
    if (t.t === "op" && (t.v === "+" || t.v === "-")) {
      if (!prev || prev.t === "op" || prev.t === "lpar" || prev.t === "comma") {
        return { t: "op", v: t.v === "+" ? "u+" : "u-" };
      }
    }
    prev = t;
    return t;
  });
  for (let i = 0; i < ts.length; i++) {
    const t = ts[i];
    if (t.t === "num") out.push(t);
    else if (t.t === "id") {
      const next = ts[i + 1];
      if (next && next.t === "lpar" && fns[t.v]) st.push({ t: "func", v: t.v });
      else out.push(t);
    } else if (t.t === "comma") {
      while (st.length && st[st.length - 1].t !== "lpar") out.push(st.pop() as Tok);
      if (!st.length) return null;
    } else if (t.t === "op") {
      const o1 = opDefs[t.v];
      if (!o1) return null;
      while (st.length && st[st.length - 1].t === "op") {
        const o2 = opDefs[(st[st.length - 1] as Tok & { v: string }).v];
        if (!o2) break;
        const cond = (o1.assoc === "L" && o1.prec <= o2.prec) || (o1.assoc === "R" && o1.prec < o2.prec);
        if (cond) out.push(st.pop() as Tok); else break;
      }
      st.push(t);
    } else if (t.t === "lpar") {
      st.push(t);
    } else if (t.t === "rpar") {
      while (st.length && st[st.length - 1].t !== "lpar") out.push(st.pop() as Tok);
      if (!st.length) return null;
      st.pop();
      if (st.length && st[st.length - 1].t === "func") out.push(st.pop() as Tok);
    }
  }
  while (st.length) {
    const x = st.pop() as Tok;
    if (x.t === "lpar" || x.t === "rpar") return null;
    out.push(x);
  }
  return out;
}

function evalRpn(rpn: Tok[], angle: AngleMode): number | null {
  const st: number[] = [];
  const opDefs = ops();
  const fns = functions(angle);
  for (const t of rpn) {
    if (t.t === "num") st.push(t.v);
    else if (t.t === "id") {
      if (t.v === "pi") st.push(Math.PI);
      else if (t.v === "e") st.push(Math.E);
      else return null;
    } else if (t.t === "op") {
      const def = opDefs[t.v];
      if (!def) return null;
      const args: number[] = [];
      for (let i = 0; i < def.arity; i++) {
        const v = st.pop();
        if (v === undefined) return null;
        args.unshift(v);
      }
      st.push(def.fn(...args));
    } else if (t.t === "func") {
      const def = fns[t.v];
      if (!def) return null;
      const args: number[] = [];
      for (let i = 0; i < def.arity; i++) {
        const v = st.pop();
        if (v === undefined) return null;
        args.unshift(v);
      }
      st.push(def.fn(...args));
    }
  }
  if (st.length !== 1) return null;
  return st[0];
}

function formatResult(v: number | null): string {
  if (v === null || !isFinite(v)) return "错误";
  const s = v.toString();
  if (s.length <= 16) return s;
  return v.toExponential(10);
}

export default function CalculatorTool() {
  const [mode, setMode] = useState<Mode>("basic");
  const [angle, setAngle] = useState<AngleMode>("rad");
  const [expr, setExpr] = useState("");
  const [history, setHistory] = useState<Array<{ e: string; r: string }>>([]);

  const tokens = useMemo(() => tokenize(expr), [expr]);
  const rpn = useMemo(() => toRpn(tokens, angle), [tokens, angle]);
  const value = useMemo(() => rpn ? evalRpn(rpn, angle) : null, [rpn, angle]);
  const result = useMemo(() => formatResult(value), [value]);

  function append(s: string) {
    setExpr((prev) => prev + s);
  }

  function clear() {
    setExpr("");
  }

  function backspace() {
    setExpr((prev) => prev.slice(0, -1));
  }

  function commit() {
    if (!expr) return;
    setHistory((h) => [{ e: expr, r: result }, ...h].slice(0, 20));
  }

  function copy(text: string) {
    if (!text) return;
    navigator.clipboard.writeText(text).catch(() => {});
  }

  const basicKeys = [
    ["7", "8", "9", "/"],
    ["4", "5", "6", "*"],
    ["1", "2", "3", "-"],
    ["0", ".", "(", ")"],
    ["+", "C", "⌫", "="],
  ];

  const sciKeys = [
    ["sin", "cos", "tan", "^"],
    ["ln", "log", "sqrt", "pow"],
    ["abs", "floor", "ceil", ","],
    ["pi", "e", "(", ")"],
    ["+", "-", "*", "/"],
  ];

  return (
    <div className="space-y-8">
      <SEO
        title="Calculator Tool"
        description="A powerful calculator supporting basic and scientific operations, functions, and history."
        keywords={["calculator", "scientific calculator", "math tool", "online calculator", "developer tools"]}
      />
      <div className="flex items-center gap-2">
        <div className="inline-flex p-2 rounded-lg bg-lime-100 text-lime-600">
          <Calculator className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-semibold">Calculator</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3 lg:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input className="rounded-md border border-gray-300 px-3 py-2 md:col-span-2 font-mono" placeholder="输入表达式，如 1+2*(3-4)" value={expr} onChange={(e) => setExpr(e.target.value)} />
            <div className="rounded-md border border-gray-300 px-3 py-2 flex items-center justify-between">
              <span className="text-sm text-gray-700">角度</span>
              <select className="rounded-md border border-gray-300 px-2 py-1 text-sm" value={angle} onChange={(e) => setAngle(e.target.value as AngleMode)}>
                <option value="rad">弧度</option>
                <option value="deg">角度</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-md border border-gray-300 px-3 py-2 font-mono text-sm">{result || "—"}</div>
            <button className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md text-sm" onClick={() => copy(result)} disabled={!result}>
              <ClipboardCopy className="h-4 w-4" /> 复制
            </button>
            <div className="flex items-center gap-2">
              <button className={`px-3 py-2 rounded-md text-sm border ${mode === "basic" ? "bg-lime-600 text-white border-lime-600" : "border-gray-300"}`} onClick={() => setMode("basic")}>基础</button>
              <button className={`px-3 py-2 rounded-md text-sm border ${mode === "scientific" ? "bg-lime-600 text-white border-lime-600" : "border-gray-300"}`} onClick={() => setMode("scientific")}>科学</button>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {(mode === "basic" ? basicKeys : sciKeys).flat().map((k, idx) => (
              <button
                key={idx}
                className="px-3 py-2 rounded-md border border-gray-300 hover:bg-gray-100 text-sm"
                onClick={() => {
                  if (k === "C") clear();
                  else if (k === "⌫") backspace();
                  else if (k === "=") commit();
                  else if (k === "pi") append("pi");
                  else if (k === "e") append("e");
                  else if (["sin","cos","tan","asin","acos","atan","ln","log","sqrt","abs","floor","ceil","round","pow"].includes(k)) append(k + "(");
                  else append(k);
                }}
              >
                {k}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="font-medium">历史记录</div>
            <button className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md text-sm" onClick={() => setHistory([])} disabled={!history.length}>
              清空
            </button>
          </div>
          <div className="space-y-2">
            {history.length ? history.map((h, i) => (
              <div key={i} className="rounded-md border border-gray-200 p-2 text-sm">
                <div className="font-mono break-all">{h.e}</div>
                <div className="font-mono text-gray-600 break-all">{h.r}</div>
                <div className="mt-1 flex items-center gap-2">
                  <button className="px-2 py-1 rounded border border-gray-300 text-xs" onClick={() => setExpr(h.e)}>复用</button>
                  <button className="px-2 py-1 rounded border border-gray-300 text-xs" onClick={() => copy(h.r)} disabled={!h.r}>复制结果</button>
                </div>
              </div>
            )) : "—"}
          </div>
        </div>
      </div>
    </div>
  );
}
