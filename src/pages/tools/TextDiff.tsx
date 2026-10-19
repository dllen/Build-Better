import { useMemo, useState } from "react";
import { GitCompare } from "lucide-react";
import * as JsDiff from "diff";
import { SEO } from "@/components/seo";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";

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
    let added = 0,
      removed = 0,
      unchanged = 0;
    for (const p of parts) {
      const len = (p.value || "").length;
      if (p.added) added += len;
      else if (p.removed) removed += len;
      else unchanged += len;
    }
    return { added, removed, unchanged };
  }, [parts]);

  return (
    <EditorSplitLayout
      title={
        <>
          <div className="inline-flex p-2 rounded-lg bg-orange-100 text-orange-600">
            <GitCompare className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-semibold">Text Diff</h1>
          <SEO
            title="Text Diff Tool"
            description="Compare two text files or snippets to find differences by characters, words, or lines."
            keywords={["text diff", "text compare", "diff checker", "developer tools", "online diff"]}
          />
        </>
      }
      toolbar={
        <>
          <label className="text-sm text-gray-700">Algorithm</label>
          <select
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            value={algo}
            onChange={(e) => setAlgo(e.target.value as Algo)}
          >
            <option value="characters">Characters</option>
            <option value="words">Words</option>
            <option value="lines">Lines</option>
          </select>
          <div className="text-xs text-gray-500">
            added: {stats.added}, removed: {stats.removed}, unchanged: {stats.unchanged}
          </div>
        </>
      }
      inputLabel="Original"
      input={
        <textarea
          className="h-full w-full resize-none px-3 py-2 font-mono text-sm focus:outline-none"
          value={left}
          onChange={(e) => setLeft(e.target.value)}
        />
      }
      outputLabel="Modified"
      output={
        <textarea
          className="h-full w-full resize-none px-3 py-2 font-mono text-sm focus:outline-none"
          value={right}
          onChange={(e) => setRight(e.target.value)}
        />
      }
      footer={
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="font-medium mb-2">Diff</div>
          <div className="font-mono whitespace-pre-wrap break-words">
            {parts.map((p, i) =>
              p.added ? (
                <span key={i} className="bg-green-200 text-green-900">
                  {p.value}
                </span>
              ) : p.removed ? (
                <span key={i} className="bg-red-200 text-red-900 line-through">
                  {p.value}
                </span>
              ) : (
                <span key={i}>{p.value}</span>
              )
            )}
          </div>
        </div>
      }
    />
  );
}