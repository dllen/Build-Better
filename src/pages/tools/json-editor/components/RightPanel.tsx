// src/pages/tools/json-editor/components/RightPanel.tsx
import { PanelRightClose, Trees, FileCheck, BarChart3 } from "lucide-react";
import type { PanelTab, JsonNodeInfo, JsonStatsData } from "../types";
import { StructureTree } from "./StructureTree";
import { SchemaValidator } from "./SchemaValidator";
import { JsonStats } from "./JsonStats";

interface RightPanelProps {
  isOpen: boolean;
  activeTab: PanelTab;
  onTabChange: (tab: PanelTab) => void;
  onToggle: () => void;
  structureTree: JsonNodeInfo | null;
  jsonContent: string;
  isValid: boolean;
  stats: JsonStatsData | null;
  onNavigate?: (path: string) => void;
  onKeyClick?: (key: string) => void;
}

const TABS: { key: PanelTab; icon: React.ElementType; label: string }[] = [
  { key: "structure", icon: Trees, label: "结构" },
  { key: "schema", icon: FileCheck, label: "Schema" },
  { key: "stats", icon: BarChart3, label: "统计" },
];

export function RightPanel({
  isOpen, activeTab, onTabChange, onToggle,
  structureTree, jsonContent, isValid, stats, onNavigate, onKeyClick,
}: RightPanelProps) {
  if (!isOpen) {
    return (
      <button onClick={onToggle}
        className="flex-shrink-0 w-10 flex items-center justify-center rounded-lg border border-border bg-card hover:bg-secondary transition-colors"
        title="显示面板">
        <PanelRightClose className="w-4 h-4" />
      </button>
    );
  }

  return (
    <div className="w-72 flex-shrink-0 flex flex-col rounded-lg border border-border bg-card overflow-hidden shadow-inner transition-all duration-200 ease-out">
      <div className="flex items-center border-b border-border/50 bg-gradient-to-r from-muted/30 to-transparent">
        <div className="flex-1 flex">
          {TABS.map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => onTabChange(key)}
              className={`flex items-center gap-1.5 px-3 py-2 text-[11px] font-medium transition-colors border-b-2 -mb-px ${
                activeTab === key ? "text-cyan-400 border-cyan-400" : "text-muted-foreground border-transparent hover:text-foreground"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">{label}</span>
            </button>
          ))}
        </div>
        <button onClick={onToggle}
          className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary/80 rounded transition-colors">
          <PanelRightClose className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1 overflow-hidden">
        {activeTab === "structure" && <StructureTree tree={structureTree} onNavigate={onNavigate} />}
        {activeTab === "schema" && <SchemaValidator jsonContent={jsonContent} isValid={isValid} />}
        {activeTab === "stats" && <JsonStats stats={stats} onKeyClick={onKeyClick} />}
      </div>
    </div>
  );
}
