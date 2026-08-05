// src/pages/tools/json-editor/hooks/useJsonValidation.ts
import { useState, useCallback } from "react";
import { tryParseJson, buildStructureTree, computeJsonStats } from "../utils/json5-parser";
import type { JsonNodeInfo, JsonStatsData } from "../types";

export function useJsonValidation() {
  const [isValid, setIsValid] = useState(true);
  const [parseError, setParseError] = useState<string | null>(null);
  const [wasFixed, setWasFixed] = useState(false);
  const [structureTree, setStructureTree] = useState<JsonNodeInfo | null>(null);
  const [stats, setStats] = useState<JsonStatsData | null>(null);

  const validate = useCallback((text: string): boolean => {
    const { result, error, wasFixed: fixed } = tryParseJson(text);
    if (error) {
      setIsValid(false);
      setParseError(error);
      setWasFixed(false);
      setStructureTree(null);
      setStats(null);
      return false;
    }
    setIsValid(true);
    setParseError(null);
    setWasFixed(fixed);
    if (result !== null) {
      setStructureTree(buildStructureTree(result));
      setStats(computeJsonStats(result));
    }
    return true;
  }, []);

  return { isValid, parseError, wasFixed, validate, structureTree, stats };
}
