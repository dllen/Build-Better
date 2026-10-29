import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useState, useMemo } from "react";
import Fuse from "fuse.js";
import { SEO } from "@/components/seo";
import { SearchInput } from "@/components/common/SearchInput";
import { ToolRail } from "@/components/common/ToolRail";
import {
  CATEGORIES,
  groupedTools,
  popularTools,
  recentTools,
  toolToneClasses,
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

  const totalTools = useMemo(() => groups.reduce((n, g) => n + g.tools.length, 0), [groups]);

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

  const ToolCard = ({ tool }: { tool: ResolvedTool }) => {
    const tone = toolToneClasses(tool.category);
    return (
      <Link
        to={tool.path}
        className="group flex flex-col gap-3 p-5 bg-card rounded-card border border-border hairline-lift focus-visible:outline-2 focus-visible:outline-ring"
      >
        <div
          className={`inline-flex p-2.5 rounded-pill ${tone.tile} self-start transition-colors duration-short ease-out`}
        >
          <tool.icon className={`h-5 w-5 ${tone.glyph}`} aria-hidden="true" />
        </div>
        <h3 className="text-title font-medium text-foreground text-balance">{tool.name}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{tool.description}</p>
      </Link>
    );
  };

  /** A rail: a horizontal run past the container edge, one cut by the edge. */
  const Rail = ({
    title,
    count,
    tools,
  }: {
    title: string;
    count: number;
    tools: ResolvedTool[];
  }) => <ToolRail title={title} count={count} tools={tools} />;

  return (
    <div>
      <SEO />

      {/* Hero — Banner posture: the search is the action, and the first
          section shows above the fold. */}
      <section className="pt-12 pb-10 sm:pt-16 sm:pb-12">
        <div className="max-w-5xl">
          <h1 className="text-display-s font-medium text-foreground text-balance !max-w-[22ch]">
            {t("home.title", "Developer Micro-Tools Collection")}
          </h1>
          <p className="lead mt-5 text-ink-2">
            {t("home.subtitle", "A suite of essential tools for developers, Fast, reliable, and easy to use.")}
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            className="w-full lg:max-w-xl"
          />
          <p className="measured text-lg text-ink shrink-0">
            {totalTools} <span className="text-muted-foreground text-sm">tools</span>
          </p>
        </div>
      </section>

      {/* Category filter rail */}
      {!isSearching && (
        <div className="rail pb-2 -mx-4 px-4 mb-12">
          <button
            type="button"
            onClick={() => setActiveCategory("all")}
            aria-pressed={activeCategory === "all"}
            className="chip"
            data-state={activeCategory === "all" ? "on" : undefined}
          >
            {t("home.all_categories", "All")}
          </button>
          {CATEGORIES.map((cat) => {
            const count = groups.find((g) => g.category.id === cat.id)?.tools.length ?? 0;
            if (count === 0) return null;
            const on = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                aria-pressed={on}
                className="chip"
                data-state={on ? "on" : undefined}
              >
                {categoryLabel(cat.labelKey)}
                <span className="measured opacity-70">{count}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Search results */}
      {isSearching && (
        <section className="pb-16">
          <div className="flex items-baseline justify-between gap-4 mb-6">
            <h2 className="text-section font-medium text-foreground">
              {t("home.section_tools")}
            </h2>
            <span className="measured text-sm text-muted-foreground">
              {searchResults.length}
            </span>
          </div>
          {searchResults.length === 0 ? (
            <div className="panel p-8 text-center">
              <p className="text-muted-foreground">
                {t("home.no_results", `No tools found for "{{q}}"`, { q: searchTerm })}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {searchResults.map((tool) => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Grouped browsing */}
      {!isSearching && (
        <>
          {activeCategory === "all" && popular.length > 0 && (
            <Rail
              title={t("home.section_popular", "Popular Tools")}
              count={popular.length}
              tools={popular}
            />
          )}

          {activeCategory === "all" && recent.length > 0 && (
            <Rail
              title={t("home.section_recent", "Recently Added")}
              count={recent.length}
              tools={recent}
            />
          )}

          {visibleGroups.map(({ category, tools }) => (
            <section key={category.id} className="section-s">
              <div className="flex items-baseline justify-between gap-4 mb-6">
                <h2 className="text-section font-medium text-foreground flex items-center gap-2">
                  <category.icon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                  {categoryLabel(category.labelKey)}
                </h2>
                <span className="measured text-sm text-muted-foreground">{tools.length}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
