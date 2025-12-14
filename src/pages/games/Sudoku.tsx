import { useEffect, useMemo, useState } from "react";
import { Grid2x2, RefreshCw, Check, Eraser } from "lucide-react";

type Cell = { v: number; fixed: boolean };
type Board = Cell[][];
type Difficulty = "easy" | "medium" | "hard";

function baseSolved(): number[][] {
  const b: number[][] = [];
  for (let r = 0; r < 9; r++) {
    const row: number[] = [];
    for (let c = 0; c < 9; c++) {
      row.push(((r * 3 + Math.floor(r / 3) + c) % 9) + 1);
    }
    b.push(row);
  }
  return b;
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function permuteSolved(sol: number[][]): number[][] {
  let grid = sol.map((row) => row.slice());
  const permNums = shuffle([1,2,3,4,5,6,7,8,9]);
  grid = grid.map((row) => row.map((v) => permNums[v - 1]));
  for (let band = 0; band < 3; band++) {
    const rows = [band * 3, band * 3 + 1, band * 3 + 2];
    const order = shuffle(rows);
    grid = order.map((r) => grid[r]).concat(grid.filter((_, idx) => !rows.includes(idx)));
    const head = grid.slice(0, 3);
    const tail = grid.slice(3);
    grid = head.concat(tail);
  }
  for (let stack = 0; stack < 3; stack++) {
    const cols = [stack * 3, stack * 3 + 1, stack * 3 + 2];
    const order = shuffle(cols);
    grid = grid.map((row) => order.map((c) => row[c]).concat(row.filter((_, idx) => !cols.includes(idx))).slice(0, 9));
    const head = grid.map((row) => row.slice(0, 3));
    const mid = grid.map((row) => row.slice(3, 6));
    const tail = grid.map((row) => row.slice(6, 9));
    grid = grid.map((_, i) => head[i].concat(mid[i]).concat(tail[i]));
  }
  return grid;
}

function blankFromSolved(sol: number[][], difficulty: Difficulty): Board {
  const removals = difficulty === "easy" ? 40 : difficulty === "medium" ? 50 : 58;
  const b: Board = sol.map((row) => row.map((v) => ({ v, fixed: true })));
  let removed = 0;
  while (removed < removals) {
    const r = Math.floor(Math.random() * 9);
    const c = Math.floor(Math.random() * 9);
    if (b[r][c].fixed) {
      b[r][c] = { v: 0, fixed: false };
      removed++;
    }
  }
  return b;
}

function cloneBoard(b: Board): Board {
  return b.map((row) => row.map((cell) => ({ v: cell.v, fixed: cell.fixed })));
}

function rowVals(b: Board, r: number) {
  return b[r].map((c) => c.v).filter(Boolean);
}
function colVals(b: Board, c: number) {
  return b.map((row) => row[c].v).filter(Boolean);
}
function boxVals(b: Board, r: number, c: number) {
  const br = Math.floor(r / 3) * 3;
  const bc = Math.floor(c / 3) * 3;
  const vals: number[] = [];
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
    const v = b[br + i][bc + j].v;
    if (v) vals.push(v);
  }
  return vals;
}
function validPlacement(b: Board, r: number, c: number, v: number) {
  if (v < 1 || v > 9) return false;
  if (rowVals(b, r).includes(v)) return false;
  if (colVals(b, c).includes(v)) return false;
  if (boxVals(b, r, c).includes(v)) return false;
  return true;
}

function findEmpty(b: Board): [number, number] | null {
  for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) {
    if (!b[r][c].v) return [r, c];
  }
  return null;
}

function solve(b: Board): Board | null {
  const next = findEmpty(b);
  if (!next) return b;
  const [r, c] = next;
  for (let v = 1; v <= 9; v++) {
    if (validPlacement(b, r, c, v)) {
      b[r][c].v = v;
      const res = solve(b);
      if (res) return res;
      b[r][c].v = 0;
    }
  }
  return null;
}

function conflictsAt(b: Board, r: number, c: number): boolean {
  const v = b[r][c].v;
  if (!v) return false;
  const countRow = rowVals(b, r).filter((x) => x === v).length;
  const countCol = colVals(b, c).filter((x) => x === v).length;
  const countBox = boxVals(b, r, c).filter((x) => x === v).length;
  return countRow > 1 || countCol > 1 || countBox > 1;
}

export default function Sudoku() {
  const [board, setBoard] = useState<Board>(() => blankFromSolved(permuteSolved(baseSolved()), "easy"));
  const [sel, setSel] = useState<[number, number] | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [status, setStatus] = useState("");

  function newGame(d: Difficulty) {
    setDifficulty(d);
    setBoard(blankFromSolved(permuteSolved(baseSolved()), d));
    setSel(null);
    setStatus("");
  }

  function input(v: number) {
    if (!sel) return;
    const [r, c] = sel;
    if (board[r][c].fixed) return;
    const nb = cloneBoard(board);
    nb[r][c].v = v;
    setBoard(nb);
  }

  function clearCell() {
    if (!sel) return;
    const [r, c] = sel;
    if (board[r][c].fixed) return;
    const nb = cloneBoard(board);
    nb[r][c].v = 0;
    setBoard(nb);
  }

  function checkBoard() {
    for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) {
      if (conflictsAt(board, r, c)) { setStatus("存在冲突"); return; }
    }
    const filled = board.every((row) => row.every((cell) => cell.v));
    setStatus(filled ? "已完成" : "无冲突");
  }

  function solveBoard() {
    const res = solve(cloneBoard(board));
    if (res) { setBoard(res); setStatus("已求解"); setSel(null); }
    else setStatus("无解");
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!sel) return;
      if (e.key >= "1" && e.key <= "9") {
        const [r, c] = sel;
        if (!board[r][c].fixed) {
          const nb = cloneBoard(board);
          nb[r][c].v = Number(e.key);
          setBoard(nb);
        }
      }
      if (e.key === "Backspace" || e.key === "Delete" || e.key === "0") {
        const [r, c] = sel;
        if (!board[r][c].fixed) {
          const nb = cloneBoard(board);
          nb[r][c].v = 0;
          setBoard(nb);
        }
      }
      if (e.key === "ArrowUp") setSel([Math.max(0, sel[0] - 1), sel[1]]);
      if (e.key === "ArrowDown") setSel([Math.min(8, sel[0] + 1), sel[1]]);
      if (e.key === "ArrowLeft") setSel([sel[0], Math.max(0, sel[1] - 1)]);
      if (e.key === "ArrowRight") setSel([sel[0], Math.min(8, sel[1] + 1)]);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sel, board]);

  const done = useMemo(() => board.every((row) => row.every((cell) => cell.v)), [board]);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2">
        <div className="inline-flex p-2 rounded-lg bg-amber-100 text-amber-600">
          <Grid2x2 className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-semibold">Sudoku</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="font-medium">棋盘</div>
            <div className="flex items-center gap-2">
              <select className="rounded-md border border-gray-300 px-2 py-1 text-sm" value={difficulty} onChange={(e) => newGame(e.target.value as Difficulty)}>
                <option value="easy">简单</option>
                <option value="medium">中等</option>
                <option value="hard">困难</option>
              </select>
              <button className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md text-sm" onClick={() => newGame(difficulty)}>
                <RefreshCw className="h-4 w-4" /> 新开局
              </button>
            </div>
          </div>
          <div className="inline-grid grid-cols-9 gap-px bg-gray-300 rounded-md p-px">
            {board.map((row, r) => row.map((cell, c) => {
              const selected = sel && sel[0] === r && sel[1] === c;
              const conflict = conflictsAt(board, r, c);
              const thickTop = r % 3 === 0 ? "border-t-2" : "";
              const thickLeft = c % 3 === 0 ? "border-l-2" : "";
              const thickRight = c % 3 === 2 ? "border-r-2" : "";
              const thickBottom = r % 3 === 2 ? "border-b-2" : "";
              return (
                <button
                  key={`${r}-${c}`}
                  className={`w-12 h-12 flex items-center justify-center bg-white ${selected ? "bg-blue-50" : ""} ${cell.fixed ? "text-gray-900 font-semibold" : "text-blue-700"} ${conflict ? "bg-red-100" : ""} border border-gray-300 ${thickTop} ${thickLeft} ${thickRight} ${thickBottom}`}
                  onClick={() => setSel([r, c])}
                >
                  {cell.v || ""}
                </button>
              );
            }))}
          </div>
          <div className="flex items-center gap-2">
            {[1,2,3,4,5,6,7,8,9].map((n) => (
              <button key={n} className="px-3 py-2 rounded-md border border-gray-300 hover:bg-gray-100 text-sm" onClick={() => input(n)}>{n}</button>
            ))}
            <button className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-gray-300 text-sm" onClick={clearCell}>
              <Eraser className="h-4 w-4" /> 清除
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
          <div className="font-medium">操作</div>
          <div className="flex items-center gap-2">
            <button className="inline-flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700" onClick={checkBoard}>
              <Check className="h-4 w-4" /> 检查
            </button>
            <button className="inline-flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-md text-sm hover:bg-purple-700" onClick={solveBoard}>
              一键求解
            </button>
          </div>
          <div className={`text-sm ${done ? "text-green-700" : status.includes("冲突") ? "text-red-700" : "text-gray-700"}`}>{status || "—"}</div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
          <div className="font-medium">说明</div>
          <div className="text-sm text-gray-700">
            选择格子后可通过数字键或下方数字按钮填入，支持方向键移动。红色高亮表示行/列/宫存在冲突。
          </div>
        </div>
      </div>
    </div>
  );
}
