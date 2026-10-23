import { useState, useMemo } from "react";
import { Sigma, Copy, Check } from "lucide-react";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";

function boxMuller(mean: number, stddev: number): number {
  let u1 = 0, u2 = 0;
  while (u1 === 0) u1 = Math.random();
  while (u2 === 0) u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + z * stddev;
}

function calcStats(nums: number[]) {
  if (nums.length === 0) return { mean: 0, stddev: 0, min: 0, max: 0 };
  const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
  const variance = nums.reduce((a, b) => a + (b - mean) ** 2, 0) / nums.length;
  return {
    mean,
    stddev: Math.sqrt(variance),
    min: Math.min(...nums),
    max: Math.max(...nums),
  };
}

export default function GaussianRandomNumberGenerator() {
  const [mean, setMean] = useState(0);
  const [stddev, setStddev] = useState(1);
  const [count, setCount] = useState(100);
  const [numbers, setNumbers] = useState<number[]>([]);
  const [copied, setCopied] = useState(false);

  const stats = useMemo(() => calcStats(numbers), [numbers]);

  const handleGenerate = () => {
    const nums: number[] = [];
    for (let i = 0; i < count; i++) {
      nums.push(Number(boxMuller(mean, stddev).toFixed(4)));
    }
    setNumbers(nums);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(numbers.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const bins = useMemo(() => {
    if (numbers.length === 0) return [];
    const binCount = Math.min(30, Math.ceil(Math.sqrt(numbers.length)));
    const min = Math.min(...numbers);
    const max = Math.max(...numbers);
    const width = (max - min) / binCount || 1;
    const bins = Array(binCount).fill(0);
    for (const n of numbers) {
      const idx = Math.min(Math.floor((n - min) / width), binCount - 1);
      bins[idx]++;
    }
    const maxBin = Math.max(...bins, 1);
    return bins.map((count, i) => ({
      label: (min + i * width).toFixed(1),
      count,
      height: `${(count / maxBin) * 100}%`,
    }));
  }, [numbers]);

  return (
    <EditorSplitLayout
      title={
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
            <Sigma className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Gaussian Random Number Generator</h1>
        </div>
      }
      toolbar={
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm">
            <label className="text-gray-600">Mean:</label>
            <input
              type="number"
              value={mean}
              onChange={(e) => setMean(Number(e.target.value))}
              className="w-20 rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-center focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            <label className="text-gray-600">Std Dev:</label>
            <input
              type="number"
              min={0.01}
              step={0.01}
              value={stddev}
              onChange={(e) => setStddev(Math.max(0.01, Number(e.target.value)))}
              className="w-20 rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-center focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            <label className="text-gray-600">Count:</label>
            <input
              type="number"
              min={1}
              max={10000}
              value={count}
              onChange={(e) => setCount(Math.max(1, Math.min(10000, Number(e.target.value))))}
              className="w-20 rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-center focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>
          <button
            onClick={handleGenerate}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Sigma className="h-3.5 w-3.5" />
            Generate
          </button>
        </div>
      }
      inputLabel="Numbers"
      inputActions={
        numbers.length > 0 ? (
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy"}
          </button>
        ) : undefined
      }
      input={
        <div className="h-full overflow-auto rounded-lg border border-gray-200 bg-white p-4">
          {numbers.length > 0 ? (
            <div className="font-mono text-sm text-gray-700 columns-4 gap-4">
              {numbers.map((n, i) => (
                <div key={i} className="py-0.5">{n}</div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
              Click Generate to create normally-distributed random numbers
            </div>
          )}
        </div>
      }
      outputLabel="Distribution"
      outputActions={
        numbers.length > 0 ? (
          <span className="text-xs text-gray-400">
            μ={stats.mean.toFixed(2)} σ={stats.stddev.toFixed(2)} · min={stats.min} max={stats.max}
          </span>
        ) : undefined
      }
      output={
        <div className="h-full overflow-auto rounded-lg border border-gray-200 bg-white p-4">
          {bins.length > 0 ? (
            <div className="flex items-end gap-px h-full">
              {bins.map((bin, i) => (
                <div key={i} className="flex-1 flex flex-col items-center justify-end h-full min-w-[12px]">
                  <div
                    className="w-full bg-blue-400 rounded-t-sm transition-all duration-300"
                    style={{ height: bin.height, minHeight: bin.count > 0 ? "2px" : "0" }}
                    title={`${bin.label}: ${bin.count}`}
                  />
                  {bins.length <= 20 && (
                    <span className="text-[9px] text-gray-400 mt-1 rotate-45 origin-left whitespace-nowrap">
                      {bin.label}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
              Histogram will appear here
            </div>
          )}
        </div>
      }
    />
  );
}