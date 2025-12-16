import { useMemo, useState } from "react";
import { Link2, RotateCcw, Info, X } from "lucide-react";

type Tile = { ch: string; removed: boolean };

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

type Difficulty = "Easy" | "Normal" | "Hard";

const LEVELS: Record<Difficulty, { rows: number; cols: number }> = {
  Easy: { rows: 8, cols: 12 },
  Normal: { rows: 10, cols: 14 },
  Hard: { rows: 12, cols: 18 },
};

function genGrid(rows: number, cols: number): Tile[][] {
  const grid: Tile[][] = [];
  // Initialize empty grid with border
  for (let r = 0; r < rows; r++) {
    const row: Tile[] = [];
    for (let c = 0; c < cols; c++) {
      row.push({ ch: "", removed: true });
    }
    grid.push(row);
  }

  // Calculate playable area (inner grid)
  const innerRows = rows - 2;
  const innerCols = cols - 2;
  const totalSlots = innerRows * innerCols;

  // Generate pairs
  const pairCount = Math.floor(totalSlots / 2);
  const content: string[] = [];
  for (let i = 0; i < pairCount; i++) {
    const ch = CHARS[i % CHARS.length];
    content.push(ch, ch);
  }

  // Shuffle content
  for (let i = content.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [content[i], content[j]] = [content[j], content[i]];
  }

  // Fill inner grid
  let k = 0;
  for (let r = 1; r < rows - 1; r++) {
    for (let c = 1; c < cols - 1; c++) {
      if (k < content.length) {
        grid[r][c] = { ch: content[k++], removed: false };
      }
    }
  }

  return grid;
}

function isClearRow(grid: Tile[][], r: number, c1: number, c2: number): boolean {
  const [a, b] = c1 < c2 ? [c1, c2] : [c2, c1];
  for (let c = a + 1; c < b; c++) {
    if (!grid[r][c].removed) return false;
  }
  return true;
}
function isClearCol(grid: Tile[][], c: number, r1: number, r2: number): boolean {
  const [a, b] = r1 < r2 ? [r1, r2] : [r2, r1];
  for (let r = a + 1; r < b; r++) {
    if (!grid[r][c].removed) return false;
  }
  return true;
}

function canConnect(grid: Tile[][], r1: number, c1: number, r2: number, c2: number): boolean {
  if (r1 === r2) {
    return isClearRow(grid, r1, c1, c2);
  }
  if (c1 === c2) {
    return isClearCol(grid, c1, r1, r2);
  }
  // one turn via corner (r1,c2) or (r2,c1)
  if (grid[r1][c2].removed && isClearRow(grid, r1, c1, c2) && isClearCol(grid, c2, r1, r2)) return true;
  if (grid[r2][c1].removed && isClearRow(grid, r2, c1, c2) && isClearCol(grid, c1, r1, r2)) return true;
  // two turns: scan rows
  for (let r = 0; r < grid.length; r++) {
    if (!grid[r][c1].removed || !grid[r][c2].removed) continue;
    if (isClearCol(grid, c1, r1, r) && isClearRow(grid, r, c1, c2) && isClearCol(grid, c2, r, r2)) return true;
  }
  // scan cols
  for (let c = 0; c < grid[0].length; c++) {
    if (!grid[r1][c].removed || !grid[r2][c].removed) continue;
    if (isClearRow(grid, r1, c1, c) && isClearCol(grid, c, r1, r2) && isClearRow(grid, r2, c, c2)) return true;
  }
  return false;
}

function hasAvailableMove(grid: Tile[][]): boolean {
  const rows = grid.length;
  const cols = grid[0].length;
  const tiles: { r: number; c: number; ch: string }[] = [];

  // Collect all active tiles
  for (let r = 1; r < rows - 1; r++) {
    for (let c = 1; c < cols - 1; c++) {
      if (!grid[r][c].removed) {
        tiles.push({ r, c, ch: grid[r][c].ch });
      }
    }
  }

  // Check all pairs
  for (let i = 0; i < tiles.length; i++) {
    for (let j = i + 1; j < tiles.length; j++) {
      if (tiles[i].ch === tiles[j].ch) {
        if (canConnect(grid, tiles[i].r, tiles[i].c, tiles[j].r, tiles[j].c)) {
          return true;
        }
      }
    }
  }
  return false;
}

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
  }

  function handleDifficultyChange(diff: Difficulty) {
    setDifficulty(diff);
    reset(diff);
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
              return (
                <div
                  key={`${r}-${c}`}
                  className={`${base} ${cell.removed ? removed : normal} ${selected}`}
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