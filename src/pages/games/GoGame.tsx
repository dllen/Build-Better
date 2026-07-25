import React, { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeft, RefreshCw, Undo, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import { SEO } from "@/components/SEO";

// Board size
const BOARD_SIZE = 19;
const EMPTY = 0;
const BLACK = 1;
const WHITE = 2;

// Directions for neighbor checking
const DIRECTIONS = [
  [0, 1],
  [1, 0],
  [0, -1],
  [-1, 0],
];

type Player = typeof BLACK | typeof WHITE;
type BoardState = number[][];

const GoGame: React.FC = () => {
  const { t } = useTranslation();
  const [board, setBoard] = useState<BoardState>(
    Array(BOARD_SIZE)
      .fill(0)
      .map(() => Array(BOARD_SIZE).fill(EMPTY))
  );
  const [currentPlayer, setCurrentPlayer] = useState<Player>(BLACK);
  const [gameStatus, setGameStatus] = useState<"playing" | "finished">("playing");
  const [winner, setWinner] = useState<Player | null>(null);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [captures, setCaptures] = useState({ [BLACK]: 0, [WHITE]: 0 });
  const [history, setHistory] = useState<BoardState[]>([]);
  const [lastMove, setLastMove] = useState<{ x: number; y: number } | null>(null);
  const isAiThinking = useRef(false);

  // Initialize game
  const resetGame = () => {
    setBoard(
      Array(BOARD_SIZE)
        .fill(0)
        .map(() => Array(BOARD_SIZE).fill(EMPTY))
    );
    setCurrentPlayer(BLACK);
    setGameStatus("playing");
    setWinner(null);
    setCaptures({ [BLACK]: 0, [WHITE]: 0 });
    setHistory([]);
    setLastMove(null);
    isAiThinking.current = false;
  };

  // Helper: Deep copy board
  const copyBoard = (b: BoardState): BoardState => b.map((row) => [...row]);

  // Helper: Check if coordinates are on board
  const isValidPos = (x: number, y: number) =>
    x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE;

  // Helper: Get group of stones and their liberties
  const getGroup = (b: BoardState, x: number, y: number) => {
    const color = b[y][x];
    if (color === EMPTY) return null;

    const group: { x: number; y: number }[] = [];
    const liberties: { x: number; y: number }[] = [];
    const visited = new Set<string>();
    const queue = [{ x, y }];

    visited.add(`${x},${y}`);

    while (queue.length > 0) {
      const { x: cx, y: cy } = queue.shift()!;
      group.push({ x: cx, y: cy });

      for (const [dx, dy] of DIRECTIONS) {
        const nx = cx + dx;
        const ny = cy + dy;

        if (isValidPos(nx, ny)) {
          const key = `${nx},${ny}`;
          if (!visited.has(key)) {
            if (b[ny][nx] === color) {
              visited.add(key);
              queue.push({ x: nx, y: ny });
            } else if (b[ny][nx] === EMPTY) {
              // Check if this liberty is already in the list
              const isAlreadyCounted = liberties.some(l => l.x === nx && l.y === ny);
              if (!isAlreadyCounted) {
                  liberties.push({ x: nx, y: ny });
              }
            }
          } else if (b[ny][nx] === EMPTY) {
              // It's a liberty we might have seen from another path or same path logic
              // Just ensure it's in the list if unique
              const isAlreadyCounted = liberties.some(l => l.x === nx && l.y === ny);
              if (!isAlreadyCounted) {
                  liberties.push({ x: nx, y: ny });
              }
          }
        }
      }
    }
    return { group, liberties };
  };

  // Helper: Count liberties
  const countLiberties = (b: BoardState, x: number, y: number) => {
      const groupInfo = getGroup(b, x, y);
      return groupInfo ? groupInfo.liberties.length : 0;
  };

  // Move logic
  const makeMove = (x: number, y: number, player: Player, isAi: boolean = false) => {
    if (board[y][x] !== EMPTY) return false;

    const newBoard = copyBoard(board);
    newBoard[y][x] = player;

    const opponent = player === BLACK ? WHITE : BLACK;
    let capturedStones: { x: number; y: number }[] = [];

    // Check captured opponent stones
    for (const [dx, dy] of DIRECTIONS) {
      const nx = x + dx;
      const ny = y + dy;
      if (isValidPos(nx, ny) && newBoard[ny][nx] === opponent) {
        const groupInfo = getGroup(newBoard, nx, ny);
        if (groupInfo && groupInfo.liberties.length === 0) {
          capturedStones = [...capturedStones, ...groupInfo.group];
        }
      }
    }

    // Remove captured stones
    capturedStones.forEach(({ x: cx, y: cy }) => {
      newBoard[cy][cx] = EMPTY;
    });

    // Check suicide rule
    const myGroupInfo = getGroup(newBoard, x, y);
    if (myGroupInfo && myGroupInfo.liberties.length === 0) {
      return false;
    }

    // Ko rule check
    if (history.length > 0) {
        const prevBoard = history[history.length - 1];
        let isSame = true;
        for(let i=0; i<BOARD_SIZE; i++) {
            for(let j=0; j<BOARD_SIZE; j++) {
                if (newBoard[i][j] !== prevBoard[i][j]) {
                    isSame = false;
                    break;
                }
            }
            if (!isSame) break;
        }
        if (isSame) return false;
    }

    // Apply move
    setHistory((prev) => [...prev, copyBoard(board)]); 
    setBoard(newBoard);
    setCaptures((prev) => ({
      ...prev,
      [player]: prev[player] + capturedStones.length,
    }));
    setLastMove({ x, y });
    setCurrentPlayer(opponent);
    return true;
  };

  const handleBoardClick = (x: number, y: number) => {
    if (gameStatus !== "playing" || isAiThinking.current) return;
    if (currentPlayer !== BLACK) return; 

    if (makeMove(x, y, BLACK)) {
      isAiThinking.current = true;
      setTimeout(() => {
        makeAiMove();
        isAiThinking.current = false;
      }, 500);
    }
  };

  const makeAiMove = () => {
    const aiPlayer = WHITE;
    const opponent = BLACK;

    const evaluateMove = (x: number, y: number): number => {
       if (board[y][x] !== EMPTY) return -10000;
       
       const tempBoard = copyBoard(board);
       tempBoard[y][x] = aiPlayer;
       
       let captureCount = 0;
       for (const [dx, dy] of DIRECTIONS) {
          const nx = x + dx;
          const ny = y + dy;
          if (isValidPos(nx, ny) && tempBoard[ny][nx] === opponent) {
            const g = getGroup(tempBoard, nx, ny);
            if (g && g.liberties.length === 0) {
                captureCount += g.group.length;
            }
          }
       }
       
       if (captureCount > 0) {
           return 1000 + captureCount * 100;
       }
       
       const myGroup = getGroup(tempBoard, x, y);
       if (myGroup && myGroup.liberties.length === 0) return -10000; 
       
       let score = 0;
       if (myGroup && myGroup.liberties.length === 1) score -= 50;
       
       const distToEdgeX = Math.min(x, BOARD_SIZE - 1 - x);
       const distToEdgeY = Math.min(y, BOARD_SIZE - 1 - y);
       
       if ((distToEdgeX === 3 || distToEdgeX === 9) && (distToEdgeY === 3 || distToEdgeY === 9)) {
           score += 10;
       }
       
       if (distToEdgeX >= 2 && distToEdgeX <= 4 && distToEdgeY >= 2 && distToEdgeY <= 4) {
           score += 5;
       }
       
       score += Math.random() * 5;
       return score;
    };

    let bestScore = -Infinity;
    let bestMoves: {x: number, y: number}[] = [];
    
    for (let y = 0; y < BOARD_SIZE; y++) {
        for (let x = 0; x < BOARD_SIZE; x++) {
            if (board[y][x] === EMPTY) {
                let score = evaluateMove(x, y);
                
                if (difficulty === "easy") {
                    score = Math.random() * 100; 
                    if (evaluateMove(x,y) <= -5000) score = -10000;
                } else if (difficulty === "medium") {
                    score += Math.random() * 20;
                }
                
                if (score > bestScore) {
                    bestScore = score;
                    bestMoves = [{x, y}];
                } else if (score === bestScore) {
                    bestMoves.push({x, y});
                }
            }
        }
    }
    
    if (bestMoves.length > 0) {
        const move = bestMoves[Math.floor(Math.random() * bestMoves.length)];
        makeMove(move.x, move.y, aiPlayer, true);
    } else {
        setCurrentPlayer(BLACK);
    }
  };

  const undoMove = () => {
    if (history.length === 0) return;
    const newHistory = [...history];
    if (newHistory.length >= 2) {
        const prevBoard = newHistory[newHistory.length - 2];
        setBoard(prevBoard);
        setHistory(newHistory.slice(0, newHistory.length - 2));
        setLastMove(null); 
        setCurrentPlayer(BLACK);
    } else if (newHistory.length === 1) {
         resetGame();
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <SEO
        title={t("games.go.title", "Go (Weiqi)")}
        description={t("games.go.desc", "Play Go against AI")}
        keywords={["Go", "Weiqi", "Baduk", "Game", "AI"]}
      />

      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/games">
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
              <ArrowLeft className="h-6 w-6" />
            </button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {t("games.go.title", "Go (Weiqi)")}
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              {t("games.go.subtitle", "Strategy board game")}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
           <button 
                onClick={undoMove} 
                disabled={history.length === 0}
                className="flex items-center px-4 py-2 border rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50"
           >
             <Undo className="mr-2 h-4 w-4" />
             {t("common.undo", "Undo")}
           </button>
          <button 
                onClick={resetGame}
                className="flex items-center px-4 py-2 border rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            {t("common.restart", "Restart")}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 flex justify-center">
            {/* Go Board */}
            <div 
                className="relative bg-[#DEB887] shadow-lg select-none"
                style={{
                    width: "100%",
                    maxWidth: "600px",
                    aspectRatio: "1/1",
                    padding: "20px"
                }}
            >
                {/* Grid Lines */}
                <div className="absolute inset-0 p-[20px] pointer-events-none">
                     <svg width="100%" height="100%" viewBox={`0 0 ${BOARD_SIZE-1} ${BOARD_SIZE-1}`} style={{ overflow: "visible" }}>
                        {Array.from({ length: BOARD_SIZE }).map((_, i) => (
                            <line 
                                key={`h-${i}`} 
                                x1={0} 
                                y1={i} 
                                x2={BOARD_SIZE-1} 
                                y2={i} 
                                stroke="#000" 
                                strokeWidth="0.05" 
                            />
                        ))}
                        {Array.from({ length: BOARD_SIZE }).map((_, i) => (
                            <line 
                                key={`v-${i}`} 
                                x1={i} 
                                y1={0} 
                                x2={i} 
                                y2={BOARD_SIZE-1} 
                                stroke="#000" 
                                strokeWidth="0.05" 
                            />
                        ))}
                        {[3, 9, 15].map(x => [3, 9, 15].map(y => (
                            <circle key={`star-${x}-${y}`} cx={x} cy={y} r="0.1" fill="#000" />
                        )))}
                     </svg>
                </div>

                {/* Stones Interaction Layer */}
                <div 
                    className="absolute inset-0 p-[20px] grid"
                    style={{
                        gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)`,
                        gridTemplateRows: `repeat(${BOARD_SIZE}, 1fr)`,
                    }}
                >
                    {board.map((row, y) => (
                        row.map((cell, x) => (
                            <div 
                                key={`${x}-${y}`}
                                className="relative flex items-center justify-center cursor-pointer"
                                onClick={() => handleBoardClick(x, y)}
                            >
                                {cell !== EMPTY && (
                                    <div 
                                        className={`rounded-full shadow-sm z-10
                                            ${cell === BLACK ? "bg-black" : "bg-white"}
                                            ${cell === WHITE ? "border border-gray-300" : ""}
                                        `}
                                        style={{
                                            width: "90%",
                                            height: "90%",
                                            background: cell === BLACK 
                                                ? "radial-gradient(circle at 30% 30%, #555, #000)" 
                                                : "radial-gradient(circle at 30% 30%, #fff, #ddd)"
                                        }}
                                    />
                                )}
                                {lastMove && lastMove.x === x && lastMove.y === y && (
                                    <div className={`absolute w-3 h-3 rounded-full border-2 ${board[y][x] === BLACK ? "border-white" : "border-black"} z-20`}></div>
                                )}
                            </div>
                        ))
                    ))}
                </div>
            </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-4">{t("games.go.settings", "Game Settings")}</h3>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {t("games.go.difficulty", "Difficulty")}
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as any)}
                  className="w-full p-2 border rounded-md bg-transparent dark:bg-gray-700"
                >
                  <option value="easy">{t("games.go.easy", "Easy")}</option>
                  <option value="medium">{t("games.go.medium", "Medium")}</option>
                  <option value="hard">{t("games.go.hard", "Hard")}</option>
                </select>
              </div>

              <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg space-y-3">
                <div className="flex justify-between items-center">
                   <div className="flex items-center gap-2">
                       <div className="w-4 h-4 rounded-full bg-black"></div>
                       <span>{t("games.go.black", "Black (You)")}</span>
                   </div>
                   <span className="font-mono text-lg">{captures[BLACK]} {t("games.go.captured", "captured")}</span>
                </div>
                <div className="flex justify-between items-center">
                   <div className="flex items-center gap-2">
                       <div className="w-4 h-4 rounded-full bg-white border border-gray-300"></div>
                       <span>{t("games.go.white", "White (AI)")}</span>
                   </div>
                   <span className="font-mono text-lg">{captures[WHITE]} {t("games.go.captured", "captured")}</span>
                </div>
              </div>

              <div className="text-center py-4">
                 {gameStatus === "playing" ? (
                     <div className="text-lg font-bold">
                         {currentPlayer === BLACK ? t("games.go.your_turn", "Your Turn") : t("games.go.ai_turn", "AI Thinking...")}
                     </div>
                 ) : (
                     <div className="text-lg font-bold text-primary">
                         {t("games.go.game_over", "Game Over")}
                     </div>
                 )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoGame;
