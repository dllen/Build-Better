import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "react-i18next";
import { useHistory } from "@/hooks/useHistory";
import { Link } from "react-router-dom";
import { Trash2, Clock, History as HistoryIcon, X } from "lucide-react";

export default function Settings() {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();
  const { history, clearHistory, removeFromHistory } = useHistory();

  const getToolTitle = (path: string) => {
    const parts = path.split("/").filter(Boolean);
    if (parts.length < 2) return path;
    
    const category = parts[0]; // tools or games
    const id = parts.slice(1).join("-"); 
    
    // Try category.id.title first
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
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t("settings.title")}</h1>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t("settings.preferences")}</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-600 dark:text-gray-300">{t("settings.theme.label")}</span>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value as "light" | "dark" | "system")}
              className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="light">{t("settings.theme.light")}</option>
              <option value="dark">{t("settings.theme.dark")}</option>
              <option value="system">{t("settings.theme.system")}</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <HistoryIcon className="w-5 h-5" />
            {t("settings.history.title")}
          </h2>
          {history.length > 0 && (
            <button
              onClick={clearHistory}
              className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 flex items-center gap-1 px-3 py-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Clear All
            </button>
          )}
        </div>
        
        {history.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-8 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
            {t("settings.history.desc")}
          </p>
        ) : (
          <div className="space-y-2">
            {history.map((item) => (
              <div
                key={item.path}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 group border border-transparent hover:border-gray-100 dark:hover:border-gray-600 transition-all"
              >
                <Link to={item.path} className="flex-1 flex flex-col gap-1">
                    <span className="font-medium text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {getToolTitle(item.path)}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(item.timestamp)}
                    </span>
                </Link>
                <button
                  onClick={() => removeFromHistory(item.path)}
                  className="p-2 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600 opacity-0 group-hover:opacity-100 transition-all"
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
