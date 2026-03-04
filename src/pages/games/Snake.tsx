import { useState, useEffect, useCallback, useRef } from "react";
import { Play, RotateCcw, Trophy } from "lucide-react";

const GRID_SIZE = 20;
const CELL_SIZE = 20;
const INITIAL_SPEED = 150;

type Point = { x: number; y: number };
type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";

export default function Snake() {
  const [snake, setSnake] = useState<Point[]>([{ x: 10, y: 10 }]);
  const [food, setFood] = useState<Point>({ x: 15, y: 15 });
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const gameLoopRef = useRef<number | null>(null);
  const directionRef = useRef<Direction>("RIGHT"); // To prevent multiple direction changes in one tick

  useEffect(() => {
    const saved = localStorage.getItem("snake-highscore");
    if (saved) setHighScore(parseInt(saved));
  }, []);

  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem("snake-highscore", score.toString());
    }
  }, [score, highScore]);

  const generateFood = useCallback((currentSnake: Point[]): Point => {
    let newFood;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      const isOnSnake = currentSnake.some(
        (segment) => segment.x === newFood.x && segment.y === newFood.y
      );
      if (!isOnSnake) break;
    }
    return newFood;
  }, []);

  const resetGame = () => {
    setSnake([{ x: 10, y: 10 }]);
    setFood(generateFood([{ x: 10, y: 10 }]));
    directionRef.current = "RIGHT";
    setScore(0);
    setGameOver(false);
    setIsPlaying(true);
  };

  const moveSnake = useCallback(() => {
    if (gameOver) return;

    setSnake((prevSnake) => {
      const head = prevSnake[0];
      const newHead = { ...head };

      switch (directionRef.current) {
        case "UP":
          newHead.y -= 1;
          break;
        case "DOWN":
          newHead.y += 1;
          break;
        case "LEFT":
          newHead.x -= 1;
          break;
        case "RIGHT":
          newHead.x += 1;
          break;
      }

      // Check collision with walls
      if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
        setGameOver(true);
        setIsPlaying(false);
        return prevSnake;
      }

      // Check collision with self
      if (prevSnake.some((segment) => segment.x === newHead.x && segment.y === newHead.y)) {
        setGameOver(true);
        setIsPlaying(false);
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];

      // Check food
      if (newHead.x === food.x && newHead.y === food.y) {
        setScore((s) => s + 1);
        setFood(generateFood(newSnake));
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [food, gameOver, generateFood]);

  useEffect(() => {
    if (isPlaying && !gameOver) {
      gameLoopRef.current = window.setInterval(moveSnake, Math.max(50, INITIAL_SPEED - score * 2));
    } else {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    }
    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [isPlaying, gameOver, moveSnake, score]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPlaying) return;

      switch (e.key) {
        case "ArrowUp":
          if (directionRef.current !== "DOWN") {
            directionRef.current = "UP";
          }
          break;
        case "ArrowDown":
          if (directionRef.current !== "UP") {
            directionRef.current = "DOWN";
          }
          break;
        case "ArrowLeft":
          if (directionRef.current !== "RIGHT") {
            directionRef.current = "LEFT";
          }
          break;
        case "ArrowRight":
          if (directionRef.current !== "LEFT") {
            directionRef.current = "RIGHT";
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPlaying]);

  return (
    <div
      className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] space-y-6 outline-none"
      tabIndex={0}
    >
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Snake Game</h1>
        <p className="text-gray-600">Use arrow keys to control the snake</p>
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
          className="relative bg-gray-900"
          style={{
            width: GRID_SIZE * CELL_SIZE,
            height: GRID_SIZE * CELL_SIZE,
          }}
        >
          {snake.map((segment, i) => (
            <div
              key={`${segment.x}-${segment.y}-${i}`}
              className="absolute bg-green-500 rounded-sm"
              style={{
                left: segment.x * CELL_SIZE,
                top: segment.y * CELL_SIZE,
                width: CELL_SIZE - 2,
                height: CELL_SIZE - 2,
                opacity: i === 0 ? 1 : 0.6,
                zIndex: i === 0 ? 10 : 1,
              }}
            />
          ))}
          <div
            className="absolute bg-red-500 rounded-full animate-pulse"
            style={{
              left: food.x * CELL_SIZE,
              top: food.y * CELL_SIZE,
              width: CELL_SIZE - 2,
              height: CELL_SIZE - 2,
            }}
          />
        </div>

        {(!isPlaying || gameOver) && (
          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white backdrop-blur-sm">
            {gameOver && <div className="text-3xl font-bold text-red-400 mb-4">Game Over!</div>}
            <button
              onClick={resetGame}
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
