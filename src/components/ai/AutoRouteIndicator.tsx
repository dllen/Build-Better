import React, { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { listAvailableModels } from "@/services/ollama";
import { routeModel, type RoutingDecision } from "@/services/ai/modelRouter";

interface Props {
  /** Tool context for task detection */
  tool?: string;
  /** BCP-47 or language name */
  language?: string;
  /** Show reasoning string */
  showReason?: boolean;
}

/**
 * Auto-route indicator. When user is in "Auto" mode, picks the best
 * installed model for the task. Falls back to default choice with manual.
 */
export function AutoRouteIndicator({ tool, language, showReason = true }: Props) {
  const [decision, setDecision] = useState<RoutingDecision | null>(null);

  useEffect(() => {
    let mounted = true;
    listAvailableModels().then(installed => {
      if (!mounted) return;
      const names = installed.map(m => m.name);
      setDecision(routeModel(names, { tool, language }));
    });
    return () => { mounted = false; };
  }, [tool, language]);

  if (!decision || !decision.picked) return null;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-md p-2 text-xs">
      <div className="flex items-center gap-2">
        <Sparkles className="h-3 w-3 text-blue-500 flex-shrink-0" />
        <span className="font-semibold text-blue-900">Auto-routed</span>
        <span className="text-blue-700">→</span>
        <span className="font-mono text-blue-900">{decision.picked}</span>
        <span className="text-blue-500 ml-auto">{decision.task}</span>
      </div>
      {showReason && (
        <p className="text-blue-600 mt-1 ml-5 leading-relaxed">{decision.reason}</p>
      )}
    </div>
  );
}
