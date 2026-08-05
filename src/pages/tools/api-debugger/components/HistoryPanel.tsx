// src/pages/tools/api-debugger/components/HistoryPanel.tsx
import { useState } from "react";
import { Clock, FolderOpen, Trash2, ChevronDown, ChevronRight, FolderPlus } from "lucide-react";
import type { HistoryEntry, CollectionItem, CollectionFolder, RequestTab } from "../types";
import { METHOD_COLORS } from "../types";

interface HistoryPanelProps {
  history: HistoryEntry[];
  collections: { folders: CollectionFolder[]; items: CollectionItem[] };
  onLoadFromHistory: (entry: HistoryEntry) => void;
  onLoadFromCollection: (item: CollectionItem) => void;
  onSaveToCollection: (tab: RequestTab) => void;
  onClearHistory: () => void;
  onRemoveHistory: (id: string) => void;
  onRemoveCollection: (id: string) => void;
  onAddFolder: (name: string) => void;
  currentTab: RequestTab | undefined;
}

export function HistoryPanel({
  history, collections,
  onLoadFromHistory, onLoadFromCollection, onSaveToCollection,
  onClearHistory, onRemoveHistory, onRemoveCollection,
  onAddFolder, currentTab,
}: HistoryPanelProps) {
  const [activeSection, setActiveSection] = useState<"history" | "collections">("history");
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [newFolderName, setNewFolderName] = useState("");
  const [showFolderInput, setShowFolderInput] = useState(false);

  const toggleFolder = (id: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="flex flex-col h-full border-t border-border/50 bg-card">
      <div className="flex border-b border-border/50">
        <button
          onClick={() => setActiveSection("history")}
          className={`flex items-center gap-1.5 px-3 py-2 text-[11px] font-medium transition-colors border-b-2 -mb-px ${
            activeSection === "history" ? "text-cyan-400 border-cyan-400" : "text-muted-foreground border-transparent hover:text-foreground"
          }`}
        >
          <Clock className="w-3 h-3" /> 历史
        </button>
        <button
          onClick={() => setActiveSection("collections")}
          className={`flex items-center gap-1.5 px-3 py-2 text-[11px] font-medium transition-colors border-b-2 -mb-px ${
            activeSection === "collections" ? "text-cyan-400 border-cyan-400" : "text-muted-foreground border-transparent hover:text-foreground"
          }`}
        >
          <FolderOpen className="w-3 h-3" /> 集合
        </button>
        <div className="flex-1" />
        {activeSection === "history" && history.length > 0 && (
          <button onClick={onClearHistory} className="px-2 py-1 text-[10px] text-muted-foreground hover:text-red-400">
            清空
          </button>
        )}
        {activeSection === "collections" && currentTab && (
          <button
            onClick={() => onSaveToCollection(currentTab)}
            className="px-2 py-1 text-[10px] text-cyan-400 hover:text-cyan-300"
          >
            + 保存
          </button>
        )}
      </div>

      <div className="flex-1 overflow-auto">
        {activeSection === "history" && (
          <div className="py-1">
            {history.length === 0 ? (
              <div className="p-4 text-center text-[11px] text-muted-foreground">暂无请求历史</div>
            ) : (
              history.map((entry) => (
                <div
                  key={entry.id}
                  className="group flex items-center gap-2 px-3 py-1.5 hover:bg-muted/50 cursor-pointer text-xs"
                  onClick={() => onLoadFromHistory(entry)}
                >
                  <span className={`font-mono font-semibold text-[10px] shrink-0 ${METHOD_COLORS[entry.tab.method]}`}>
                    {entry.tab.method}
                  </span>
                  <span className="truncate text-muted-foreground flex-1">{entry.tab.url || "(empty)"}</span>
                  {entry.responseStatus && (
                    <span className={`text-[10px] shrink-0 ${
                      entry.responseStatus < 300 ? "text-emerald-400" :
                      entry.responseStatus < 400 ? "text-amber-400" : "text-red-400"
                    }`}>
                      {entry.responseStatus}
                    </span>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); onRemoveHistory(entry.id); }}
                    className="p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-secondary/80 transition-all"
                  >
                    <Trash2 className="w-3 h-3 text-muted-foreground" />
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {activeSection === "collections" && (
          <div className="py-1">
            {collections.folders.map((folder) => {
              const folderItems = collections.items.filter((i) => i.folderId === folder.id);
              return (
                <div key={folder.id}>
                  <div
                    className="flex items-center gap-1 px-3 py-1 text-[11px] text-muted-foreground hover:bg-muted/50 cursor-pointer"
                    onClick={() => toggleFolder(folder.id)}
                  >
                    {expandedFolders.has(folder.id) ? (
                      <ChevronDown className="w-3 h-3" />
                    ) : (
                      <ChevronRight className="w-3 h-3" />
                    )}
                    <FolderOpen className="w-3 h-3 text-amber-400" />
                    <span className="flex-1">{folder.name}</span>
                    <span className="text-[10px]">{folderItems.length}</span>
                  </div>
                  {expandedFolders.has(folder.id) && folderItems.map((item) => (
                    <div
                      key={item.id}
                      className="group flex items-center gap-2 pl-8 pr-3 py-1 hover:bg-muted/50 cursor-pointer text-xs"
                      onClick={() => onLoadFromCollection(item)}
                    >
                      <span className={`font-mono font-semibold text-[10px] shrink-0 ${METHOD_COLORS[item.method]}`}>
                        {item.method}
                      </span>
                      <span className="truncate text-muted-foreground flex-1">{item.name}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); onRemoveCollection(item.id); }}
                        className="p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-secondary/80 transition-all"
                      >
                        <Trash2 className="w-3 h-3 text-muted-foreground" />
                      </button>
                    </div>
                  ))}
                </div>
              );
            })}
            {collections.items.filter((i) => !i.folderId).map((item) => (
              <div
                key={item.id}
                className="group flex items-center gap-2 px-3 py-1 hover:bg-muted/50 cursor-pointer text-xs"
                onClick={() => onLoadFromCollection(item)}
              >
                <span className={`font-mono font-semibold text-[10px] shrink-0 ${METHOD_COLORS[item.method]}`}>
                  {item.method}
                </span>
                <span className="truncate text-muted-foreground flex-1">{item.name}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); onRemoveCollection(item.id); }}
                  className="p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-secondary/80 transition-all"
                >
                  <Trash2 className="w-3 h-3 text-muted-foreground" />
                </button>
              </div>
            ))}
            {showFolderInput ? (
              <div className="flex items-center gap-1 px-3 py-1">
                <input
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newFolderName.trim()) {
                      onAddFolder(newFolderName.trim());
                      setNewFolderName("");
                      setShowFolderInput(false);
                    }
                    if (e.key === "Escape") setShowFolderInput(false);
                  }}
                  placeholder="文件夹名称..."
                  className="flex-1 px-2 py-1 text-[11px] bg-muted/50 border border-border/30 rounded outline-none"
                  autoFocus
                />
              </div>
            ) : (
              <button
                onClick={() => setShowFolderInput(true)}
                className="flex items-center gap-1 px-3 py-1 text-[11px] text-muted-foreground hover:text-foreground w-full"
              >
                <FolderPlus className="w-3 h-3" /> 新建文件夹
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
