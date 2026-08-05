// src/pages/tools/api-debugger/components/EnvironmentSwitcher.tsx
import { useState, useRef, useEffect } from "react";
import { ChevronDown, Plus, Settings, Trash2, Check } from "lucide-react";
import type { EnvironmentConfig, Environment } from "../types";

interface EnvironmentSwitcherProps {
  environments: EnvironmentConfig[];
  activeId: string;
  onSelect: (id: string) => void;
  onAdd: (name: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onUpdateVariables: (id: string, vars: Environment) => void;
}

export function EnvironmentSwitcher({
  environments, activeId, onSelect, onAdd, onDelete, onRename, onUpdateVariables,
}: EnvironmentSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editingVarsId, setEditingVarsId] = useState<string | null>(null);
  const [editingVars, setEditingVars] = useState<Array<{ key: string; value: string }>>([]);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
        setManageOpen(false);
      }
    };
    setTimeout(() => document.addEventListener("click", close), 0);
    return () => document.removeEventListener("click", close);
  }, [open]);

  const active = environments.find((e) => e.id === activeId);

  const openVarEditor = (env: EnvironmentConfig) => {
    const vars = Object.entries(env.variables).map(([key, value]) => ({ key, value }));
    setEditingVars(vars.length > 0 ? vars : [{ key: "", value: "" }]);
    setEditingVarsId(env.id);
  };

  const saveVars = () => {
    if (editingVarsId) {
      const vars: Environment = {};
      for (const { key, value } of editingVars) {
        if (key.trim()) vars[key.trim()] = value;
      }
      onUpdateVariables(editingVarsId, vars);
    }
    setEditingVarsId(null);
  };

  const addVarRow = () => {
    setEditingVars([...editingVars, { key: "", value: "" }]);
  };

  const updateVarRow = (index: number, field: "key" | "value", val: string) => {
    const next = [...editingVars];
    next[index] = { ...next[index], [field]: val };
    setEditingVars(next);
  };

  const removeVarRow = (index: number) => {
    if (editingVars.length <= 1) {
      setEditingVars([{ key: "", value: "" }]);
    } else {
      setEditingVars(editingVars.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md border border-border/50 bg-card hover:bg-secondary/80 transition-colors"
      >
        <span className="text-muted-foreground">环境:</span>
        <span className="font-medium text-cyan-400">{active?.name ?? "No Env"}</span>
        <ChevronDown className="w-3 h-3 text-muted-foreground" />
      </button>

      {open && !manageOpen && !editingVarsId && (
        <div className="absolute right-0 top-full mt-1 w-52 py-1 bg-popover border border-border rounded-lg shadow-xl z-30">
          {environments.map((env) => (
            <button
              key={env.id}
              onClick={() => { onSelect(env.id); setOpen(false); }}
              className={`flex items-center justify-between w-full px-3 py-2 text-xs hover:bg-muted/80 transition-colors ${
                env.id === activeId ? "text-cyan-400" : "text-muted-foreground"
              }`}
            >
              {env.name}
              {env.id === activeId && <Check className="w-3.5 h-3.5" />}
            </button>
          ))}
          <div className="border-t border-border/50 my-1" />
          <button
            onClick={() => setManageOpen(true)}
            className="flex items-center gap-2 w-full px-3 py-2 text-xs text-muted-foreground hover:bg-muted/80 transition-colors"
          >
            <Settings className="w-3.5 h-3.5" /> 管理环境
          </button>
        </div>
      )}

      {open && manageOpen && !editingVarsId && (
        <div className="absolute right-0 top-full mt-1 w-64 py-2 px-2 bg-popover border border-border rounded-lg shadow-xl z-30">
          <div className="flex items-center gap-1 mb-2">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="新环境名称..."
              className="flex-1 px-2 py-1 text-xs bg-muted/50 border border-border/30 rounded-md outline-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && newName.trim()) {
                  onAdd(newName.trim());
                  setNewName("");
                }
              }}
            />
            <button
              onClick={() => {
                if (newName.trim()) { onAdd(newName.trim()); setNewName(""); }
              }}
              className="p-1 rounded text-cyan-400 hover:bg-cyan-500/10"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-0.5 max-h-48 overflow-auto">
            {environments.filter((e) => e.name !== "No Environment").map((env) => (
              <div key={env.id} className="flex items-center gap-1">
                {editId === env.id ? (
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") { onRename(env.id, editName); setEditId(null); }
                      if (e.key === "Escape") setEditId(null);
                    }}
                    className="flex-1 px-2 py-1 text-xs bg-muted/50 border border-border/30 rounded-md outline-none"
                    autoFocus
                  />
                ) : (
                  <span
                    className="flex-1 px-2 py-1 text-xs cursor-pointer hover:bg-muted/50 rounded"
                    onDoubleClick={() => { setEditId(env.id); setEditName(env.name); }}
                  >
                    {env.name}
                  </span>
                )}
                <button
                  onClick={() => openVarEditor(env)}
                  className="p-0.5 rounded text-muted-foreground hover:text-cyan-400"
                  title="编辑变量"
                >
                  <Settings className="w-3 h-3" />
                </button>
                <button
                  onClick={() => onDelete(env.id)}
                  className="p-0.5 rounded text-muted-foreground hover:text-red-400"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={() => setManageOpen(false)}
            className="mt-2 w-full py-1 text-[10px] text-muted-foreground hover:text-foreground"
          >
            返回
          </button>
        </div>
      )}

      {/* Variable editor */}
      {open && editingVarsId && (
        <div className="absolute right-0 top-full mt-1 w-72 py-2 px-2 bg-popover border border-border rounded-lg shadow-xl z-30">
          <div className="text-[11px] font-medium text-foreground mb-2 px-1">
            {environments.find((e) => e.id === editingVarsId)?.name} — 变量
          </div>
          <div className="space-y-1 max-h-56 overflow-auto mb-2">
            {editingVars.map((v, i) => (
              <div key={i} className="flex items-center gap-1">
                <input
                  value={v.key}
                  onChange={(e) => updateVarRow(i, "key", e.target.value)}
                  placeholder="变量名"
                  className="flex-1 min-w-0 px-2 py-1 text-xs bg-muted/50 border border-border/30 rounded-md outline-none font-mono"
                  spellCheck={false}
                />
                <input
                  value={v.value}
                  onChange={(e) => updateVarRow(i, "value", e.target.value)}
                  placeholder="值"
                  className="flex-1 min-w-0 px-2 py-1 text-xs bg-muted/50 border border-border/30 rounded-md outline-none font-mono"
                  spellCheck={false}
                />
                <button
                  onClick={() => removeVarRow(i)}
                  className="p-0.5 rounded text-muted-foreground hover:text-red-400 shrink-0"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={addVarRow}
            className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground px-1 mb-2"
          >
            <Plus className="w-3 h-3" /> 添加变量
          </button>
          <div className="flex gap-1">
            <button
              onClick={() => setEditingVarsId(null)}
              className="flex-1 py-1 text-[10px] text-muted-foreground hover:text-foreground border border-border/50 rounded-md"
            >
              取消
            </button>
            <button
              onClick={saveVars}
              className="flex-1 py-1 text-[10px] bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 rounded-md hover:bg-cyan-500/25"
            >
              保存变量
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
