import { useState, useMemo } from "react";
import { Dice6 } from "lucide-react";
import { CalculatorShell } from "@/components/common/CalculatorShell";
import { rollDice, type DieType } from "@/lib/data/random";

const DIE_OPTIONS: { label: string; value: DieType }[] = [
  { label: "D4", value: 4 },
  { label: "D6", value: 6 },
  { label: "D8", value: 8 },
  { label: "D10", value: 10 },
  { label: "D12", value: 12 },
  { label: "D20", value: 20 },
  { label: "D100", value: 100 },
];

export default function MultiDiceRoller() {
  const [dieType, setDieType] = useState<DieType>(6);
  const [count, setCount] = useState(2);
  const [mode, setMode] = useState<"sum" | "individual">("sum");
  const [roll, setRoll] = useState(0);

  const result = useMemo(() => {
    return rollDice(dieType, count, mode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dieType, count, mode, roll]);

  return (
    <CalculatorShell
      title="Multi Dice Roller"
      subtitle="Roll multiple dice for games or probability calculations."
      icon={Dice6}
      iconBgColor="bg-primary/10"
      iconColor="text-primary"
      keywords={["dice", "roller", "probability", "random", "dnd"]}
      children={
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">Dice type</label>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
              {DIE_OPTIONS.map((d) => (
                <button
                  key={d.value}
                  onClick={() => setDieType(d.value)}
                  className={`py-2 rounded-lg border text-sm font-medium transition-colors ${ dieType === d.value ? "border-border bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-border" }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">
              Number of dice: {count}
            </label>
            <input
              type="range"
              min={1}
              max={50}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>1</span>
              <span>50</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">Roll mode</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "sum", label: "Sum" },
                { id: "individual", label: "Individual" },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id as "sum" | "individual")}
                  className={`py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${ mode === m.id ? "border-border bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-border" }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => setRoll((r) => r + 1)}
            className="w-full py-2.5 px-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary transition-colors text-sm font-medium"
          >
            Roll Dice
          </button>
        </div>
      }
      result={
        <div className="space-y-4 text-center">
          <p className="text-xs font-medium text-muted-foreground tracking-wide">Result</p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {result.dice[0].rolls.map((v, i) => (
              <span
                key={i}
                className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary font-bold text-lg border border-border"
              >
                {v}
              </span>
            ))}
          </div>
          <div className="pt-2">
            <p className="text-3xl font-bold text-foreground">{result.total}</p>
            <p className="text-sm text-muted-foreground">Total</p>
          </div>
        </div>
      }
    />
  );
}
