import { useCallback, useEffect, useMemo, useState } from "react";
import { Keyboard, RotateCcw, Check, Play } from "lucide-react";

type CellType = "wall" | "empty" | "letter" | "door" | "spike";
type Cell = { t: CellType; ch?: string };
type Pos = { r: number; c: number };

type Level = {
  name: string;
  map: string[];
  sequence: string[];
};

const LEVELS: Level[] = [
  {
    name: "Basics",
    map: [
      "########################",
      "#S....:...w...q....####E",
      "#....###########.......#",
      "#....*.................#",
      "#......................#",
      "########################",
    ],
    sequence: [":", "w", "q"],
  },
  {
    name: "Motion",
    map: [
      "########################",
      "#S....h...j...k...l..##E",
      "#....###########.......#",
      "#....*.................#",
      "#......................#",
      "########################",
    ],
    sequence: ["h", "j", "k", "l"],
  },
  {
    name: "Editing",
    map: [
      "########################",
      "#S....d...d...x...p..##E",
      "#....###########.......#",
      "#....*.................#",
      "#......................#",
      "########################",
    ],
    sequence: ["d", "d", "x", "p"],
  },
];

function parseLevel(level: Level) {
  const h = level.map.length;
  const w = level.map[0].length;
  const grid: Cell[][] = Array.from({ length: h }, () => Array<Cell>(w));
  let start: Pos | null = null;
  for (let r = 0; r < h; r++) {
    for (let c = 0; c < w; c++) {
      const ch = level.map[r][c];
      if (ch === "#") grid[r][c] = { t: "wall" };
      else if (ch === ".") grid[r][c] = { t: "empty" };
      else if (ch === "*") grid[r][c] = { t: "spike" };
      else if (ch === "S") {
        grid[r][c] = { t: "empty" };
        start = { r, c };
      } else if (ch === "E") {
        grid[r][c] = { t: "door" };
      } else {
        grid[r][c] = { t: "letter", ch };
      }
    }
  }
  return { grid, start: start! };
}

export default function PacVim() {
  const [levelIndex, setLevelIndex] = useState(0);
  const level = LEVELS[levelIndex];
  const { grid: initGrid, start } = useMemo(() => parseLevel(level), [level]);
  const [grid, setGrid] = useState<Cell[][]>(initGrid);
  const [pos, setPos] = useState<Pos>(start);
  const [progress, setProgress] = useState(0);
  const [open, setOpen] = useState(false);
  const [won, setWon] = useState(false);

  useEffect(() => {
    setGrid(initGrid);
    setPos(start);
    setProgress(0);
    setOpen(false);
    setWon(false);
  }, [initGrid, start]);

  const canMove = useCallback((r: number, c: number) => {
    if (r < 0 || c < 0 || r >= grid.length || c >= grid[0].length) return false;
    const cell = grid[r][c];
    if (cell.t === "wall") return false;
    if (cell.t === "door" && !open) return false;
    return true;
  }, [grid, open]);

  const handleStep = useCallback((r: number, c: number) => {
    const cell = grid[r][c];
    if (cell.t === "spike") {
      setPos(start);
      setProgress(0);
      return;
    }
    if (cell.t === "letter") {
      const need = level.sequence[progress];
      if (cell.ch === need) {
        const ng = grid.map(row => row.slice());
        ng[r][c] = { t: "empty" };
        setGrid(ng);
        const np = progress + 1;
        setProgress(np);
        if (np === level.sequence.length) setOpen(true);
      } else {
        setProgress(0);
      }
    }
    if (cell.t === "door" && open) {
      if (levelIndex + 1 < LEVELS.length) {
        setLevelIndex(levelIndex + 1);
      } else {
        setWon(true);
      }
    }
  }, [grid, level.sequence, progress, open, start, levelIndex]);

  const move = useCallback((dr: number, dc: number) => {
    const nr = pos.r + dr;
    const nc = pos.c + dc;
    if (!canMove(nr, nc)) return;
    setPos({ r: nr, c: nc });
    handleStep(nr, nc);
  }, [pos, canMove, handleStep]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (won) return;
      if (e.key === "ArrowLeft" || e.key === "h") move(0, -1);
      if (e.key === "ArrowRight" || e.key === "l") move(0, 1);
      if (e.key === "ArrowUp" || e.key === "k") move(-1, 0);
      if (e.key === "ArrowDown" || e.key === "j") move(1, 0);
      if (e.key === " ") {
        setGrid(initGrid);
        setPos(start);
        setProgress(0);
        setOpen(false);
      }
      if (e.key === "Enter" && open) {
        if (levelIndex + 1 < LEVELS.length) {
          setLevelIndex(levelIndex + 1);
        } else {
          setWon(true);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [move, initGrid, start, open, levelIndex, won]);

  const seqState = useMemo(() => {
    return level.sequence.map((ch, i) => i < progress ? "done" : i === progress ? "next" : "todo");
  }, [level.sequence, progress]);

  const resetLevel = useCallback(() => {
    setGrid(initGrid);
    setPos(start);
    setProgress(0);
    setOpen(false);
    setWon(false);
  }, [initGrid, start]);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2">
        <div className="inline-flex p-2 rounded-lg bg-teal-100 text-teal-600">
          <Keyboard className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-semibold">PacVim</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="font-medium">{level.name}</div>
            <div className="flex items-center gap-2">
              {open ? <span className="inline-flex items-center gap-1 text-green-600 text-sm"><Check className="h-4 w-4" /> Exit Open</span> : <span className="text-gray-500 text-sm">Collect sequence to open</span>}
              <button className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md text-sm" onClick={resetLevel}>
                <RotateCcw className="h-4 w-4" /> Reset
              </button>
            </div>
          </div>

          <div className="inline-block bg-gray-50 rounded-md border border-gray-200 p-2">
            <div className="grid" style={{ gridTemplateColumns: `repeat(${grid[0].length}, 28px)`, gridTemplateRows: `repeat(${grid.length}, 28px)`, gap: 2 }}>
              {grid.map((row, r) => row.map((cell, c) => {
                const isPlayer = pos.r === r && pos.c === c;
                const base = "w-7 h-7 rounded flex items-center justify-center text-xs font-mono";
                if (isPlayer) return <div key={`${r}-${c}`} className="w-7 h-7 rounded bg-blue-500 text-white flex items-center justify-center">@</div>;
                if (cell.t === "wall") return <div key={`${r}-${c}`} className={`${base} bg-gray-300`} />;
                if (cell.t === "empty") return <div key={`${r}-${c}`} className={`${base} bg-white border border-gray-200`} />;
                if (cell.t === "spike") return <div key={`${r}-${c}`} className={`${base} bg-red-100 text-red-600 border border-red-200`}>!</div>;
                if (cell.t === "door") return <div key={`${r}-${c}`} className={`${base} ${open ? "bg-green-100 text-green-700 border border-green-200" : "bg-yellow-100 text-yellow-700 border border-yellow-200"}`}>{open ? "E" : "X"}</div>;
                return <div key={`${r}-${c}`} className={`${base} bg-indigo-100 text-indigo-700 border border-indigo-200`}>{cell.ch}</div>;
              }))}
            </div>
          </div>

          {won && (
            <div className="mt-4 rounded-md border border-green-200 bg-green-50 p-3 text-green-700 text-sm flex items-center justify-between">
              <div>All levels complete</div>
              <button className="inline-flex items-center gap-2 px-3 py-2 bg-teal-600 text-white rounded-md text-sm" onClick={() => setLevelIndex(0)}>
                <Play className="h-4 w-4" /> Replay
              </button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
          <div className="font-medium">Sequence</div>
          <div className="flex flex-wrap gap-2">
            {level.sequence.map((ch, i) => (
              <div key={i} className={`px-2 py-1 rounded-md border text-sm font-mono ${seqState[i] === "done" ? "bg-green-100 text-green-700 border-green-200" : seqState[i] === "next" ? "bg-blue-100 text-blue-700 border-blue-200" : "bg-gray-100 text-gray-700 border-gray-200"}`}>
                {ch}
              </div>
            ))}
          </div>
          <div className="space-y-1 text-sm text-gray-600">
            <div>移动：h j k l 或方向键</div>
            <div>收集顺序：按顺序踩到字符方块</div>
            <div>门：收集完成后出口开放</div>
            <div>重置：空格 或点击 Reset</div>
            <div>下一关：收集完成后回车</div>
          </div>
        </div>
      </div>
    </div>
  );
}
