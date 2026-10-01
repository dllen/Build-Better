import { useTranslation } from "react-i18next";
import { Globe, Languages } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const SUPPORTED_LANGUAGES = [
  { code: "en", name: "English", nativeName: "English", dir: "ltr" },
  { code: "ja", name: "Japanese", nativeName: "日本語", dir: "ltr" },
  { code: "ko", name: "Korean", nativeName: "한국어", dir: "ltr" },
  { code: "de", name: "German", nativeName: "Deutsch", dir: "ltr" },
  { code: "fr", name: "French", nativeName: "Français", dir: "ltr" },
  { code: "es", name: "Spanish", nativeName: "Español", dir: "ltr" },
  { code: "pt", name: "Portuguese", nativeName: "Português", dir: "ltr" },
  { code: "ru", name: "Russian", nativeName: "Русский", dir: "ltr" },
  { code: "ar", name: "Arabic", nativeName: "العربية", dir: "rtl" },
  { code: "zh-CN", name: "Chinese (Simplified)", nativeName: "简体中文", dir: "ltr" },
  { code: "zh-TW", name: "Chinese (Traditional)", nativeName: "繁體中文", dir: "ltr" },
];

function getLanguageFromPath(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  const firstSegment = segments[0];
  const lang = SUPPORTED_LANGUAGES.find((l) => l.code === firstSegment);
  return lang ? lang.code : "en";
}

function buildLangPath(currentPath: string, targetLang: string): string {
  // Strip any existing language prefix from the path
  const segments = currentPath.split("/").filter(Boolean);
  const firstIsLang = SUPPORTED_LANGUAGES.some((l) => l.code === segments[0]);
  const pathWithoutLang = firstIsLang ? "/" + segments.slice(1).join("/") : currentPath;

  if (targetLang === "en") {
    return pathWithoutLang || "/";
  }
  return `/${targetLang}${pathWithoutLang || "/"}`;
}

export function LanguageSelector() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Determine current language from URL path
  const currentLang = getLanguageFromPath(location.pathname);

  const handleLanguageChange = (langCode: string) => {
    const newPath = buildLangPath(location.pathname, langCode);
    i18n.changeLanguage(langCode);
    navigate(newPath);
    setIsOpen(false);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentLangInfo = SUPPORTED_LANGUAGES.find((l) => l.code === currentLang) || SUPPORTED_LANGUAGES[0];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 text-gray-600 hover:text-blue-600 transition-colors p-2 rounded-md hover:bg-gray-100"
        title="Change Language"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <Globe className="h-5 w-5" />
        <span className="text-sm font-medium hidden sm:inline">{currentLangInfo.nativeName}</span>
        {currentLangInfo.dir === "rtl" && <Languages className="h-4 w-4 text-blue-500" />}
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 border border-gray-100 z-50 max-h-80 overflow-y-auto"
          role="listbox"
        >
          {SUPPORTED_LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors flex items-center justify-between gap-2
                ${currentLang === lang.code ? "text-blue-600 font-medium bg-blue-50" : "text-gray-700"}
              `}
              role="option"
              aria-selected={currentLang === lang.code}
            >
              <span className="flex items-center gap-2">
                {lang.nativeName}
                {lang.dir === "rtl" && <span className="text-xs text-gray-400">RTL</span>}
              </span>
              {currentLang === lang.code && (
                <span className="text-blue-600 text-xs font-medium">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
