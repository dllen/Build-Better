// src/pages/tools/api-debugger/hooks/useRequest.ts
import { useCallback } from "react";
import type { RequestTab, Environment, ResponseData } from "../types";
import { replaceVariables } from "../utils/variable-replacer";

export function useRequest() {
  const sendRequest = useCallback(async (
    tab: RequestTab,
    env: Environment
  ): Promise<ResponseData> => {
    const resolvedUrl = replaceVariables(tab.url, env);

    const activeParams = tab.params.filter((p) => p.enabled && p.key);
    const queryString = activeParams
      .map((p) => `${encodeURIComponent(p.key)}=${encodeURIComponent(replaceVariables(p.value, env))}`)
      .join("&");
    const fullUrl = queryString
      ? `${resolvedUrl}${resolvedUrl.includes("?") ? "&" : "?"}${queryString}`
      : resolvedUrl;

    const activeHeaders = tab.headers.filter((h) => h.enabled && h.key);
    const headerObj = activeHeaders.reduce((acc, h) => {
      acc[replaceVariables(h.key, env)] = replaceVariables(h.value, env);
      return acc;
    }, {} as Record<string, string>);

    const resolvedBody = tab.bodyType !== "none" && tab.body
      ? replaceVariables(tab.body, env)
      : undefined;

    const startTime = performance.now();
    const res = await fetch("/api/tools/api-debugger", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        method: tab.method,
        url: fullUrl,
        headers: headerObj,
        body: tab.method !== "GET" && tab.method !== "HEAD" ? resolvedBody : undefined,
      }),
    });

    const responseData = await res.json();
    const endTime = performance.now();

    if (!res.ok) {
      throw new Error(responseData.error || `Request failed with status ${res.status}`);
    }

    return {
      status: responseData.status,
      statusText: responseData.statusText,
      headers: responseData.headers,
      data: responseData.data,
      time: Math.round(endTime - startTime),
      size: JSON.stringify(responseData.data).length,
    };
  }, []);

  return { sendRequest };
}
