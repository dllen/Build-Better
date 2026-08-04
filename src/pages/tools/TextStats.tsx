import { useMemo, useState } from "react";
import { FileText, ClipboardCopy, Check } from "lucide-react";

type Stats = {
  characters: number;
  charactersNoWs: number;
  words: number;
  lines: number;
  paragraphs: number;
  bytesUtf8: number;
  uniqueChars: number;
  avgWordLen: number;
  longestWord: string;
  shortestWord: string;
  readingTimeMin: number;
};

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'he',
  'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the', 'to', 'was', 'were', 'will', 'with'
]);

export default function TextStats() {
  const [text, setText] = useState(
    "Hello world!\n这是一个测试文本，用于统计。\n\nCount words, lines, bytes, and more."
  );
  const [copied, setCopied] = useState("");
  const [ignoreStopWords, setIgnoreStopWords] = useState(true);

  const words = useMemo(() => {
    const trimmed = text.trim();
    if (!trimmed) return [];
    return trimmed.split(/[\s,.!?;:"'(){}\[\]<>]+/ ).filter(Boolean);
  }, [text]);

  const lines = useMemo(() => {
    if (!text) return 0;
    return text.split(/\r?\n/).length;
  }, [text]);

  const paragraphs = useMemo(() => {
    const arr = text
      .trim()
      .split(/\r?\n\s*\r?\n/)
      .filter((p) => p.trim().length > 0);
    return text.trim() ? arr.length : 0;
  }, [text]);

  const bytesUtf8 = useMemo(() => new TextEncoder().encode(text).length, [text]);

  const charactersNoWs = useMemo(() => {
    const m = text.match(/\S/g);
    return m ? m.length : 0;
  }, [text]);

  const freqTopChars = useMemo(() => {
    const map = new Map<string, number>();
    for (const ch of text) {
      if (!ch.trim()) continue;
      map.set(ch, (map.get(ch) || 0) + 1);
    }
    const arr = Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    return arr;
  }, [text]);

  const freqTopWords = useMemo(() => {
    const map = new Map<string, number>();
    for (const w of words) {
      const lower = w.toLowerCase();
      if (ignoreStopWords && STOP_WORDS.has(lower)) continue;
      if (lower.length < 2) continue; // Ignore single chars usually
      map.set(lower, (map.get(lower) || 0) + 1);
    }
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  }, [words, ignoreStopWords]);

  const stats: Stats = useMemo(() => {
    const characters = text.length;
    const wordsCount = words.length;
    const uniqueChars = new Set([...text]).size;
    const avgWordLen = wordsCount ? words.reduce((sum, w) => sum + w.length, 0) / wordsCount : 0;
    const longestWord = words.reduce((m, w) => (w.length > m.length ? w : m), "");
    const shortestWord = words.reduce((m, w) => (m === "" || w.length < m.length ? w : m), "");
    const readingTimeMin = wordsCount ? Math.max(0.1, Math.round((wordsCount / 200) * 10) / 10) : 0;
    return {
      characters,
      charactersNoWs,
      words: wordsCount,
      lines,
      paragraphs,
      bytesUtf8,
      uniqueChars,
      avgWordLen: Math.round(avgWordLen * 100) / 100,
      longestWord,
      shortestWord,
      readingTimeMin,
    };
  }, [text, words, lines, paragraphs, bytesUtf8, charactersNoWs]);

  function copy(textToCopy: string) {
    if (!textToCopy) return;
    navigator.clipboard
      .writeText(textToCopy)
      .then(() => {
        setCopied("ok");
        setTimeout(() => setCopied(""), 1000);
      })
      .catch(() => {});
  }

  const statsText = useMemo(() => {
    return [
      `characters: ${stats.characters}`,
      `characters_no_whitespace: ${stats.charactersNoWs}`,
      `words: ${stats.words}`,
      `lines: ${stats.lines}`,
      `paragraphs: ${stats.paragraphs}`,
      `bytes_utf8: ${stats.bytesUtf8}`,
      `unique_chars: ${stats.uniqueChars}`,
      `avg_word_length: ${stats.avgWordLen}`,
      `longest_word: ${stats.longestWord || "—"}`,
      `shortest_word: ${stats.shortestWord || "—"}`,
      `reading_time_min: ${stats.readingTimeMin}`,
    ].join("\n");
  }, [stats]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <div className="inline-flex p-2 rounded-lg bg-indigo-100 text-indigo-600">
          <FileText className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-semibold">Text Statistics</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Input Text</label>
          <textarea
            className="w-full h-96 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 font-mono text-sm resize-none"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
            <div className="font-medium">Summary</div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-2 bg-gray-50 rounded border border-gray-100">
                <div className="text-gray-500 text-xs uppercase">Characters</div>
                <div className="font-mono font-medium text-lg">{stats.characters}</div>
              </div>
              <div className="p-2 bg-gray-50 rounded border border-gray-100">
                <div className="text-gray-500 text-xs uppercase">Words</div>
                <div className="font-mono font-medium text-lg">{stats.words}</div>
              </div>
              <div className="p-2 bg-gray-50 rounded border border-gray-100">
                <div className="text-gray-500 text-xs uppercase">Lines</div>
                <div className="font-mono font-medium text-lg">{stats.lines}</div>
              </div>
              <div className="p-2 bg-gray-50 rounded border border-gray-100">
                <div className="text-gray-500 text-xs uppercase">Paragraphs</div>
                <div className="font-mono font-medium text-lg">{stats.paragraphs}</div>
              </div>
            </div>
            
            <div className="text-sm space-y-1 pt-2 border-t border-gray-100">
              <div className="flex justify-between"><span>No Whitespace:</span> <span className="font-mono">{stats.charactersNoWs}</span></div>
              <div className="flex justify-between"><span>Bytes (UTF-8):</span> <span className="font-mono">{stats.bytesUtf8}</span></div>
              <div className="flex justify-between"><span>Reading Time:</span> <span className="font-mono">~{stats.readingTimeMin} min</span></div>
            </div>

            <button
              className="w-full mt-2 inline-flex justify-center items-center gap-2 px-3 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
              onClick={() => copy(statsText)}
            >
              <ClipboardCopy className="h-4 w-4" /> Copy Report{" "}
              {copied ? <Check className="h-4 w-4 text-green-600" /> : null}
            </button>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
            <div className="flex justify-between items-center">
              <div className="font-medium">Top Words</div>
              <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={ignoreStopWords}
                  onChange={e => setIgnoreStopWords(e.target.checked)}
                  className="rounded text-indigo-600"
                />
                Ignore Stop Words
              </label>
            </div>
            <div className="flex flex-wrap gap-2">
              {freqTopWords.map(([word, count]) => (
                <div key={word} className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded text-xs flex gap-1 items-center">
                  <span className="font-medium">{word}</span>
                  <span className="opacity-60 text-[10px]">{count}</span>
                </div>
              ))}
              {freqTopWords.length === 0 && <span className="text-gray-400 text-sm">No words found</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
