import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeft, RefreshCw, Play, Trophy, Hexagon } from "lucide-react";
import { Link } from "react-router-dom";

// --- Game Constants & Logic ---

// Board Constants
// We use axial coordinates (q, r).
// The board is a hexagram.
// Radius 4 (0 to 4 rings from center? No, standard is 121 holes).
// Triangle side = 5 holes.
// Center is (0,0).
// Let's define the valid board map.
// To generate a star shape of size 4 (standard):
// It's the union of two large triangles.
// One triangle (pointing up): q <= 4, r <= 4, s <= 4  (where s = -q-r)
// Wait, let's use a simpler generation method.
// Center (0,0).
// Range for standard board:
// q, r, s such that |q| <= 4 AND |r| <= 4 AND |s| <= 4 ? No, that's a hexagon.
// Star shape:
// A Hexagon of size 4 + 6 triangles of size 4 attached?
// Let's manually define the constraints for a standard Chinese Checkers board.
// Standard board has 121 positions.
// It effectively fits in a large triangle of side 13, but with corners cut.
// Let's use the standard "Star" generation logic.
// Center 0,0.
// Valid if distance from center <= 4 OR (distance from center <= 8 AND in one of the 6 points).

const BOARD_RADIUS = 4; // The inner hexagon radius
const TRIANGLE_SIZE = 4; // The points

const DIRECTIONS = [
  { q: 1, r: 0 }, { q: 1, r: -1 }, { q: 0, r: -1 },
  { q: -1, r: 0 }, { q: -1, r: 1 }, { q: 0, r: 1 }
];

interface Point {
  q: number;
  r: number;
}

interface Piece {
  id: number;
  owner: "player" | "ai"; // 1 (Player/Green/Bottom) vs 2 (AI/Red/Top)
  q: number;
  r: number;
}

// Generate valid board positions
const generateBoard = (): Point[] => {
  const points: Point[] = [];
  // We scan a large area and filter.
  for (let q = -8; q <= 8; q++) {
    for (let r = -8; r <= 8; r++) {
      const s = -q - r;
      // Check if inside the star
      // Condition for Star:
      // (|q| <= 4 AND |r| <= 4 AND |s| <= 4) is the inner hexagon? No.
      // Standard star Logic:
      // It's a union of two large triangles inverted.
      // Triangle 1 (Points Top/Bottom-Left/Bottom-Right):  s <= 4, q <= 4, r <= 4 ?? No.
      
      // Easier check:
      // Distance from center: max(|q|, |r|, |s|)
      // If dist <= 4: Inside inner hexagon.
      // If dist > 4: Must be in one of the 6 arms.
      // Arm conditions:
      // Top (Red): r <= -5 (and within cone)
      // Bottom (Green): r >= 5
      // etc.
      
      // Let's use the specific logic for 121 holes.
      // 1. Inner hexagon: |q| <= 4 AND |r| <= 4 AND |s| <= 4. (Actually, this gives a hexagon of side 5? radius 4).
      // 2. Arms.
      // Let's just hardcode the "is valid" function.
      
      if (isValidHex(q, r)) {
        points.push({ q, r });
      }
    }
  }
  return points;
};

const isValidHex = (q: number, r: number): boolean => {
  const s = -q - r;
  // Inner Hexagon (Radius 4)
  if (Math.abs(q) <= 4 && Math.abs(r) <= 4 && Math.abs(s) <= 4) return true;
  
  // Arms (Triangles of height 4 sticking out)
  // Top (AI Home): q in [-4, 4], r in [-8, -5], s in [?, ?]
  // Bottom (Player Home): q in [-4, 4], r in [5, 8]
  // Top-Right: q in [5, 8], r in [-8, -5] ... NO.
  
  // Correct Logic for Star:
  // It is the intersection of two large triangles? No.
  // It is the union of two large triangles.
  // Triangle 1 (Points N, SE, SW): r <= 4, s <= 4, q <= 4 ??? No.
  
  // Let's rely on the coordinate constraint:
  // One large triangle (Vertex at Top r=-8, Bottom-Right q=8, Bottom-Left s=8)
  // Constraints: r >= -8, q <= 8, s <= 8 ? (Pointing Down)
  // Let's try:
  // T1 (Pointing Up): r <= 4, q >= -4, s >= -4 ?
  
  // Let's simply check if it belongs to any of the 6 triangles or the center.
  // Actually, simpler:
  // Valid if (q,r,s) are within the board bounds.
  // Center Hexagon: max(|q|,|r|,|s|) <= 4
  // Triangle Top: r < -4 AND q <= 4 AND s <= 4 (Wait, s = -q-r. If r is -8, q=4, s=4. -4-8 = -12 != 8. Sum must be 0)
  
  // Let's use the property:
  // The board is defined by max(|q|, |r|, |s|) <= 8 AND (something to cut the gaps).
  // The gaps are where one coordinate is 0? No.
  // The gaps are where TWO coordinates have large absolute values of SAME SIGN? No.
  
  // Let's use the standard "triangle union" logic.
  // Triangle 1 (Points Top, Bottom-Left, Bottom-Right):
  //   q <= 4 AND r >= -4 AND s <= 4  (Inverted?)
  // Let's go with "Player Home" logic.
  // Player Home (Bottom): r > 4. Tip is r=8. Base is r=5.
  //   Triangle: r > 4 AND q <= 4 AND s <= 4. (Check: r=5, q=4 => s=-9. No. q range shrinks).
  //   Actually for Bottom Triangle: r > 4. And the sides are q >= -4 and s >= -4?
  //   Tip (0, 8, -8). Base row r=5: (-3, 5, -2)...
  
  // Let's just use the "Union of Two Large Triangles" definition which forms the Star of David shape.
  // Triangle A (Points Top, SE, SW): r <= 4, q >= -4, s >= -4 (Assuming standard orientation).
  // Triangle B (Points Bottom, NE, NW): r >= -4, q <= 4, s <= 4.
  // Intersection is the hexagon. Union is the Star.
  
  // Wait, let's test a point.
  // Top Tip: (0, -8, 8).
  // Triangle A check: -8 <= 4 (True), 0 >= -4 (True), 8 >= -4 (True). -> Inside Triangle A.
  // Triangle B check: -8 >= -4 (False).
  // So Top Tip is in A.
  
  // Bottom Tip: (0, 8, -8).
  // Triangle A check: 8 <= 4 (False).
  // Triangle B check: 8 >= -4 (True), 0 <= 4 (True), -8 <= 4 (True). -> Inside Triangle B.
  
  // So valid = Inside Triangle A OR Inside Triangle B.
  // A: r <= 4 AND q >= -4 AND s >= -4
  // B: r >= -4 AND q <= 4 AND s <= 4
  
  // Note: s = -q-r.
  
  const inA = r <= 4 && q >= -4 && s >= -4;
  const inB = r >= -4 && q <= 4 && s <= 4;
  
  return inA || inB;
};

// Initial Positions
// Player (Green) starts at Bottom (Triangle B tip). 
// Wait, Triangle B tip is (0, 8, -8)? 
// Let's verify Bottom Triangle: r >= 5.
// Tip (0, 8). Base row r=5.
// AI (Red) starts at Top (Triangle A tip). r <= -5.
const getInitialPieces = (): Piece[] => {
  const pieces: Piece[] = [];
  let id = 0;
  
  // Player (Bottom)
  // Zone: r > 4
  for (let q = -8; q <= 8; q++) {
    for (let r = 5; r <= 8; r++) {
       if (isValidHex(q, r)) {
         pieces.push({ id: id++, owner: "player", q, r });
       }
    }
  }
  
  // AI (Top)
  // Zone: r < -4
  for (let q = -8; q <= 8; q++) {
    for (let r = -8; r <= -5; r++) {
       if (isValidHex(q, r)) {
         pieces.push({ id: id++, owner: "ai", q, r });
       }
    }
  }
  
  return pieces;
};

// Game Logic Helpers

const getPieceAt = (pieces: Piece[], q: number, r: number) => 
  pieces.find(p => p.q === q && p.r === r);

// BFS to find all reachable points for a piece (single step or multi-jump)
// Chinese Checkers Rules:
// 1. Step to adjacent empty.
// 2. Jump over adjacent piece to empty (straight line). Can chain jumps.
// NOTE: A turn is EITHER one step OR a chain of jumps.
// Ideally, we calculate all reachable destinations.
// But standard UI often separates "Step" vs "Jump".
// However, standard digital implementation often just shows all reachable spots.
// "Reachable" means:
// - Adjacent empty spots (distance 1).
// - Jump reachable spots (distance > 1 via chain).
const getReachablePositions = (pieces: Piece[], startQ: number, startR: number): Point[] => {
  const visited = new Set<string>();
  const reachable: Point[] = [];
  const queue: Point[] = [];
  
  const posKey = (q: number, r: number) => `${q},${r}`;
  
  // 1. Adjacent Steps (Only if we haven't jumped yet? Usually distinct)
  // Actually, if you step, you stop. If you jump, you can continue.
  // So "Reachable" set is: { Adjacent Empty } UNION { All Chain Jump Destinations }.
  
  // Add Adjacent Empty
  DIRECTIONS.forEach(d => {
    const nq = startQ + d.q;
    const nr = startR + d.r;
    if (isValidHex(nq, nr) && !getPieceAt(pieces, nq, nr)) {
      reachable.push({ q: nq, r: nr });
    }
  });

  // BFS for Jumps
  const jumpQueue: Point[] = [{ q: startQ, r: startR }];
  const jumpVisited = new Set<string>();
  jumpVisited.add(posKey(startQ, startR));
  
  while (jumpQueue.length > 0) {
    const curr = jumpQueue.shift()!;
    
    DIRECTIONS.forEach(d => {
      // Check for jump: Neighbor has piece, Next has empty.
      const midQ = curr.q + d.q;
      const midR = curr.r + d.r;
      const destQ = curr.q + 2 * d.q;
      const destR = curr.r + 2 * d.r;
      
      if (isValidHex(destQ, destR)) {
        const midPiece = getPieceAt(pieces, midQ, midR);
        const destPiece = getPieceAt(pieces, destQ, destR);
        
        if (midPiece && !destPiece) {
          // Valid jump
          const key = posKey(destQ, destR);
          if (!jumpVisited.has(key)) {
            jumpVisited.add(key);
            jumpQueue.push({ q: destQ, r: destR });
            // Don't add to reachable if it's the start (circular jump)
            if (destQ !== startQ || destR !== startR) {
              reachable.push({ q: destQ, r: destR });
            }
          }
        }
      }
    });
  }
  
  // Unique
  const unique = new Map<string, Point>();
  reachable.forEach(p => unique.set(posKey(p.q, p.r), p));
  return Array.from(unique.values());
};

// AI Logic
// Heuristic: Distance to target corner.
// Player Target: Top (r=-8). AI Target: Bottom (r=8).
// AI (Red/Top) wants to maximize r.
// Player (Green/Bottom) wants to minimize r.
// Score = Sum (targetRow - p.r) ? No.
// AI wants to move pieces to r=8 (Bottom).
// So AI Score = Sum(p.r). Higher is better.
// Player Score = Sum(-p.r). (Since they want to go to -8).
// Or just Distance to Target Point (0, 8) for AI.

const getHeuristicScore = (pieces: Piece[], owner: "ai" | "player") => {
  let score = 0;
  const targetR = owner === "ai" ? 8 : -8; // AI aims for Bottom (8), Player aims for Top (-8)
  
  pieces.filter(p => p.owner === owner).forEach(p => {
    // Distance to (0, targetR). 
    // Hex distance: (abs(q1-q2) + abs(q1+r1 - q2-r2) + abs(r1-r2)) / 2
    // Target q=0, r=targetR.
    // dist = (abs(p.q - 0) + abs(p.q+p.r - targetR) + abs(p.r - targetR)) / 2
    const dist = (Math.abs(p.q) + Math.abs(p.q + p.r - targetR) + Math.abs(p.r - targetR)) / 2;
    score -= dist; // Closer is better (less negative)
  });
  
  return score;
};

// Check Win Condition
// Win if all pieces are in the target zone.
const checkWin = (pieces: Piece[], owner: "ai" | "player"): boolean => {
  const myPieces = pieces.filter(p => p.owner === owner);
  if (myPieces.length === 0) return false;
  
  // AI Target Zone: Bottom Triangle (r >= 5)
  // Player Target Zone: Top Triangle (r <= -5)
  const targetZoneCheck = owner === "ai" 
    ? (p: Piece) => p.r >= 5
    : (p: Piece) => p.r <= -5;
    
  return myPieces.every(targetZoneCheck);
};

const ChineseCheckers: React.FC = () => {
  const { t } = useTranslation();
  const [pieces, setPieces] = useState<Piece[]>(getInitialPieces());
  const [selectedPieceId, setSelectedPieceId] = useState<number | null>(null);
  const [reachable, setReachable] = useState<Point[]>([]);
  const [turn, setTurn] = useState<"player" | "ai">("player");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [winner, setWinner] = useState<"player" | "ai" | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [aiThinking, setAiThinking] = useState(false);

  // Board Points (Static)
  const boardPoints = useMemo(() => generateBoard(), []);

  // Handle Selection
  const handlePointClick = (q: number, r: number) => {
    if (winner || turn !== "player" || !gameStarted) return;

    // Check if clicked on a piece
    const clickedPiece = getPieceAt(pieces, q, r);
    
    if (clickedPiece && clickedPiece.owner === "player") {
      // Select Piece
      setSelectedPieceId(clickedPiece.id);
      const moves = getReachablePositions(pieces, q, r);
      setReachable(moves);
    } else if (selectedPieceId !== null) {
      // Check if clicked on a valid move
      const move = reachable.find(m => m.q === q && m.r === r);
      if (move) {
        // Execute Move
        executeMove(selectedPieceId, q, r);
      } else {
        // Deselect
        setSelectedPieceId(null);
        setReachable([]);
      }
    }
  };

  const executeMove = (pieceId: number, q: number, r: number) => {
    setPieces(prev => prev.map(p => p.id === pieceId ? { ...p, q, r } : p));
    setSelectedPieceId(null);
    setReachable([]);
    
    // Check Win
    // Need to check AFTER state update, but for simplicity check here with projected state
    // Actually, effect handles AI turn, let's check win in effect too or here.
    
    const nextPieces = pieces.map(p => p.id === pieceId ? { ...p, q, r } : p);
    if (checkWin(nextPieces, turn)) {
      setWinner(turn);
      setGameStarted(false);
    } else {
      setTurn(turn === "player" ? "ai" : "player");
    }
  };

  // AI Turn
  useEffect(() => {
    if (gameStarted && turn === "ai" && !winner) {
      setAiThinking(true);
      const timer = setTimeout(() => {
        makeAiMove();
        setAiThinking(false);
      }, 500); // Small delay for visual
      return () => clearTimeout(timer);
    }
  }, [turn, gameStarted, winner]);

  const makeAiMove = () => {
    // Find all possible moves for AI
    const aiPieces = pieces.filter(p => p.owner === "ai");
    let allMoves: { pieceId: number, dest: Point, score: number }[] = [];

    aiPieces.forEach(p => {
      const moves = getReachablePositions(pieces, p.q, p.r);
      moves.forEach(m => {
        // Evaluate Move
        // Create temp state
        const tempPieces = pieces.map(tp => tp.id === p.id ? { ...tp, q: m.q, r: m.r } : tp);
        
        let score = 0;
        
        // Base Score: Forward Progress
        // AI wants r to be larger (towards 8).
        const progress = m.r - p.r;
        score += progress * 10;
        
        // Heuristic: Distance to target
        // Current Distance
        // const currDist = (Math.abs(p.q) + Math.abs(p.q + p.r - 8) + Math.abs(p.r - 8)) / 2;
        // New Distance
        // const newDist = (Math.abs(m.q) + Math.abs(m.q + m.r - 8) + Math.abs(m.r - 8)) / 2;
        // score += (currDist - newDist) * 10; // Positive if got closer
        
        // Centrality (Prefer keeping pieces near q=0 to avoid getting stuck on sides?)
        // score -= Math.abs(m.q) * 0.5;

        // Difficulty Tuning
        if (difficulty === "easy") {
          score += Math.random() * 50; // High randomness
        } else if (difficulty === "medium") {
           // Pure Greedy + small random
           score += Math.random() * 5;
        } else {
           // Hard:
           // 1. Prefer moves that end in target zone if possible.
           if (m.r >= 5) score += 20;
           
           // 2. Avoid leaving pieces behind (r < -4)
           // If this piece is the trailing one (min r), big bonus to move it.
           const minR = Math.min(...aiPieces.map(ap => ap.r));
           if (p.r === minR) score += 15;
           
           // 3. Lookahead? (Too expensive for JS single thread without optimization? Maybe depth 1 is fine)
           // Let's stick to strong heuristic.
           
           // Hopping Bonus (Long jumps preferred)
           // Distance traveled
           const dist = Math.abs(m.r - p.r) + Math.abs(m.q - p.q); // rough
           score += dist; 
        }

        allMoves.push({ pieceId: p.id, dest: m, score });
      });
    });

    // Sort and Pick
    allMoves.sort((a, b) => b.score - a.score);
    
    if (allMoves.length > 0) {
      // Pick top 1 or random from top few
      const best = allMoves[0];
      // console.log("AI Best Move:", best);
      executeMove(best.pieceId, best.dest.q, best.dest.r);
    } else {
      // No moves? Pass? (Should not happen in Chinese Checkers unless fully blocked)
      setTurn("player");
    }
  };

  const restartGame = () => {
    setPieces(getInitialPieces());
    setTurn("player");
    setWinner(null);
    setSelectedPieceId(null);
    setReachable([]);
    setGameStarted(true);
  };

  // Rendering Helpers
  // Hex to Pixel
  // x = size * (3/2 * q)
  // y = size * (sqrt(3)/2 * q  +  sqrt(3) * r)
  const hexSize = 14; // Radius of a single hex
  const xOffset = 50; // Center %
  const yOffset = 50; // Center %
  const scale = 2.2; // Scaling factor for % coordinates

  const hexToPixel = (q: number, r: number) => {
    const x = scale * (3/2 * q);
    const y = scale * (Math.sqrt(3)/2 * q + Math.sqrt(3) * r);
    return { x: x + xOffset, y: y + yOffset };
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
            <Hexagon className="w-8 h-8 text-emerald-600" />
            {t("games.chinese_checkers.title", "Chinese Checkers")}
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Game Board */}
          <div className="lg:col-span-2 aspect-square relative bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden border-4 border-slate-200 dark:border-slate-700 flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-full h-full select-none">
              {/* Board Holes */}
              {boardPoints.map((pt, i) => {
                const { x, y } = hexToPixel(pt.q, pt.r);
                const isReachable = reachable.some(r => r.q === pt.q && r.r === pt.r);
                
                // Color zones
                let fill = "#e2e8f0"; // Default
                if (pt.r <= -5) fill = "#fee2e2"; // Top (AI Home) - Light Red
                if (pt.r >= 5) fill = "#dcfce7"; // Bottom (Player Home) - Light Green
                
                return (
                  <g key={`${pt.q},${pt.r}`} onClick={() => handlePointClick(pt.q, pt.r)}>
                    <circle 
                      cx={x} cy={y} r="2" 
                      fill={fill}
                      className="transition-colors"
                    />
                    {isReachable && (
                      <circle 
                        cx={x} cy={y} r="3.5" 
                        fill="none" stroke="#22c55e" strokeWidth="0.5" 
                        className="animate-pulse cursor-pointer" 
                        style={{ fill: "rgba(34, 197, 94, 0.3)" }}
                      />
                    )}
                  </g>
                );
              })}

              {/* Pieces */}
              {pieces.map(p => {
                const { x, y } = hexToPixel(p.q, p.r);
                const isSelected = p.id === selectedPieceId;
                const color = p.owner === "player" ? "#16a34a" : "#dc2626"; // Green vs Red
                
                return (
                  <circle
                    key={p.id}
                    cx={x} cy={y} r="2.8"
                    fill={color}
                    stroke={isSelected ? "white" : "none"}
                    strokeWidth={isSelected ? "0.5" : "0"}
                    className={`transition-all duration-300 ${
                      p.owner === "player" && turn === "player" ? "cursor-pointer hover:opacity-80" : ""
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePointClick(p.q, p.r);
                    }}
                    style={{
                      filter: isSelected ? "drop-shadow(0 0 2px rgba(0,0,0,0.5))" : "none"
                    }}
                  />
                );
              })}
            </svg>

            {/* Overlays */}
            {!gameStarted && !winner && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-2xl text-center">
                  <h2 className="text-2xl font-bold mb-4">{t("games.chinese_checkers.title", "Chinese Checkers")}</h2>
                  <div className="flex gap-4 mb-6 justify-center">
                    {(["easy", "medium", "hard"] as const).map((d) => (
                      <button
                        key={d}
                        onClick={() => setDifficulty(d)}
                        className={`px-4 py-2 rounded-lg capitalize ${
                          difficulty === d 
                            ? "bg-emerald-600 text-white" 
                            : "bg-gray-200 dark:bg-gray-700"
                        }`}
                      >
                        {t(`games.chinese_checkers.${d}`, d)}
                      </button>
                    ))}
                  </div>
                  <button 
                    onClick={restartGame} 
                    className="w-full bg-emerald-600 text-white px-6 py-3 rounded-lg flex items-center justify-center hover:bg-emerald-700"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    {t("games.start", "Start Game")}
                  </button>
                </div>
              </div>
            )}

            {winner && (
               <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                 <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-2xl text-center animate-in zoom-in">
                   <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                   <h2 className="text-2xl font-bold mb-2">
                     {winner === "player" ? t("games.chinese_checkers.win", "You Win!") : t("games.chinese_checkers.lose", "AI Wins!")}
                   </h2>
                   <button 
                     onClick={restartGame} 
                     className="mt-4 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                   >
                     {t("games.restart", "Play Again")}
                   </button>
                 </div>
               </div>
            )}
          </div>

          {/* Controls & Status */}
          <div className="flex flex-col gap-4">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">{t("games.chinese_checkers.status", "Game Status")}</h3>
                <button 
                  onClick={() => setGameStarted(false)}
                  className="p-2 border rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
              
              <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className="text-center">
                  <div className="text-sm text-gray-500 mb-1">{t("games.chinese_checkers.turn", "Turn")}</div>
                  <div className={`font-bold flex items-center gap-2 ${turn === "player" ? "text-emerald-600" : "text-red-600"}`}>
                    {turn === "player" ? t("games.chinese_checkers.you") : t("games.chinese_checkers.ai")}
                    {aiThinking && <RefreshCw className="w-3 h-3 animate-spin" />}
                  </div>
                </div>
              </div>

              <div className="text-sm text-gray-500 text-center">
                 {t("games.chinese_checkers.desc", "Move all your pieces to the opposite triangle.")}
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border">
              <h3 className="font-semibold mb-2">{t("games.chinese_checkers.rules", "Rules")}</h3>
              <ul className="text-sm text-gray-600 dark:text-gray-400 list-disc pl-4 space-y-1">
                <li>{t("games.chinese_checkers.rule1", "Move to adjacent empty hole.")}</li>
                <li>{t("games.chinese_checkers.rule2", "Jump over adjacent piece to empty hole.")}</li>
                <li>{t("games.chinese_checkers.rule3", "Chain jumps are allowed.")}</li>
                <li>{t("games.chinese_checkers.rule4", "First to fill opposite triangle wins.")}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChineseCheckers;
