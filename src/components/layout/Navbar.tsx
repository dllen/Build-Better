import { Link } from "react-router-dom";
import { Settings, Menu } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { LanguageSelector } from "../LanguageSelector";

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { t } = useTranslation();

  return (
    <nav className="bg-background/80 backdrop-blur-md sticky top-0 z-50 border-b border-border shadow-sm supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl text-primary hover:opacity-80 transition-opacity">
            <img src="/logo.svg" alt="BuildBetter" className="h-6 w-6" />
            <span>{t("app.title")}</span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-muted-foreground hover:text-primary transition-colors font-medium text-sm">
              {t("app.tools")}
            </Link>
            <a href="/office/" target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary transition-colors font-medium text-sm">
              {t("app.office_apps")}
            </a>
            <a href="/pdf-tools/" className="text-muted-foreground hover:text-primary transition-colors font-medium text-sm">
              {t("app.pdf_tools")}
            </a>
            <Link to="/tools/text" className="text-muted-foreground hover:text-primary transition-colors font-medium text-sm">
              Text Suite
            </Link>
            <Link to="/games" className="text-muted-foreground hover:text-primary transition-colors font-medium text-sm">
              {t("app.games")}
            </Link>
            <Link to="/rss-read" className="text-muted-foreground hover:text-primary transition-colors font-medium text-sm">
              RSS Read
            </Link>
            <Link to="/indie-developer" className="text-muted-foreground hover:text-primary transition-colors font-medium text-sm">
              独立开发者
            </Link>
            <Link to="/ai-development" className="text-muted-foreground hover:text-primary transition-colors font-medium text-sm">
              {t("app.ai_navigation")}
            </Link>
            <Link
              to="/settings"
              className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 font-medium text-sm"
            >
              <Settings className="h-4 w-4" />
              <span>{t("app.settings")}</span>
            </Link>
            <LanguageSelector />
          </div>

          <div className="flex items-center gap-4 md:hidden">
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
            <Link
              to="/"
              className="py-2 text-muted-foreground hover:text-primary"
              onClick={() => setIsMenuOpen(false)}
            >
              {t("app.tools")}
            </Link>
            <a
              href="/office/"
              target="_blank"
              rel="noreferrer"
              className="py-2 text-muted-foreground hover:text-primary"
              onClick={() => setIsMenuOpen(false)}
            >
              {t("app.office_apps")}
            </a>
            <a
              href="/pdf-tools/"
              className="py-2 text-muted-foreground hover:text-primary"
              onClick={() => setIsMenuOpen(false)}
            >
              {t("app.pdf_tools")}
            </a>
            <Link
              to="/tools/text"
              className="py-2 text-muted-foreground hover:text-primary"
              onClick={() => setIsMenuOpen(false)}
            >
              Text Suite
            </Link>
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
            <Link
              to="/indie-developer"
              className="py-2 text-muted-foreground hover:text-primary"
              onClick={() => setIsMenuOpen(false)}
            >
              独立开发者
            </Link>
            <Link
              to="/ai-development"
              className="py-2 text-muted-foreground hover:text-primary"
              onClick={() => setIsMenuOpen(false)}
            >
              {t("app.ai_navigation")}
            </Link>
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
