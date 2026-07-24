import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, CommandIcon, Wrench, Gamepad2, Settings, X, ArrowRight, Clock, Star, Heart } from "lucide-react";
import Fuse from "fuse.js";
import { useHistory } from "@/hooks/useHistory";
import { useFavorites } from "@/hooks/useFavorites";

// All available routes
const allCommands = [
  // Pages
  { id: "home", name: "Home", description: "Main tools dashboard", path: "/", category: "pages", icon: Wrench },
  { id: "games", name: "Games", description: "Play mini games", path: "/games", category: "pages", icon: Gamepad2 },
  { id: "settings", name: "Settings", description: "App settings", path: "/settings", category: "pages", icon: Settings },
  { id: "rss-read", name: "RSS Reader", description: "Read RSS feeds", path: "/rss-read", category: "pages", icon: Settings },
  
  // Dev Wrenchs
  { id: "api-debugger", name: "API Debugger", description: "Test HTTP requests", path: "/tools/api-debugger", category: "dev", icon: Wrench },
  { id: "code-formatter", name: "Code Formatter", description: "Format code", path: "/tools/code-formatter", category: "dev", icon: Wrench },
  { id: "json-diff", name: "JSON Diff", description: "Compare JSON files", path: "/tools/json-diff", category: "dev", icon: Wrench },
  { id: "json-editor", name: "JSON Editor", description: "Edit JSON visually", path: "/tools/json-editor", category: "dev", icon: Wrench },
  { id: "regex-tester", name: "Regex Tester", description: "Test regular expressions", path: "/tools/regex-tester", category: "dev", icon: Wrench },
  { id: "jwt-decode", name: "JWT Decode", description: "Decode JWT tokens", path: "/tools/jwt-decode", category: "dev", icon: Wrench },
  { id: "sql-formatter", name: "SQL Formatter", description: "Format SQL queries", path: "/tools/code-formatter", category: "dev", icon: Wrench },
  
  // Data Wrenchs
  { id: "csv-to-json", name: "CSV to JSON", description: "Convert CSV to JSON", path: "/tools/csv-to-json", category: "data", icon: Wrench },
  { id: "data-converter", name: "Data Converter", description: "Convert between formats", path: "/tools/data-converter", category: "data", icon: Wrench },
  { id: "text-deduper", name: "Text Deduper", description: "Remove duplicate lines", path: "/tools/text-deduper", category: "data", icon: Wrench },
  { id: "text-diff", name: "Text Diff", description: "Compare text files", path: "/tools/text-diff", category: "data", icon: Wrench },
  
  // Crypto & Security
  { id: "hash-tools", name: "Hash Wrenchs", description: "Generate hashes", path: "/tools/hash-tools", category: "security", icon: Wrench },
  { id: "bcrypt", name: "Bcrypt", description: "Hash passwords", path: "/tools/bcrypt", category: "security", icon: Wrench },
  { id: "rsa-keygen", name: "RSA Key Generator", description: "Generate RSA keys", path: "/tools/rsa-keygen", category: "security", icon: Wrench },
  { id: "otp-generator", name: "OTP Generator", description: "Generate one-time passwords", path: "/tools/otp-generator", category: "security", icon: Wrench },
  { id: "bip39", name: "BIP39 Wrench", description: "Mnemonic codes", path: "/tools/bip39", category: "security", icon: Wrench },
  
  // Image Wrenchs
  { id: "qr-generator", name: "QR Generator", description: "Generate QR codes", path: "/tools/qr-generator", category: "image", icon: Wrench },
  { id: "image-compressor", name: "Image Compressor", description: "Compress images", path: "/tools/image-compressor", category: "image", icon: Wrench },
  { id: "image-resizer", name: "Image Resizer", description: "Resize images", path: "/tools/image-resizer", category: "image", icon: Wrench },
  
  // Utilities
  { id: "password-generator", name: "Password Generator", description: "Generate passwords", path: "/tools/password-generator", category: "utils", icon: Wrench },
  { id: "uuid-generator", name: "UUID/ULID Generator", description: "Generate UUIDs and ULIDs", path: "/tools/ulid", category: "utils", icon: Wrench },
  { id: "base-converter", name: "Base Converter", description: "Convert number bases", path: "/tools/base-converter", category: "utils", icon: Wrench },
  { id: "calculator", name: "Calculator", description: "Calculator tool", path: "/tools/calculator", category: "utils", icon: Wrench },
  { id: "cron-quartz", name: "Cron Quartz", description: "Cron expression builder", path: "/tools/cron-quartz", category: "utils", icon: Wrench },
  { id: "date-time", name: "Date Time Wrenchs", description: "Date and time utilities", path: "/tools/date-time", category: "utils", icon: Wrench },
  
  // Finance
  { id: "mortgage-calculator", name: "Mortgage Calculator", description: "Calculate mortgage payments", path: "/tools/mortgage-calculator", category: "finance", icon: Wrench },
  { id: "investment-return", name: "Investment Return", description: "Calculate investment returns", path: "/tools/investment-return", category: "finance", icon: Wrench },
  { id: "roi-calculator", name: "ROI Calculator", description: "Calculate ROI", path: "/tools/roi-calculator", category: "finance", icon: Wrench },
  
  // Config Generators
  { id: "nginx-config", name: "Nginx Config", description: "Generate Nginx config", path: "/tools/nginx-config", category: "config", icon: Wrench },
  { id: "apache-config", name: "Apache Config", description: "Generate Apache config", path: "/tools/apache-config", category: "config", icon: Wrench },
  { id: "haproxy-config", name: "HAProxy Config", description: "Generate HAProxy config", path: "/tools/haproxy-config", category: "config", icon: Wrench },
  
  // Text Wrenchs
  { id: "text-suite", name: "Text Suite", description: "All text tools", path: "/tools/text", category: "text", icon: Wrench },
  { id: "text-stats", name: "Text Stats", description: "Text statistics", path: "/tools/text-stats", category: "text", icon: Wrench },
  { id: "text-case", name: "Text Case Converter", description: "Convert text case", path: "/tools/text/case", category: "text", icon: Wrench },
  { id: "markdown-html", name: "Markdown to HTML", description: "Convert Markdown to HTML", path: "/tools/markdown-html", category: "text", icon: Wrench },
  
  // Games
  { id: "snake", name: "Snake Game", description: "Classic snake game", path: "/games/snake", category: "games", icon: Gamepad2 },
  { id: "tetris", name: "Tetris", description: "Classic Tetris game", path: "/games/tetris", category: "games", icon: Gamepad2 },
  { id: "2048", name: "2048", description: "2048 puzzle game", path: "/games/2048", category: "games", icon: Gamepad2 },
  { id: "sudoku", name: "Sudoku", description: "Sudoku puzzle", path: "/games/sudoku", category: "games", icon: Gamepad2 },
  { id: "chinese-chess", name: "Chinese Chess", description: "Xiangqi", path: "/games/chinese-chess", category: "games", icon: Gamepad2 },
  { id: "gomoku", name: "Gomoku", description: "Five in a row", path: "/games/gomoku", category: "games", icon: Gamepad2 },
  { id: "go", name: "Go Game", description: "Weiqi/Baduk", path: "/games/go", category: "games", icon: Gamepad2 },
];

interface Command {
  id: string;
  name: string;
  description: string;
  path: string;
  category: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const { history } = useHistory();
  const { favorites, toggleFavorite, isFavorite } = useFavorites();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const fuse = useMemo(
    () =>
      new Fuse(allCommands, {
        keys: ["name", "description", "id"],
        threshold: 0.3,
        includeScore: true,
      }),
    []
  );

  const recentPaths = useMemo(() => {
    return history.slice(0, 5).map((h) => h.path);
  }, [history]);

  const favoritePaths = useMemo(() => {
    return favorites.map((f) => f.path);
  }, [favorites]);

  const filteredCommands = useMemo(() => {
    if (!query.trim()) {
      // Show favorites first, then recents
      const favoriteCommands = allCommands.filter((cmd) => favoritePaths.includes(cmd.path));
      const recentCommands = allCommands
        .filter((cmd) => recentPaths.includes(cmd.path) && !favoritePaths.includes(cmd.path))
        .slice(0, 5);
      return [...favoriteCommands, ...recentCommands];
    }
    return fuse.search(query).map((result) => result.item);
  }, [query, fuse, recentPaths, favoritePaths]);

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredCommands.length]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const handleSelect = useCallback(
    (command: Command) => {
      navigate(command.path);
      onClose();
    },
    [navigate, onClose]
  );

  const handleToggleFavorite = useCallback(
    (e: React.MouseEvent, command: Command) => {
      e.stopPropagation();
      toggleFavorite(command.path, command.name, command.category);
    },
    [toggleFavorite]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < filteredCommands.length - 1 ? prev + 1 : 0
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : filteredCommands.length - 1
          );
          break;
        case "Enter":
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            handleSelect(filteredCommands[selectedIndex]);
          }
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
      }
    },
    [filteredCommands, selectedIndex, handleSelect, onClose]
  );

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selectedElement = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  const categoryLabels: Record<string, string> = {
    pages: "Pages",
    dev: "Developer Wrenchs",
    data: "Data Wrenchs",
    security: "Security",
    image: "Image Wrenchs",
    utils: "Utilities",
    finance: "Finance",
    config: "Config Generators",
    text: "Text Wrenchs",
    games: "Games",
  };

  const groupedCommands = filteredCommands.reduce((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = [];
    acc[cmd.category].push(cmd);
    return acc;
  }, {} as Record<string, Command[]>);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-xl mx-4 bg-popover border border-border rounded-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search tools, games, pages..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground bg-muted rounded border border-border">
            ESC
          </kbd>
          <button
            onClick={onClose}
            className="p-1 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[60vh] overflow-y-auto py-2">
          {!query.trim() && favorites.length > 0 && (
            <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Heart className="w-3 h-3 fill-current" />
              Favorites
            </div>
          )}
          {!query.trim() && favorites.length === 0 && recentPaths.length > 0 && (
            <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3 h-3" />
              Recent
            </div>
          )}
          {query.trim() && (
            <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Results
            </div>
          )}

          {filteredCommands.length === 0 && (
            <div className="px-4 py-8 text-center text-muted-foreground">
              <p>No results found for "{query}"</p>
            </div>
          )}

          {Object.entries(groupedCommands).map(([category, commands]) => (
            <div key={category}>
              {query.trim() && (
                <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Star className="w-3 h-3" />
                  {categoryLabels[category] || category}
                </div>
              )}
              {commands.map((command) => {
                const globalIndex = filteredCommands.indexOf(command);
                const Icon = command.icon;
                const isFav = isFavorite(command.path);
                const isRecent = !query.trim() && recentPaths.includes(command.path);
                
                return (
                  <div
                    key={command.id}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 transition-colors group cursor-pointer ${
                      globalIndex === selectedIndex
                        ? "bg-primary/10 text-primary"
                        : "text-foreground hover:bg-muted"
                    }`}
                    onClick={() => handleSelect(command)}
                    onMouseEnter={() => setSelectedIndex(globalIndex)}
                  >
                    <Icon
                      className={`w-5 h-5 flex-shrink-0 ${
                        globalIndex === selectedIndex ? "text-primary" : "text-muted-foreground"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{command.name}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {command.description}
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleToggleFavorite(e, command)}
                      className={`p-1.5 rounded-full hover:bg-muted transition-colors ${
                        isFav ? "text-red-500" : "text-muted-foreground opacity-0 group-hover:opacity-100"
                      }`}
                      title={isFav ? "Remove from favorites" : "Add to favorites"}
                    >
                      <Heart className={`w-4 h-4 ${isFav ? "fill-current" : ""}`} />
                    </button>
                    {isRecent && !isFav && (
                      <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    )}
                    {globalIndex === selectedIndex && (
                      <ArrowRight className="w-4 h-4 text-primary flex-shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-border text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-muted rounded border border-border">↑↓</kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-muted rounded border border-border">↵</kbd>
              Select
            </span>
          </div>
          <span className="flex items-center gap-1">
            <CommandIcon className="w-3 h-3" />
            <kbd className="px-1.5 py-0.5 bg-muted rounded border border-border">K</kbd>
            to toggle
          </span>
        </div>
      </div>
    </div>
  );
}
