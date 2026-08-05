// src/pages/tools/api-debugger/components/TabBar.tsx
import { Plus, X } from "lucide-react";
import type { RequestTab } from "../types";
import { METHOD_COLORS } from "../types";

interface TabBarProps {
  tabs: RequestTab[];
  activeTabId: string;
  onSelectTab: (id: string) => void;
  onCloseTab: (id: string) => void;
  onAddTab: () => void;
  onRenameTab?: (id: string, name: string) => void;
}

export function TabBar({ tabs, activeTabId, onSelectTab, onCloseTab, onAddTab, onRenameTab }: TabBarProps) {
  return (
    <div className="flex items-center border-b border-border/50 bg-muted/20 overflow-x-auto">
      <div className="flex items-center flex-1 min-w-0">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          const methodColor = METHOD_COLORS[tab.method] || "text-muted-foreground";
          return (
            <div
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`group flex items-center gap-1.5 px-3 py-2 text-xs cursor-pointer border-r border-border/30 transition-colors shrink-0 ${
                isActive ? "bg-card border-b-2 border-b-cyan-400 -mb-px" : "hover:bg-muted/50"
              }`}
            >
              <span className={`font-mono font-semibold text-[10px] ${methodColor}`}>
                {tab.method}
              </span>
              {onRenameTab ? (
                <input
                  value={tab.name}
                  onChange={(e) => onRenameTab(tab.id, e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className={`bg-transparent outline-none min-w-[60px] max-w-[120px] ${isActive ? "text-foreground" : "text-muted-foreground"}`}
                  spellCheck={false}
                />
              ) : (
                <span className={`truncate max-w-[120px] ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                  {tab.name}
                </span>
              )}
              {tab.isLoading && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseTab(tab.id);
                }}
                className="p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-secondary/80 transition-all ml-1"
              >
                <X className="w-3 h-3 text-muted-foreground" />
              </button>
            </div>
          );
        })}
      </div>
      <button
        onClick={onAddTab}
        className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors shrink-0"
        title="新建标签 (Ctrl+T)"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}
