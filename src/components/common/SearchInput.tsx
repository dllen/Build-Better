import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchInput({ value, onChange, placeholder, className = "" }: SearchInputProps) {
  const { t } = useTranslation();

  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <Search className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
      </div>
      <input
        type="text"
        name="q"
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="field block w-full pl-11 pr-4 leading-5"
        placeholder={placeholder || t("app.search_placeholder", "Search tools…")}
        aria-label={placeholder || t("app.search_placeholder", "Search tools…")}
      />
    </div>
  );
}
