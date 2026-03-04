import { useMemo, useState } from "react";
import { Dice6, Copy, RefreshCw } from "lucide-react";

type Ticket = {
  reds: number[];
  blue: number;
};

function randIntInclusive(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickUnique(count: number, min: number, max: number) {
  const s = new Set<number>();
  while (s.size < count) {
    s.add(randIntInclusive(min, max));
  }
  return Array.from(s);
}

export default function LotterySsq() {
  const [count, setCount] = useState(5);
  const [sortReds, setSortReds] = useState(true);
  const [ensureUniqueTickets, setEnsureUniqueTickets] = useState(true);
  const [tickets, setTickets] = useState<Ticket[]>([]);

  const formatted = useMemo(() => {
    return tickets.map((t) => {
      const reds = [...t.reds];
      if (sortReds) reds.sort((a, b) => a - b);
      const redStr = reds.map((n) => String(n).padStart(2, "0")).join(" ");
      const blueStr = String(t.blue).padStart(2, "0");
      return `${redStr} | ${blueStr}`;
    });
  }, [tickets, sortReds]);

  function generate() {
    const res: Ticket[] = [];
    const seen = new Set<string>();
    for (let i = 0; i < count; i++) {
      let t: Ticket;
      let key = "";
      let tries = 0;
      do {
        const reds = pickUnique(6, 1, 33);
        const blue = randIntInclusive(1, 16);
        const sorted = [...reds].sort((a, b) => a - b);
        key = `${sorted.join(",")}|${blue}`;
        t = { reds, blue };
        tries++;
        if (!ensureUniqueTickets || !seen.has(key)) break;
      } while (tries < 1000);
      if (ensureUniqueTickets) seen.add(key);
      res.push(t);
    }
    setTickets(res);
  }

  async function copyAll() {
    if (formatted.length === 0) return;
    const text = formatted.join("\n");
    await navigator.clipboard.writeText(text);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <div className="inline-flex p-2 rounded-lg bg-red-100 text-red-600">
          <Dice6 className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-semibold">福利彩票 · 双色球随机选号</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">注数: {count}</label>
            <input
              type="range"
              min={1}
              max={20}
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value))}
            />
          </div>
          <div className="grid grid-cols-1 gap-3 text-sm">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={sortReds}
                onChange={(e) => setSortReds(e.target.checked)}
              />
              红球升序显示
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={ensureUniqueTickets}
                onChange={(e) => setEnsureUniqueTickets(e.target.checked)}
              />
              生成结果不重复
            </label>
          </div>
          <div className="flex gap-3">
            <button
              className="px-4 py-2 rounded-md bg-blue-600 text-white inline-flex items-center gap-2"
              onClick={generate}
            >
              <RefreshCw className="h-4 w-4" />
              随机生成
            </button>
            <button
              className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 inline-flex items-center gap-2 disabled:opacity-50"
              onClick={copyAll}
              disabled={formatted.length === 0}
            >
              <Copy className="h-4 w-4" />
              复制全部
            </button>
          </div>
          <div className="text-xs text-gray-500">规则: 6个红球(1-33), 1个蓝球(1-16)</div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-4">
          <div className="font-medium mb-3">结果</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tickets.map((t, idx) => {
              const reds = sortReds ? [...t.reds].sort((a, b) => a - b) : t.reds;
              return (
                <div key={idx} className="flex items-center gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {reds.map((n, i) => (
                      <span
                        key={i}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-700 font-semibold"
                      >
                        {String(n).padStart(2, "0")}
                      </span>
                    ))}
                    <span className="mx-1 text-gray-400">|</span>
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-semibold">
                      {String(t.blue).padStart(2, "0")}
                    </span>
                  </div>
                </div>
              );
            })}
            {tickets.length === 0 && (
              <div className="text-sm text-gray-500">点击“随机生成”获取号码</div>
            )}
          </div>
          {formatted.length > 0 && (
            <div className="mt-4 bg-gray-50 rounded-md border border-gray-200 p-3">
              <div className="text-xs text-gray-500 mb-1">文本格式</div>
              <div className="font-mono text-sm whitespace-pre-wrap break-words">
                {formatted.join("\n")}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
