import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "react-i18next";
import { useHistory } from "@/hooks/useHistory";
import { useFavorites } from "@/hooks/useFavorites";
import { Link } from "react-router-dom";
import { Trash2, Clock, History as HistoryIcon, X, Heart, Star } from "lucide-react";

export default function Settings() {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();
  const { history, clearHistory, removeFromHistory } = useHistory();
  const { favorites, clearFavorites, removeFavorite } = useFavorites();

  const getToolTitle = (path: string) => {
    const parts = path.split("/").filter(Boolean);
    if (parts.length < 2) return path;
    
    const category = parts[0];
    const id = parts.slice(1).join("-");
    
    const titleKey = `${category}.${id}.title`;
    const nameKey = `${category}.${id}.name`;
    
    const title = t(titleKey);
    if (title && title !== titleKey) return title;
    
    const name = t(nameKey);
    if (name && name !== nameKey) return name;
    
    return id.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  };

  const formatDate = (timestamp: number) => {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(new Date(timestamp));
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-foreground">{t("settings.title")}</h1>

      {/* Theme Settings */}
      <div className="bg-card text-card-foreground rounded-xl border border-border p-6 space-y-4 shadow-sm">
        <h2 className="text-lg font-semibold">{t("settings.preferences")}</h2>
        <div className="space-y-4">
          <div className="space-y-3">
            <span className="text-sm text-muted-foreground">{t("settings.theme.label")}</span>
            <div className="grid grid-cols-3 gap-2">
              {(["light", "dark", "system"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all duration-200 ${
                    theme === t 
                      ? "border-primary bg-primary/5" 
                      : "border-border/50 hover:border-border bg-secondary/30"
                  }`}
                >
                  {t === "light" && (
                    <svg className="h-5 w-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  )}
                  {t === "dark" && (
                    <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                  )}
                  {t === "system" && (
                    <svg className="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  )}
                  <span className={`text-xs font-medium ${
                    theme === t ? "text-primary" : "text-muted-foreground"
                  }`}>
                    {t === "light" ? "浅色" : t === "dark" ? "深色" : "系统"}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Favorites */}
      <div className="bg-card text-card-foreground rounded-xl border border-border p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500" />
            Favorites
          </h2>
          {favorites.length > 0 && (
            <button
              onClick={clearFavorites}
              className="text-sm text-destructive hover:text-destructive/90 flex items-center gap-1 px-3 py-1 rounded-md hover:bg-destructive/10 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Clear All
            </button>
          )}
        </div>
        
        {favorites.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-8 bg-muted/50 rounded-lg">
            No favorites yet. Click the heart icon in the search menu to add favorites.
          </p>
        ) : (
          <div className="space-y-2">
            {favorites.map((item) => (
              <div
                key={item.path}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 group border border-transparent hover:border-border transition-all"
              >
                <Link to={item.path} className="flex-1 flex flex-col gap-1">
                  <span className="font-medium group-hover:text-primary transition-colors flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    {item.name}
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    Added {formatDate(item.addedAt)}
                  </span>
                </Link>
                <button
                  onClick={() => removeFavorite(item.path)}
                  className="p-2 text-muted-foreground hover:text-destructive rounded-full hover:bg-muted opacity-0 group-hover:opacity-100 transition-all"
                  title="Remove from favorites"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* History */}
      <div className="bg-card text-card-foreground rounded-xl border border-border p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <HistoryIcon className="w-5 h-5" />
            {t("settings.history.title")}
          </h2>
          {history.length > 0 && (
            <button
              onClick={clearHistory}
              className="text-sm text-destructive hover:text-destructive/90 flex items-center gap-1 px-3 py-1 rounded-md hover:bg-destructive/10 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Clear All
            </button>
          )}
        </div>
        
        {history.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-8 bg-muted/50 rounded-lg">
            {t("settings.history.desc")}
          </p>
        ) : (
          <div className="space-y-2">
            {history.map((item) => (
              <div
                key={item.path}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 group border border-transparent hover:border-border transition-all"
              >
                <Link to={item.path} className="flex-1 flex flex-col gap-1">
                    <span className="font-medium group-hover:text-primary transition-colors">
                        {getToolTitle(item.path)}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(item.timestamp)}
                    </span>
                </Link>
                <button
                  onClick={() => removeFromHistory(item.path)}
                  className="p-2 text-muted-foreground hover:text-destructive rounded-full hover:bg-muted opacity-0 group-hover:opacity-100 transition-all"
                  title="Remove from history"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
