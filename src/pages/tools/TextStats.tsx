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

export default function TextStats() {
  const [text, setText] = useState("Hello world!\n这是一个测试文本，用于统计。\n\nCount words, lines, bytes, and more.");
  const [copied, setCopied] = useState("");

  const words = useMemo(() => {
    const trimmed = text.trim();
    if (!trimmed) return [];
    return trimmed.split(/\s+/).filter(Boolean);
  }, [text]);

  const lines = useMemo(() => {
    if (!text) return 0;
    return text.split(/\r?\n/).length;
  }, [text]);

  const paragraphs = useMemo(() => {
    const arr = text.trim().split(/\r?\n\s*\r?\n/).filter((p) => p.trim().length > 0);
    return text.trim() ? arr.length : 0;
  }, [text]);

  const bytesUtf8 = useMemo(() => new TextEncoder().encode(text).length, [text]);

  const charactersNoWs = useMemo(() => {
    const m = text.match(/\S/g);
    return m ? m.length : 0;
  }, [text]);

  const freqTop = useMemo(() => {
    const map = new Map<string, number>();
    for (const ch of text) {
      if (!ch.trim()) continue;
      map.set(ch, (map.get(ch) || 0) + 1);
    }
    const arr = Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10);
    return arr;
  }, [text]);

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
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied("ok");
      setTimeout(() => setCopied(""), 1000);
    }).catch(() => {});
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
        <h1 className="text-2xl font-semibold">文本统计</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">输入文本</label>
          <textarea
            className="w-full h-56 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 font-mono"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
          <div className="font-medium">统计信息</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="rounded-md border border-gray-200 px-3 py-2">字符数: {stats.characters}</div>
            <div className="rounded-md border border-gray-200 px-3 py-2">非空白字符: {stats.charactersNoWs}</div>
            <div className="rounded-md border border-gray-200 px-3 py-2">字数: {stats.words}</div>
            <div className="rounded-md border border-gray-200 px-3 py-2">行数: {stats.lines}</div>
            <div className="rounded-md border border-gray-200 px-3 py-2">段落数: {stats.paragraphs}</div>
            <div className="rounded-md border border-gray-200 px-3 py-2">UTF-8字节: {stats.bytesUtf8}</div>
            <div className="rounded-md border border-gray-200 px-3 py-2">唯一字符: {stats.uniqueChars}</div>
            <div className="rounded-md border border-gray-200 px-3 py-2">平均字长: {stats.avgWordLen}</div>
            <div className="rounded-md border border-gray-200 px-3 py-2">最长单词: {stats.longestWord || "—"}</div>
            <div className="rounded-md border border-gray-200 px-3 py-2">最短单词: {stats.shortestWord || "—"}</div>
            <div className="rounded-md border border-gray-200 px-3 py-2">阅读时长(分钟): {stats.readingTimeMin}</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 rounded-md border border-gray-200 px-3 py-2 font-mono text-sm break-words whitespace-pre-wrap">{statsText}</div>
            <button className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md text-sm" onClick={() => copy(statsText)}>
              <ClipboardCopy className="h-4 w-4" /> 复制 {copied ? <Check className="h-4 w-4 text-green-600" /> : null}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
        <div className="font-medium">字符频率 Top 10（忽略空白）</div>
        {freqTop.length === 0 ? (
          <div className="text-sm text-gray-600">无</div>
        ) : (
          <div className="rounded-md border border-gray-200 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-3 py-2 font-medium text-gray-700">字符</th>
                  <th className="text-left px-3 py-2 font-medium text-gray-700">次数</th>
                </tr>
              </thead>
              <tbody>
                {freqTop.map(([ch, cnt], i) => (
                  <tr key={i} className="border-t">
                    <td className="px-3 py-2 font-mono">{ch === " " ? "space" : ch}</td>
                    <td className="px-3 py-2">{cnt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
