import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeft, RefreshCw, Plane, Trophy, RotateCcw, Play } from "lucide-react";
import { Link } from "react-router-dom";

// Game Constants
const PLAYERS = ["red", "yellow", "blue", "green"] as const;
type PlayerColor = typeof PLAYERS[number];

// Colors
const COLORS = {
  red: "#ef4444",
  yellow: "#eab308",
  blue: "#3b82f6",
  green: "#22c55e",
};

// Game State Interfaces
interface Piece {
  id: number; // 0-3
  color: PlayerColor;
  position: number; // -1: Hangar, 0-51: Main Track, 52-57: Home Stretch, 99: Finished
  distance: number; // Total distance traveled (logic only)
}

interface GameState {
  pieces: Record<PlayerColor, Piece[]>;
  currentPlayerIndex: number;
  diceValue: number | null;
  waitingForDice: boolean;
  waitingForMove: boolean;
  consecutiveSixes: number;
  winners: PlayerColor[];
  logs: string[];
}

const FlyingChess: React.FC = () => {
  const { t } = useTranslation();
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [gameStarted, setGameStarted] = useState(false);
  
  // Initial State
  const createInitialState = (): GameState => {
    const pieces: any = {};
    PLAYERS.forEach(p => {
      pieces[p] = Array(4).fill(0).map((_, i) => ({
        id: i,
        color: p,
        position: -1,
        distance: 0
      }));
    });
    return {
      pieces,
      currentPlayerIndex: 0,
      diceValue: null,
      waitingForDice: true,
      waitingForMove: false,
      consecutiveSixes: 0,
      winners: [],
      logs: []
    };
  };

  const [gameState, setGameState] = useState<GameState>(createInitialState());
  
  // Helper: Get logical position on the main track (0-51) based on player color
  const getGlobalPos = (color: PlayerColor, localPos: number) => {
    if (localPos < 0 || localPos >= 100) return localPos; // Hangar or Finished
    // Offsets: Red: 0, Yellow: 13, Blue: 26, Green: 39
    let offset = 0;
    if (color === "yellow") offset = 13;
    else if (color === "blue") offset = 26;
    else if (color === "green") offset = 39;
    
    // If localPos is in home stretch (>= 50 for logic)
    if (localPos >= 50) return -1; // Special handling for home stretch
    
    return (localPos + offset) % 52;
  };

  // AI Logic
  useEffect(() => {
    if (!gameStarted) return;
    const currentPlayer = PLAYERS[gameState.currentPlayerIndex];
    
    // If it's not Red (User), it's AI
    if (currentPlayer !== "red" && (gameState.waitingForDice || gameState.waitingForMove)) {
      const timer = setTimeout(() => {
        if (gameState.waitingForDice) {
          rollDice();
        } else if (gameState.waitingForMove) {
          aiMove();
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [gameState, gameStarted]);

  const addLog = (msg: string) => {
    setGameState(prev => ({
      ...prev,
      logs: [msg, ...prev.logs].slice(0, 5)
    }));
  };

  const rollDice = () => {
    if (!gameState.waitingForDice) return;
    
    const value = Math.floor(Math.random() * 6) + 1;
    
    setGameState(prev => ({
      ...prev,
      diceValue: value,
      waitingForDice: false,
      waitingForMove: true
    }));
  };

  const getMovablePieces = (state: GameState, val: number) => {
    const player = PLAYERS[state.currentPlayerIndex];
    const pieces = state.pieces[player];
    return pieces.filter(p => {
      if (p.position === 99) return false; // Finished
      if (p.position === -1) {
        // Hangar: Need 6 to launch
        return val === 6;
      }
      // On board
      const dist = p.distance + val;
      if (dist > 56) return false; // 50 (track) + 6 (home)
      return true;
    });
  };

  // Effect to check if no moves available
  useEffect(() => {
    if (gameState.waitingForMove && gameState.diceValue) {
      const movables = getMovablePieces(gameState, gameState.diceValue);
      if (movables.length === 0) {
        setTimeout(() => nextTurn(), 1000);
      }
    }
  }, [gameState.waitingForMove, gameState.diceValue]);

  const nextTurn = () => {
    setGameState(prev => {
      let nextPlayerIndex = prev.currentPlayerIndex;
      let nextConsecutiveSixes = prev.consecutiveSixes;
      
      if (prev.diceValue === 6) {
        if (prev.consecutiveSixes >= 2) {
          nextPlayerIndex = (prev.currentPlayerIndex + 1) % 4;
          nextConsecutiveSixes = 0;
          addLog(t("games.flying_chess.turn_change_limit", "Turn passed (3x Sixes)"));
        } else {
          nextConsecutiveSixes += 1;
          addLog(t("games.flying_chess.bonus_turn", "Bonus Turn (Rolled 6)!"));
        }
      } else {
        nextPlayerIndex = (prev.currentPlayerIndex + 1) % 4;
        nextConsecutiveSixes = 0;
      }

      return {
        ...prev,
        currentPlayerIndex: nextPlayerIndex,
        diceValue: null,
        waitingForDice: true,
        waitingForMove: false,
        consecutiveSixes: nextConsecutiveSixes
      };
    });
  };

  const handleMove = (pieceIndex: number) => {
    if (!gameState.waitingForMove || !gameState.diceValue) return;
    
    const player = PLAYERS[gameState.currentPlayerIndex];
    const pieces = [...gameState.pieces[player]];
    const piece = pieces[pieceIndex];
    const val = gameState.diceValue;

    // Logic
    let newDistance = piece.distance;
    let newPosition = piece.position;
    let msg = "";

    if (piece.position === -1) {
      if (val === 6) {
        newPosition = 0; // Start point
        newDistance = 0;
        msg = t("games.flying_chess.launched", "Launched!");
      } else {
        return; // Invalid move
      }
    } else {
      newDistance += val;
      
      if (newDistance > 56) {
        const overshoot = newDistance - 56;
        newDistance = 56 - overshoot;
      }
      
      const moved = applyMoveLogic(player, newDistance);
      newDistance = moved.distance;
      msg = moved.msg || t("games.flying_chess.moved", "Moved");
      
      if (newDistance === 56) {
        newPosition = 99; // Finished
        msg = t("games.flying_chess.finished", "Finished!");
      } else {
        newPosition = newDistance; 
      }
    }

    // Interaction with others (Kick)
    let myGlobalPos = -1;
    if (newPosition !== -1 && newPosition !== 99 && newDistance <= 50) {
      myGlobalPos = getGlobalPos(player, newDistance);
    }
    
    const newPieces = { ...gameState.pieces };
    newPieces[player] = pieces;
    pieces[pieceIndex] = { ...piece, position: newPosition, distance: newDistance };

    // Check collision
    if (myGlobalPos !== -1) {
      PLAYERS.forEach(p => {
        if (p === player) return;
        newPieces[p] = newPieces[p].map(enemy => {
          if (enemy.position !== -1 && enemy.position !== 99 && enemy.distance <= 50) {
            const enemyGlobal = getGlobalPos(p, enemy.distance);
            if (enemyGlobal === myGlobalPos) {
              addLog(`${t("games.flying_chess.kicked_msg", "Kicked!")} ${t(`games.flying_chess.${p}`)}`);
              return { ...enemy, position: -1, distance: 0 };
            }
          }
          return enemy;
        });
      });
    }

    setGameState(prev => ({
      ...prev,
      pieces: newPieces,
      waitingForMove: false 
    }));
    
    addLog(msg);
    setTimeout(nextTurn, 500);
  };
  
  const applyMoveLogic = (color: PlayerColor, dist: number): { distance: number, msg: string } => {
    if (dist > 56) return { distance: 56 - (dist - 56), msg: "Bounce" };
    if (dist > 50) return { distance: dist, msg: "" }; 

    let offset = 0;
    if (color === "yellow") offset = 13;
    else if (color === "blue") offset = 26;
    else if (color === "green") offset = 39;
    
    let globalIdx = (dist + offset) % 52;
    let msg = "";

    const colorIdx = PLAYERS.indexOf(color); 
    const spotColorIdx = globalIdx % 4;
    
    if (colorIdx === spotColorIdx) {
       dist += 4;
       msg = t("games.flying_chess.jump", "Jump!");
       
       // Chain Jump? Usually not recursive in simple implementations, but standard rules allow it.
       // For MVP, single jump.
       
       // Check Fly (e.g., if landing on spot 18 relative to start?)
       // Simplified: No Fly for now, just Jump.
    }
    
    return { distance: dist, msg };
  };

  const aiMove = () => {
    const player = PLAYERS[gameState.currentPlayerIndex];
    const val = gameState.diceValue!;
    const movables = gameState.pieces[player]
      .map((p, i) => ({ ...p, idx: i }))
      .filter(p => {
        if (p.position === 99) return false;
        if (p.position === -1) return val === 6;
        if (p.distance + val > 56) return false;
        return true;
      });

    if (movables.length === 0) return;

    let selected = movables[0];
    
    if (difficulty === "easy") {
      selected = movables[Math.floor(Math.random() * movables.length)];
    } else {
      let bestScore = -1000;
      
      movables.forEach(m => {
        let score = 0;
        if (m.position === -1) score += 50; 
        
        // Prefer moving closer to finish
        score += m.distance;

        if (difficulty === "hard") {
           score += Math.random() * 20;
        } else {
           score += Math.random() * 10;
        }
        
        if (score > bestScore) {
          bestScore = score;
          selected = m;
        }
      });
    }

    handleMove(selected.idx);
  };

  const getCoordinates = (color: PlayerColor, distance: number, position: number) => {
    if (position === -1) {
      const base = {
        red: { x: 90, y: 90 },
        yellow: { x: 10, y: 90 },
        blue: { x: 10, y: 10 },
        green: { x: 90, y: 10 }
      }[color];
      return base;
    }
    if (position === 99) {
      return { x: 50, y: 50 };
    }
    
    const visualIdx = getGlobalPos(color, distance);
    if (visualIdx === -1) {
       const stepsInHome = distance - 50; 
       if (color === "red") return { x: 50, y: 85 - stepsInHome * 6 };
       if (color === "yellow") return { x: 15 + stepsInHome * 6, y: 50 };
       if (color === "blue") return { x: 50, y: 15 + stepsInHome * 6 };
       if (color === "green") return { x: 85 - stepsInHome * 6, y: 50 };
       return { x: 50, y: 50 };
    }
    
    if (visualIdx < 13) { 
      return { x: 85 - (visualIdx) * (70/12), y: 85 };
    } else if (visualIdx < 26) { 
      return { x: 15, y: 85 - (visualIdx - 13) * (70/12) };
    } else if (visualIdx < 39) { 
      return { x: 15 + (visualIdx - 26) * (70/12), y: 15 };
    } else { 
      return { x: 85, y: 15 + (visualIdx - 39) * (70/12) };
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-4xl w-full">
        <div className="flex items-center mb-6">
          <Link to="/games" className="mr-4">
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
              <ArrowLeft className="w-6 h-6" />
            </button>
          </Link>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Plane className="w-8 h-8 text-blue-500" />
            {t("games.flying_chess.title", "Flying Chess")}
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 aspect-square relative bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden border-4 border-slate-200 dark:border-slate-700">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <rect x="15" y="15" width="70" height="70" fill="none" stroke="#e2e8f0" strokeWidth="8" rx="4" />
              
              <line x1="50" y1="85" x2="50" y2="50" stroke={COLORS.red} strokeWidth="6" strokeDasharray="1 1" />
              <line x1="15" y1="50" x2="50" y2="50" stroke={COLORS.yellow} strokeWidth="6" strokeDasharray="1 1" />
              <line x1="50" y1="15" x2="50" y2="50" stroke={COLORS.blue} strokeWidth="6" strokeDasharray="1 1" />
              <line x1="85" y1="50" x2="50" y2="50" stroke={COLORS.green} strokeWidth="6" strokeDasharray="1 1" />
              
              <circle cx="50" cy="50" r="5" fill="#64748b" />
              
              <rect x="80" y="80" width="20" height="20" fill={COLORS.red} opacity="0.2" />
              <rect x="0" y="80" width="20" height="20" fill={COLORS.yellow} opacity="0.2" />
              <rect x="0" y="0" width="20" height="20" fill={COLORS.blue} opacity="0.2" />
              <rect x="80" y="0" width="20" height="20" fill={COLORS.green} opacity="0.2" />

              {PLAYERS.map(player => (
                gameState.pieces[player].map((piece, i) => {
                  const coords = getCoordinates(player, piece.distance, piece.position);
                  let { x, y } = coords;
                  if (piece.position === -1) {
                    if (i === 1) x += 5;
                    if (i === 2) y += 5;
                    if (i === 3) { x += 5; y += 5; }
                  }
                  
                  return (
                    <g 
                      key={`${player}-${i}`}
                      onClick={() => player === PLAYERS[gameState.currentPlayerIndex] && handleMove(i)}
                      style={{ cursor: player === PLAYERS[gameState.currentPlayerIndex] ? "pointer" : "default", transition: "all 0.3s ease" }}
                    >
                      <circle cx={x} cy={y} r="3" fill={COLORS[player]} stroke="white" strokeWidth="1" className="transition-all duration-300" />
                      {player === PLAYERS[gameState.currentPlayerIndex] && 
                       gameState.waitingForMove && 
                       gameState.diceValue && 
                       getMovablePieces(gameState, gameState.diceValue).find(p => p.id === i) && (
                         <circle cx={x} cy={y} r="4" fill="none" stroke="white" strokeWidth="0.5" className="animate-ping" />
                       )}
                    </g>
                  );
                })
              ))}
            </svg>
            
            {!gameStarted && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-2xl text-center">
                  <h2 className="text-2xl font-bold mb-4">{t("games.flying_chess.title", "Flying Chess")}</h2>
                  <div className="flex gap-4 mb-6 justify-center">
                    {(["easy", "medium", "hard"] as const).map((d) => (
                      <button
                        key={d}
                        onClick={() => setDifficulty(d)}
                        className={`px-4 py-2 rounded-lg capitalize ${
                          difficulty === d 
                            ? "bg-blue-600 text-white" 
                            : "bg-gray-200 dark:bg-gray-700"
                        }`}
                      >
                        {t(`games.flying_chess.${d}`, d)}
                      </button>
                    ))}
                  </div>
                  <button 
                    onClick={() => setGameStarted(true)} 
                    className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg flex items-center justify-center hover:bg-blue-700"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    {t("games.start", "Start Game")}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">{t("games.flying_chess.status", "Game Status")}</h3>
                <button 
                  onClick={() => setGameStarted(false)}
                  className="p-2 border rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
              
              <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className="text-center">
                  <div className="text-sm text-gray-500 mb-1">{t("games.flying_chess.turn", "Turn")}</div>
                  <div className="font-bold capitalize" style={{ color: COLORS[PLAYERS[gameState.currentPlayerIndex]] }}>
                    {t(`games.flying_chess.${PLAYERS[gameState.currentPlayerIndex]}`)}
                  </div>
                </div>
                
                <div className="flex flex-col items-center">
                  <div className={`w-16 h-16 flex items-center justify-center rounded-xl text-3xl font-bold border-4
                    ${gameState.waitingForDice ? "animate-pulse border-blue-400" : "border-gray-200"}
                  `}>
                    {gameState.diceValue || "?"}
                  </div>
                  {gameState.waitingForDice && PLAYERS[gameState.currentPlayerIndex] === "red" && (
                    <button 
                      onClick={rollDice} 
                      className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      {t("games.flying_chess.roll", "Roll")}
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {gameState.logs.map((log, i) => (
                  <div key={i} className="text-sm text-gray-600 dark:text-gray-400 border-b pb-1">
                    {log}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border">
              <h3 className="font-semibold mb-2">{t("games.flying_chess.rules", "Rules")}</h3>
              <ul className="text-sm text-gray-600 dark:text-gray-400 list-disc pl-4 space-y-1">
                <li>{t("games.flying_chess.rule1", "Roll 6 to launch a plane.")}</li>
                <li>{t("games.flying_chess.rule2", "Land on same color to jump.")}</li>
                <li>{t("games.flying_chess.rule3", "Land on opponent to kick them back.")}</li>
                <li>{t("games.flying_chess.rule4", "First to move all planes to center wins.")}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlyingChess;
