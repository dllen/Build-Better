import { useCallback, useEffect, useMemo, useState } from "react";
import { Bomb, RotateCcw } from "lucide-react";

type Cell = {
  revealed: boolean;
  flagged: boolean;
  mine: boolean;
  count: number;
};

const ROWS = 12;
const COLS = 18;
const MINES = 35;

function neighbors(r: number, c: number) {
  const ns: Array<[number, number]> = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) ns.push([nr, nc]);
    }
  }
  return ns;
}

function createBoard(): Cell[][] {
  const b: Cell[][] = Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => ({ revealed: false, flagged: false, mine: false, count: 0 }))
  );
  let placed = 0;
  while (placed < MINES) {
    const r = Math.floor(Math.random() * ROWS);
    const c = Math.floor(Math.random() * COLS);
    if (!b[r][c].mine) {
      b[r][c].mine = true;
      placed++;
    }
  }
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (b[r][c].mine) continue;
      b[r][c].count = neighbors(r, c).reduce((acc, [nr, nc]) => acc + (b[nr][nc].mine ? 1 : 0), 0);
    }
  }
  return b;
}

export default function Minesweeper() {
  const [board, setBoard] = useState<Cell[][]>(createBoard());
  const [gameOver, setGameOver] = useState(false);
  const [win, setWin] = useState(false);

  const remaining = useMemo(() => {
    let hidden = 0;
    for (const row of board) for (const cell of row) if (!cell.revealed) hidden++;
    return hidden;
  }, [board]);

  const floodReveal = useCallback((r: number, c: number, next: Cell[][]) => {
    const stack: Array<[number, number]> = [[r, c]];
    const visited = new Set<string>();
    while (stack.length) {
      const [cr, cc] = stack.pop()!;
      const key = `${cr}:${cc}`;
      if (visited.has(key)) continue;
      visited.add(key);
      const cell = next[cr][cc];
      if (cell.revealed || cell.flagged) continue;
      cell.revealed = true;
      if (cell.count === 0 && !cell.mine) {
        for (const [nr, nc] of neighbors(cr, cc)) {
          const ncell = next[nr][nc];
          if (!ncell.revealed && !ncell.flagged) stack.push([nr, nc]);
        }
      }
    }
  }, []);

  const reveal = useCallback(
    (r: number, c: number) => {
      if (gameOver || win) return;
      setBoard((prev) => {
        const next = prev.map((row) => row.map((cell) => ({ ...cell })));
        const cell = next[r][c];
        if (cell.revealed || cell.flagged) return prev;
        if (cell.mine) {
          cell.revealed = true;
          setGameOver(true);
          return next;
        }
        floodReveal(r, c, next);
        return next;
      });
    },
    [gameOver, win, floodReveal]
  );

  const toggleFlag = useCallback(
    (r: number, c: number) => {
      if (gameOver || win) return;
      setBoard((prev) => {
        const next = prev.map((row) => row.map((cell) => ({ ...cell })));
        const cell = next[r][c];
        if (cell.revealed) return prev;
        cell.flagged = !cell.flagged;
        return next;
      });
    },
    [gameOver, win]
  );

  useEffect(() => {
    if (gameOver) return;
    const allSafeRevealed = board.every((row) =>
      row.every((cell) => (cell.mine ? true : cell.revealed))
    );
    if (allSafeRevealed) setWin(true);
  }, [board, gameOver]);

  const reset = () => {
    setBoard(createBoard());
    setGameOver(false);
    setWin(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <div className="inline-flex p-2 rounded-lg bg-destructive/10 text-destructive">
          <Bomb className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-semibold">Minesweeper</h1>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-sm text-ink-2">Mines: {MINES}</div>
        <div className="text-sm text-ink-2">Hidden: {remaining}</div>
        <button
          className="px-3 py-2 bg-primary text-primary-foreground rounded-md flex items-center gap-2 transition-colors hover:bg-primary/90"
          onClick={reset}
        >
          <RotateCcw className="h-4 w-4" /> Reset
        </button>
      </div>

      <div
        className="inline-grid bg-muted p-1 rounded-md border border-border"
        style={{
          gridTemplateColumns: `repeat(${COLS}, 28px)`,
          gridTemplateRows: `repeat(${ROWS}, 28px)`,
        }}
      >
        {board.map((row, r) =>
          row.map((cell, c) => {
            const base =
              "w-[26px] h-[26px] m-[1px] text-xs font-semibold flex items-center justify-center rounded";
            const unrevealed = "bg-muted hover:bg-accent cursor-pointer transition-colors";
            const revealed = cell.mine ? "bg-destructive text-destructive-foreground" : "bg-card text-foreground";
            const flagged = "bg-warning/20 text-foreground";
            return (
              <div
                key={`${r}-${c}`}
                className={`${base} ${cell.revealed ? revealed : cell.flagged ? flagged : unrevealed}`}
                onClick={() => reveal(r, c)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  toggleFlag(r, c);
                }}
              >
                {cell.revealed ? (
                  cell.mine ? (
                    <Bomb className="h-4 w-4 mx-auto" aria-label="Mine" />
                  ) : cell.count > 0 ? (
                    cell.count
                  ) : (
                    ""
                  )
                ) : cell.flagged ? (
                  <span aria-label="Flagged">⚑</span>
                ) : (
                  ""
                )}
              </div>
            );
          })
        )}
      </div>

      {(gameOver || win) && (
        <div className={`text-lg font-bold ${win ? "text-success" : "text-destructive"}`}>
          {win ? "You Win!" : "Game Over"}
        </div>
      )}
    </div>
  );
}
