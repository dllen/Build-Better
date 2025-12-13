import { useState, useCallback, useEffect } from "react";
import { RotateCcw, User, Cpu } from "lucide-react";

const BOARD_SIZE = 15;
const EMPTY = 0;
const BLACK = 1;
const WHITE = 2;

type Player = typeof BLACK | typeof WHITE;
type BoardState = number[][];

export default function Gomoku() {
  const [board, setBoard] = useState<BoardState>(
    Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(EMPTY))
  );
  const [currentPlayer, setCurrentPlayer] = useState<Player>(BLACK);
  const [winner, setWinner] = useState<Player | "DRAW" | null>(null);
  const [isAiThinking, setIsAiThinking] = useState(false);

  const checkWin = useCallback((board: BoardState, r: number, c: number, player: Player) => {
    const directions = [
      [1, 0], // Horizontal
      [0, 1], // Vertical
      [1, 1], // Diagonal \
      [1, -1], // Diagonal /
    ];

    for (const [dr, dc] of directions) {
      let count = 1;
      // Check forward
      let nr = r + dr;
      let nc = c + dc;
      while (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && board[nr][nc] === player) {
        count++;
        nr += dr;
        nc += dc;
      }
      // Check backward
      nr = r - dr;
      nc = c - dc;
      while (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && board[nr][nc] === player) {
        count++;
        nr -= dr;
        nc -= dc;
      }

      if (count >= 5) return true;
    }
    return false;
  }, []);

  const getAiMove = useCallback((board: BoardState) => {
    // 1. Check if AI can win immediately
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (board[r][c] === EMPTY) {
          board[r][c] = WHITE;
          if (checkWin(board, r, c, WHITE)) {
            board[r][c] = EMPTY;
            return { r, c };
          }
          board[r][c] = EMPTY;
        }
      }
    }

    // 2. Check if opponent can win immediately and block
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (board[r][c] === EMPTY) {
          board[r][c] = BLACK;
          if (checkWin(board, r, c, BLACK)) {
            board[r][c] = EMPTY;
            return { r, c };
          }
          board[r][c] = EMPTY;
        }
      }
    }

    // 3. Otherwise pick a random valid move near center or existing pieces
    // Better: Pick move that maximizes potential (e.g. 3 in a row)
    const candidates: { r: number; c: number; score: number }[] = [];
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (board[r][c] === EMPTY) {
          // Score based on proximity to center and other pieces
          let score = 0;
          const distToCenter = Math.abs(r - 7) + Math.abs(c - 7);
          score += (30 - distToCenter); // Prefer center

          // Check neighbors
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              if (dr === 0 && dc === 0) continue;
              const nr = r + dr;
              const nc = c + dc;
              if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && board[nr][nc] !== EMPTY) {
                score += 10;
              }
            }
          }
          candidates.push({ r, c, score });
        }
      }
    }

    candidates.sort((a, b) => b.score - a.score);
    // Pick one of the top 3 best moves to add variety
    const top = candidates.slice(0, 3);
    return top[Math.floor(Math.random() * top.length)];
  }, [checkWin]);

  

  const makeMove = useCallback((r: number, c: number) => {
    if (board[r][c] !== EMPTY || winner) return;

    const newBoard = board.map((row) => [...row]);
    newBoard[r][c] = currentPlayer;
    setBoard(newBoard);

    if (checkWin(newBoard, r, c, currentPlayer)) {
      setWinner(currentPlayer);
    } else if (newBoard.every((row) => row.every((cell) => cell !== EMPTY))) {
      setWinner("DRAW");
    } else {
      setCurrentPlayer(currentPlayer === BLACK ? WHITE : BLACK);
    }
  }, [board, winner, currentPlayer, checkWin]);

  useEffect(() => {
    if (currentPlayer === WHITE && !winner) {
      setIsAiThinking(true);
      const timer = setTimeout(() => {
        const move = getAiMove(board);
        if (move) {
          makeMove(move.r, move.c);
        }
        setIsAiThinking(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentPlayer, winner, board, getAiMove, makeMove]);

  const handleCellClick = (r: number, c: number) => {
    if (currentPlayer === BLACK && !isAiThinking) {
      makeMove(r, c);
    }
  };

  const resetGame = () => {
    setBoard(Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(EMPTY)));
    setCurrentPlayer(BLACK);
    setWinner(null);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Gomoku (AI)</h1>
        <p className="text-gray-600">Five in a Row against AI</p>
      </div>

      <div className="flex items-center gap-8 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className={`flex items-center gap-2 ${currentPlayer === BLACK ? "font-bold text-blue-600" : "text-gray-500"}`}>
          <User className="w-5 h-5" /> You (Black)
        </div>
        <div className="text-gray-300">vs</div>
        <div className={`flex items-center gap-2 ${currentPlayer === WHITE ? "font-bold text-red-600" : "text-gray-500"}`}>
          <Cpu className="w-5 h-5" /> AI (White) {isAiThinking && "..."}
        </div>
      </div>

      <div className="relative bg-[#e6c288] p-4 rounded-lg shadow-xl border-4 border-[#c5a065]">
        <div
          className="grid gap-0 bg-[#e6c288]"
          style={{
            gridTemplateColumns: `repeat(${BOARD_SIZE}, 30px)`,
            gridTemplateRows: `repeat(${BOARD_SIZE}, 30px)`,
          }}
        >
          {board.map((row, r) =>
            row.map((cell, c) => (
              <div
                key={`${r}-${c}`}
                className="w-[30px] h-[30px] relative cursor-pointer flex items-center justify-center"
                onClick={() => handleCellClick(r, c)}
              >
                {/* Grid lines */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-full h-[1px] bg-gray-700/50 absolute" />
                  <div className="h-full w-[1px] bg-gray-700/50 absolute" />
                </div>
                
                {/* Piece */}
                {cell !== EMPTY && (
                  <div
                    className={`w-[22px] h-[22px] rounded-full shadow-sm z-10 ${
                      cell === BLACK
                        ? "bg-gray-900 radial-gradient-black"
                        : "bg-white border border-gray-200 radial-gradient-white"
                    }`}
                  />
                )}
                
                {/* Hover effect */}
                {cell === EMPTY && !winner && currentPlayer === BLACK && (
                  <div className="w-[10px] h-[10px] rounded-full bg-black/10 opacity-0 hover:opacity-100 transition-opacity z-10" />
                )}
              </div>
            ))
          )}
        </div>

        {winner && (
          <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white backdrop-blur-sm z-20 rounded-sm">
            <div className="text-4xl font-bold mb-4 drop-shadow-lg">
              {winner === BLACK ? "You Win!" : winner === WHITE ? "AI Wins!" : "Draw!"}
            </div>
            <button
              onClick={resetGame}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-full font-bold transition-colors shadow-lg"
            >
              <RotateCcw className="w-5 h-5" /> Play Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
