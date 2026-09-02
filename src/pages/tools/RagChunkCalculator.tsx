import { useState } from "react";
import { Layers, Calculator, Trash2, Info } from "lucide-react";

type ChunkBy = "tokens" | "characters";

export default function RagChunkCalculator() {
  const [totalChars, setTotalChars] = useState("");
  const [chunkSize, setChunkSize] = useState("");
  const [overlap, setOverlap] = useState("0");
  const [ratio, setRatio] = useState("0.25");
  const [chunkBy, setChunkBy] = useState<ChunkBy>("tokens");
  const [result, setResult] = useState<{
    totalTokens: number;
    numChunks: number;
    totalOverlap: number;
    avgTokensPerChunk: number;
    previewBoundaries: number[];
  } | null>(null);

  function calculate() {
    const total = parseFloat(totalChars);
    const size = parseFloat(chunkSize);
    const ov = parseFloat(overlap) || 0;
    const r = parseFloat(ratio) || 0.25;

    if (!total || !size || total <= 0 || size <= 0) return;

    const totalTokens = total * r;
    const effectiveChunkSize = chunkBy === "tokens" ? size : size * r;
    const effectiveOverlap = chunkBy === "tokens" ? ov : ov * r;

    const numChunks =
      effectiveOverlap >= effectiveChunkSize
        ? 0
        : Math.ceil((totalTokens - effectiveOverlap) / (effectiveChunkSize - effectiveOverlap));

    const finalChunks = numChunks > 0 ? numChunks : 1;
    const totalOverlapTokens = effectiveOverlap * Math.max(0, finalChunks - 1);
    const avgTokensPerChunk = totalTokens / finalChunks;

    // Generate preview boundary markers
    const previewBoundaries: number[] = [];
    if (finalChunks > 1) {
      for (let i = 1; i < finalChunks; i++) {
        const position = Math.round((i / finalChunks) * 100);
        previewBoundaries.push(position);
      }
    }

    setResult({
      totalTokens,
      numChunks: finalChunks,
      totalOverlap: totalOverlapTokens,
      avgTokensPerChunk,
      previewBoundaries,
    });
  }

  function clear() {
    setTotalChars("");
    setChunkSize("");
    setOverlap("0");
    setRatio("0.25");
    setResult(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <div className="inline-flex p-2 rounded-lg bg-indigo-100 text-indigo-600">
          <Layers className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-semibold">RAG 分块计算器</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">文档总字符数</label>
            <input
              type="number"
              value={totalChars}
              onChange={(e) => setTotalChars(e.target.value)}
              placeholder="例如：10000"
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              min="1"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">分块方式</label>
            <div className="flex gap-4">
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="chunkBy"
                  checked={chunkBy === "tokens"}
                  onChange={() => setChunkBy("tokens")}
                />
                按 Token 数
              </label>
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="chunkBy"
                  checked={chunkBy === "characters"}
                  onChange={() => setChunkBy("characters")}
                />
                按字符数
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Chunk 大小（{chunkBy === "tokens" ? "Token 数" : "字符数"}）
            </label>
            <input
              type="number"
              value={chunkSize}
              onChange={(e) => setChunkSize(e.target.value)}
              placeholder={chunkBy === "tokens" ? "例如：512" : "例如：2000"}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              min="1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">重叠 Token 数</label>
              <input
                type="number"
                value={overlap}
                onChange={(e) => setOverlap(e.target.value)}
                placeholder="例如：50"
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                min="0"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                每 Token 对应字符数
              </label>
              <input
                type="number"
                value={ratio}
                onChange={(e) => setRatio(e.target.value)}
                placeholder="例如：0.25"
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                min="0.0001"
                step="0.01"
              />
              <p className="text-xs text-gray-500">默认 0.25（1 Token ≈ 4 字符）</p>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              className="px-4 py-2 rounded-md bg-blue-600 text-white inline-flex items-center gap-2 disabled:opacity-50"
              onClick={calculate}
              disabled={!totalChars || !chunkSize}
            >
              <Calculator className="h-4 w-4" />
              计算
            </button>
            <button
              className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 inline-flex items-center gap-2"
              onClick={clear}
            >
              <Trash2 className="h-4 w-4" />
              清空
            </button>
          </div>

          <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-md">
            <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-blue-700">
              数据仅在浏览器本地处理，不会上传到服务器。
            </p>
          </div>
        </div>

        {/* Result Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
          {result ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">总 Token 数</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {result.totalTokens.toLocaleString("zh-CN", {
                      maximumFractionDigits: 0,
                    })}
                  </p>
                </div>
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-xs text-blue-600 mb-1">Chunk 数量</p>
                  <p className="text-lg font-semibold text-blue-700">
                    {result.numChunks.toLocaleString("zh-CN")}
                  </p>
                </div>
                <div className="bg-amber-50 rounded-lg p-3">
                  <p className="text-xs text-amber-600 mb-1">预估重叠 Token</p>
                  <p className="text-lg font-semibold text-amber-700">
                    {result.totalOverlap.toLocaleString("zh-CN", {
                      maximumFractionDigits: 0,
                    })}
                  </p>
                </div>
                <div className="bg-green-50 rounded-lg p-3">
                  <p className="text-xs text-green-600 mb-1">平均每 Chunk Token</p>
                  <p className="text-lg font-semibold text-green-700">
                    {result.avgTokensPerChunk.toLocaleString("zh-CN", {
                      maximumFractionDigits: 1,
                    })}
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">公式说明</p>
                <div className="bg-gray-50 rounded-md p-3 text-xs font-mono text-gray-600 space-y-1">
                  <p>num_chunks = ceil((total_tokens - overlap) / (chunk_size - overlap))</p>
                  <p>total_tokens = total_chars * ratio</p>
                </div>
              </div>

              {result.previewBoundaries.length > 0 && (
                <div className="border-t border-gray-100 pt-4">
                  <p className="text-sm font-medium text-gray-700 mb-3">分块预览（边界位置）</p>
                  <div className="relative">
                    <div className="h-2 bg-gray-200 rounded-full" />
                    <div className="absolute top-0 left-0 right-0 flex justify-between items-center h-2">
                      <span className="absolute left-0 -top-6 text-xs text-gray-500">0%</span>
                      {result.previewBoundaries.map((pos, i) => (
                        <div
                          key={i}
                          className="absolute flex flex-col items-center"
                          style={{ left: `${pos}%`, transform: "translateX(-50%)" }}
                        >
                          <div className="w-0.5 h-3 bg-indigo-400" />
                          <span className="text-xs text-indigo-600 mt-1 whitespace-nowrap">
                            {pos}%
                          </span>
                        </div>
                      ))}
                      <span className="absolute right-0 -top-6 text-xs text-gray-500">100%</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-6">
                    共 {result.numChunks} 个 Chunk，相邻 Chunk 之间有重叠区域
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <Layers className="h-12 w-12 mb-3 opacity-30" />
              <p className="text-sm">输入参数后点击"计算"查看结果</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
