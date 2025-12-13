import { useState, useEffect, useCallback, useRef } from "react";
import { Play, RotateCcw, Trophy } from "lucide-react";

const ROWS = 20;
const COLS = 10;
const BLOCK_SIZE = 24;

const SHAPES = {
  I: [[1, 1, 1, 1]],
  J: [
    [1, 0, 0],
    [1, 1, 1],
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1],
  ],
  O: [
    [1, 1],
    [1, 1],
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1],
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
  ],
};

const COLORS = {
  I: "bg-cyan-500",
  J: "bg-blue-500",
  L: "bg-orange-500",
  O: "bg-yellow-500",
  S: "bg-green-500",
  T: "bg-purple-500",
  Z: "bg-red-500",
};

type ShapeType = keyof typeof SHAPES;

type Tetromino = {
  shape: number[][];
  type: ShapeType;
  x: number;
  y: number;
};

const createBoard = () => Array.from({ length: ROWS }, () => Array(COLS).fill(null));

export default function Tetris() {
  const [board, setBoard] = useState<(string | null)[][]>(createBoard());
  const [currentPiece, setCurrentPiece] = useState<Tetromino | null>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const gameLoopRef = useRef<number | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("tetris-highscore");
    if (saved) setHighScore(parseInt(saved));
  }, []);

  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem("tetris-highscore", score.toString());
    }
  }, [score, highScore]);

  const generatePiece = useCallback((): Tetromino => {
    const types = Object.keys(SHAPES) as ShapeType[];
    const type = types[Math.floor(Math.random() * types.length)];
    const shape = SHAPES[type];
    return {
      shape,
      type,
      x: Math.floor(COLS / 2) - Math.floor(shape[0].length / 2),
      y: 0,
    };
  }, []);

  const isValidMove = useCallback(
    (piece: Tetromino, newX: number, newY: number, newShape?: number[][]) => {
      const shape = newShape || piece.shape;
      for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
          if (shape[r][c]) {
            const nextX = newX + c;
            const nextY = newY + r;

            if (
              nextX < 0 ||
              nextX >= COLS ||
              nextY >= ROWS ||
              (nextY >= 0 && board[nextY][nextX])
            ) {
              return false;
            }
          }
        }
      }
      return true;
    },
    [board]
  );

  const rotatePiece = useCallback(() => {
    if (!currentPiece || gameOver || !isPlaying) return;

    const newShape = currentPiece.shape[0].map((_, i) =>
      currentPiece.shape.map((row) => row[i]).reverse()
    );

    if (isValidMove(currentPiece, currentPiece.x, currentPiece.y, newShape)) {
      setCurrentPiece({ ...currentPiece, shape: newShape });
    }
  }, [currentPiece, isValidMove, gameOver, isPlaying]);

  const movePiece = useCallback(
    (dx: number, dy: number) => {
      if (!currentPiece || gameOver || !isPlaying) return;

      if (isValidMove(currentPiece, currentPiece.x + dx, currentPiece.y + dy)) {
        setCurrentPiece({
          ...currentPiece,
          x: currentPiece.x + dx,
          y: currentPiece.y + dy,
        });
        return true;
      }
      return false;
    },
    [currentPiece, isValidMove, gameOver, isPlaying]
  );

  const lockPiece = useCallback(() => {
    if (!currentPiece) return;

    const newBoard = board.map((row) => [...row]);
    let linesCleared = 0;

    // Place piece
    currentPiece.shape.forEach((row, r) => {
      row.forEach((cell, c) => {
        if (cell) {
          const boardY = currentPiece.y + r;
          const boardX = currentPiece.x + c;
          if (boardY >= 0 && boardY < ROWS && boardX >= 0 && boardX < COLS) {
            newBoard[boardY][boardX] = COLORS[currentPiece.type];
          }
        }
      });
    });

    // Check lines
    for (let r = ROWS - 1; r >= 0; r--) {
      if (newBoard[r].every((cell) => cell !== null)) {
        newBoard.splice(r, 1);
        newBoard.unshift(Array(COLS).fill(null));
        linesCleared++;
        r++; // Check same row again
      }
    }

    if (linesCleared > 0) {
      setScore((s) => s + linesCleared * 100 * linesCleared); // Bonus for multiple lines
    }

    setBoard(newBoard);

    // Check game over
    const newPiece = generatePiece();
    if (!isValidMove(newPiece, newPiece.x, newPiece.y)) {
      setGameOver(true);
      setIsPlaying(false);
    } else {
      setCurrentPiece(newPiece);
    }
  }, [currentPiece, board, generatePiece, isValidMove]);

  useEffect(() => {
    if (isPlaying && !gameOver) {
      gameLoopRef.current = window.setInterval(() => {
        if (!movePiece(0, 1)) {
          lockPiece();
        }
      }, 800 - Math.min(700, Math.floor(score / 500) * 50)); // Speed up
    }
    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [isPlaying, gameOver, movePiece, lockPiece, score]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPlaying || gameOver) return;

      switch (e.key) {
        case "ArrowLeft": movePiece(-1, 0); break;
        case "ArrowRight": movePiece(1, 0); break;
        case "ArrowDown": movePiece(0, 1); break;
        case "ArrowUp": rotatePiece(); break;
        case " ": { // Hard drop
          let dropY = 0;
          while (isValidMove(currentPiece!, currentPiece!.x, currentPiece!.y + dropY + 1)) {
            dropY++;
          }
          movePiece(0, dropY);
          break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPlaying, gameOver, movePiece, rotatePiece, currentPiece, isValidMove]);

  const startGame = () => {
    setBoard(createBoard());
    setCurrentPiece(generatePiece());
    setScore(0);
    setGameOver(false);
    setIsPlaying(true);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] space-y-6 outline-none" tabIndex={0}>
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Tetris</h1>
        <p className="text-gray-600">Arrows to move/rotate, Space to drop</p>
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
          <div className="text-2xl font-bold text-purple-600">{highScore}</div>
        </div>
      </div>

      <div className="relative bg-gray-900 rounded-lg shadow-lg p-1 border-4 border-gray-800">
        <div
          className="relative bg-gray-900 grid gap-[1px]"
          style={{
            gridTemplateColumns: `repeat(${COLS}, ${BLOCK_SIZE}px)`,
            gridTemplateRows: `repeat(${ROWS}, ${BLOCK_SIZE}px)`,
          }}
        >
          {board.map((row, r) =>
            row.map((cell, c) => {
              let color = cell ? cell : "bg-gray-800/50";
              // Overlay current piece
              if (currentPiece && isPlaying && !gameOver) {
                const pieceRow = r - currentPiece.y;
                const pieceCol = c - currentPiece.x;
                if (
                  pieceRow >= 0 &&
                  pieceRow < currentPiece.shape.length &&
                  pieceCol >= 0 &&
                  pieceCol < currentPiece.shape[pieceRow].length &&
                  currentPiece.shape[pieceRow][pieceCol]
                ) {
                  color = COLORS[currentPiece.type];
                }
              }

              return (
                <div
                  key={`${r}-${c}`}
                  className={`${color} w-full h-full rounded-[1px] transition-colors duration-75`}
                />
              );
            })
          )}
        </div>

        {(!isPlaying || gameOver) && (
          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white backdrop-blur-sm z-10">
            {gameOver && <div className="text-3xl font-bold text-red-400 mb-4">Game Over!</div>}
            <button
              onClick={startGame}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-full font-bold transition-colors"
            >
              {gameOver ? <RotateCcw className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              {gameOver ? "Try Again" : "Start Game"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
