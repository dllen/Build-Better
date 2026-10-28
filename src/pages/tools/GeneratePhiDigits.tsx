import { useState } from "react";
import { Triangle, Copy } from "lucide-react";

/**
 * Compute the golden ratio φ = (1 + √5) / 2 to N decimal places.
 *
 * Step 1: Compute √5 to N+extra digits using Newton's method with BigInt.
 * Step 2: φ = (1 + √5) / 2, scale and format.
 */
function generatePhiDigits(count: number): string {
  const extra = 15; // extra digits for Newton convergence
  const scale = 10n ** BigInt(count + extra);

  // Newton's method for sqrt(5):
  // x_{n+1} = (x_n + 5 * scale * scale / x_n) / 2
  // Initial guess: x_0 = 2 * scale (since sqrt(5) ≈ 2.236...)
  const aScaled = 5n * scale * scale;
  let x = 2n * scale;

  // Iterate until convergence (typically 10-15 iterations for BigInt range)
  for (let i = 0; i < 20; i++) {
    const prev = x;
    x = (x + aScaled / x) / 2n;
    if (x === prev) break;
  }

  // φ = (1 + √5) / 2
  // phi_scaled = (scale + x) / 2
  const phiScaled = (scale + x) / 2n;

  const str = phiScaled.toString().padStart(count + 1, "0");
  const intPart = str[0]; // "1"
  const fracPart = str.slice(1, 1 + count);
  return `${intPart}.${fracPart}`;
}

export default function GeneratePhiDigits() {
  const [count, setCount] = useState(100);
  const [digits, setDigits] = useState("");

  const handleGenerate = () => {
    setDigits(generatePhiDigits(count));
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(digits);
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-primary/10 text-primary rounded-lg">
          <Triangle className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Golden Ratio Digit Generator</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Generate the digits of φ (phi, the golden ratio, ≈ 1.618...) up to any length.
      </p>
      <div className="space-y-4 p-6 rounded-xl border border-border bg-card">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5 text-sm">
            <span className="text-muted-foreground font-medium">Digits after decimal:</span>
            <input
              type="number"
              min={1}
              max={5000}
              value={count}
              onChange={(e) =>
                setCount(Math.max(1, Math.min(5000, Number(e.target.value))))
              }
              className="w-24 rounded-lg border border-border px-3 py-2 text-sm text-center focus:border-border focus:ring-1 focus:ring-ring outline-none"
            />
          </div>
          <button
            onClick={handleGenerate}
            className="inline-flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary transition-colors"
          >
            <Triangle className="h-4 w-4" />
            Generate
          </button>
          {digits && (
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1 px-3 py-2 text-sm text-muted-foreground hover:text-muted-foreground hover:bg-muted rounded-lg transition-colors"
            >
              <Copy className="h-4 w-4" />
              Copy
            </button>
          )}
        </div>
        {digits && (
          <div className="p-4 rounded-lg bg-muted border border-border max-h-64 overflow-auto">
            <p className="font-mono text-sm text-foreground break-all leading-relaxed">{digits}</p>
          </div>
        )}
      </div>
    </div>
  );
}