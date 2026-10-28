import { Link } from "react-router-dom";
import { Play, Box, User, Gamepad2, Bomb, Grid2x2, Link2, Keyboard, CircleDot, PawPrint, Plane, Hexagon, ExternalLink } from "lucide-react";
import { SEO } from "@/components/seo";
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
    color: "tone-cool-glyph",
    bgColor: "tone-cool-tile",
  },
  {
    id: "snake",
    name: "Snake",
    description: "Classic snake game. Eat food, grow longer, don't hit the wall!",
    icon: Play,
    path: "/games/snake",
    color: "tone-amber-glyph",
    bgColor: "tone-amber-tile",
  },
  {
    id: "tetris",
    name: "Tetris",
    description: "Classic block stacking game. Clear lines to score points.",
    icon: Box,
    path: "/games/tetris",
    color: "tone-cool-glyph",
    bgColor: "tone-cool-tile",
  },
  {
    id: "gomoku",
    name: "Gomoku (AI)",
    description: "Five in a row strategy game against an AI opponent.",
    icon: User,
    path: "/games/gomoku",
    color: "tone-plain-glyph",
    bgColor: "tone-plain-tile",
  },
  {
    id: "chinese-chess",
    name: "Chinese Chess (AI)",
    description: "Classic Chinese Chess (Xiangqi) against AI. Challenge different difficulty levels.",
    icon: User,
    path: "/games/chinese-chess",
    color: "tone-cool-glyph",
    bgColor: "tone-cool-tile",
  },
  {
    id: "go",
    name: "Go (Weiqi)",
    description: "Classic strategy board game. Surround territory to win.",
    icon: CircleDot,
    path: "/games/go",
    color: "tone-plain-glyph",
    bgColor: "tone-plain-tile",
  },
  {
    id: "jungle",
    name: "Jungle Chess (AI)",
    description: "Dou Shou Qi - Classic animal battle strategy game.",
    icon: PawPrint,
    path: "/games/jungle",
    color: "tone-amber-glyph",
    bgColor: "tone-amber-tile",
  },
  {
    id: "flying-chess",
    name: "Flying Chess (AI)",
    description: "Classic Aeroplane Chess (Ludo Variant) with 3 AI opponents.",
    icon: Plane,
    path: "/games/flying-chess",
    color: "tone-cool-glyph",
    bgColor: "tone-cool-tile",
  },
  {
    id: "chinese-checkers",
    name: "Chinese Checkers (AI)",
    description: "Classic Sternhalma. Move pieces to the opposite star point.",
    icon: Hexagon,
    path: "/games/chinese-checkers",
    color: "tone-plain-glyph",
    bgColor: "tone-plain-tile",
  },
  {
    id: "dino",
    name: "Chrome Dino",
    description: "The famous offline dinosaur runner game. Jump over obstacles!",
    icon: Gamepad2,
    path: "/games/dino",
    color: "tone-plain-glyph",
    bgColor: "tone-plain-tile",
  },
  {
    id: "minesweeper",
    name: "Minesweeper",
    description: "Uncover all safe cells. Right-click to flag mines.",
    icon: Bomb,
    path: "/games/minesweeper",
    color: "tone-cool-glyph",
    bgColor: "tone-cool-tile",
  },
  {
    id: "game-2048",
    name: "2048",
    description: "Combine tiles to reach 2048. Arrows to move.",
    icon: Grid2x2,
    path: "/games/2048",
    color: "tone-amber-glyph",
    bgColor: "tone-amber-tile",
  },
  {
    id: "link-match",
    name: "Link Match",
    description: "字母数字连连看：最多两次拐弯连通即可消除。",
    icon: Link2,
    path: "/games/link-match",
    color: "tone-cool-glyph",
    bgColor: "tone-cool-tile",
  },
  {
    id: "sudoku",
    name: "Sudoku",
    description: "经典数独：填充1-9，行列与宫内不重复。",
    icon: Grid2x2,
    path: "/games/sudoku",
    color: "tone-plain-glyph",
    bgColor: "tone-plain-tile",
  },
  {
    id: "pacvim",
    name: "PacVim",
    description: "用 Vim 键位在网格中闯关，按顺序收集字符。",
    icon: Keyboard,
    path: "/games/pacvim",
    color: "tone-cool-glyph",
    bgColor: "tone-cool-tile",
  },
];

const externalGameLinks = [
  {
    id: "yikm",
    name: "小霸王，其乐无穷",
    description: "在线畅玩经典 FC、街机、掌机等复古游戏。",
    url: "https://www.yikm.net/",
    icon: ExternalLink,
    color: "tone-amber-glyph",
    bgColor: "tone-amber-tile",
  },
  {
    id: "wxiu",
    name: "在线玩",
    description: "无需下载，直接在浏览器中玩各种小游戏。",
    url: "https://www.wxiu.com/",
    icon: ExternalLink,
    color: "tone-cool-glyph",
    bgColor: "tone-cool-tile",
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
        <h1 className="text-4xl font-bold text-foreground tracking-tight">Games & Relax</h1>
        <p className="text-xl text-ink-2 max-w-2xl mx-auto">
          Take a break and enjoy some classic mini games.
        </p>
      </div>

      <SearchInput value={searchTerm} onChange={setSearchTerm} placeholder="Search games..." />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredGames.map((game) => (
          <Link
            key={game.id}
            to={game.path}
            className="group block p-6 bg-card rounded-xl border border-border hover:border-primary/40 transition-colors duration-200"
          >
            <div
              className={`inline-flex p-3 rounded-lg ${game.bgColor} ${game.color} mb-4 transition-colors`}
            >
              <game.icon className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
              {game.name}
            </h2>
            <p className="text-ink-2 text-sm">{game.description}</p>
          </Link>
        ))}
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-foreground border-b border-border pb-2">更多游戏</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {externalGameLinks.map((link) => (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group block p-6 bg-card rounded-xl border border-border hover:border-primary/40 transition-colors duration-200"
            >
              <div
                className={`inline-flex p-3 rounded-lg ${link.bgColor} ${link.color} mb-4 transition-colors`}
              >
                <link.icon className="h-6 w-6" />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                  {link.name}
                </h2>
                <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <p className="text-ink-2 text-sm">{link.description}</p>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
