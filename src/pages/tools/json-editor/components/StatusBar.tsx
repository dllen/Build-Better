import { AlertCircle, Check } from "lucide-react";

interface StatusBarProps {
  isValid: boolean;
  parseError: string | null;
  contentLength: number;
  currentMode: string;
}

export function StatusBar({ isValid, parseError, contentLength, currentMode }: StatusBarProps) {
  return (
    <div className="flex items-center justify-between px-3 py-1.5 text-[11px] text-muted-foreground border-t border-border/50 bg-muted/20 rounded-b-lg flex-shrink-0">
      <div className="flex items-center gap-3">
        {isValid ? (
          <span className="flex items-center gap-1 text-emerald-400">
            <Check className="w-3 h-3" /> 有效
          </span>
        ) : (
          <span className="flex items-center gap-1 text-red-400">
            <AlertCircle className={`w-3 h-3 ${parseError ? "animate-pulse" : ""}`} /> 无效
          </span>
        )}
        <span className="text-border/50">|</span>
        <span>{contentLength.toLocaleString()} 字符</span>
        <span className="text-border/50">|</span>
        <span>{currentMode}</span>
      </div>
      <div className="flex items-center gap-3">
        <span>UTF-8</span>
        <span className="text-border/50">|</span>
        <span>2 空格</span>
        <span className="text-border/50">|</span>
        <span className="text-cyan-400/70">按 ? 查看快捷键</span>
      </div>
    </div>
  );
}
