// src/pages/tools/api-debugger/components/KeyValueEditor.tsx
import { Plus, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import type { KeyValuePair } from "../types";
import { genId } from "../types";

interface KeyValueEditorProps {
  items: KeyValuePair[];
  onChange: (items: KeyValuePair[]) => void;
  showDescription?: boolean;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
}

export function KeyValueEditor({
  items,
  onChange,
  showDescription = false,
  keyPlaceholder = "Key",
  valuePlaceholder = "Value",
}: KeyValueEditorProps) {
  const update = (id: string, field: keyof KeyValuePair, value: string | boolean) => {
    onChange(items.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  const remove = (id: string) => {
    if (items.length <= 1) {
      onChange([{ id: genId(), key: "", value: "", description: "", enabled: true }]);
    } else {
      onChange(items.filter((item) => item.id !== id));
    }
  };

  const add = () => {
    onChange([...items, { id: genId(), key: "", value: "", description: "", enabled: true }]);
  };

  return (
    <div className="space-y-1">
      {items.map((item) => (
        <div key={item.id} className="flex items-center gap-1.5 group">
          <button
            onClick={() => update(item.id, "enabled", !item.enabled)}
            className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          >
            {item.enabled ? (
              <ToggleRight className="w-4 h-4 text-emerald-400" />
            ) : (
              <ToggleLeft className="w-4 h-4" />
            )}
          </button>
          <input
            type="text"
            value={item.key}
            onChange={(e) => update(item.id, "key", e.target.value)}
            placeholder={keyPlaceholder}
            className="flex-1 min-w-0 px-2 py-1.5 text-xs bg-muted/50 border border-border/30 rounded-md outline-none focus:border-cyan-500/30 font-mono"
            spellCheck={false}
          />
          <input
            type="text"
            value={item.value}
            onChange={(e) => update(item.id, "value", e.target.value)}
            placeholder={valuePlaceholder}
            className="flex-1 min-w-0 px-2 py-1.5 text-xs bg-muted/50 border border-border/30 rounded-md outline-none focus:border-cyan-500/30 font-mono"
            spellCheck={false}
          />
          {showDescription && (
            <input
              type="text"
              value={item.description}
              onChange={(e) => update(item.id, "description", e.target.value)}
              placeholder="Description"
              className="w-24 min-w-0 px-2 py-1.5 text-xs bg-muted/50 border border-border/30 rounded-md outline-none focus:border-cyan-500/30 hidden sm:block"
              spellCheck={false}
            />
          )}
          <button
            onClick={() => remove(item.id)}
            className="shrink-0 p-1 text-muted-foreground hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
      <button
        onClick={add}
        className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors pl-6"
      >
        <Plus className="w-3 h-3" /> Add
      </button>
    </div>
  );
}
