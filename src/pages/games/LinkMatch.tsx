import { useMemo, useState } from "react";
import { Link2, RotateCcw } from "lucide-react";

type Tile = { ch: string; removed: boolean };
const ROWS = 10;
const COLS = 14;
const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

function genPairs(rows: number, cols: number): Tile[][] {
  const total = rows * cols;
  const pairs = total % 2 === 0 ? total / 2 : Math.floor(total / 2);
  const list: string[] = [];
  for (let i = 0; i < pairs; i++) {
    const ch = CHARS[i % CHARS.length];
    list.push(ch, ch);
  }
  while (list.length < total) list.push(CHARS[Math.floor(Math.random() * CHARS.length)]);
  // shuffle
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  const grid: Tile[][] = [];
  let k = 0;
  for (let r = 0; r < rows; r++) {
    const row: Tile[] = [];
    for (let c = 0; c < cols; c++) {
      row.push({ ch: list[k++], removed: false });
    }
    grid.push(row);
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

export default function LinkMatch() {
  const [grid, setGrid] = useState<Tile[][]>(() => {
    const g = genPairs(ROWS, COLS);
    // make edges empty to allow turns
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (r === 0 || c === 0 || r === ROWS - 1 || c === COLS - 1) g[r][c].removed = true;
    return g;
  });
  const [sel, setSel] = useState<{ r: number; c: number } | null>(null);
  const remaining = useMemo(() => {
    let count = 0;
    for (let r = 1; r < ROWS - 1; r++) for (let c = 1; c < COLS - 1; c++) if (!grid[r][c].removed) count++;
    return count;
  }, [grid]);

  function reset() {
    const g = genPairs(ROWS, COLS);
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (r === 0 || c === 0 || r === ROWS - 1 || c === COLS - 1) g[r][c].removed = true;
    setGrid(g);
    setSel(null);
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

      <div className="flex items-center gap-3">
        <div className="text-sm text-gray-600">Remaining: {remaining}</div>
        <button className="px-3 py-2 bg-blue-600 text-white rounded-md flex items-center gap-2" onClick={reset}>
          <RotateCcw className="h-4 w-4" /> Reset
        </button>
      </div>

      <div
        className="inline-grid bg-gray-100 p-1 rounded-md border border-gray-200"
        style={{ gridTemplateColumns: `repeat(${COLS}, 36px)`, gridTemplateRows: `repeat(${ROWS}, 36px)` }}
      >
        {grid.map((row, r) =>
          row.map((cell, c) => {
            const base = "w-[34px] h-[34px] m-[1px] rounded text-sm font-bold flex items-center justify-center select-none";
            const removed = "bg-transparent";
            const normal = "bg-white border border-gray-300 cursor-pointer hover:bg-gray-50";
            const selected = sel && sel.r === r && sel.c === c ? "ring-2 ring-pink-400" : "";
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
  );
}
