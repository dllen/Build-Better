import { useState } from "react";
import { Lock, ClipboardCopy, Check } from "lucide-react";
import * as bcrypt from "bcryptjs";

export default function BcryptTool() {
  const [text, setText] = useState("");
  const [rounds, setRounds] = useState(10);
  const [hashOut, setHashOut] = useState("");
  const [hashing, setHashing] = useState(false);
  const [copied, setCopied] = useState("");

  const [cmpText, setCmpText] = useState("");
  const [cmpHash, setCmpHash] = useState("");
  const [cmpRunning, setCmpRunning] = useState(false);
  const [cmpResult, setCmpResult] = useState<null | boolean>(null);

  async function doHash() {
    if (!text) return;
    setHashing(true);
    try {
      const hash = await bcrypt.hash(text, rounds);
      setHashOut(hash);
      setCmpHash((prev) => prev || hash);
    } finally {
      setHashing(false);
    }
  }

  async function doCompare() {
    if (!cmpText || !cmpHash) return;
    setCmpRunning(true);
    try {
      const ok = await bcrypt.compare(cmpText, cmpHash);
      setCmpResult(ok);
    } finally {
      setCmpRunning(false);
    }
  }

  function copy(textToCopy: string) {
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied("ok");
      setTimeout(() => setCopied(""), 1000);
    }).catch(() => {});
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2">
        <div className="inline-flex p-2 rounded-lg bg-gray-100 text-gray-700">
          <Lock className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-semibold">Bcrypt 哈希与比较</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
          <div className="font-medium">哈希生成</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input className="rounded-md border border-gray-300 px-3 py-2 md:col-span-2" placeholder="输入明文字符串" value={text} onChange={(e) => setText(e.target.value)} />
            <input type="number" min={4} max={15} className="rounded-md border border-gray-300 px-3 py-2" value={rounds} onChange={(e) => setRounds(Number(e.target.value))} />
          </div>
          <button
            className="inline-flex items-center gap-2 px-3 py-2 bg-gray-700 text-white rounded-md text-sm hover:bg-gray-800 disabled:opacity-50"
            onClick={doHash}
            disabled={!text || hashing}
          >
            生成哈希
          </button>
          <div className="flex items-center gap-2">
            <div className="flex-1 rounded-md border border-gray-200 px-3 py-2 font-mono text-sm break-all">{hashOut || "—"}</div>
            <button className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md text-sm" onClick={() => copy(hashOut)} disabled={!hashOut}>
              <ClipboardCopy className="h-4 w-4" /> 复制 {copied ? <Check className="h-4 w-4 text-green-600" /> : null}
            </button>
          </div>
          <div className="text-xs text-gray-600">
            轮次（cost）越高越安全但越慢。推荐 10-12。
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
          <div className="font-medium">哈希比较</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input className="rounded-md border border-gray-300 px-3 py-2" placeholder="输入明文待比较" value={cmpText} onChange={(e) => setCmpText(e.target.value)} />
            <input className="rounded-md border border-gray-300 px-3 py-2" placeholder="输入bcrypt哈希" value={cmpHash} onChange={(e) => setCmpHash(e.target.value)} />
          </div>
          <button
            className="inline-flex items-center gap-2 px-3 py-2 bg-gray-700 text-white rounded-md text-sm hover:bg-gray-800 disabled:opacity-50"
            onClick={doCompare}
            disabled={!cmpText || !cmpHash || cmpRunning}
          >
            比较
          </button>
          <div className={`rounded-md border px-3 py-2 text-sm ${cmpResult === null ? "border-gray-200" : cmpResult ? "border-green-200 bg-green-50 text-green-700" : "border-red-200 bg-red-50 text-red-700"}`}>
            {cmpResult === null ? "—" : (cmpResult ? "匹配" : "不匹配")}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 p-4 space-y-2 bg-white">
        <div className="font-medium">说明</div>
        <div className="text-sm text-gray-700">
          Bcrypt 基于 Blowfish 密码，包含自适应成本参数（轮次）。本工具在浏览器中使用 bcryptjs 实现。
        </div>
      </div>
    </div>
  );
}

