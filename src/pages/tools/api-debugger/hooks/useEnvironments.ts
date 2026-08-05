// src/pages/tools/api-debugger/hooks/useEnvironments.ts
import { useState, useCallback, useMemo } from "react";
import type { EnvironmentConfig, Environment } from "../types";
import { genId } from "../types";
import { loadJSON, saveJSON } from "../utils/storage";

const ENVS_KEY = "environments";
const ACTIVE_KEY = "activeEnv";

const DEFAULT_ENVS: EnvironmentConfig[] = [
  { id: genId(), name: "No Environment", variables: {} },
];

export function useEnvironments() {
  const [environments, setEnvironments] = useState<EnvironmentConfig[]>(() =>
    loadJSON(ENVS_KEY, DEFAULT_ENVS)
  );
  const [activeId, setActiveId] = useState<string>(() =>
    loadJSON<string>(ACTIVE_KEY, DEFAULT_ENVS[0].id)
  );

  const activeEnv = useMemo(
    () => environments.find((e) => e.id === activeId)?.variables ?? {},
    [environments, activeId]
  );

  const saveEnvs = useCallback((envs: EnvironmentConfig[]) => {
    setEnvironments(envs);
    saveJSON(ENVS_KEY, envs);
  }, []);

  const setActive = useCallback((id: string) => {
    setActiveId(id);
    saveJSON(ACTIVE_KEY, id);
  }, []);

  const addEnv = useCallback((name: string) => {
    const env: EnvironmentConfig = { id: genId(), name, variables: {} };
    saveEnvs([...environments, env]);
    setActive(env.id);
  }, [environments, saveEnvs, setActive]);

  const updateEnv = useCallback((id: string, variables: Environment) => {
    saveEnvs(environments.map((e) => (e.id === id ? { ...e, variables } : e)));
  }, [environments, saveEnvs]);

  const deleteEnv = useCallback((id: string) => {
    const next = environments.filter((e) => e.id !== id);
    if (next.length === 0) next.push({ id: genId(), name: "No Environment", variables: {} });
    saveEnvs(next);
    if (activeId === id) setActive(next[0].id);
  }, [environments, activeId, saveEnvs, setActive]);

  const renameEnv = useCallback((id: string, name: string) => {
    saveEnvs(environments.map((e) => (e.id === id ? { ...e, name } : e)));
  }, [environments, saveEnvs]);

  return {
    environments, activeId, activeEnv,
    setActive, addEnv, updateEnv, deleteEnv, renameEnv,
  };
}
