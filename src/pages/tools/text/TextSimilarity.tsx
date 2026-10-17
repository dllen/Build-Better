import React, { useState, useEffect } from "react";
import { GitCompare } from "lucide-react";
import * as Diff from "diff";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";

export default function TextSimilarity() {
  const [text1, setText1] = useState("");
  const [text2, setText2] = useState("");
  const [similarity, setSimilarity] = useState(0);

  useEffect(() => {
    if (!text1 && !text2) { setSimilarity(100); return; }
    if (!text1 || !text2) { setSimilarity(0); return; }

    const diffs = Diff.diffChars(text1, text2);
    let common = 0;
    diffs.forEach((part) => {
      if (!part.added && !part.removed) {
        common += part.value.length;
      }
    });

    const totalLen = text1.length + text2.length;
    const ratio = (2 * common) / totalLen;
    setSimilarity(Math.round(ratio * 100));
  }, [text1, text2]);

  const diffs = React.useMemo(() => {
    if (!text1 || !text2) return [];
    return Diff.diffChars(text1, text2);
  }, [text1, text2]);

  return (
    <EditorSplitLayout
      title={
        <>
          <div className="p-2 bg-cyan-100 text-cyan-600 rounded-lg">
            <GitCompare className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-bold">Text Similarity Detector</h1>
        </>
      }
      toolbar={
        <div className="flex items-center gap-4">
          <span className="font-semibold text-gray-700">Similarity:</span>
          <div className="flex-1 max-w-xs bg-gray-200 rounded-full h-2.5">
            <div
              className={`h-2.5 rounded-full ${similarity > 80 ? "bg-green-600" : similarity > 50 ? "bg-yellow-600" : "bg-red-600"}`}
              style={{ width: `${similarity}%` }}
            />
          </div>
          <span className={`text-lg font-bold ${similarity > 80 ? "text-green-600" : similarity > 50 ? "text-yellow-600" : "text-red-600"}`}>
            {similarity}%
          </span>
        </div>
      }
      inputLabel="Text A"
      input={
        <textarea
          value={text1}
          onChange={(e) => setText1(e.target.value)}
          placeholder="Enter original text..."
          className="h-full w-full resize-none px-3 py-2 font-mono text-sm focus:outline-none"
        />
      }
      outputLabel="Text B"
      output={
        <textarea
          value={text2}
          onChange={(e) => setText2(e.target.value)}
          placeholder="Enter comparison text..."
          className="h-full w-full resize-none px-3 py-2 font-mono text-sm focus:outline-none"
        />
      }
      footer={
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="font-medium mb-2">Comparison View</div>
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 font-mono text-sm whitespace-pre-wrap break-words min-h-[100px]">
            {diffs.map((part, i) => {
              const color = part.added
                ? "bg-green-200 text-green-800"
                : part.removed
                  ? "bg-red-200 text-red-800 line-through decoration-red-500"
                  : "text-gray-700";
              return (
                <span key={i} className={color}>
                  {part.value}
                </span>
              );
            })}
            {diffs.length === 0 && <span className="text-gray-400 italic">Enter text in both fields to compare</span>}
          </div>
          <div className="flex gap-4 text-xs text-gray-500 mt-2">
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 bg-red-200 inline-block rounded" /> Removed from A
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 bg-green-200 inline-block rounded" /> Added in B
            </div>
          </div>
        </div>
      }
    />
  );
}