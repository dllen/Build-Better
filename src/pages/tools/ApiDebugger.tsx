// src/pages/tools/ApiDebugger.tsx
import { useState, useCallback, useEffect } from "react";
import { Terminal, PanelLeftClose, PanelLeft } from "lucide-react";
import { SEO } from "@/components/SEO";
import { ToolPageSEO } from "@/components/seo/ToolPageSEO";
import { TrustBanner } from "@/components/seo/TrustBanner";
import { useTranslation } from "react-i18next";
import { toolSEOContent } from "@/data/tool-seo-content";
import { useTabs } from "./api-debugger/hooks/useTabs";
import { useHistory } from "./api-debugger/hooks/useHistory";
import { useCollections } from "./api-debugger/hooks/useCollections";
import { useEnvironments } from "./api-debugger/hooks/useEnvironments";
import { useRequest } from "./api-debugger/hooks/useRequest";
import { TabBar } from "./api-debugger/components/TabBar";
import { EnvironmentSwitcher } from "./api-debugger/components/EnvironmentSwitcher";
import { RequestBuilder } from "./api-debugger/components/RequestBuilder";
import { ResponseViewer } from "./api-debugger/components/ResponseViewer";
import { HistoryPanel } from "./api-debugger/components/HistoryPanel";
import { CurlImporter } from "./api-debugger/components/CurlImporter";
import type { HttpMethod, RequestTab } from "./api-debugger/types";

export default function ApiDebugger() {
  const { t } = useTranslation();
  const { tabs, activeTabId, activeTab, setActiveTabId, addTab, closeTab, updateTab, updateActiveTab } = useTabs();
  const { history, addEntry, clearHistory, removeEntry: removeHistoryEntry } = useHistory();
  const { folders, items, addFolder, addItem, removeItem } = useCollections();
  const { environments, activeId, activeEnv, setActive, addEnv, deleteEnv, renameEnv, updateEnv } = useEnvironments();
  const { sendRequest } = useRequest();

  const [historyOpen, setHistoryOpen] = useState(true);
  const [curlImportOpen, setCurlImportOpen] = useState(false);
  const [splitRatio, setSplitRatio] = useState(50);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key === "t") { e.preventDefault(); addTab(); }
      if (mod && e.key === "w") { e.preventDefault(); closeTab(activeTabId); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [addTab, closeTab, activeTabId]);

  const handleSend = useCallback(async () => {
    if (!activeTab) return;
    updateTab(activeTab.id, { isLoading: true, responseError: null, response: null });
    try {
      const response = await sendRequest(activeTab, activeEnv);
      updateTab(activeTab.id, { response, isLoading: false });
      addEntry(activeTab, response.status, response.time);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "请求失败";
      updateTab(activeTab.id, { responseError: msg, isLoading: false });
      addEntry(activeTab, null, null);
    }
  }, [activeTab, activeEnv, sendRequest, updateTab, addEntry]);

  const handleLoadFromHistory = useCallback((entry: typeof history[0]) => {
    updateActiveTab({
      method: entry.tab.method,
      url: entry.tab.url,
      params: entry.tab.params,
      headers: entry.tab.headers,
      body: entry.tab.body,
      bodyType: entry.tab.bodyType,
      response: null,
      responseError: null,
    });
  }, [updateActiveTab]);

  const handleLoadFromCollection = useCallback((item: typeof items[0]) => {
    updateActiveTab({
      method: item.method,
      url: item.url,
      params: item.params,
      headers: item.headers,
      body: item.body,
      bodyType: item.bodyType,
      response: null,
      responseError: null,
    });
  }, [updateActiveTab]);

  const handleSaveToCollection = useCallback((tab: RequestTab) => {
    addItem({
      name: tab.name,
      method: tab.method,
      url: tab.url,
      params: tab.params,
      headers: tab.headers,
      body: tab.body,
      bodyType: tab.bodyType,
      folderId: null,
    });
  }, [addItem]);

  const handleImportCurl = useCallback((updates: Partial<RequestTab>) => {
    if (!activeTab) return;
    const method = (updates.method || "GET") as HttpMethod;
    const bodyType = (method !== "GET" && method !== "HEAD") ? "json" as const : "none" as const;
    updateActiveTab({
      ...updates,
      method,
      bodyType: updates.body ? bodyType : "none",
      body: updates.body || "",
    });
  }, [activeTab, updateActiveTab]);

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <SEO
        title={toolSEOContent["api-debugger"]?.title || "API Debugger"}
        description={toolSEOContent["api-debugger"]?.description || "A Postman-like API testing tool."}
        keywords={["api", "debugger", "rest", "http", "testing"]}
      />
      {toolSEOContent["api-debugger"] && <ToolPageSEO data={toolSEOContent["api-debugger"]} />}

      {/* Header */}
      <div className="flex-shrink-0 mb-2">
        <TrustBanner />
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500/20 to-amber-500/20 border border-orange-500/30">
              <Terminal className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold">{t("tools.api-debugger.name", "API Debugger")}</h1>
              <p className="text-xs text-muted-foreground">{t("tools.api-debugger.desc", "调试 REST API，类似 Postman")}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurlImportOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-border/50 text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
            >
              <Terminal className="w-3.5 h-3.5" /> Import cURL
            </button>
            <EnvironmentSwitcher
              environments={environments}
              activeId={activeId}
              onSelect={setActive}
              onAdd={addEnv}
              onDelete={deleteEnv}
              onRename={renameEnv}
              onUpdateVariables={updateEnv}
            />
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex-shrink-0">
        <TabBar
          tabs={tabs}
          activeTabId={activeTabId}
          onSelectTab={setActiveTabId}
          onCloseTab={closeTab}
          onAddTab={addTab}
          onRenameTab={(id, name) => updateTab(id, { name })}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex min-h-0">
        {/* Left: RequestBuilder */}
        <div className="flex-1 flex flex-col border-r border-border/50" style={{ flexBasis: `${splitRatio}%` }}>
          {activeTab ? (
            <RequestBuilder tab={activeTab} onUpdate={updateActiveTab} onSend={handleSend} />
          ) : (
            <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
              没有打开的请求
            </div>
          )}
        </div>

        {/* Split handle */}
        <div
          className="w-1 bg-border/30 hover:bg-cyan-500/50 cursor-col-resize transition-colors flex-shrink-0"
          onMouseDown={(e) => {
            const startX = e.clientX;
            const startRatio = splitRatio;
            const containerWidth = (e.target as HTMLElement).parentElement?.offsetWidth ?? window.innerWidth;
            const onMove = (ev: MouseEvent) => {
              const delta = ev.clientX - startX;
              setSplitRatio(Math.max(20, Math.min(80, startRatio + (delta / containerWidth) * 100)));
            };
            const onUp = () => {
              document.removeEventListener("mousemove", onMove);
              document.removeEventListener("mouseup", onUp);
            };
            document.addEventListener("mousemove", onMove);
            document.addEventListener("mouseup", onUp);
          }}
        />

        {/* Right: ResponseViewer */}
        <div className="flex-1 flex flex-col" style={{ flexBasis: `${100 - splitRatio}%` }}>
          <ResponseViewer
            response={activeTab?.response ?? null}
            error={activeTab?.responseError ?? null}
            isLoading={activeTab?.isLoading ?? false}
          />
        </div>
      </div>

      {/* Bottom: History panel toggle + panel */}
      <div className="flex-shrink-0 flex">
        <button
          onClick={() => setHistoryOpen(!historyOpen)}
          className="flex items-center gap-1 px-3 py-1 text-[10px] text-muted-foreground hover:text-foreground border-t border-border/50"
        >
          {historyOpen ? <PanelLeftClose className="w-3 h-3" /> : <PanelLeft className="w-3 h-3" />}
          {historyOpen ? "隐藏" : "显示"} 历史/集合
        </button>
      </div>
      {historyOpen && (
        <div className="flex-shrink-0 h-48">
          <HistoryPanel
            history={history}
            collections={{ folders, items }}
            onLoadFromHistory={handleLoadFromHistory}
            onLoadFromCollection={handleLoadFromCollection}
            onSaveToCollection={handleSaveToCollection}
            onClearHistory={clearHistory}
            onRemoveHistory={removeHistoryEntry}
            onRemoveCollection={removeItem}
            onAddFolder={addFolder}
            currentTab={activeTab}
          />
        </div>
      )}

      {/* cURL import modal */}
      <CurlImporter
        show={curlImportOpen}
        onClose={() => setCurlImportOpen(false)}
        onImport={handleImportCurl}
      />
    </div>
  );
}
