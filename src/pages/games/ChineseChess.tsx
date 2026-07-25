import React, { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { SEO } from "@/components/SEO";
import { RefreshCw, Trophy, AlertCircle, Settings } from "lucide-react";

// --- Types ---

type Color = "r" | "b"; // Red (bottom), Black (top)
type PieceType = "k" | "a" | "b" | "n" | "r" | "c" | "p"; // King, Advisor, Bishop(Elephant), Knight(Horse), Rook(Chariot), Cannon, Pawn(Soldier)

interface Piece {
  color: Color;
  type: PieceType;
}

interface Position {
  r: number;
  c: number;
}

interface Move {
  from: Position;
  to: Position;
  captured?: Piece | null;
  score?: number;
}

type Difficulty = "easy" | "medium" | "hard";

// --- Constants ---

const COLS = 9;
const ROWS = 10;

// Initial Board Setup
const INITIAL_BOARD_FEN = [
  ["br", "bn", "bb", "ba", "bk", "ba", "bb", "bn", "br"],
  [null, null, null, null, null, null, null, null, null],
  [null, "bc", null, null, null, null, null, "bc", null],
  ["bp", null, "bp", null, "bp", null, "bp", null, "bp"],
  [null, null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null, null],
  ["rp", null, "rp", null, "rp", null, "rp", null, "rp"],
  [null, "rc", null, null, null, null, null, "rc", null],
  [null, null, null, null, null, null, null, null, null],
  ["rr", "rn", "rb", "ra", "rk", "ra", "rb", "rn", "rr"],
];

const PIECE_VALUES: Record<PieceType, number> = {
  k: 10000,
  r: 90,
  n: 40,
  c: 45,
  b: 20,
  a: 20,
  p: 10, // Increases after crossing river
};

// --- Helper Functions ---

const parsePiece = (str: string | null): Piece | null => {
  if (!str) return null;
  return {
    color: str[0] as Color,
    type: str[1] as PieceType,
  };
};

const getInitialBoard = (): (Piece | null)[][] => {
  return INITIAL_BOARD_FEN.map((row) => row.map(parsePiece));
};

const isValidPos = (r: number, c: number) => r >= 0 && r < ROWS && c >= 0 && c < COLS;

// Move Validation Logic
const getValidMoves = (board: (Piece | null)[][], turn: Color): Move[] => {
  const moves: Move[] = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const piece = board[r][c];
      if (piece && piece.color === turn) {
        const pieceMoves = getPieceMoves(board, { r, c }, piece);
        moves.push(...pieceMoves);
      }
    }
  }
  // Filter out moves that leave King in check (optional for simple AI, but good for correctness)
  // For performance, simple AI might skip full check validation on every generated move, 
  // but "King facing King" rule is mandatory.
  return moves.filter(move => !willCauseCheck(board, move, turn));
};

const getPieceMoves = (board: (Piece | null)[][], pos: Position, piece: Piece): Move[] => {
  const moves: Move[] = [];
  const { r, c } = pos;
  const isRed = piece.color === "r";

  const addMove = (tr: number, tc: number) => {
    if (!isValidPos(tr, tc)) return;
    const target = board[tr][tc];
    if (target && target.color === piece.color) return; // Cannot capture own piece
    moves.push({ from: pos, to: { r: tr, c: tc }, captured: target });
  };

  switch (piece.type) {
    case "k": // General
      // Palace bounds: cols 3-5. Red rows 7-9, Black rows 0-2.
      const rMin = isRed ? 7 : 0;
      const rMax = isRed ? 9 : 2;
      const cMin = 3;
      const cMax = 5;
      [[0, 1], [0, -1], [1, 0], [-1, 0]].forEach(([dr, dc]) => {
        const nr = r + dr, nc = c + dc;
        if (nr >= rMin && nr <= rMax && nc >= cMin && nc <= cMax) {
          addMove(nr, nc);
        }
      });
      // Flying General rule is checked in `willCauseCheck` or globally
      break;

    case "a": // Advisor
      // Palace diagonal
      const arMin = isRed ? 7 : 0;
      const arMax = isRed ? 9 : 2;
      [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([dr, dc]) => {
        const nr = r + dr, nc = c + dc;
        if (nr >= arMin && nr <= arMax && nc >= 3 && nc <= 5) {
          addMove(nr, nc);
        }
      });
      break;

    case "b": // Elephant (Bishop)
      // 2 steps diagonal, cannot cross river
      // River: Red side 5-9, Black side 0-4.
      const brMin = isRed ? 5 : 0;
      const brMax = isRed ? 9 : 4;
      [[2, 2], [2, -2], [-2, 2], [-2, -2]].forEach(([dr, dc]) => {
        const nr = r + dr, nc = c + dc;
        const eyeR = r + dr / 2, eyeC = c + dc / 2; // Elephant eye
        if (nr >= brMin && nr <= brMax && isValidPos(nr, nc)) {
          if (!board[eyeR][eyeC]) { // Not blocked
            addMove(nr, nc);
          }
        }
      });
      break;

    case "n": // Horse (Knight)
      // L-shape, check leg
      [[1, 2], [1, -2], [-1, 2], [-1, -2], [2, 1], [2, -1], [-2, 1], [-2, -1]].forEach(([dr, dc]) => {
        const nr = r + dr, nc = c + dc;
        const legR = r + (Math.abs(dr) === 2 ? Math.sign(dr) : 0);
        const legC = c + (Math.abs(dc) === 2 ? Math.sign(dc) : 0);
        if (isValidPos(nr, nc) && !board[legR][legC]) {
          addMove(nr, nc);
        }
      });
      break;

    case "r": // Rook (Chariot)
      [[0, 1], [0, -1], [1, 0], [-1, 0]].forEach(([dr, dc]) => {
        let nr = r + dr, nc = c + dc;
        while (isValidPos(nr, nc)) {
          const target = board[nr][nc];
          if (!target) {
            addMove(nr, nc);
          } else {
            if (target.color !== piece.color) addMove(nr, nc);
            break;
          }
          nr += dr; nc += dc;
        }
      });
      break;

    case "c": // Cannon
      [[0, 1], [0, -1], [1, 0], [-1, 0]].forEach(([dr, dc]) => {
        let nr = r + dr, nc = c + dc;
        let platform = false;
        while (isValidPos(nr, nc)) {
          const target = board[nr][nc];
          if (!target) {
            if (!platform) addMove(nr, nc);
          } else {
            if (!platform) {
              platform = true;
            } else {
              if (target.color !== piece.color) addMove(nr, nc);
              break;
            }
          }
          nr += dr; nc += dc;
        }
      });
      break;

    case "p": // Pawn (Soldier)
      // Forward 1. After river, side 1.
      // Red moves -1 row, Black moves +1 row.
      const forward = isRed ? -1 : 1;
      const crossedRiver = isRed ? r <= 4 : r >= 5;
      
      // Forward
      addMove(r + forward, c);
      
      // Sideways if crossed
      if (crossedRiver) {
        addMove(r, c - 1);
        addMove(r, c + 1);
      }
      break;
  }

  return moves;
};

// Check if moving creates a direct check or exposes King (including flying general)
const willCauseCheck = (board: (Piece | null)[][], move: Move, turn: Color): boolean => {
  // Simulate move
  const tempBoard = board.map(row => [...row]);
  tempBoard[move.to.r][move.to.c] = tempBoard[move.from.r][move.from.c];
  tempBoard[move.from.r][move.from.c] = null;

  // Find Kings
  let redK: Position | null = null;
  let blackK: Position | null = null;

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const p = tempBoard[r][c];
      if (p?.type === "k") {
        if (p.color === "r") redK = { r, c };
        else blackK = { r, c };
      }
    }
  }

  if (!redK || !blackK) return true; // Should not happen

  // 1. Flying General Check
  if (redK.c === blackK.c) {
    let hasBlocker = false;
    for (let r = Math.min(redK.r, blackK.r) + 1; r < Math.max(redK.r, blackK.r); r++) {
      if (tempBoard[r][redK.c]) {
        hasBlocker = true;
        break;
      }
    }
    if (!hasBlocker) return true; // Flying General!
  }

  // 2. Check if current turn's King is under attack
  const kingPos = turn === "r" ? redK : blackK;
  const opponent = turn === "r" ? "b" : "r";
  
  // It's computationally expensive to check all opponent moves.
  // Instead, check if any opponent piece can attack KingPos.
  return isUnderAttack(tempBoard, kingPos, opponent);
};

const isUnderAttack = (board: (Piece | null)[][], target: Position, attackerColor: Color): boolean => {
  // Iterate all opponent pieces and see if they can move to target
  // Optimization: Reverse check from target (e.g. is there a Knight in knight-attack position?)
  // For simplicity, let's iterate all pieces (board is small enough).
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const p = board[r][c];
      if (p && p.color === attackerColor) {
        // We only care if this piece can move to 'target'.
        // We can reuse getPieceMoves but optimize to stop early or just check specific logic.
        // For simplicity/correctness, use getPieceMoves logic but simplified for 'can capture'.
        // Note: Pawn logic depends on position, so we must respect that.
        const moves = getPieceMoves(board, { r, c }, p);
        if (moves.some(m => m.to.r === target.r && m.to.c === target.c)) {
          return true;
        }
      }
    }
  }
  return false;
};

// AI Evaluation
const evaluateBoard = (board: (Piece | null)[][]): number => {
  let score = 0;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const piece = board[r][c];
      if (piece) {
        let val = PIECE_VALUES[piece.type];
        
        // Position bonuses (simplified)
        if (piece.type === 'p') {
          // Pawns worth more across river
          const crossed = piece.color === 'r' ? r <= 4 : r >= 5;
          if (crossed) val += 10;
          // Approaching general
          if (piece.color === 'r' && r <= 2) val += 10;
          if (piece.color === 'b' && r >= 7) val += 10;
        }
        
        // Control center (simple heuristic)
        if (c === 4) val += 1;

        score += piece.color === "r" ? val : -val;
      }
    }
  }
  return score;
};

// Minimax with Alpha-Beta
const minimax = (
  board: (Piece | null)[][],
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean
): { score: number; move?: Move } => {
  if (depth === 0) {
    return { score: evaluateBoard(board) };
  }

  const turn = isMaximizing ? "r" : "b";
  const moves = getValidMoves(board, turn);

  if (moves.length === 0) {
    // No moves? Loss.
    return { score: isMaximizing ? -100000 : 100000 };
  }

  // Move ordering: captures first
  moves.sort((a, b) => (b.captured ? PIECE_VALUES[b.captured.type] : 0) - (a.captured ? PIECE_VALUES[a.captured.type] : 0));

  let bestMove: Move | undefined = moves[0];

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      // Apply move
      const savedPiece = board[move.to.r][move.to.c];
      board[move.to.r][move.to.c] = board[move.from.r][move.from.c];
      board[move.from.r][move.from.c] = null;

      const evalResult = minimax(board, depth - 1, alpha, beta, false);
      
      // Undo move
      board[move.from.r][move.from.c] = board[move.to.r][move.to.c];
      board[move.to.r][move.to.c] = savedPiece;

      if (evalResult.score > maxEval) {
        maxEval = evalResult.score;
        bestMove = move;
      }
      alpha = Math.max(alpha, evalResult.score);
      if (beta <= alpha) break;
    }
    return { score: maxEval, move: bestMove };
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      // Apply move
      const savedPiece = board[move.to.r][move.to.c];
      board[move.to.r][move.to.c] = board[move.from.r][move.from.c];
      board[move.from.r][move.from.c] = null;

      const evalResult = minimax(board, depth - 1, alpha, beta, true);

      // Undo move
      board[move.from.r][move.from.c] = board[move.to.r][move.to.c];
      board[move.to.r][move.to.c] = savedPiece;

      if (evalResult.score < minEval) {
        minEval = evalResult.score;
        bestMove = move;
      }
      beta = Math.min(beta, evalResult.score);
      if (beta <= alpha) break;
    }
    return { score: minEval, move: bestMove };
  }
};


export default function ChineseChess() {
  const { t } = useTranslation();
  const [board, setBoard] = useState<(Piece | null)[][]>(getInitialBoard());
  const [turn, setTurn] = useState<Color>("r"); // Red goes first
  const [selectedPos, setSelectedPos] = useState<Position | null>(null);
  const [validMoves, setValidMoves] = useState<Move[]>([]);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [gameStatus, setGameStatus] = useState<"playing" | "red_win" | "black_win">("playing");
  const [lastMove, setLastMove] = useState<Move | null>(null);
  const [aiThinking, setAiThinking] = useState(false);

  // Reset Game
  const resetGame = () => {
    setBoard(getInitialBoard());
    setTurn("r");
    setSelectedPos(null);
    setValidMoves([]);
    setGameStatus("playing");
    setLastMove(null);
    setAiThinking(false);
  };

  // Check Game Over
  useEffect(() => {
    // Check if current player has no moves
    if (gameStatus !== "playing") return;

    // Check if generals exist (Minimax might capture king if depth allows, but standard checkmate is usually "no valid moves")
    // Or if we implemented capture-the-king logic in 'willCauseCheck', we just need to see if we have valid moves.
    const moves = getValidMoves(board, turn);
    if (moves.length === 0) {
      setGameStatus(turn === "r" ? "black_win" : "red_win");
    }
  }, [board, turn, gameStatus]);

  // AI Turn
  useEffect(() => {
    if (gameStatus !== "playing" || turn === "r") return; // AI is Black

    const makeAiMove = async () => {
      setAiThinking(true);
      
      // Delay to let UI render
      await new Promise(resolve => setTimeout(resolve, 100));

      let depth = 2;
      if (difficulty === "medium") depth = 3;
      if (difficulty === "hard") depth = 4;

      // Clone board for AI
      const tempBoard = board.map(row => [...row]);
      const { move } = minimax(tempBoard, depth, -Infinity, Infinity, false);

      if (move) {
        applyMove(move);
      } else {
        setGameStatus("red_win");
      }
      setAiThinking(false);
    };

    makeAiMove();
  }, [turn, gameStatus, difficulty]);

  const applyMove = (move: Move) => {
    setBoard(prev => {
      const newBoard = prev.map(row => [...row]);
      newBoard[move.to.r][move.to.c] = newBoard[move.from.r][move.from.c];
      newBoard[move.from.r][move.from.c] = null;
      return newBoard;
    });
    setLastMove(move);
    setTurn(prev => prev === "r" ? "b" : "r");
    setSelectedPos(null);
    setValidMoves([]);
  };

  const handleSquareClick = (r: number, c: number) => {
    if (gameStatus !== "playing" || aiThinking) return;
    if (turn === "b") return; // Not Red's turn

    const clickedPiece = board[r][c];
    
    // If clicking a valid move target
    const move = validMoves.find(m => m.to.r === r && m.to.c === c);
    if (move) {
      applyMove(move);
      return;
    }

    // Select piece
    if (clickedPiece && clickedPiece.color === turn) {
      setSelectedPos({ r, c });
      // Calculate valid moves for this piece
      const moves = getPieceMoves(board, { r, c }, clickedPiece);
      // Filter out self-check moves
      const safeMoves = moves.filter(m => !willCauseCheck(board, m, turn));
      setValidMoves(safeMoves);
    } else {
      // Clicked empty or enemy piece without being a valid move -> deselect
      setSelectedPos(null);
      setValidMoves([]);
    }
  };

  // Render Helpers
  const getPieceLabel = (piece: Piece) => {
    const map: Record<string, string> = {
      rk: "帅", ra: "仕", rb: "相", rn: "马", rr: "车", rc: "炮", rp: "兵",
      bk: "将", ba: "士", bb: "象", bn: "马", br: "车", bc: "炮", bp: "卒"
    };
    return map[piece.color + piece.type];
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl flex flex-col items-center">
      <SEO
        title={t("games.chinese-chess.title", "Chinese Chess")}
        description={t("games.chinese-chess.desc", "Play Chinese Chess (Xiangqi) against AI.")}
      />

      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {t("games.chinese-chess.title", "Chinese Chess")}
        </h1>
        <p className="text-gray-600">
          {t("games.chinese-chess.subtitle", "Challenge the AI in this classic strategy game.")}
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Game Board */}
        <div className="relative bg-[#dcb35c] p-1 rounded shadow-lg select-none">
          {/* Grid Lines */}
          <div className="absolute inset-4 border-2 border-black pointer-events-none">
            {/* Horizontal Lines */}
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={`h-${i}`} className="absolute w-full h-px bg-black" style={{ top: `${(i + 1) * 11.11}%` }} />
            ))}
            {/* Vertical Lines (Split by River) */}
            {Array.from({ length: 7 }).map((_, i) => (
              <React.Fragment key={`v-${i}`}>
                <div className="absolute w-px h-[44.44%] bg-black" style={{ left: `${(i + 1) * 12.5}%`, top: 0 }} />
                <div className="absolute w-px h-[44.44%] bg-black" style={{ left: `${(i + 1) * 12.5}%`, bottom: 0 }} />
              </React.Fragment>
            ))}
            {/* Palace Diagonals */}
            {/* Top Palace */}
            <div className="absolute w-[25%] h-[22.22%] top-0 left-[37.5%] pointer-events-none">
              <svg width="100%" height="100%">
                <line x1="0" y1="0" x2="100%" y2="100%" stroke="black" strokeWidth="1" />
                <line x1="100%" y1="0" x2="0" y2="100%" stroke="black" strokeWidth="1" />
              </svg>
            </div>
            {/* Bottom Palace */}
            <div className="absolute w-[25%] h-[22.22%] bottom-0 left-[37.5%] pointer-events-none">
              <svg width="100%" height="100%">
                <line x1="0" y1="0" x2="100%" y2="100%" stroke="black" strokeWidth="1" />
                <line x1="100%" y1="0" x2="0" y2="100%" stroke="black" strokeWidth="1" />
              </svg>
            </div>
            {/* River Text */}
            <div className="absolute top-[44.44%] w-full h-[11.11%] flex items-center justify-around text-2xl font-serif opacity-50">
              <span>楚 河</span>
              <span>汉 界</span>
            </div>
          </div>

          {/* Board Cells */}
          <div className="relative grid grid-cols-9 grid-rows-10 w-[360px] h-[400px] sm:w-[450px] sm:h-[500px]">
            {board.map((row, r) =>
              row.map((piece, c) => {
                const isSelected = selectedPos?.r === r && selectedPos?.c === c;
                const isLastFrom = lastMove?.from.r === r && lastMove?.from.c === c;
                const isLastTo = lastMove?.to.r === r && lastMove?.to.c === c;
                const isValidTarget = validMoves.some(m => m.to.r === r && m.to.c === c);

                return (
                  <div
                    key={`${r}-${c}`}
                    onClick={() => handleSquareClick(r, c)}
                    className={`relative flex items-center justify-center cursor-pointer z-10`}
                  >
                    {/* Highlight valid move target */}
                    {isValidTarget && !piece && (
                      <div className="w-3 h-3 bg-green-500 rounded-full opacity-50 absolute" />
                    )}
                    
                    {/* Highlight valid capture target */}
                    {isValidTarget && piece && (
                      <div className="w-[80%] h-[80%] border-4 border-green-500 rounded-full absolute opacity-50" />
                    )}

                    {/* Last Move Highlight */}
                    {(isLastFrom || isLastTo) && (
                      <div className="w-full h-full bg-blue-200 opacity-30 absolute" />
                    )}

                    {/* Piece */}
                    {piece && (
                      <div
                        className={`
                          w-[85%] h-[85%] rounded-full border-2 flex items-center justify-center shadow-md text-xl sm:text-2xl font-bold bg-[#f3d99d]
                          ${piece.color === "r" ? "text-red-600 border-red-600" : "text-black border-black"}
                          ${isSelected ? "ring-4 ring-blue-400 scale-110 z-20" : ""}
                        `}
                      >
                        {getPieceLabel(piece)}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="w-full md:w-64 space-y-6">
          <div className="bg-white p-4 rounded-xl shadow border border-gray-200">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
              <Settings size={18} />
              {t("games.chinese-chess.settings", "Game Settings")}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("games.chinese-chess.difficulty", "Difficulty")}
                </label>
                <div className="flex gap-2">
                  {(["easy", "medium", "hard"] as Difficulty[]).map((d) => (
                    <button
                      key={d}
                      onClick={() => {
                        setDifficulty(d);
                        resetGame();
                      }}
                      className={`flex-1 py-1.5 text-sm rounded border ${
                        difficulty === d
                          ? "bg-indigo-50 border-indigo-500 text-indigo-700"
                          : "border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {t(`games.chinese-chess.${d}`, d.charAt(0).toUpperCase() + d.slice(1))}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Status</span>
                  <span className={`text-sm font-bold ${
                    turn === "r" ? "text-red-600" : "text-black"
                  }`}>
                    {gameStatus === "playing" 
                      ? (turn === "r" ? t("games.chinese-chess.red_turn", "Red's Turn") : t("games.chinese-chess.black_turn", "Black's Turn (AI)"))
                      : gameStatus === "red_win" ? t("games.chinese-chess.red_win", "Red Wins!") : t("games.chinese-chess.black_win", "Black Wins!")}
                  </span>
                </div>
                {aiThinking && (
                  <div className="text-xs text-center text-gray-500 animate-pulse">
                    AI is thinking...
                  </div>
                )}
              </div>

              <button
                onClick={resetGame}
                className="w-full flex items-center justify-center gap-2 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
              >
                <RefreshCw size={18} />
                {t("common.restart", "Restart Game")}
              </button>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-sm text-blue-800">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <AlertCircle size={16} />
              {t("common.how_to_play", "How to Play")}
            </h4>
            <ul className="list-disc list-inside space-y-1 opacity-80">
              <li>Red moves first.</li>
              <li>Capture the enemy General to win.</li>
              <li>Pieces move on intersections.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
