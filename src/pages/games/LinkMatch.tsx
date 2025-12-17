import { useMemo, useState } from "react";
import { Link2, RotateCcw, Info, X, Lightbulb } from "lucide-react";
import {
  Tile,
  Difficulty,
  LEVELS,
  genGrid,
  canConnect,
  findHint,
  hasAvailableMove,
} from "./linkMatchLogic";

export default function LinkMatch() {
  const [difficulty, setDifficulty] = useState<Difficulty>("Normal");
  const [grid, setGrid] = useState<Tile[][]>(() => {
    const { rows, cols } = LEVELS["Normal"];
    let newGrid: Tile[][] = [];
    let attempts = 0;
    do {
      newGrid = genGrid(rows, cols);
      attempts++;
    } while (!hasAvailableMove(newGrid) && attempts < 50);
    return newGrid;
  });
  const [sel, setSel] = useState<{ r: number; c: number } | null>(null);
  const [hint, setHint] = useState<[{ r: number; c: number }, { r: number; c: number }] | null>(null);
  const [showRules, setShowRules] = useState(false);

  const { rows, cols } = LEVELS[difficulty];

  const remaining = useMemo(() => {
    let count = 0;
    for (let r = 1; r < rows - 1; r++) for (let c = 1; c < cols - 1; c++) if (!grid[r][c].removed) count++;
    return count;
  }, [grid, rows, cols]);

  function reset(diff: Difficulty = difficulty) {
    const { rows, cols } = LEVELS[diff];
    let newGrid: Tile[][] = [];
    let attempts = 0;
    
    // Try to generate a solvable grid up to 50 times
    do {
      newGrid = genGrid(rows, cols);
      attempts++;
    } while (!hasAvailableMove(newGrid) && attempts < 50);

    setGrid(newGrid);
    setSel(null);
    setHint(null);
  }

  function handleDifficultyChange(diff: Difficulty) {
    setDifficulty(diff);
    reset(diff);
  }

  function handleHint() {
    const found = findHint(grid);
    if (found) {
      setHint(found);
    } else {
      alert("No moves available! Reshuffling...");
      reset();
    }
  }

  function click(r: number, c: number) {
    const cell = grid[r][c];
    if (cell.removed) return;
    if (!sel) {
      setSel({ r, c });
    } else {
      const s = sel;
      if (s.r === r && s.c === c) { setSel(null); return; }
      if (grid[s.r][s.c].ch !== cell.ch) { setSel({ r, c }); return; }
      const tempGrid = grid.map((row) => row.map((t) => ({ ...t })));
      if (canConnect(tempGrid, s.r, s.c, r, c)) {
        tempGrid[s.r][s.c].removed = true;
        tempGrid[r][c].removed = true;
        setGrid(tempGrid);
        setSel(null);
        setHint(null);
      } else {
        setSel({ r, c });
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <div className="inline-flex p-2 rounded-lg bg-pink-100 text-pink-600">
          <Link2 className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-semibold">Link Match</h1>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Difficulty:</span>
          <select
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
            value={difficulty}
            onChange={(e) => handleDifficultyChange(e.target.value as Difficulty)}
          >
            {(Object.keys(LEVELS) as Difficulty[]).map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
        <div className="text-sm text-gray-600">Remaining: {remaining}</div>
        <button className="px-3 py-2 bg-blue-600 text-white rounded-md flex items-center gap-2 text-sm" onClick={() => reset()}>
          <RotateCcw className="h-4 w-4" /> Reset
        </button>
        <button
          className="px-3 py-2 bg-amber-500 text-white rounded-md flex items-center gap-2 text-sm hover:bg-amber-600 transition-colors"
          onClick={handleHint}
        >
          <Lightbulb className="h-4 w-4" /> Hint
        </button>
        <button
          className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md flex items-center gap-2 text-sm hover:bg-gray-200 transition-colors"
          onClick={() => setShowRules(!showRules)}
        >
          <Info className="h-4 w-4" /> Rules
        </button>
      </div>

      {showRules && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 relative">
          <button 
            onClick={() => setShowRules(false)}
            className="absolute top-2 right-2 text-blue-400 hover:text-blue-600"
          >
            <X className="h-5 w-5" />
          </button>
          <h3 className="font-semibold text-blue-900 mb-2">How to Play</h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-blue-800">
            <li>Connect two identical tiles to remove them from the board.</li>
            <li>The connecting line between two tiles cannot have more than <strong>two turns</strong> (90-degree angles).</li>
            <li>The path cannot pass through other tiles, but can go through empty spaces.</li>
            <li>Clear all tiles to win the game!</li>
          </ul>
        </div>
      )}

      <div className="overflow-auto pb-4">
        <div
          className="inline-grid bg-gray-100 p-1 rounded-md border border-gray-200"
          style={{ gridTemplateColumns: `repeat(${cols}, 36px)`, gridTemplateRows: `repeat(${rows}, 36px)` }}
        >
          {grid.map((row, r) =>
            row.map((cell, c) => {
              const base = "w-[34px] h-[34px] m-[1px] rounded text-sm font-bold flex items-center justify-center select-none transition-all duration-200";
              const removed = "bg-transparent";
              const normal = "bg-white border border-gray-300 cursor-pointer hover:bg-gray-50 hover:scale-105 hover:shadow-sm hover:z-10";
              const selected = sel && sel.r === r && sel.c === c ? "ring-2 ring-pink-400 bg-pink-50 scale-105 z-10 shadow-sm" : "";
              const isHint = hint && ((hint[0].r === r && hint[0].c === c) || (hint[1].r === r && hint[1].c === c));
              const hinted = isHint ? "ring-2 ring-amber-400 bg-amber-50 scale-105 z-10 shadow-sm animate-pulse" : "";
              return (
                <div
                  key={`${r}-${c}`}
                  className={`${base} ${cell.removed ? removed : normal} ${selected} ${hinted}`}
                  onClick={() => click(r, c)}
                >
                  {!cell.removed ? cell.ch : ""}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}