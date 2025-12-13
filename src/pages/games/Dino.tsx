import { useState, useEffect, useRef, useCallback } from "react";
import { Play, RotateCcw, Trophy } from "lucide-react";

const GRAVITY = 0.6;
const JUMP_FORCE = -10;
const GROUND_Y = 150;
const DINO_X = 50;
const DINO_WIDTH = 40;
const DINO_HEIGHT = 40;
const OBSTACLE_WIDTH = 20;
const OBSTACLE_HEIGHT = 40;
const GAME_WIDTH = 600;
const GAME_HEIGHT = 200;

export default function Dino() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  const dinoY = useRef(GROUND_Y);
  const dinoVelocity = useRef(0);
  const obstacles = useRef<{ x: number; type: number }[]>([]);
  const animationRef = useRef<number | null>(null);
  const scoreRef = useRef(0);
  const lastTimeRef = useRef(0);
  const speedRef = useRef(5);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("dino-highscore");
    if (saved) setHighScore(parseInt(saved));
  }, []);

  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem("dino-highscore", score.toString());
    }
  }, [score, highScore]);

  const jump = useCallback(() => {
    if (dinoY.current === GROUND_Y) {
      dinoVelocity.current = JUMP_FORCE;
    }
  }, []);

  const update = useCallback((time: number) => {
    if (!lastTimeRef.current) lastTimeRef.current = time;
    lastTimeRef.current = time;

    // Physics
    dinoVelocity.current += GRAVITY;
    dinoY.current += dinoVelocity.current;

    if (dinoY.current > GROUND_Y) {
      dinoY.current = GROUND_Y;
      dinoVelocity.current = 0;
    }

    // Obstacles
    speedRef.current = 5 + scoreRef.current * 0.005; // Increase speed
    obstacles.current.forEach((obs) => {
      obs.x -= speedRef.current;
    });

    // Remove off-screen obstacles
    if (obstacles.current.length > 0 && obstacles.current[0].x < -OBSTACLE_WIDTH) {
      obstacles.current.shift();
      scoreRef.current += 1;
      setScore(scoreRef.current);
    }

    // Add new obstacles
    if (
      obstacles.current.length === 0 ||
      GAME_WIDTH - obstacles.current[obstacles.current.length - 1].x > Math.random() * 300 + 200
    ) {
      obstacles.current.push({
        x: GAME_WIDTH,
        type: Math.random() > 0.5 ? 1 : 0, // simple variety
      });
    }

    // Collision detection
    const dinoRect = {
      x: DINO_X + 5, // hitbox adjustment
      y: dinoY.current + 5,
      w: DINO_WIDTH - 10,
      h: DINO_HEIGHT - 10,
    };

    for (const obs of obstacles.current) {
      const obsRect = {
        x: obs.x,
        y: GROUND_Y + (DINO_HEIGHT - OBSTACLE_HEIGHT), // Aligned to bottom
        w: OBSTACLE_WIDTH,
        h: OBSTACLE_HEIGHT,
      };

      if (
        dinoRect.x < obsRect.x + obsRect.w &&
        dinoRect.x + dinoRect.w > obsRect.x &&
        dinoRect.y < obsRect.y + obsRect.h &&
        dinoRect.y + dinoRect.h > obsRect.y
      ) {
        setGameOver(true);
        setIsPlaying(false);
        return; // Stop loop
      }
    }

    // Draw
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

      // Ground
      ctx.beginPath();
      ctx.moveTo(0, GROUND_Y + DINO_HEIGHT);
      ctx.lineTo(GAME_WIDTH, GROUND_Y + DINO_HEIGHT);
      ctx.strokeStyle = "#555";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Dino
      ctx.fillStyle = "#333";
      ctx.fillRect(DINO_X, dinoY.current, DINO_WIDTH, DINO_HEIGHT);
      // Eye
      ctx.fillStyle = "#fff";
      ctx.fillRect(DINO_X + 25, dinoY.current + 5, 5, 5);

      // Obstacles
      ctx.fillStyle = "#e02424";
      obstacles.current.forEach((obs) => {
        ctx.fillRect(obs.x, GROUND_Y + (DINO_HEIGHT - OBSTACLE_HEIGHT), OBSTACLE_WIDTH, OBSTACLE_HEIGHT);
      });
    }

    if (isPlaying) {
      animationRef.current = requestAnimationFrame(update);
    }
  }, [isPlaying]);

  useEffect(() => {
    if (isPlaying && !gameOver) {
      lastTimeRef.current = 0;
      animationRef.current = requestAnimationFrame(update);
    }
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying, gameOver, update]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp") {
        if (isPlaying && !gameOver) {
          jump();
        } else if (!isPlaying && !gameOver) {
          // Prevent accidental start if needed, but here we use button
        } else if (gameOver) {
          resetGame();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPlaying, gameOver, jump]);

  const resetGame = () => {
    dinoY.current = GROUND_Y;
    dinoVelocity.current = 0;
    obstacles.current = [];
    scoreRef.current = 0;
    setScore(0);
    setGameOver(false);
    setIsPlaying(true);
    // Draw initial state
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] space-y-6 outline-none" tabIndex={0}>
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Chrome Dino</h1>
        <p className="text-gray-600">Space or Arrow Up to jump</p>
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

      <div className="relative bg-white rounded-lg shadow-lg p-4 border border-gray-200 overflow-hidden">
        <canvas
          ref={canvasRef}
          width={GAME_WIDTH}
          height={GAME_HEIGHT}
          className="bg-gray-50 rounded border border-gray-100"
        />

        {(!isPlaying || gameOver) && (
          <div className="absolute inset-0 bg-black/10 flex flex-col items-center justify-center backdrop-blur-[1px]">
            {gameOver && <div className="text-3xl font-bold text-gray-800 mb-4">Game Over</div>}
            <button
              onClick={resetGame}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-bold transition-colors shadow-lg"
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
