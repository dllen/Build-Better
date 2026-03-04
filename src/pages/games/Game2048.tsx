import { useCallback, useEffect, useState } from "react";
import { RotateCcw, Trophy } from "lucide-react";

type Grid = number[][];
const SIZE = 4;

function emptyGrid(): Grid {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
}

function randomEmptyCell(g: Grid): [number, number] | null {
  const empties: Array<[number, number]> = [];
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++) if (g[r][c] === 0) empties.push([r, c]);
  if (empties.length === 0) return null;
  return empties[Math.floor(Math.random() * empties.length)];
}

function spawnTile(g: Grid): boolean {
  const cell = randomEmptyCell(g);
  if (!cell) return false;
  const [r, c] = cell;
  g[r][c] = Math.random() < 0.9 ? 2 : 4;
  return true;
}

function slideRow(row: number[]): { row: number[]; scoreGain: number; moved: boolean } {
  const nums = row.filter((v) => v !== 0);
  let scoreGain = 0;
  const merged: number[] = [];
  for (let i = 0; i < nums.length; i++) {
    if (i < nums.length - 1 && nums[i] === nums[i + 1]) {
      const v = nums[i] * 2;
      merged.push(v);
      scoreGain += v;
      i++;
    } else {
      merged.push(nums[i]);
    }
  }
  while (merged.length < SIZE) merged.push(0);
  const moved = merged.some((v, i) => v !== row[i]);
  return { row: merged, scoreGain, moved };
}

function rotateGrid(g: Grid): Grid {
  const r: Grid = emptyGrid();
  for (let i = 0; i < SIZE; i++) for (let j = 0; j < SIZE; j++) r[j][SIZE - 1 - i] = g[i][j];
  return r;
}

export default function Game2048() {
  const [grid, setGrid] = useState<Grid>(() => {
    const g = emptyGrid();
    spawnTile(g);
    spawnTile(g);
    return g;
  });
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("2048-highscore");
    if (saved) setBest(parseInt(saved));
  }, []);

  useEffect(() => {
    if (score > best) {
      setBest(score);
      localStorage.setItem("2048-highscore", String(score));
    }
  }, [score, best]);

  const canMove = useCallback((g: Grid) => {
    for (let r = 0; r < SIZE; r++)
      for (let c = 0; c < SIZE; c++) {
        if (g[r][c] === 0) return true;
        if (r < SIZE - 1 && g[r][c] === g[r + 1][c]) return true;
        if (c < SIZE - 1 && g[r][c] === g[r][c + 1]) return true;
      }
    return false;
  }, []);

  const moveLeft = useCallback(() => {
    setGrid((prev) => {
      let movedAny = false;
      let gain = 0;
      const next = prev.map((row) => {
        const { row: nr, scoreGain, moved } = slideRow(row);
        gain += scoreGain;
        if (moved) movedAny = true;
        return nr;
      });
      if (movedAny) {
        setScore((s) => s + gain);
        spawnTile(next);
        if (!canMove(next)) setGameOver(true);
        return next;
      }
      return prev;
    });
  }, [canMove]);

  const moveRight = useCallback(() => {
    setGrid((prev) => {
      const reversed = prev.map((row) => [...row].reverse());
      let movedAny = false;
      let gain = 0;
      const nextRev = reversed.map((row) => {
        const { row: nr, scoreGain, moved } = slideRow(row);
        gain += scoreGain;
        if (moved) movedAny = true;
        return nr;
      });
      const next = nextRev.map((row) => [...row].reverse());
      if (movedAny) {
        setScore((s) => s + gain);
        spawnTile(next);
        if (!canMove(next)) setGameOver(true);
        return next;
      }
      return prev;
    });
  }, [canMove]);

  const moveUp = useCallback(() => {
    setGrid((prev) => {
      // rotate CCW, move left, rotate CW
      const rot1 = rotateGrid(prev);
      let movedAny = false;
      let gain = 0;
      const nextRot1 = rot1.map((row) => {
        const { row: nr, scoreGain, moved } = slideRow(row);
        gain += scoreGain;
        if (moved) movedAny = true;
        return nr;
      });
      const next = rotateGrid(rotateGrid(rotateGrid(nextRot1)));
      if (movedAny) {
        setScore((s) => s + gain);
        spawnTile(next);
        if (!canMove(next)) setGameOver(true);
        return next;
      }
      return prev;
    });
  }, [canMove]);

  const moveDown = useCallback(() => {
    setGrid((prev) => {
      // rotate CW, move left, rotate CCW
      const rot3 = rotateGrid(rotateGrid(rotateGrid(prev)));
      let movedAny = false;
      let gain = 0;
      const nextRot3 = rot3.map((row) => {
        const { row: nr, scoreGain, moved } = slideRow(row);
        gain += scoreGain;
        if (moved) movedAny = true;
        return nr;
      });
      const next = rotateGrid(nextRot3);
      if (movedAny) {
        setScore((s) => s + gain);
        spawnTile(next);
        if (!canMove(next)) setGameOver(true);
        return next;
      }
      return prev;
    });
  }, [canMove]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (gameOver) return;
      if (e.key === "ArrowLeft") moveLeft();
      else if (e.key === "ArrowRight") moveRight();
      else if (e.key === "ArrowUp") moveUp();
      else if (e.key === "ArrowDown") moveDown();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [moveLeft, moveRight, moveUp, moveDown, gameOver]);

  const reset = () => {
    const g = emptyGrid();
    spawnTile(g);
    spawnTile(g);
    setGrid(g);
    setScore(0);
    setGameOver(false);
  };

  const tileColor = (v: number) => {
    if (v === 0) return "bg-gray-200";
    const colors: Record<number, string> = {
      2: "bg-yellow-100",
      4: "bg-yellow-200",
      8: "bg-orange-300",
      16: "bg-orange-400",
      32: "bg-orange-500",
      64: "bg-red-500",
      128: "bg-red-600",
      256: "bg-purple-500",
      512: "bg-purple-600",
      1024: "bg-blue-500",
      2048: "bg-green-500",
    };
    return colors[v] || "bg-green-600";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-semibold">2048</h1>
      </div>

      <div className="flex items-center gap-8">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 min-w-[120px] text-center">
          <div className="text-sm text-gray-500 mb-1">Score</div>
          <div className="text-2xl font-bold text-blue-600">{score}</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 min-w-[120px] text-center">
          <div className="text-sm text-gray-500 mb-1 flex items-center justify-center gap-1">
            <Trophy className="h-4 w-4 text-yellow-500" /> Best
          </div>
          <div className="text-2xl font-bold text-purple-600">{best}</div>
        </div>
        <button
          className="px-3 py-2 bg-blue-600 text-white rounded-md flex items-center gap-2"
          onClick={reset}
        >
          <RotateCcw className="h-4 w-4" /> Reset
        </button>
      </div>

      <div
        className="inline-grid bg-gray-100 p-2 rounded-md border border-gray-200 gap-2"
        style={{
          gridTemplateColumns: `repeat(${SIZE}, 80px)`,
          gridTemplateRows: `repeat(${SIZE}, 80px)`,
        }}
      >
        {grid.map((row, r) =>
          row.map((v, c) => (
            <div
              key={`${r}-${c}`}
              className={`w-[80px] h-[80px] rounded-md flex items-center justify-center font-bold text-xl text-gray-800 ${tileColor(v)}`}
            >
              {v || ""}
            </div>
          ))
        )}
      </div>

      {gameOver && <div className="text-lg font-bold text-red-600">Game Over</div>}
    </div>
  );
}
