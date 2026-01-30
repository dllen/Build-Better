import { useState } from "react";
import { SearchInput } from "@/components/common/SearchInput";
import { useTranslation } from "react-i18next";
import { ExternalLink, Star, Bookmark } from "lucide-react";

interface Resource {
  id: string;
  title: string;
  description: string;
  url: string;
  category: string;
  icon?: string;
}

const resources: Resource[] = [
  // MCP Related
  {
    id: "mcp-servers",
    title: "Glama MCP Servers",
    description: "Discover and explore Model Context Protocol servers.",
    url: "https://glama.ai/mcp/servers",
    category: "mcp",
  },
  {
    id: "mcp-official",
    title: "Model Context Protocol",
    description: "The official documentation for Model Context Protocol.",
    url: "https://modelcontextprotocol.io/",
    category: "mcp",
  },
  // Agent Skills
  {
    id: "agent-skills",
    title: "AI Tmpl Skills",
    description: "A collection of skills for AI agents.",
    url: "https://www.aitmpl.com/skills",
    category: "agent-skills",
  },
  {
    id: "skills-mp",
    title: "SkillsMP",
    description: "Discover 58,925+ open-source agent skills for Claude, Codex & ChatGPT.",
    url: "https://skillsmp.com/",
    category: "agent-skills",
  },
  {
    id: "claude-skills-lib",
    title: "Claude Skills Library",
    description: "Production-Ready skill packages for Claude AI & Claude Code.",
    url: "https://github.com/alirezarezvani/claude-skills",
    category: "agent-skills",
  },
  {
    id: "vercel-agent-skills",
    title: "Vercel Agent Skills",
    description: "A collection of skills for AI coding agents by Vercel Engineering.",
    url: "https://github.com/vercel-labs/agent-skills",
    category: "agent-skills",
  },
  {
    id: "awesome-claude-skills",
    title: "Awesome Claude Skills",
    description: "The awesome collection of Claude Skills and resources.",
    url: "https://github.com/VoltAgent/awesome-claude-skills",
    category: "agent-skills",
  },
  {
    id: "ui-ux-benchmark-skill",
    title: "UI/UX Benchmark Skill",
    description: "Benchmark skill for UI/UX design.",
    url: "https://github.com/hylarucoder/benchmark-skill-ui-ux-pro-max",
    category: "agent-skills",
  },
  {
    id: "baoyu-skills",
    title: "Baoyu Skills",
    description: "A collection of practical Claude and AI agent skills.",
    url: "https://github.com/JimLiu/baoyu-skills",
    category: "agent-skills",
  },
  {
    id: "agent-skills-react-best-practices",
    title: "Agent Skills: React Best Practices",
    description: "Best-practice React skills from the Vercel Agent Skills repository.",
    url: "https://github.com/vercel-labs/agent-skills/tree/react-best-practices",
    category: "agent-skills",
  },
  {
    id: "agent-skills-guard",
    title: "Agent Skills Guard",
    description: "Guardrails and safety patterns for AI agent skills.",
    url: "https://github.com/brucevanfdm/agent-skills-guard",
    category: "agent-skills",
  },
  {
    id: "awesome-agent-skills",
    title: "Awesome Agent Skills",
    description: "Curated list of open-source agent skills and resources.",
    url: "https://github.com/libukai/awesome-agent-skills",
    category: "agent-skills",
  },
  // LLM Development
  {
    id: "openai-platform",
    title: "OpenAI Platform",
    description: "API access and developer tools for OpenAI models.",
    url: "https://platform.openai.com/",
    category: "llm-dev",
  },
  {
    id: "hugging-face",
    title: "Hugging Face",
    description: "The AI community building the future. Models, datasets, and spaces.",
    url: "https://huggingface.co/",
    category: "llm-dev",
  },
  {
    id: "langchain",
    title: "LangChain",
    description: "Framework for developing applications powered by language models.",
    url: "https://www.langchain.com/",
    category: "llm-dev",
  },
  {
    id: "microsoft-ai-agents-for-beginners",
    title: "AI Agents for Beginners",
    description: "Microsoft's hands-on curriculum for building AI agents step by step.",
    url: "https://github.com/microsoft/ai-agents-for-beginners",
    category: "llm-dev",
  },
  {
    id: "speed-comparison",
    title: "AI Speed Comparison",
    description: "Compare response speed across different AI models and providers.",
    url: "https://github.com/niklas-heer/speed-comparison",
    category: "llm-dev",
  },
  {
    id: "opensource-projects",
    title: "Open-source Projects",
    description: "Discover the best open-source projects and hidden gems in the developer community.",
    url: "https://www.opensourceprojects.dev/",
    category: "llm-dev",
  },
  {
    id: "build-your-own-x",
    title: "Build your own x",
    description: "Build your own (insert technology here)",
    url: "https://github.com/kjj6198/build-your-own-x",
    category: "llm-dev",
  },
  {
    id: "agents-md",
    title: "AGENTS.md",
    description: "A simple, open format for guiding coding agents.",
    url: "https://agents.md/",
    category: "llm-dev",
  },
  // Prompts
  {
    id: "flowgpt",
    title: "FlowGPT",
    description: "Visual interface for ChatGPT prompt engineering.",
    url: "https://flowgpt.com/",
    category: "prompts",
  },
  {
    id: "prompt-manager",
    title: "Prompt Manager",
    description: "Manage and organize reusable prompts for AI workflows.",
    url: "https://github.com/n-WN/prompt-manager",
    category: "prompts",
  },
  {
    id: "lijigang-2025",
    title: "2025李继刚提示词库",
    description: "2025年李继刚提示词库，包含107条提示词结构推文。",
    url: "https://www.geekjourney.dev/docs/prompt-guides/lijigang-2025",
    category: "prompts",
  },
  // Tools
  {
    id: "vercel-ai-sdk",
    title: "Vercel AI SDK",
    description: "The TypeScript Toolkit for AI-powered applications.",
    url: "https://sdk.vercel.ai/docs",
    category: "tools",
  },
  {
    id: "zlibrary-to-notebooklm",
    title: "ZLibrary to NotebookLM",
    description: "Convert Z-Library books into sources for NotebookLM.",
    url: "https://github.com/zstmfhy/zlibrary-to-notebooklm",
    category: "tools",
  },
  {
    id: "superpowers",
    title: "Superpowers",
    description: "Command-line superpowers for working with AI and automation.",
    url: "https://github.com/obra/superpowers",
    category: "tools",
  },
  {
    id: "shell-ai",
    title: "ShellAI",
    description: "A delightfully minimal, yet remarkably powerful AI Shell Assistant.",
    url: "https://github.com/ibigio/shell-ai",
    category: "tools",
  },
];

const categories = [
  { id: "mcp", title: "MCP Resources" },
  { id: "llm-dev", title: "LLM Development" },
  { id: "agent-skills", title: "Agent Skills" },
  { id: "prompts", title: "Prompts Library" },
  { id: "tools", title: "AI Tools" },
];

export default function AiDevelopment() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem("ai-dev-favorites");
    return saved ? JSON.parse(saved) : [];
  });

  const toggleFavorite = (id: string) => {
    const newFavorites = favorites.includes(id)
      ? favorites.filter((fid) => fid !== id)
      : [...favorites, id];
    setFavorites(newFavorites);
    localStorage.setItem("ai-dev-favorites", JSON.stringify(newFavorites));
  };

  const filteredResources = resources.filter((resource) =>
    resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    resource.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getCategoryResources = (categoryId: string) => {
    return filteredResources.filter((r) => r.category === categoryId);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">AI Development Navigation</h1>
        <p className="text-xl text-gray-600 mb-8">
          Curated resources for AI developers, including MCP, Agents, and LLMs.
        </p>
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search AI resources..."
        />
      </div>

      <div className="space-y-12">
        {categories.map((category) => {
          const categoryResources = getCategoryResources(category.id);
          if (categoryResources.length === 0) return null;

          return (
            <div key={category.id}>
              <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2">
                {category.title}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categoryResources.map((resource) => (
                  <div
                    key={resource.id}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow relative group"
                  >
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          toggleFavorite(resource.id);
                        }}
                        className="text-gray-400 hover:text-yellow-500"
                        title={favorites.includes(resource.id) ? "Remove from favorites" : "Add to favorites"}
                      >
                        {favorites.includes(resource.id) ? (
                          <Star className="h-5 w-5 fill-current text-yellow-500" />
                        ) : (
                          <Star className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block h-full"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {resource.title}
                        </h3>
                        <ExternalLink className="h-4 w-4 text-gray-400" />
                      </div>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        {resource.description}
                      </p>
                    </a>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {filteredResources.length === 0 && (
        <div className="text-center text-gray-500 mt-12">
          No resources found matching "{searchQuery}"
        </div>
      )}
    </div>
  );
}
