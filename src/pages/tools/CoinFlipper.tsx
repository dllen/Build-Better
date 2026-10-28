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
        <div className="p-2 bg-primary/10 text-primary rounded-lg">
          <Coins className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Coin Flipper</h1>
      </div>

      <p className="text-sm text-muted-foreground mb-6">
        Flip a virtual coin multiple times and see the distribution of heads vs tails.
      </p>

      <div className="space-y-4 p-6 rounded-xl border border-border bg-card">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-muted-foreground">Number of flips:</label>
          <input
            type="number"
            min={1}
            max={1000}
            value={count}
            onChange={(e) => setCount(Math.max(1, Math.min(1000, Number(e.target.value))))}
            className="w-24 rounded-lg border border-border px-3 py-2 text-sm focus:border-border focus:ring-1 focus:ring-ring outline-none"
          />
        </div>

        <button
          onClick={handleFlip}
          disabled={flipping}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Coins className={`h-4 w-4 ${flipping ? "animate-spin" : ""}`} />
          {flipping ? `Flipping... (${currentFlip! + 1}/${count})` : "Flip"}
        </button>

        {results.length > 0 && (
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1 p-4 rounded-lg bg-primary/10 border border-border text-center">
                <p className="text-2xl font-bold text-primary">{heads}</p>
                <p className="text-xs text-primary">
                  Heads ({results.length > 0 ? ((heads / results.length) * 100).toFixed(1) : 0}%)
                </p>
              </div>
              <div className="flex-1 p-4 rounded-lg bg-muted border border-border text-center">
                <p className="text-2xl font-bold text-muted-foreground">{tails}</p>
                <p className="text-xs text-muted-foreground">
                  Tails ({results.length > 0 ? ((tails / results.length) * 100).toFixed(1) : 0}%)
                </p>
              </div>
            </div>

            <div className="max-h-64 overflow-auto rounded-lg border border-border">
              <div className="flex flex-wrap gap-1 p-3">
                {results.map((r, i) => (
                  <span
                    key={i}
                    className={`inline-flex items-center justify-center w-8 h-8 rounded text-xs font-bold ${ i === currentFlip ? "ring-2 ring-ring scale-110" : "" } ${ r === "heads" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground" }`}
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