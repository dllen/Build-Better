import { useMemo, useState } from "react";
import { Shield, ClipboardCopy, Check } from "lucide-react";

type Tri = { r: boolean; w: boolean; x: boolean };
type Special = { suid: boolean; sgid: boolean; sticky: boolean };

function triToOctal(t: Tri) {
  return (t.r ? 4 : 0) + (t.w ? 2 : 0) + (t.x ? 1 : 0);
}

function specialToOctal(s: Special) {
  return (s.suid ? 4 : 0) + (s.sgid ? 2 : 0) + (s.sticky ? 1 : 0);
}

function buildPermString(u: Tri, g: Tri, o: Tri, s: Special) {
  const su = u.x && s.suid ? "s" : u.x ? "x" : s.suid ? "S" : "-";
  const sg = g.x && s.sgid ? "s" : g.x ? "x" : s.sgid ? "S" : "-";
  const st = o.x && s.sticky ? "t" : o.x ? "x" : s.sticky ? "T" : "-";
  const uStr = `${u.r ? "r" : "-"}${u.w ? "w" : "-"}${su}`;
  const gStr = `${g.r ? "r" : "-"}${g.w ? "w" : "-"}${sg}`;
  const oStr = `${o.r ? "r" : "-"}${o.w ? "w" : "-"}${st}`;
  return `-${uStr}${gStr}${oStr}`;
}

function parseInput(input: string) {
  const s = input.trim();
  if (!s) return null;
  const tri = (v: number): Tri => ({ r: !!(v & 4), w: !!(v & 2), x: !!(v & 1) });
  if (/^[0-9]{3,4}$/.test(s)) {
    const digits = s.split("").map((d) => parseInt(d, 10));
    let spec = { suid: false, sgid: false, sticky: false };
    let u = { r: false, w: false, x: false }, g = { r: false, w: false, x: false }, o = { r: false, w: false, x: false };
    if (digits.length === 4) {
      const sp = digits[0];
      spec = { suid: !!(sp & 4), sgid: !!(sp & 2), sticky: !!(sp & 1) };
      u = tri(digits[1]); g = tri(digits[2]); o = tri(digits[3]);
    } else {
      u = tri(digits[0]); g = tri(digits[1]); o = tri(digits[2]);
    }
    return { u, g, o, spec };
  }
  const u: Tri = { r: false, w: false, x: false };
  const g: Tri = { r: false, w: false, x: false };
  const o: Tri = { r: false, w: false, x: false };
  const spec: Special = { suid: false, sgid: false, sticky: false };
  const parts = s.split(/[,\s]+/).filter(Boolean);
  for (const p of parts) {
    const m = p.match(/^([ugoas]+)([+=-])([rwxst]+)$/);
    if (!m) continue;
    const who = m[1]; const op = m[2]; const perms = m[3];
    const apply = (t: Tri, perm: string, val: boolean) => {
      if (perm === "r") t.r = val;
      if (perm === "w") t.w = val;
      if (perm === "x") t.x = val;
    };
    const setSpecial = (perm: string, val: boolean) => {
      if (perm === "s") { spec.suid = val; spec.sgid = val || spec.sgid; }
      if (perm === "t") spec.sticky = val;
    };
    const targets: Tri[] = [];
    if (who.includes("u")) targets.push(u);
    if (who.includes("g")) targets.push(g);
    if (who.includes("o")) targets.push(o);
    if (who.includes("a")) { targets.push(u, g, o); }
    const add = op === "+"; const remove = op === "-"; const assign = op === "=";
    for (const ch of perms.split("")) {
      if (ch === "s" || ch === "t") {
        setSpecial(ch, add || assign);
        continue;
      }
      for (const t of targets) {
        if (assign) {
          t.r = false; t.w = false; t.x = false;
        }
        apply(t, ch, add || assign);
        if (remove) apply(t, ch, false);
      }
    }
  }
  return { u, g, o, spec };
}

export default function ChmodCalculator() {
  const [u, setU] = useState<Tri>({ r: true, w: true, x: true });
  const [g, setG] = useState<Tri>({ r: true, w: false, x: true });
  const [o, setO] = useState<Tri>({ r: true, w: false, x: true });
  const [spec, setSpec] = useState<Special>({ suid: false, sgid: false, sticky: false });
  const [input, setInput] = useState("");
  const [copied, setCopied] = useState("");

  const octal = useMemo(() => {
    const s = specialToOctal(spec);
    const uo = triToOctal(u), go = triToOctal(g), oo = triToOctal(o);
    return s ? `${s}${uo}${go}${oo}` : `${uo}${go}${oo}`;
  }, [u, g, o, spec]);

  const permStr = useMemo(() => buildPermString(u, g, o, spec), [u, g, o, spec]);

  const symbolic = useMemo(() => {
    const seg = (who: string, t: Tri) => `${who}=${t.r ? "r" : ""}${t.w ? "w" : ""}${t.x ? "x" : ""}`.replace(/=$/, "=none");
    const parts = [seg("u", u), seg("g", g), seg("o", o)];
    if (spec.suid || spec.sgid) parts.push("ug+s");
    if (spec.sticky) parts.push("o+t");
    return parts.join(", ");
  }, [u, g, o, spec]);

  const chmodCmd = useMemo(() => `chmod ${octal} file`, [octal]);

  function applyInput() {
    const parsed = parseInput(input);
    if (!parsed) return;
    setU(parsed.u); setG(parsed.g); setO(parsed.o); setSpec(parsed.spec);
  }

  function copy(text: string) {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopied("ok");
      setTimeout(() => setCopied(""), 1000);
    }).catch(() => {});
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2">
        <div className="inline-flex p-2 rounded-lg bg-emerald-100 text-emerald-600">
          <Shield className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-semibold">Chmod 计算器</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
          <div className="font-medium">用户（Owner）</div>
          <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={u.r} onChange={(e) => setU({ ...u, r: e.target.checked })} /> 读 r</label>
          <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={u.w} onChange={(e) => setU({ ...u, w: e.target.checked })} /> 写 w</label>
          <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={u.x} onChange={(e) => setU({ ...u, x: e.target.checked })} /> 执行 x</label>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
          <div className="font-medium">用户组（Group）</div>
          <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={g.r} onChange={(e) => setG({ ...g, r: e.target.checked })} /> 读 r</label>
          <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={g.w} onChange={(e) => setG({ ...g, w: e.target.checked })} /> 写 w</label>
          <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={g.x} onChange={(e) => setG({ ...g, x: e.target.checked })} /> 执行 x</label>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
          <div className="font-medium">其他（Others）</div>
          <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={o.r} onChange={(e) => setO({ ...o, r: e.target.checked })} /> 读 r</label>
          <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={o.w} onChange={(e) => setO({ ...o, w: e.target.checked })} /> 写 w</label>
          <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={o.x} onChange={(e) => setO({ ...o, x: e.target.checked })} /> 执行 x</label>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
          <div className="font-medium">特殊位（Special bits）</div>
          <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={spec.suid} onChange={(e) => setSpec({ ...spec, suid: e.target.checked })} /> setuid</label>
          <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={spec.sgid} onChange={(e) => setSpec({ ...spec, sgid: e.target.checked })} /> setgid</label>
          <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={spec.sticky} onChange={(e) => setSpec({ ...spec, sticky: e.target.checked })} /> sticky</label>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
          <div className="font-medium">结果</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded-md border border-gray-200 px-3 py-2 font-mono">八进制: {octal}</div>
            <div className="rounded-md border border-gray-200 px-3 py-2 font-mono">权限串: {permStr}</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 rounded-md border border-gray-200 px-3 py-2 font-mono text-sm break-words">{chmodCmd}</div>
            <button className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md text-sm" onClick={() => copy(chmodCmd)}>
              <ClipboardCopy className="h-4 w-4" /> 复制 {copied ? <Check className="h-4 w-4 text-green-600" /> : null}
            </button>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
          <div className="font-medium">从输入解析</div>
          <input className="w-full rounded-md border border-gray-300 px-3 py-2" placeholder="如 755 或 u=rwx,g=rx,o=rx 或 a+rx" value={input} onChange={(e) => setInput(e.target.value)} />
          <button className="inline-flex items-center gap-2 px-3 py-2 bg-emerald-600 text-white rounded-md text-sm hover:bg-emerald-700 disabled:opacity-50" onClick={applyInput} disabled={!input.trim()}>
            解析并应用
          </button>
          <div className="text-sm text-gray-600">当前符号模式: {symbolic}</div>
        </div>
      </div>
    </div>
  );
}
