import { Link } from "react-router-dom";
import { Settings, Menu } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { LanguageSelector } from "../LanguageSelector";

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { t } = useTranslation();

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl text-blue-600">
            <img src="/logo.svg" alt="BuildBetter" className="h-6 w-6" />
            <span>{t("app.title")}</span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-gray-600 hover:text-blue-600 transition-colors">
              {t("app.tools")}
            </Link>
            <a href="/pdf-tools/" className="text-gray-600 hover:text-blue-600 transition-colors">
              {t("app.pdf_tools")}
            </a>
            <Link to="/tools/text" className="text-gray-600 hover:text-blue-600 transition-colors">
              Text Suite
            </Link>
            <Link to="/games" className="text-gray-600 hover:text-blue-600 transition-colors">
              {t("app.games")}
            </Link>
            <Link
              to="/settings"
              className="text-gray-600 hover:text-blue-600 transition-colors flex items-center gap-1"
            >
              <Settings className="h-4 w-4" />
              <span>{t("app.settings")}</span>
            </Link>
            <LanguageSelector />
          </div>

          <div className="flex items-center gap-4 md:hidden">
            <LanguageSelector />
            <button className="p-2 text-gray-600" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-gray-100 py-2">
          <div className="container mx-auto px-4 flex flex-col gap-2">
            <Link
              to="/"
              className="py-2 text-gray-600 hover:text-blue-600"
              onClick={() => setIsMenuOpen(false)}
            >
              {t("app.tools")}
            </Link>
            <a
              href="/pdf-tools/"
              className="py-2 text-gray-600 hover:text-blue-600"
              onClick={() => setIsMenuOpen(false)}
            >
              {t("app.pdf_tools")}
            </a>
            <Link
              to="/tools/text"
              className="py-2 text-gray-600 hover:text-blue-600"
              onClick={() => setIsMenuOpen(false)}
            >
              Text Suite
            </Link>
            <Link
              to="/games"
              className="py-2 text-gray-600 hover:text-blue-600"
              onClick={() => setIsMenuOpen(false)}
            >
              {t("app.games")}
            </Link>
            <Link
              to="/settings"
              className="py-2 text-gray-600 hover:text-blue-600 flex items-center gap-2"
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
