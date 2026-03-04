import { Link } from "react-router-dom";
import { Play, Box, User, Gamepad2, Bomb, Grid2x2, Link2, Keyboard, CircleDot, PawPrint, Plane, Hexagon } from "lucide-react";
import { SEO } from "@/components/SEO";
import { useState, useMemo } from "react";
import Fuse from "fuse.js";
import { SearchInput } from "@/components/common/SearchInput";

const games = [
  {
    id: "nes",
    name: "NES Arcade",
    description: "Classic NES games collection with emulator. Mario, Contra, Zelda and more!",
    icon: Gamepad2,
    path: "/games/nes",
    color: "text-red-600",
    bgColor: "bg-red-100",
  },
  {
    id: "snake",
    name: "Snake",
    description: "Classic snake game. Eat food, grow longer, don't hit the wall!",
    icon: Play,
    path: "/games/snake",
    color: "text-green-600",
    bgColor: "bg-green-100",
  },
  {
    id: "tetris",
    name: "Tetris",
    description: "Classic block stacking game. Clear lines to score points.",
    icon: Box,
    path: "/games/tetris",
    color: "text-blue-600",
    bgColor: "bg-blue-100",
  },
  {
    id: "gomoku",
    name: "Gomoku (AI)",
    description: "Five in a row strategy game against an AI opponent.",
    icon: User,
    path: "/games/gomoku",
    color: "text-purple-600",
    bgColor: "bg-purple-100",
  },
  {
    id: "chinese-chess",
    name: "Chinese Chess (AI)",
    description: "Classic Chinese Chess (Xiangqi) against AI. Challenge different difficulty levels.",
    icon: User,
    path: "/games/chinese-chess",
    color: "text-red-600",
    bgColor: "bg-red-100",
  },
  {
    id: "go",
    name: "Go (Weiqi)",
    description: "Classic strategy board game. Surround territory to win.",
    icon: CircleDot,
    path: "/games/go",
    color: "text-slate-700",
    bgColor: "bg-slate-200",
  },
  {
    id: "jungle",
    name: "Jungle Chess (AI)",
    description: "Dou Shou Qi - Classic animal battle strategy game.",
    icon: PawPrint,
    path: "/games/jungle",
    color: "text-amber-700",
    bgColor: "bg-amber-200",
  },
  {
    id: "flying-chess",
    name: "Flying Chess (AI)",
    description: "Classic Aeroplane Chess (Ludo Variant) with 3 AI opponents.",
    icon: Plane,
    path: "/games/flying-chess",
    color: "text-sky-600",
    bgColor: "bg-sky-100",
  },
  {
    id: "chinese-checkers",
    name: "Chinese Checkers (AI)",
    description: "Classic Sternhalma. Move pieces to the opposite star point.",
    icon: Hexagon,
    path: "/games/chinese-checkers",
    color: "text-emerald-600",
    bgColor: "bg-emerald-100",
  },
  {
    id: "dino",
    name: "Chrome Dino",
    description: "The famous offline dinosaur runner game. Jump over obstacles!",
    icon: Gamepad2,
    path: "/games/dino",
    color: "text-gray-600",
    bgColor: "bg-gray-100",
  },
  {
    id: "minesweeper",
    name: "Minesweeper",
    description: "Uncover all safe cells. Right-click to flag mines.",
    icon: Bomb,
    path: "/games/minesweeper",
    color: "text-red-600",
    bgColor: "bg-red-100",
  },
  {
    id: "game-2048",
    name: "2048",
    description: "Combine tiles to reach 2048. Arrows to move.",
    icon: Grid2x2,
    path: "/games/2048",
    color: "text-amber-600",
    bgColor: "bg-amber-100",
  },
  {
    id: "link-match",
    name: "Link Match",
    description: "字母数字连连看：最多两次拐弯连通即可消除。",
    icon: Link2,
    path: "/games/link-match",
    color: "text-pink-600",
    bgColor: "bg-pink-100",
  },
  {
    id: "sudoku",
    name: "Sudoku",
    description: "经典数独：填充1-9，行列与宫内不重复。",
    icon: Grid2x2,
    path: "/games/sudoku",
    color: "text-amber-600",
    bgColor: "bg-amber-100",
  },
  {
    id: "pacvim",
    name: "PacVim",
    description: "用 Vim 键位在网格中闯关，按顺序收集字符。",
    icon: Keyboard,
    path: "/games/pacvim",
    color: "text-teal-600",
    bgColor: "bg-teal-100",
  },
];

export default function Games() {
  const [searchTerm, setSearchTerm] = useState("");

  const fuse = useMemo(
    () =>
      new Fuse(games, {
        keys: ["name", "description"],
        threshold: 0.3,
      }),
    []
  );

  const filteredGames = useMemo(() => {
    if (!searchTerm) return games;
    return fuse.search(searchTerm).map((result) => result.item);
  }, [searchTerm, fuse]);

  return (
    <div className="space-y-12">
      <SEO title="Games & Relax - BuildBetter" description="Collection of mini games to relax." />
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Games & Relax</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Take a break and enjoy some classic mini games.
        </p>
      </div>

      <SearchInput value={searchTerm} onChange={setSearchTerm} placeholder="Search games..." />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredGames.map((game) => (
          <Link
            key={game.id}
            to={game.path}
            className="group block p-6 bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-blue-300 transition-all duration-200"
          >
            <div
              className={`inline-flex p-3 rounded-lg ${game.bgColor} ${game.color} mb-4 group-hover:scale-110 transition-transform`}
            >
              <game.icon className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600">
              {game.name}
            </h2>
            <p className="text-gray-600 text-sm">{game.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
