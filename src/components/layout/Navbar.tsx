import { Link } from "react-router-dom";
import { Settings, Menu, ChevronDown, Search, Command, Sun, Moon, Monitor } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { LanguageSelector } from "../LanguageSelector";
import { useTheme } from "@/contexts/ThemeContext";

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();

  const openCommandPalette = () => {
    window.dispatchEvent(new CustomEvent("toggle-command-palette"));
  };

  const cycleTheme = () => {
    const themes: ("light" | "dark" | "system")[] = ["light", "dark", "system"];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  const ThemeIcon = theme === "dark" ? Moon : theme === "light" ? Sun : Monitor;
  const themeLabel = theme === "dark" ? "Dark" : theme === "light" ? "Light" : "System";

  return (
    <nav className="bg-background/80 backdrop-blur-md sticky top-0 z-50 border-b border-border shadow-sm supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl text-primary hover:opacity-80 transition-opacity">
            <img src="/logo.svg" alt="BuildBetter" className="h-6 w-6" />
            <span>{t("app.title")}</span>
          </Link>

          <div className="hidden md:flex items-center gap-4">
            {/* Search Button */}
            <button
              onClick={openCommandPalette}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground bg-muted/50 hover:bg-muted rounded-lg border border-border/50 transition-colors"
            >
              <Search className="h-4 w-4" />
              <span className="hidden lg:inline">Search...</span>
              <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-xs bg-background rounded border border-border/50">
                <Command className="h-3 w-3" />K
              </kbd>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={cycleTheme}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/50 hover:bg-secondary border border-transparent hover:border-border/50 transition-all duration-200 group"
              title={`Theme: ${themeLabel} (click to cycle)`}
            >
              <span className="relative flex h-5 w-5">
                <Sun className={`h-4 w-4 text-amber-500 transition-all duration-300 ${theme === 'light' ? 'opacity-100 scale-100' : 'opacity-0 scale-75 absolute inset-0'} dark:opacity-0`} />
                <Moon className={`h-4 w-4 text-slate-400 transition-all duration-300 ${theme === 'dark' ? 'opacity-100 scale-100' : 'opacity-0 scale-75 absolute inset-0'} hidden dark:block`} />
                <Monitor className={`h-4 w-4 text-slate-500 transition-all duration-300 ${theme === 'system' ? 'opacity-100 scale-100' : 'opacity-0 scale-75 absolute inset-0'}`} />
              </span>
              <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors hidden lg:inline">{themeLabel}</span>
            </button>

            {/* Common Tools Dropdown */}
            <div className="relative group">
              <button className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors font-medium text-sm focus:outline-none">
                常用工具
                <ChevronDown className="h-3 w-3" />
              </button>
              <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 w-40 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="bg-popover border border-border rounded-md shadow-lg overflow-hidden">
                  <Link 
                    to="/" 
                    className="block px-4 py-2 text-sm text-popover-foreground hover:bg-muted hover:text-primary transition-colors text-center"
                  >
                    {t("app.tools")}
                  </Link>
                  <a 
                    href="/office/" 
                    target="_blank" 
                    rel="noreferrer"
                    className="block px-4 py-2 text-sm text-popover-foreground hover:bg-muted hover:text-primary transition-colors text-center"
                  >
                    {t("app.office_apps")}
                  </a>
                  <a 
                    href="/pdf-tools/" 
                    className="block px-4 py-2 text-sm text-popover-foreground hover:bg-muted hover:text-primary transition-colors text-center"
                  >
                    {t("app.pdf_tools")}
                  </a>
                  <Link 
                    to="/tools/text" 
                    className="block px-4 py-2 text-sm text-popover-foreground hover:bg-muted hover:text-primary transition-colors text-center"
                  >
                    Text Suite
                  </Link>
                </div>
              </div>
            </div>
            <Link to="/games" className="text-muted-foreground hover:text-primary transition-colors font-medium text-sm">
              {t("app.games")}
            </Link>
            <Link to="/rss-read" className="text-muted-foreground hover:text-primary transition-colors font-medium text-sm">
              RSS Read
            </Link>

            {/* Investment & Finance Dropdown */}
            <div className="relative group">
              <button className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors font-medium text-sm focus:outline-none">
                投资理财
                <ChevronDown className="h-3 w-3" />
              </button>
              <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 w-40 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="bg-popover border border-border rounded-md shadow-lg overflow-hidden">
                  <a 
                    href="/fund-analysis/" 
                    className="block px-4 py-2 text-sm text-popover-foreground hover:bg-muted hover:text-primary transition-colors text-center"
                  >
                    基金分析
                  </a>
                </div>
              </div>
            </div>
            
            {/* Website Navigation Dropdown */}
            <div className="relative group">
              <button className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors font-medium text-sm focus:outline-none">
                网站导航
                <ChevronDown className="h-3 w-3" />
              </button>
              <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 w-40 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="bg-popover border border-border rounded-md shadow-lg overflow-hidden">
                  <Link 
                    to="/indie-developer" 
                    className="block px-4 py-2 text-sm text-popover-foreground hover:bg-muted hover:text-primary transition-colors text-center"
                  >
                    独立开发者
                  </Link>
                  <Link 
                    to="/ai-development" 
                    className="block px-4 py-2 text-sm text-popover-foreground hover:bg-muted hover:text-primary transition-colors text-center"
                  >
                    {t("app.ai_navigation")}
                  </Link>
                  <Link 
                    to="/loop-engineering" 
                    className="block px-4 py-2 text-sm text-popover-foreground hover:bg-muted hover:text-primary transition-colors text-center"
                  >
                    Loop Engineering
                  </Link>
                  <Link 
                    to="/data-developer" 
                    className="block px-4 py-2 text-sm text-popover-foreground hover:bg-muted hover:text-primary transition-colors text-center"
                  >
                    数据开发者
                  </Link>
                  <Link 
                    to="/non-indie-developer" 
                    className="block px-4 py-2 text-sm text-popover-foreground hover:bg-muted hover:text-primary transition-colors text-center"
                  >
                    非独立开发者
                  </Link>
                  <a 
                    href="/algorithm-visualizer/index.html" 
                    target="_blank" 
                    rel="noreferrer"
                    className="block px-4 py-2 text-sm text-popover-foreground hover:bg-muted hover:text-primary transition-colors text-center"
                  >
                    算法可视化
                  </a>
                </div>
              </div>
            </div>

            <Link
              to="/settings"
              className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 font-medium text-sm"
            >
              <Settings className="h-4 w-4" />
              <span>{t("app.settings")}</span>
            </Link>
            <LanguageSelector />
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <LanguageSelector />
            <button className="p-2 text-muted-foreground hover:text-foreground" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-border py-2 bg-background">
          <div className="container mx-auto px-4 flex flex-col gap-2">
            {/* Search Button */}
            <button
              onClick={() => {
                openCommandPalette();
                setIsMenuOpen(false);
              }}
              className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground bg-muted/50 rounded-lg border border-border/50"
            >
              <Search className="h-4 w-4" />
              <span>Search...</span>
              <kbd className="ml-auto flex items-center gap-0.5 px-1.5 py-0.5 text-xs bg-background rounded border border-border/50">
                <Command className="h-3 w-3" />K
              </kbd>
            </button>
            
            {/* Theme Toggle */}
            <button
              onClick={() => {
                cycleTheme();
                setIsMenuOpen(false);
              }}
              className="flex items-center gap-3 px-4 py-3 text-sm bg-secondary/50 rounded-lg border border-border/50 hover:bg-secondary transition-colors w-full"
            >
              <span className="relative flex h-5 w-5">
                <Sun className={`h-4 w-4 text-amber-500 transition-all duration-300 ${theme === 'light' ? 'opacity-100 scale-100' : 'opacity-0 scale-75 absolute inset-0'} dark:opacity-0`} />
                <Moon className={`h-4 w-4 text-slate-400 transition-all duration-300 ${theme === 'dark' ? 'opacity-100 scale-100' : 'opacity-0 scale-75 absolute inset-0'} hidden dark:block`} />
                <Monitor className={`h-4 w-4 text-slate-500 transition-all duration-300 ${theme === 'system' ? 'opacity-100 scale-100' : 'opacity-0 scale-75 absolute inset-0'}`} />
              </span>
              <span className="text-muted-foreground">Theme</span>
              <span className="ml-auto text-foreground font-medium">{themeLabel}</span>
            </button>
            
            <div className="py-2">
              <div className="text-sm font-semibold text-foreground mb-2">常用工具</div>
              <div className="pl-4 flex flex-col gap-2 border-l-2 border-border ml-1">
                <Link
                  to="/"
                  className="text-muted-foreground hover:text-primary py-1"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {t("app.tools")}
                </Link>
                <a
                  href="/office/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-muted-foreground hover:text-primary py-1"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {t("app.office_apps")}
                </a>
                <a
                  href="/pdf-tools/"
                  className="text-muted-foreground hover:text-primary py-1"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {t("app.pdf_tools")}
                </a>
                <Link
                  to="/tools/text"
                  className="text-muted-foreground hover:text-primary py-1"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Text Suite
                </Link>
              </div>
            </div>
            <Link
              to="/games"
              className="py-2 text-muted-foreground hover:text-primary"
              onClick={() => setIsMenuOpen(false)}
            >
              {t("app.games")}
            </Link>
            <Link
              to="/rss-read"
              className="py-2 text-muted-foreground hover:text-primary"
              onClick={() => setIsMenuOpen(false)}
            >
              RSS Read
            </Link>

            <div className="py-2">
              <div className="text-sm font-semibold text-foreground mb-2">投资理财</div>
              <div className="pl-4 flex flex-col gap-2 border-l-2 border-border ml-1">
                <a
                  href="/fund-analysis/"
                  className="text-muted-foreground hover:text-primary py-1"
                  onClick={() => setIsMenuOpen(false)}
                >
                  基金分析
                </a>
              </div>
            </div>
            
            <div className="py-2">
              <div className="text-sm font-semibold text-foreground mb-2">网站导航</div>
              <div className="pl-4 flex flex-col gap-2 border-l-2 border-border ml-1">
                <Link
                  to="/indie-developer"
                  className="text-muted-foreground hover:text-primary py-1"
                  onClick={() => setIsMenuOpen(false)}
                >
                  独立开发者
                </Link>
                <Link
                  to="/ai-development"
                  className="text-muted-foreground hover:text-primary py-1"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {t("app.ai_navigation")}
                </Link>
                <Link
                  to="/data-developer"
                  className="text-muted-foreground hover:text-primary py-1"
                  onClick={() => setIsMenuOpen(false)}
                >
                  数据开发者
                </Link>
                <Link
                  to="/non-indie-developer"
                  className="text-muted-foreground hover:text-primary py-1"
                  onClick={() => setIsMenuOpen(false)}
                >
                  非独立开发者
                </Link>
                <a
                  href="/algorithm-visualizer/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-muted-foreground hover:text-primary py-1"
                  onClick={() => setIsMenuOpen(false)}
                >
                  算法可视化
                </a>
              </div>
            </div>

            <Link
              to="/settings"
              className="py-2 text-muted-foreground hover:text-primary flex items-center gap-2"
              onClick={() => setIsMenuOpen(false)}
            >
              <Settings className="h-4 w-4" />
              <span>{t("app.settings")}</span>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
