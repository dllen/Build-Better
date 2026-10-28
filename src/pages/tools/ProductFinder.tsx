import { useState, useEffect, useMemo } from "react";
import { Compass, Search, ExternalLink, X } from "lucide-react";
import { SEO } from "@/components/seo";
import { ToolPageSEO } from "@/components/seo/ToolPageSEO";
import { toolSEOContent } from "@/data/tool-seo-content";

interface ProductTag {
  name: string;
  slug: string;
}

interface ProductCategory {
  name: string;
  slug: string;
  order: number;
}

interface Product {
  name: string;
  slug: string;
  tagline: string;
  description: string;
  website: string;
  logo: string;
  thumbnail: string;
  tags: string[];
  pricing_type: string;
  status: string;
}

interface ProductData {
  metadata: {
    categories: ProductCategory[];
    tags: ProductTag[];
    total: number;
  };
  products: Product[];
}

const PRICING_COLORS: Record<string, string> = {
  Free: "bg-success/10 text-success dark:bg-success/30 dark:text-success",
  Freemium: "bg-primary/10 text-primary dark:bg-primary/30 dark:text-primary",
  Paid: "bg-primary/10 text-primary dark:bg-primary/30 dark:text-primary",
};

export default function ProductFinder() {
  const [data, setData] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedPricing, setSelectedPricing] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/data/product-finder.json")
      .then((res) => res.json())
      .then((json) => setData(json))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!data) return [];
    let result = data.products;

    if (search.trim()) {
      const term = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.tagline.toLowerCase().includes(term) ||
          p.description.toLowerCase().includes(term)
      );
    }

    if (selectedCategory) {
      // Products don't have category field in crawled data, skip for now
    }

    if (selectedPricing) {
      result = result.filter((p) => p.pricing_type === selectedPricing);
    }

    if (selectedTags.size > 0) {
      result = result.filter((p) => p.tags.some((t) => selectedTags.has(t)));
    }

    return result;
  }, [data, search, selectedCategory, selectedPricing, selectedTags]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  };

  return (
    <div className="text-foreground font-sans">
      <SEO
        title={toolSEOContent["product-finder"]?.title || "Product Finder"}
        description={
          toolSEOContent["product-finder"]?.description ||
          "Discover 400+ indie products, tools, and SaaS — filter by category, pricing, and tags."
        }
        keywords={["product", "finder", "tools", "saas", "indie", "discover"]}
      />
      {toolSEOContent["product-finder"] && (
        <ToolPageSEO data={toolSEOContent["product-finder"]} />
      )}

      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 dark:bg-primary/20 rounded-xl border border-border dark:border-border/30">
              <Compass className="w-8 h-8 text-primary dark:text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Product Finder</h1>
              <p className="text-muted-foreground text-sm mt-1">
                {data ? `Discover ${data.metadata.total}+ indie products and tools` : "Discover indie products and tools"}
              </p>
            </div>
          </div>
        </header>

        {/* Filters */}
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search products by name, tagline, or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            />
          </div>

          {/* Pricing tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedPricing(null)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${ !selectedPricing ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground" }`}
              type="button"
            >
              All
            </button>
            {["Free", "Freemium", "Paid"].map((pricing) => (
              <button
                key={pricing}
                onClick={() => setSelectedPricing(selectedPricing === pricing ? null : pricing)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${ selectedPricing === pricing ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground" }`}
                type="button"
              >
                {pricing}
              </button>
            ))}
          </div>

          {/* Category tabs */}
          {data?.metadata.categories && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${ !selectedCategory ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent" }`}
                type="button"
              >
                All Categories
              </button>
              {data.metadata.categories
                .sort((a, b) => a.order - b.order)
                .map((cat) => (
                  <button
                    key={cat.slug}
                    onClick={() =>
                      setSelectedCategory(selectedCategory === cat.slug ? null : cat.slug)
                    }
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${ selectedCategory === cat.slug ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent" }`}
                    type="button"
                  >
                    {cat.name}
                  </button>
                ))}
            </div>
          )}

          {/* Selected tags */}
          {selectedTags.size > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {[...selectedTags].map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs rounded-full"
                >
                  {tag}
                  <button onClick={() => toggleTag(tag)} type="button">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <button
                onClick={() => setSelectedTags(new Set())}
                className="text-xs text-muted-foreground hover:text-foreground ml-1"
                type="button"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Results count */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {loading
              ? "Loading products..."
              : `Showing ${filtered.length} of ${data?.products.length || 0} products`}
          </p>
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <div className="flex flex-col items-center gap-3">
              <Compass className="w-8 h-8 animate-pulse text-primary" />
              <p>Loading products…</p>
            </div>
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((product) => (
              <article
                key={product.slug}
                className="group bg-card border border-border rounded-xl p-5 hover:border-primary/30 transition-colors duration-300 flex flex-col"
              >
                {/* Logo + header */}
                <div className="flex items-start gap-3 mb-3">
                  {product.logo ? (
                    <img
                      src={product.logo}
                      alt={product.name}
                      className="w-10 h-10 rounded-lg object-cover bg-muted flex-shrink-0"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <Compass className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-card-foreground group-hover:text-primary transition-colors truncate">
                      {product.name}
                    </h3>
                    {product.tagline && (
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                        {product.tagline}
                      </p>
                    )}
                  </div>
                  {product.pricing_type && (
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${ PRICING_COLORS[product.pricing_type] || "bg-muted text-muted-foreground" }`}
                    >
                      {product.pricing_type}
                    </span>
                  )}
                </div>

                {/* Description */}
                {product.description && (
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-3 flex-1">
                    {product.description}
                  </p>
                )}

                {/* Tags */}
                {product.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {product.tags.slice(0, 5).map((tag) => (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`text-xs px-1.5 py-0.5 rounded transition-colors ${ selectedTags.has(tag) ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground hover:text-foreground hover:bg-accent" }`}
                        type="button"
                      >
                        {tag}
                      </button>
                    ))}
                    {product.tags.length > 5 && (
                      <span className="text-xs text-muted-foreground px-1">
                        +{product.tags.length - 5}
                      </span>
                    )}
                  </div>
                )}

                {/* Visit button */}
                <a
                  href={product.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 w-full py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors mt-auto"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Visit
                </a>
              </article>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-64 text-muted-foreground border-2 border-dashed border-border rounded-xl">
            <p>No products found. Try adjusting your filters.</p>
          </div>
        )}

        {/* Footer attribution */}
        <footer className="text-center text-xs text-muted-foreground pt-4 border-t border-border">
          Product data sourced from{" "}
          <a
            href="https://10015.io/product-finder"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            10015.io Product Finder
          </a>
        </footer>
      </div>
    </div>
  );
}