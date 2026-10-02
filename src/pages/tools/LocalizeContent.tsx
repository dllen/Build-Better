import React from "react";

interface Props {
  toolId: string;
  lang: string;
  /** When true, renders nothing client-side (noindex markets). */
  fallbackOnly?: boolean;
}

/**
 * Load and render MDX content for a tool in a given language.
 * Uses Vite's import.meta.glob for build-time resolution; if missing, renders
 * a simple fallback.
 */
export default function LocalizedContent({ toolId, lang, fallbackOnly }: Props) {
  // Build-time: import.meta.glob reads all MDX files at bundle time.
  const modules = import.meta.glob<{ default: React.ComponentType }>(
    "../../content/*/*.mdx",
    { eager: true }
  );
  const path = `../../content/${lang}/${toolId}.mdx`;
  const Mdx = modules[path]?.default;

  if (!Mdx || fallbackOnly) {
    return (
      <p className="text-gray-500 italic text-sm">
        Localized content for {toolId} ({lang}) coming soon.
      </p>
    );
  }
  return <Mdx />;
}
