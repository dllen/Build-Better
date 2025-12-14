import { useMemo, useState } from "react";
import { GitCompare } from "lucide-react";
import * as JsDiff from "diff";
import { SEO } from "@/components/SEO";

type Algo = "characters" | "words" | "lines";

export default function TextDiff() {
  const [left, setLeft] = useState("Hello world\nThis is a test.");
  const [right, setRight] = useState("Hello world!\nThis is an exam.");
  const [algo, setAlgo] = useState<Algo>("words");

  const parts = useMemo(() => {
    switch (algo) {
      case "characters":
        return JsDiff.diffChars(left, right);
      case "lines":
        return JsDiff.diffLines(left, right);
      case "words":
      default:
        return JsDiff.diffWords(left, right);
    }
  }, [left, right, algo]);

  const stats = useMemo(() => {
    let added = 0, removed = 0, unchanged = 0;
    for (const p of parts) {
      const len = (p.value || "").length;
      if (p.added) added += len; else if (p.removed) removed += len; else unchanged += len;
    }
    return { added, removed, unchanged };
  }, [parts]);

  return (
    <div className="space-y-6">
      <SEO
        title="Text Diff Tool"
        description="Compare two text files or snippets to find differences by characters, words, or lines."
        keywords={["text diff", "text compare", "diff checker", "developer tools", "online diff"]}
      />
      <div className="flex items-center gap-2">
        <div className="inline-flex p-2 rounded-lg bg-orange-100 text-orange-600">
          <GitCompare className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-semibold">Text Diff</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Original</label>
          <textarea className="w-full h-56 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 font-mono" value={left} onChange={(e) => setLeft(e.target.value)} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Modified</label>
          <textarea className="w-full h-56 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 font-mono" value={right} onChange={(e) => setRight(e.target.value)} />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <label className="text-sm text-gray-700">Algorithm</label>
        <select
          className="rounded-md border border-gray-300 px-3 py-2"
          value={algo}
          onChange={(e) => setAlgo(e.target.value as Algo)}
        >
          <option value="characters">Characters</option>
          <option value="words">Words</option>
          <option value="lines">Lines</option>
        </select>
        <div className="text-xs text-gray-500">added: {stats.added}, removed: {stats.removed}, unchanged: {stats.unchanged}</div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="font-medium mb-2">Diff</div>
        <div className="font-mono whitespace-pre-wrap break-words">
          {parts.map((p, i) => (
            p.added ? (
              <span key={i} className="bg-green-200 text-green-900">{p.value}</span>
            ) : p.removed ? (
              <span key={i} className="bg-red-200 text-red-900 line-through">{p.value}</span>
            ) : (
              <span key={i}>{p.value}</span>
            )
          ))}
        </div>
      </div>
    </div>
  );
}

