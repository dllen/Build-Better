import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useState, useMemo } from "react";
import Fuse from "fuse.js";
import { Star, Clock } from "lucide-react";
import { SEO } from "@/components/SEO";
import { SearchInput } from "@/components/common/SearchInput";
import {
  CATEGORIES,
  groupedTools,
  popularTools,
  recentTools,
  type ToolMeta,
  type CategoryId,
} from "@/data/tools";

type ResolvedTool = ToolMeta & { name: string; description: string };

export default function Home() {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState<CategoryId | "all">("all");

  // Resolve i18n text once per locale for search + render
  const resolve = useMemo(
    () => (tool: ToolMeta): ResolvedTool => ({
      ...tool,
      name: tool.nameKey ? t(tool.nameKey, tool.name) : tool.name,
      description: tool.descKey ? t(tool.descKey, tool.description) : tool.description,
    }),
    [t]
  );

  const groups = useMemo(
    () =>
      groupedTools().map((g) => ({
        category: g.category,
        tools: g.tools.map(resolve),
      })),
    [resolve]
  );

  const popular = useMemo(() => popularTools().map(resolve), [resolve]);
  const recent = useMemo(() => recentTools().map(resolve), [resolve]);

  const fuse = useMemo(() => {
    const all = groups.flatMap((g) => g.tools);
    return new Fuse(all, {
      keys: ["name", "description", "keywords"],
      threshold: 0.3,
    });
  }, [groups]);

  const isSearching = searchTerm.trim().length > 0;
  const searchResults = useMemo(() => {
    if (!isSearching) return [];
    return fuse.search(searchTerm).map((r) => r.item);
  }, [isSearching, fuse, searchTerm]);

  const visibleGroups = useMemo(() => {
    if (activeCategory === "all") return groups;
    return groups.filter((g) => g.category.id === activeCategory);
  }, [groups, activeCategory]);

  const categoryLabel = (labelKey: string) => t(labelKey);

  const ToolCard = ({ tool }: { tool: ResolvedTool }) => (
    <Link
      key={tool.id}
      to={tool.path}
      className="group block p-6 bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-blue-300 transition-all duration-200"
    >
      <div
        className={`inline-flex p-3 rounded-lg ${tool.bgColor} ${tool.color} mb-4 group-hover:scale-110 transition-transform`}
      >
        <tool.icon className="h-6 w-6" />
      </div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600">
        {tool.name}
      </h2>
      <p className="text-gray-600">{tool.description}</p>
    </Link>
  );

  return (
    <div className="space-y-10">
      <SEO />
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900 tracking-tight">{t("home.title")}</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">{t("home.subtitle")}</p>
      </div>

      <SearchInput value={searchTerm} onChange={setSearchTerm} />

      {/* Category filter bar */}
      {!isSearching && (
        <div className="flex flex-wrap justify-center gap-2">
          <button
            onClick={() => setActiveCategory("all")}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              activeCategory === "all"
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:text-blue-600"
            }`}
          >
            {t("home.all_categories", "All")}
          </button>
          {CATEGORIES.map((cat) => {
            const count = groups.find((g) => g.category.id === cat.id)?.tools.length ?? 0;
            if (count === 0) return null;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  activeCategory === cat.id
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:text-blue-600"
                }`}
              >
                {categoryLabel(cat.labelKey)}
                <span className="ml-1.5 text-xs opacity-70">{count}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Search results (flat) */}
      {isSearching && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900 border-b pb-2">
            {t("home.section_tools")}
          </h2>
          {searchResults.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              {t("home.no_results", `No tools found for "{{q}}"`, { q: searchTerm })}
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {searchResults.map((tool) => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Grouped browsing */}
      {!isSearching && (
        <>
          {activeCategory === "all" && popular.length > 0 && (
            <section className="space-y-4">
              <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-900 border-b pb-2">
                <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
                {t("home.section_popular", "Popular Tools")}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {popular.map((tool) => (
                  <ToolCard key={tool.id} tool={tool} />
                ))}
              </div>
            </section>
          )}

          {activeCategory === "all" && recent.length > 0 && (
            <section className="space-y-4">
              <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-900 border-b pb-2">
                <Clock className="h-5 w-5 text-blue-500" />
                {t("home.section_recent", "Recently Added")}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recent.map((tool) => (
                  <ToolCard key={tool.id} tool={tool} />
                ))}
              </div>
            </section>
          )}

          {visibleGroups.map(({ category, tools }) => (
            <section key={category.id} className="space-y-4">
              <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-900 border-b pb-2">
                <category.icon className="h-5 w-5 text-gray-500" />
                {categoryLabel(category.labelKey)}
                <span className="text-sm font-normal text-gray-400">{tools.length}</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tools.map((tool) => (
                  <ToolCard key={tool.id} tool={tool} />
                ))}
              </div>
            </section>
          ))}
        </>
      )}
    </div>
  );
}
