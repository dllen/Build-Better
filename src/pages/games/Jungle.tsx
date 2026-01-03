import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeft, RefreshCw, Undo, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import { SEO } from "@/components/SEO";

// Constants
const ROWS = 9;
const COLS = 7;

// Piece Ranks
const RAT = 1;
const CAT = 2;
const DOG = 3;
const WOLF = 4;
const LEOPARD = 5;
const TIGER = 6;
const LION = 7;
const ELEPHANT = 8;

// Players
const PLAYER_BLUE = 0; // AI (Top)
const PLAYER_RED = 1;  // User (Bottom)

// Board Cell Types
const TYPE_LAND = 0;
const TYPE_RIVER = 1;
const TYPE_TRAP = 2;
const TYPE_DEN = 3;

interface Piece {
  player: number;
  rank: number;
  label: string;
}

interface Position {
  r: number;
  c: number;
}

// Terrain Map
const getTerrain = (r: number, c: number) => {
  // Dens
  if ((r === 0 && c === 3)) return { type: TYPE_DEN, owner: PLAYER_BLUE };
  if ((r === 8 && c === 3)) return { type: TYPE_DEN, owner: PLAYER_RED };
  
  // Traps
  const blueTraps = [{ r: 0, c: 2 }, { r: 0, c: 4 }, { r: 1, c: 3 }];
  const redTraps = [{ r: 8, c: 2 }, { r: 8, c: 4 }, { r: 7, c: 3 }];
  if (blueTraps.some(p => p.r === r && p.c === c)) return { type: TYPE_TRAP, owner: PLAYER_BLUE };
  if (redTraps.some(p => p.r === r && p.c === c)) return { type: TYPE_TRAP, owner: PLAYER_RED };

  // River
  if (r >= 3 && r <= 5) {
    if (c === 1 || c === 2 || c === 4 || c === 5) return { type: TYPE_RIVER, owner: null };
  }

  return { type: TYPE_LAND, owner: null };
};

// Initial Board Setup
const initialPieces: { [key: string]: Piece } = {
  "0,0": { player: PLAYER_BLUE, rank: LION, label: "🦁" },
  "0,6": { player: PLAYER_BLUE, rank: TIGER, label: "🐯" },
  "1,1": { player: PLAYER_BLUE, rank: DOG, label: "🐕" },
  "1,5": { player: PLAYER_BLUE, rank: CAT, label: "🐈" },
  "2,0": { player: PLAYER_BLUE, rank: RAT, label: "🐀" },
  "2,2": { player: PLAYER_BLUE, rank: LEOPARD, label: "🐆" },
  "2,4": { player: PLAYER_BLUE, rank: WOLF, label: "🐺" },
  "2,6": { player: PLAYER_BLUE, rank: ELEPHANT, label: "🐘" },

  "8,6": { player: PLAYER_RED, rank: LION, label: "🦁" },
  "8,0": { player: PLAYER_RED, rank: TIGER, label: "🐯" },
  "7,5": { player: PLAYER_RED, rank: DOG, label: "🐕" },
  "7,1": { player: PLAYER_RED, rank: CAT, label: "🐈" },
  "6,6": { player: PLAYER_RED, rank: RAT, label: "🐀" },
  "6,4": { player: PLAYER_RED, rank: LEOPARD, label: "🐆" },
  "6,2": { player: PLAYER_RED, rank: WOLF, label: "🐺" },
  "6,0": { player: PLAYER_RED, rank: ELEPHANT, label: "🐘" },
};

const Jungle: React.FC = () => {
  const { t } = useTranslation();
  const [board, setBoard] = useState<{ [key: string]: Piece }>(initialPieces);
  const [turn, setTurn] = useState<number>(PLAYER_RED);
  const [selectedPos, setSelectedPos] = useState<Position | null>(null);
  const [validMoves, setValidMoves] = useState<Position[]>([]);
  const [winner, setWinner] = useState<number | null>(null);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [history, setHistory] = useState<{ [key: string]: Piece }[]>([]);
  const isAiThinking = useRef(false);

  // Helper: Get Piece at Position
  const getPiece = (b: { [key: string]: Piece }, r: number, c: number) => b[`${r},${c}`];

  // Helper: Is Valid Move
  const getValidMoves = (b: { [key: string]: Piece }, r: number, c: number) => {
    const piece = getPiece(b, r, c);
    if (!piece) return [];

    const moves: Position[] = [];
    const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];

    directions.forEach(([dr, dc]) => {
      let nr = r + dr;
      let nc = c + dc;

      // Basic Bounds Check
      if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) return;

      // Check Terrain
      const targetTerrain = getTerrain(nr, nc);
      
      // Cannot enter own Den
      if (targetTerrain.type === TYPE_DEN && targetTerrain.owner === piece.player) return;

      // River Logic
      if (targetTerrain.type === TYPE_RIVER) {
        if (piece.rank === RAT) {
          // Rat can enter river
        } else if (piece.rank === LION || piece.rank === TIGER) {
          // Jump over river
          while (getTerrain(nr, nc).type === TYPE_RIVER) {
            // Check if rat blocks jump
            const midPiece = getPiece(b, nr, nc);
            if (midPiece) return; // Blocked by rat in river
            
            nr += dr;
            nc += dc;
          }
          // Bounds check after jump
          if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) return;
        } else {
          // Others cannot enter river
          return;
        }
      }

      // Check Target Cell Content
      const targetPiece = getPiece(b, nr, nc);
      
      if (targetPiece) {
        if (targetPiece.player === piece.player) return; // Cannot capture own piece

        // Capture Rules
        // Traps: Opponent in trap -> rank becomes 0 (effectively) for capture check
        const isTargetInTrap = getTerrain(nr, nc).type === TYPE_TRAP && getTerrain(nr, nc).owner !== targetPiece.player;
        
        if (isTargetInTrap) {
          // Can capture any piece in trap
        } else {
          // Normal Capture Rules
          if (piece.rank === ELEPHANT && targetPiece.rank === RAT) return; // Elephant cannot eat Rat
          if (piece.rank === RAT && targetPiece.rank === ELEPHANT) {
             // Rat can eat Elephant
             // Special case: Rat in river cannot eat Elephant on land
             const isRatInRiver = getTerrain(r, c).type === TYPE_RIVER;
             if (isRatInRiver) return;
          } else if (piece.rank < targetPiece.rank) {
            return; // Lower rank cannot eat higher
          }
        }
        
        // Rat special: Rat in water cannot eat Rat on land? Rules vary.
        // Common rule: Rat in river cannot attack piece on land.
        if (piece.rank === RAT && getTerrain(r, c).type === TYPE_RIVER && getTerrain(nr, nc).type !== TYPE_RIVER) {
            return;
        }
      }

      moves.push({ r: nr, c: nc });
    });

    return moves;
  };

  const handleClick = (r: number, c: number) => {
    if (winner !== null || isAiThinking.current || turn !== PLAYER_RED) return;

    const clickedPiece = getPiece(board, r, c);

    // If selecting own piece
    if (clickedPiece && clickedPiece.player === PLAYER_RED) {
      setSelectedPos({ r, c });
      setValidMoves(getValidMoves(board, r, c));
      return;
    }

    // If moving to valid position
    if (selectedPos) {
      const isMoveValid = validMoves.some(m => m.r === r && m.c === c);
      if (isMoveValid) {
        executeMove(selectedPos.r, selectedPos.c, r, c);
      } else {
        // Deselect if invalid click
        setSelectedPos(null);
        setValidMoves([]);
      }
    }
  };

  const executeMove = (fr: number, fc: number, tr: number, tc: number) => {
    const newBoard = { ...board };
    const movingPiece = newBoard[`${fr},${fc}`];
    
    // Check Win Condition (Entering Den)
    const targetTerrain = getTerrain(tr, tc);
    if (targetTerrain.type === TYPE_DEN && targetTerrain.owner !== movingPiece.player) {
      setWinner(movingPiece.player);
    }

    // Capture (or simply Move)
    delete newBoard[`${fr},${fc}`];
    newBoard[`${tr},${tc}`] = movingPiece;

    // Check if opponent has no pieces left
    const opponent = movingPiece.player === PLAYER_RED ? PLAYER_BLUE : PLAYER_RED;
    const opponentPieces = Object.values(newBoard).filter(p => p.player === opponent);
    if (opponentPieces.length === 0) {
        setWinner(movingPiece.player);
    }

    setHistory(prev => [...prev, board]);
    setBoard(newBoard);
    setSelectedPos(null);
    setValidMoves([]);
    
    // Switch turn
    const nextTurn = movingPiece.player === PLAYER_RED ? PLAYER_BLUE : PLAYER_RED;
    setTurn(nextTurn);

    if (nextTurn === PLAYER_BLUE && winner === null) {
      isAiThinking.current = true;
      setTimeout(() => makeAiMove(newBoard), 500);
    }
  };

  const makeAiMove = (currentBoard: { [key: string]: Piece }) => {
    // AI Logic
    const aiPlayer = PLAYER_BLUE;
    const opponent = PLAYER_RED;
    
    // Find all possible moves for AI
    let allMoves: { from: Position, to: Position, score: number }[] = [];
    
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const piece = getPiece(currentBoard, r, c);
        if (piece && piece.player === aiPlayer) {
          const moves = getValidMoves(currentBoard, r, c);
          moves.forEach(to => {
            allMoves.push({
              from: { r, c },
              to,
              score: evaluateMove(currentBoard, { r, c }, to, difficulty)
            });
          });
        }
      }
    }

    if (allMoves.length === 0) {
      setWinner(opponent);
      isAiThinking.current = false;
      return;
    }

    // Sort moves by score
    allMoves.sort((a, b) => b.score - a.score);

    // Pick move based on difficulty
    let bestMove;
    if (difficulty === "easy") {
        // Random among top 50% moves or purely random
        const idx = Math.floor(Math.random() * allMoves.length);
        bestMove = allMoves[idx];
    } else if (difficulty === "medium") {
        // Top 3 moves random
        const topN = Math.min(3, allMoves.length);
        const idx = Math.floor(Math.random() * topN);
        bestMove = allMoves[idx];
    } else {
        // Best move
        bestMove = allMoves[0];
    }

    executeMove(bestMove.from.r, bestMove.from.c, bestMove.to.r, bestMove.to.c);
    isAiThinking.current = false;
  };

  const evaluateMove = (b: { [key: string]: Piece }, from: Position, to: Position, diff: string) => {
    let score = 0;
    const piece = getPiece(b, from.r, from.c);
    const targetPiece = getPiece(b, to.r, to.c);
    const targetTerrain = getTerrain(to.r, to.c);

    // 1. Capture Value
    if (targetPiece) {
       score += targetPiece.rank * 10;
       if (targetPiece.rank === ELEPHANT) score += 50; // Killing Elephant is huge
    }

    // 2. Den Proximity (Aggression)
    // Red Den is at (8,3)
    const distToDen = Math.abs(to.r - 8) + Math.abs(to.c - 3);
    const prevDist = Math.abs(from.r - 8) + Math.abs(from.c - 3);
    score += (prevDist - distToDen) * 2;
    
    if (targetTerrain.type === TYPE_DEN && targetTerrain.owner === PLAYER_RED) {
        score += 1000; // Winning move
    }
    
    // 3. Trap Control
    if (targetTerrain.type === TYPE_TRAP && targetTerrain.owner === PLAYER_RED) {
        score += 5; // Controlling opponent traps is good
    }

    // 4. Safety (Basic lookahead)
    // Check if destination is under attack by opponent
    // This is expensive, so simplified: if next to strong opponent, reduce score
    // ... skipping complex check for speed/simplicity ...
    
    // 5. Randomness
    score += Math.random() * 2;

    return score;
  };

  const undoMove = () => {
      if (history.length === 0) return;
      // Undo 2 moves (AI and User)
      const prevBoard = history.length >= 2 ? history[history.length - 2] : history[0]; 
      // Actually if history has 1, it means User moved once. If we undo, we go back to start.
      // But usually AI responds immediately. So we undo pairs.
      
      if (history.length >= 2) {
          setBoard(history[history.length - 2]);
          setHistory(prev => prev.slice(0, prev.length - 2));
          setTurn(PLAYER_RED);
      } else {
          // Reset
          setBoard(initialPieces);
          setHistory([]);
          setTurn(PLAYER_RED);
      }
      setWinner(null);
  };
  
  const resetGame = () => {
      setBoard(initialPieces);
      setHistory([]);
      setTurn(PLAYER_RED);
      setWinner(null);
      setSelectedPos(null);
      setValidMoves([]);
  };

  // Rendering
  const renderCell = (r: number, c: number) => {
    const terrain = getTerrain(r, c);
    const piece = getPiece(board, r, c);
    const isSelected = selectedPos?.r === r && selectedPos?.c === c;
    const isValid = validMoves.some(m => m.r === r && m.c === c);

    let bgClass = "bg-[#f0d9b5]"; // Default Land
    if (terrain.type === TYPE_RIVER) bgClass = "bg-blue-300";
    if (terrain.type === TYPE_TRAP) bgClass = "bg-gray-300 border-dashed border-2 border-gray-500";
    if (terrain.type === TYPE_DEN) bgClass = terrain.owner === PLAYER_BLUE ? "bg-blue-200" : "bg-red-200";

    return (
      <div
        key={`${r},${c}`}
        className={`
          w-full h-full relative flex items-center justify-center
          ${bgClass}
          ${isValid ? "after:content-[''] after:absolute after:w-3 after:h-3 after:bg-green-500/50 after:rounded-full" : ""}
          cursor-pointer select-none border border-black/10
        `}
        onClick={() => handleClick(r, c)}
      >
        {terrain.type === TYPE_DEN && (
            <span className="absolute text-xs font-bold opacity-30">{t("games.jungle.den", "DEN")}</span>
        )}
        {terrain.type === TYPE_TRAP && (
            <span className="absolute text-xs font-bold opacity-30">{t("games.jungle.trap", "TRAP")}</span>
        )}
        
        {piece && (
          <div className={`
            text-3xl md:text-4xl transition-transform
            ${piece.player === PLAYER_RED ? "drop-shadow-[0_2px_2px_rgba(220,38,38,0.8)]" : "drop-shadow-[0_2px_2px_rgba(37,99,235,0.8)]"}
            ${isSelected ? "scale-125" : "hover:scale-110"}
          `}>
            {piece.label}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <SEO
        title={t("games.jungle.title", "Jungle Chess")}
        description={t("games.jungle.desc", "Play Jungle Chess (Dou Shou Qi) against AI")}
        keywords={["Jungle", "Dou Shou Qi", "Animal Chess", "Game", "AI"]}
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
              {t("games.jungle.title", "Jungle Chess")}
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              {t("games.jungle.subtitle", "Classic Animal Battle Game")}
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
            {/* Board Container */}
            <div className="border-4 border-amber-800 rounded-lg overflow-hidden shadow-xl bg-amber-100 p-1">
                <div 
                    className="grid"
                    style={{
                        gridTemplateColumns: `repeat(${COLS}, minmax(40px, 60px))`,
                        gridTemplateRows: `repeat(${ROWS}, minmax(40px, 60px))`,
                        gap: "1px",
                        backgroundColor: "#8B4513" // Border color between cells
                    }}
                >
                    {Array.from({ length: ROWS }).map((_, r) => 
                        Array.from({ length: COLS }).map((_, c) => renderCell(r, c))
                    )}
                </div>
            </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-4">{t("games.jungle.settings", "Game Settings")}</h3>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {t("games.jungle.difficulty", "Difficulty")}
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as any)}
                  className="w-full p-2 border rounded-md bg-transparent dark:bg-gray-700"
                >
                  <option value="easy">{t("games.jungle.easy", "Easy")}</option>
                  <option value="medium">{t("games.jungle.medium", "Medium")}</option>
                  <option value="hard">{t("games.jungle.hard", "Hard")}</option>
                </select>
              </div>

              <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg space-y-3">
                 <div className="text-sm text-gray-500">{t("games.jungle.rules", "Rank: 🐘 > 🦁 > 🐯 > 🐆 > 🐺 > 🐕 > 🐈 > 🐀 (> 🐘)")}</div>
                 
                 <div className="flex justify-between items-center mt-4">
                     <span className={`font-bold ${turn === PLAYER_RED ? "text-red-600 scale-110" : "text-gray-400"}`}>
                         {t("games.jungle.red", "Red (You)")}
                     </span>
                     <span className={`font-bold ${turn === PLAYER_BLUE ? "text-blue-600 scale-110" : "text-gray-400"}`}>
                         {t("games.jungle.blue", "Blue (AI)")}
                     </span>
                 </div>
              </div>

              <div className="text-center py-4">
                 {winner !== null ? (
                     <div className="text-xl font-bold text-primary animate-bounce">
                         {winner === PLAYER_RED ? t("games.jungle.red_win", "Red Wins!") : t("games.jungle.blue_win", "Blue Wins!")}
                     </div>
                 ) : (
                     <div className="text-lg font-bold">
                         {turn === PLAYER_RED ? t("games.jungle.your_turn", "Your Turn") : t("games.jungle.ai_turn", "AI Thinking...")}
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

export default Jungle;
