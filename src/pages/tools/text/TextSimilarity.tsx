import React, { useState, useEffect } from 'react';
import { GitCompare, Copy, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import * as Diff from 'diff';

export default function TextSimilarity() {
  const { t } = useTranslation();
  const [text1, setText1] = useState('');
  const [text2, setText2] = useState('');
  const [similarity, setSimilarity] = useState(0);
  
  useEffect(() => {
    if (!text1 && !text2) {
      setSimilarity(100);
      return;
    }
    if (!text1 || !text2) {
      setSimilarity(0);
      return;
    }

    const diffs = Diff.diffChars(text1, text2);
    let common = 0;
    diffs.forEach(part => {
      if (!part.added && !part.removed) {
        common += part.value.length;
      }
    });

    // Simple similarity: 2 * common / (len1 + len2)
    // Or Levenshtein based. DiffChars essentially gives us enough to calc edit distance.
    // Edit distance = additions + removals
    // Similarity = 1 - (edit distance / max len)
    // Using common chars ratio for simplicity and speed here which works well for text comparison
    const totalLen = text1.length + text2.length;
    const ratio = (2 * common) / totalLen;
    setSimilarity(Math.round(ratio * 100));

  }, [text1, text2]);

  const diffs = React.useMemo(() => {
    if (!text1 || !text2) return [];
    return Diff.diffChars(text1, text2);
  }, [text1, text2]);

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <div className="p-2 bg-cyan-100 text-cyan-600 rounded-lg">
          <GitCompare size={24} />
        </div>
        <h1 className="text-2xl font-bold">Text Similarity Detector</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-700">Similarity Score</h2>
          <div className={`text-2xl font-bold ${similarity > 80 ? 'text-green-600' : similarity > 50 ? 'text-yellow-600' : 'text-red-600'}`}>
            {similarity}%
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6">
          <div 
            className={`h-2.5 rounded-full ${similarity > 80 ? 'bg-green-600' : similarity > 50 ? 'bg-yellow-600' : 'bg-red-600'}`} 
            style={{ width: `${similarity}%` }}
          ></div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Text A</label>
            <textarea
              value={text1}
              onChange={(e) => setText1(e.target.value)}
              placeholder="Enter original text..."
              className="w-full h-40 p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none font-mono text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Text B</label>
            <textarea
              value={text2}
              onChange={(e) => setText2(e.target.value)}
              placeholder="Enter comparison text..."
              className="w-full h-40 p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none font-mono text-sm"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Comparison View</label>
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 font-mono text-sm whitespace-pre-wrap break-words min-h-[100px]">
            {diffs.map((part, i) => {
              const color = part.added ? 'bg-green-200 text-green-800' : part.removed ? 'bg-red-200 text-red-800 line-through decoration-red-500' : 'text-gray-700';
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
              <span className="w-3 h-3 bg-red-200 inline-block rounded"></span> Removed from A
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 bg-green-200 inline-block rounded"></span> Added in B
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
