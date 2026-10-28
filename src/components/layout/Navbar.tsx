import { Link } from "react-router-dom";
import { Settings, Menu, ChevronDown, Search, Command, Sun, Moon, Monitor } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { LanguageSelector } from "../LanguageSelector";
import { useTheme } from "@/contexts/ThemeContext";
import { AuthStatus } from "@/components/auth/AuthStatus";
import { AuthModal } from "@/components/auth/AuthModal";

/** The dropdown that opens on hover must also open on click and on keyboard. */
function NavDropdown({
  label,
  children,
  align = "left",
}: {
  label: string;
  children: React.ReactNode;
  align?: "left" | "center";
}) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div
      ref={wrap}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors font-medium text-sm"
      >
        {label}
        <ChevronDown
          className={`h-3 w-3 transition-transform duration-short ease-out ${open ? "rotate-180" : ""}`}
        />
      </button>
      <div
        className={`absolute top-full pt-2 z-dropdown transition-opacity duration-short ease-out ${
          align === "center" ? "left-1/2 -translate-x-1/2" : "left-0"
        } ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      >
        <div className="panel py-1 w-52 shadow-none">{children}</div>
      </div>
    </div>
  );
}

/** One row inside a dropdown: a link, a verb, a place. */
function MenuRow({
  to,
  href,
  external,
  children,
}: {
  to?: string;
  href?: string;
  external?: boolean;
  children: React.ReactNode;
}) {
  const cls =
    "block px-4 py-2 text-sm text-popover-foreground hover:bg-muted hover:text-primary transition-colors text-center";
  if (to) {
    return (
      <Link to={to} className={cls}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} className={cls} target={external ? "_blank" : undefined} rel="noreferrer">
      {children}
    </a>
  );
}

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
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

  const themeLabel = theme === "dark" ? "Dark" : theme === "light" ? "Light" : "System";

  const themeIcon = (
    <span className="relative flex h-4 w-4" aria-hidden="true">
      <Sun
        className={`h-4 w-4 text-amber-500 transition-opacity duration-short ease-out ${
          theme === "light" ? "opacity-100" : "opacity-0 absolute inset-0"
        }`}
      />
      <Moon
        className={`h-4 w-4 text-slate-400 transition-opacity duration-short ease-out ${
          theme === "dark" ? "opacity-100" : "opacity-0 absolute inset-0"
        }`}
      />
      <Monitor
        className={`h-4 w-4 text-slate-500 transition-opacity duration-short ease-out ${
          theme === "system" ? "opacity-100" : "opacity-0 absolute inset-0"
        }`}
      />
    </span>
  );

  return (
    <>
      <nav className="sticky top-0 z-sticky-nav bg-background border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16 gap-4">
            <Link
              to="/"
              className="flex items-center gap-2 font-medium text-lg text-foreground hover:text-primary transition-colors shrink-0"
              aria-label={t("app.title")}
            >
              <img src="/logo.svg" alt="" className="h-5 w-5" aria-hidden="true" />
              <span>{t("app.title")}</span>
            </Link>

            <div className="hidden md:flex items-center gap-5 min-w-0">
              {/* Search: the nav's leading control, a visible command pill. */}
              <button
                type="button"
                onClick={openCommandPalette}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground bg-muted/50 hover:bg-muted rounded-pill border border-border transition-colors"
              >
                <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="hidden lg:inline">{t("nav.search", "Search…")}</span>
                <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-xs bg-background rounded border border-border/50 measured">
                  <Command className="h-3 w-3" aria-hidden="true" />
                  <span>K</span>
                </kbd>
              </button>

              {/* Theme toggle */}
              <button
                type="button"
                onClick={cycleTheme}
                className="flex items-center gap-2 px-2 py-1.5 rounded-pill bg-secondary/50 hover:bg-secondary border border-transparent hover:border-border/50 transition-colors group"
                title={`Theme: ${themeLabel} (click to cycle)`}
              >
                {themeIcon}
                <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors hidden lg:inline">
                  {themeLabel}
                </span>
              </button>

              {/* Common Tools Dropdown */}
              <NavDropdown label="常用工具" align="center">
                <MenuRow to="/">{t("app.tools")}</MenuRow>
                <MenuRow href="/office/" external>
                  {t("app.office_apps")}
                </MenuRow>
                <MenuRow href="/pdf-tools/">{t("app.pdf_tools")}</MenuRow>
                <MenuRow to="/text">Text Suite</MenuRow>
                <MenuRow href="/bento/Bento_Slides.bento.html" external>
                  PPT 演示
                </MenuRow>
              </NavDropdown>

              <Link
                to="/games"
                className="text-muted-foreground hover:text-primary transition-colors font-medium text-sm"
              >
                {t("app.games")}
              </Link>
              <Link
                to="/rss-read"
                className="text-muted-foreground hover:text-primary transition-colors font-medium text-sm"
              >
                RSS Read
              </Link>

              {/* Website Navigation Dropdown */}
              <NavDropdown label="网站导航" align="center">
                <MenuRow to="/indie-developer">独立开发者</MenuRow>
                <MenuRow to="/ai-development">{t("app.ai_navigation")}</MenuRow>
                <MenuRow to="/github-stars">开源项目</MenuRow>
                <MenuRow to="/loop-engineering">Loop Engineering</MenuRow>
                <MenuRow to="/data-developer">数据开发者</MenuRow>
                <MenuRow to="/non-indie-developer">非独立开发者</MenuRow>
                <MenuRow href="/algorithm-visualizer/index.html" external>
                  算法可视化
                </MenuRow>
              </NavDropdown>

              <Link
                to="/settings"
                className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 font-medium text-sm"
              >
                <Settings className="h-4 w-4" aria-hidden="true" />
                <span>{t("app.settings")}</span>
              </Link>
              <AuthStatus onLoginClick={() => setAuthOpen(true)} />
              <LanguageSelector />
            </div>

            <div className="flex items-center gap-2 md:hidden">
              <LanguageSelector />
              <AuthStatus onLoginClick={() => setAuthOpen(true)} />
              <button
                type="button"
                aria-label="Menu"
                aria-expanded={isMenuOpen}
                className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                <Menu className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-border py-3 bg-background">
            <div className="container mx-auto px-4 flex flex-col gap-1">
              <button
                type="button"
                onClick={() => {
                  openCommandPalette();
                  setIsMenuOpen(false);
                }}
                className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground bg-muted/50 rounded-pill border border-border/50"
              >
                <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{t("nav.search", "Search…")}</span>
                <kbd className="ml-auto flex items-center gap-0.5 px-1.5 py-0.5 text-xs bg-background rounded border border-border/50 measured">
                  <Command className="h-3 w-3" aria-hidden="true" />
                  <span>K</span>
                </kbd>
              </button>

              <button
                type="button"
                onClick={() => {
                  cycleTheme();
                  setIsMenuOpen(false);
                }}
                className="flex items-center gap-3 px-3 py-2 text-sm bg-secondary/50 rounded-pill border border-border/50 hover:bg-secondary transition-colors w-full"
              >
                {themeIcon}
                <span className="text-muted-foreground">Theme</span>
                <span className="ml-auto text-foreground font-medium">{themeLabel}</span>
              </button>

              <div className="py-2">
                <div className="text-sm font-medium text-foreground mb-2">常用工具</div>
                <div className="pl-4 flex flex-col gap-2 border-l border-border ml-1">
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
                    to="/text"
                    className="text-muted-foreground hover:text-primary py-1"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Text Suite
                  </Link>
                  <a
                    href="/bento/Bento_Slides.bento.html"
                    target="_blank"
                    rel="noreferrer"
                    className="text-muted-foreground hover:text-primary py-1"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    PPT 演示
                  </a>
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
                <div className="text-sm font-medium text-foreground mb-2">网站导航</div>
                <div className="pl-4 flex flex-col gap-2 border-l border-border ml-1">
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
                    to="/github-stars"
                    className="text-muted-foreground hover:text-primary py-1"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    开源项目
                  </Link>
                  <Link
                    to="/loop-engineering"
                    className="text-muted-foreground hover:text-primary py-1"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Loop Engineering
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
                <Settings className="h-4 w-4" aria-hidden="true" />
                <span>{t("app.settings")}</span>
              </Link>
            </div>
          </div>
        )}
      </nav>
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}
