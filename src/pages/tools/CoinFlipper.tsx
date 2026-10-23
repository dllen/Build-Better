import { useState, useCallback } from "react";
import { Coins } from "lucide-react";

function flipCoin(): "heads" | "tails" {
  return Math.random() < 0.5 ? "heads" : "tails";
}

export default function CoinFlipper() {
  const [count, setCount] = useState(10);
  const [results, setResults] = useState<("heads" | "tails")[]>([]);
  const [flipping, setFlipping] = useState(false);
  const [currentFlip, setCurrentFlip] = useState<number | null>(null);

  const heads = results.filter((r) => r === "heads").length;
  const tails = results.length - heads;

  const handleFlip = useCallback(async () => {
    setFlipping(true);
    setResults([]);
    const newResults: ("heads" | "tails")[] = [];

    for (let i = 0; i < count; i++) {
      setCurrentFlip(i);
      await new Promise((r) => setTimeout(r, 60));
      newResults.push(flipCoin());
      setResults([...newResults]);
    }

    setCurrentFlip(null);
    setFlipping(false);
  }, [count]);

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-yellow-100 text-yellow-600 rounded-lg">
          <Coins className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Coin Flipper</h1>
      </div>

      <p className="text-sm text-gray-500 mb-6">
        Flip a virtual coin multiple times and see the distribution of heads vs tails.
      </p>

      <div className="space-y-4 p-6 rounded-xl border border-gray-200 bg-white">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700">Number of flips:</label>
          <input
            type="number"
            min={1}
            max={1000}
            value={count}
            onChange={(e) => setCount(Math.max(1, Math.min(1000, Number(e.target.value))))}
            className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none"
          />
        </div>

        <button
          onClick={handleFlip}
          disabled={flipping}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-yellow-600 text-white text-sm font-medium rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Coins className={`h-4 w-4 ${flipping ? "animate-spin" : ""}`} />
          {flipping ? `Flipping... (${currentFlip! + 1}/${count})` : "Flip"}
        </button>

        {results.length > 0 && (
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1 p-4 rounded-lg bg-yellow-50 border border-yellow-200 text-center">
                <p className="text-2xl font-bold text-yellow-700">{heads}</p>
                <p className="text-xs text-yellow-600">
                  Heads ({results.length > 0 ? ((heads / results.length) * 100).toFixed(1) : 0}%)
                </p>
              </div>
              <div className="flex-1 p-4 rounded-lg bg-gray-50 border border-gray-200 text-center">
                <p className="text-2xl font-bold text-gray-700">{tails}</p>
                <p className="text-xs text-gray-600">
                  Tails ({results.length > 0 ? ((tails / results.length) * 100).toFixed(1) : 0}%)
                </p>
              </div>
            </div>

            <div className="max-h-64 overflow-auto rounded-lg border border-gray-200">
              <div className="flex flex-wrap gap-1 p-3">
                {results.map((r, i) => (
                  <span
                    key={i}
                    className={`inline-flex items-center justify-center w-8 h-8 rounded text-xs font-bold ${
                      i === currentFlip
                        ? "ring-2 ring-yellow-400 scale-110"
                        : ""
                    } ${
                      r === "heads"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {r === "heads" ? "H" : "T"}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}