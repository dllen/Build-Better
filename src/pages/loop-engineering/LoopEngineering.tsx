import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ExternalLink, Search, ChevronRight, CheckCircle2, AlertTriangle, Clock, BookOpen, Wrench, FileText, Target, Sparkles } from "lucide-react";

// Templates data
const templates = [
  { name: "PR Babysitter Loop", category: "PR Review", risk: "Medium", desc: "Monitor a pull request until CI is green and review comments are resolved." },
  { name: "CI Failure Fix Loop", category: "CI Fix", risk: "Medium", desc: "Fix failing CI by reading logs, applying minimal changes, and rerunning validation." },
  { name: "Bug Fixing Loop", category: "Bug Fix", risk: "Medium", desc: "Reproduce a bug, fix the smallest cause, and verify with a regression test." },
  { name: "Code Review Loop", category: "Code Review", risk: "Low", desc: "Automated code review with configurable rules and severity levels." },
  { name: "Maker-Checker Loop", category: "Quality", risk: "Medium", desc: "Separation of concerns: one agent executes, another validates." },
  { name: "SEO Content Refresh Loop", category: "SEO", risk: "Low", desc: "Periodic content refresh based on keyword performance." },
  { name: "Data Cleaning Loop", category: "Data", risk: "Medium", desc: "Automated data quality checks and corrections." },
  { name: "Research Summary Loop", category: "Research", risk: "Low", desc: "Periodic research summaries from multiple sources." },
  { name: "Dependency Update Loop", category: "Maintenance", risk: "Medium", desc: "Safe dependency updates with changelog review." },
  { name: "Documentation Loop", category: "Docs", risk: "Low", desc: "Auto-generate and update documentation." },
  { name: "Refactor Loop", category: "Refactor", risk: "High", desc: "Structured refactoring with safety checks." },
  { name: "Migration Loop", category: "Migration", risk: "Critical", desc: "Framework or library migration with validation." },
];

// Tools data
const tools = [
  { name: "Claude Code /goal", category: "Official Docs", maturity: "Official", desc: "Official Claude Code feature for keeping Claude working toward a measurable completion condition." },
  { name: "Claude Code /loop", category: "Official Docs", maturity: "Official", desc: "Scheduled prompt and /loop documentation for recurring tasks." },
  { name: "Codex Follow a goal", category: "Official Docs", maturity: "Official", desc: "Official Codex guidance for durable goals with validation loops." },
  { name: "Codex AGENTS.md", category: "Official Docs", maturity: "Official", desc: "Durable instruction files for AI coding agents." },
  { name: "Codex Skills", category: "Official Docs", maturity: "Official", desc: "Reusable workflow packages for agents." },
  { name: "continuous-claude", category: "Agent Orchestrators", maturity: "Community", desc: "Open-source orchestrator that runs Claude Code or Codex in a continuous loop." },
  { name: "claude-review-loop", category: "Review Loops", maturity: "Community", desc: "Claude Code plugin for automated code review." },
  { name: "Mem0", category: "Memory Layers", maturity: "Community", desc: "Memory-first framing for token-rich and token-poor agent loops." },
  { name: "Ralphify", category: "Loop Runtimes", maturity: "Experimental", desc: "Experimental loop-definition format for local experiments." },
];

// Guides data
const guides = [
  { title: "What Is Loop Engineering?", category: "Concept", desc: "Designing controlled outer cycles around model-driven work with clear goals, bounded context, and explicit stop rules." },
  { title: "Build Your First Loop", category: "Starter", desc: "Start with one small loop: one discovery source, one outcome, one validation, one stop rule." },
  { title: "Hypothesis, MVP, Validation, Feedback", category: "Design", desc: "Four-part design loop: state hypothesis, run smallest version, collect evidence, decide next steps." },
  { title: "How to Validate an Agent Loop", category: "Validation", desc: "Good validation records expected evidence, actual evidence, hypothesis status, and next steps." },
  { title: "Token-rich vs Token-poor Loops", category: "Cost", desc: "Balance between context size and cost efficiency." },
  { title: "How to Stop Agent Loops Safely", category: "Safety", desc: "Hard, pre-defined stop rules: validation passes, N failed iterations, budget hit, or human approval." },
  { title: "Goodhart's Law for AI Agents", category: "Safety", desc: "When a validation metric becomes the target, agents may optimize the metric instead of the real goal." },
  { title: "Memory for Agent Loops", category: "Memory", desc: "What to keep, summarize, retrieve, and forget in long-running loops." },
  { title: "AGENTS.md vs SKILL.md vs RALPH.md", category: "Concept", desc: "Three complementary formats for different use cases." },
  { title: "Claude Code vs Codex /goal", category: "Tools", desc: "Comparing goal mechanisms across major AI coding agents." },
  { title: "Open vs Closed Agent Loops", category: "Concept", desc: "Closed loops have clear validation; open loops need stronger supervision." },
  { title: "Loop Engineering vs Waterfall", category: "Compare", desc: "Evidence-driven iteration vs upfront design." },
];

// Skills data
const skills = [
  { name: "Pyramid Principle", desc: "Start with answer, then organize supporting points." },
  { name: "5 Whys", desc: "Root cause analysis through iterative questioning." },
  { name: "SMART Goals", desc: "Specific, Measurable, Achievable, Relevant, Time-bound objectives." },
  { name: "PDCA", desc: "Plan-Do-Check-Act cycle for continuous improvement." },
  { name: "SWOT Analysis", desc: "Strengths, Weaknesses, Opportunities, Threats framework." },
  { name: "STAR Method", desc: "Situation, Task, Action, Result structured response." },
  { name: "Feynman Technique", desc: "Explain simply to identify knowledge gaps." },
  { name: "OKR", desc: "Objectives and Key Results goal-setting framework." },
  { name: "WBS", desc: "Work Breakdown Structure for project decomposition." },
  { name: "Decision Matrix", desc: "Weighted criteria analysis for decision making." },
];

const riskColors: Record<string, string> = {
  Low: "text-green-500 border-green-500/30 bg-green-500/10",
  Medium: "text-yellow-500 border-yellow-500/30 bg-yellow-500/10",
  High: "text-orange-500 border-orange-500/30 bg-orange-500/10",
  Critical: "text-red-500 border-red-500/30 bg-red-500/10",
};

const maturityColors: Record<string, string> = {
  Official: "text-cyan-400 border-cyan-400/30 bg-cyan-400/10",
  Stable: "text-green-400 border-green-400/30 bg-green-400/10",
  Experimental: "text-amber-400 border-amber-400/30 bg-amber-400/10",
  Community: "text-purple-400 border-purple-400/30 bg-purple-400/10",
};

type TabType = "overview" | "templates" | "tools" | "guides" | "skills";

export default function LoopEngineering() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  const categories = ["All", ...Array.from(new Set([...templates.map(t => t.category), ...tools.map(t => t.category)]))];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-xs uppercase tracking-wider text-cyan-400">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
          AI Agent Workflows
        </div>
        <h1 className="text-4xl font-bold tracking-tight">
          Loop Engineering{" "}
          <span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            for Safe, Verifiable Workflows
          </span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-3xl">
          Build copyable AI agent workflows with evidence, stop rules, budget limits, fallbacks, and human approval gates.
        </p>
        <div className="flex flex-wrap gap-4 pt-2">
          <a
            href="https://loopengineering.app/loop-goal-generator/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500 text-white font-medium hover:bg-cyan-600 transition-colors"
          >
            <Target className="w-4 h-4" />
            Build a Loop Goal
            <ExternalLink className="w-3 h-3" />
          </a>
          <a
            href="https://loopengineering.app/templates/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:border-cyan-500/50 transition-colors"
          >
            Browse Verified Templates
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Features */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Search, text: "Browser-only generators" },
          { icon: FileText, text: "Copyable outputs" },
          { icon: CheckCircle2, text: "Explicit stop rules" },
          { icon: AlertTriangle, text: "Human approval gates" },
        ].map((feature, i) => (
          <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
            <feature.icon className="w-4 h-4 text-emerald-500" />
            {feature.text}
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-1 overflow-x-auto">
          {[
            { id: "overview", label: "Overview", icon: Sparkles },
            { id: "templates", label: "Templates", icon: FileText },
            { id: "tools", label: "Tools", icon: Wrench },
            { id: "guides", label: "Guides", icon: BookOpen },
            { id: "skills", label: "Skills", icon: Target },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-cyan-500 text-cyan-400"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {activeTab === "overview" && (
        <div className="space-y-8">
          {/* Quick Links */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <a
              href="https://loopengineering.app/loop-goal-generator/"
              target="_blank"
              rel="noopener noreferrer"
              className="group p-6 rounded-xl border border-border bg-card hover:border-cyan-500/50 transition-colors"
            >
              <Target className="w-8 h-8 text-cyan-400 mb-3" />
              <h3 className="font-semibold mb-2">Goal Generator</h3>
              <p className="text-sm text-muted-foreground">Build loop goals with hypothesis, objective, validation, and stop rules.</p>
            </a>
            <a
              href="https://loopengineering.app/methodology-skill-generator/"
              target="_blank"
              rel="noopener noreferrer"
              className="group p-6 rounded-xl border border-border bg-card hover:border-cyan-500/50 transition-colors"
            >
              <Sparkles className="w-8 h-8 text-purple-400 mb-3" />
              <h3 className="font-semibold mb-2">Skills Generator</h3>
              <p className="text-sm text-muted-foreground">Turn 5 Whys, SMART, PDCA into agent prompts and SKILL.md files.</p>
            </a>
            <a
              href="https://loopengineering.app/templates/"
              target="_blank"
              rel="noopener noreferrer"
              className="group p-6 rounded-xl border border-border bg-card hover:border-cyan-500/50 transition-colors"
            >
              <FileText className="w-8 h-8 text-emerald-400 mb-3" />
              <h3 className="font-semibold mb-2">Templates</h3>
              <p className="text-sm text-muted-foreground">20+ ready-to-use loop patterns for CI, PR, bug fixes, and more.</p>
            </a>
            <a
              href="https://loopengineering.app/tools/"
              target="_blank"
              rel="noopener noreferrer"
              className="group p-6 rounded-xl border border-border bg-card hover:border-cyan-500/50 transition-colors"
            >
              <Wrench className="w-8 h-8 text-orange-400 mb-3" />
              <h3 className="font-semibold mb-2">Tools</h3>
              <p className="text-sm text-muted-foreground">Compare Claude Code, Codex, open-source orchestrators.</p>
            </a>
            <a
              href="https://loopengineering.app/guides/"
              target="_blank"
              rel="noopener noreferrer"
              className="group p-6 rounded-xl border border-border bg-card hover:border-cyan-500/50 transition-colors"
            >
              <BookOpen className="w-8 h-8 text-blue-400 mb-3" />
              <h3 className="font-semibold mb-2">Guides</h3>
              <p className="text-sm text-muted-foreground">In-depth guides on loop engineering patterns and best practices.</p>
            </a>
            <a
              href="https://loopengineering.app/loop-budget-calculator/"
              target="_blank"
              rel="noopener noreferrer"
              className="group p-6 rounded-xl border border-border bg-card hover:border-cyan-500/50 transition-colors"
            >
              <Clock className="w-8 h-8 text-amber-400 mb-3" />
              <h3 className="font-semibold mb-2">Budget Calculator</h3>
              <p className="text-sm text-muted-foreground">Estimate token costs for long-running loops.</p>
            </a>
          </div>

          {/* Five Moves */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-xl font-semibold mb-4">The Five Moves of a Loop</h2>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {[
                { num: "1", title: "Discover", desc: "Find work to do" },
                { num: "2", title: "Handoff", desc: "Pass to agent" },
                { num: "3", title: "Verify", desc: "Check the result" },
                { num: "4", title: "Persist", desc: "Save what happened" },
                { num: "5", title: "Schedule", desc: "Next pass or stop" },
              ].map((move) => (
                <div key={move.num} className="text-center">
                  <div className="w-10 h-10 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center mx-auto mb-2">
                    {move.num}
                  </div>
                  <div className="font-medium">{move.title}</div>
                  <div className="text-xs text-muted-foreground">{move.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Works With */}
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Works with</div>
            <div className="flex flex-wrap gap-2">
              {["Claude Code", "Codex", "Cursor", "GitHub Actions", "Ralphify"].map((tool) => (
                <span key={tool} className="px-3 py-1.5 rounded-full border border-border bg-muted/50 text-sm">
                  {tool}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "templates" && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-border bg-background"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 rounded-lg border border-border bg-background"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div className="text-sm text-muted-foreground">{templates.length} templates</div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates
              .filter((t) => {
                const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  t.desc.toLowerCase().includes(searchTerm.toLowerCase());
                const matchesCategory = categoryFilter === "All" || t.category === categoryFilter;
                return matchesSearch && matchesCategory;
              })
              .map((template, i) => (
                <a
                  key={i}
                  href={`https://loopengineering.app/templates/${template.name.toLowerCase().replace(/\s+/g, "-")}-loop/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group p-5 rounded-xl border border-border bg-card hover:border-cyan-500/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs uppercase tracking-wider text-muted-foreground">{template.category}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${riskColors[template.risk]}`}>
                      {template.risk}
                    </span>
                  </div>
                  <h3 className="font-semibold mb-2 group-hover:text-cyan-400 transition-colors">{template.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{template.desc}</p>
                  <div className="flex items-center gap-1 text-xs text-cyan-400 font-medium">
                    Open template <ChevronRight className="w-3 h-3" />
                  </div>
                </a>
              ))}
          </div>
        </div>
      )}

      {activeTab === "tools" && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search tools..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-border bg-background"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 rounded-lg border border-border bg-background"
            >
              {["All", ...Array.from(new Set(tools.map(t => t.category)))].map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm">
            <div className="flex gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span className="text-amber-200">
                This directory mixes official docs, open-source projects, and experimental runtimes. Verify maturity and licensing before production use.
              </span>
            </div>
          </div>
          <div className="text-sm text-muted-foreground">{tools.length} tools</div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tools
              .filter((t) => {
                const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  t.desc.toLowerCase().includes(searchTerm.toLowerCase());
                const matchesCategory = categoryFilter === "All" || t.category === categoryFilter;
                return matchesSearch && matchesCategory;
              })
              .map((tool, i) => (
                <a
                  key={i}
                  href={`https://loopengineering.app/tools/${tool.name.toLowerCase().replace(/\s+|\//g, "-")}/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group p-5 rounded-xl border border-border bg-card hover:border-cyan-500/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold group-hover:text-cyan-400 transition-colors">{tool.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${maturityColors[tool.maturity]}`}>
                      {tool.maturity}
                    </span>
                  </div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">{tool.category}</div>
                  <p className="text-sm text-muted-foreground mb-4">{tool.desc}</p>
                  <div className="flex items-center gap-1 text-xs text-cyan-400 font-medium">
                    View tool <ExternalLink className="w-3 h-3" />
                  </div>
                </a>
              ))}
          </div>
        </div>
      )}

      {activeTab === "guides" && (
        <div className="space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search guides..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-border bg-background"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {guides
              .filter((g) => 
                g.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                g.desc.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map((guide, i) => (
                <a
                  key={i}
                  href={`https://loopengineering.app/guides/${guide.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group p-5 rounded-xl border border-border bg-card hover:border-cyan-500/50 transition-colors"
                >
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">{guide.category}</div>
                  <h3 className="font-semibold mb-2 group-hover:text-cyan-400 transition-colors">{guide.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{guide.desc}</p>
                  <div className="flex items-center gap-1 text-xs text-cyan-400 font-medium">
                    Read guide <ChevronRight className="w-3 h-3" />
                  </div>
                </a>
              ))}
          </div>
        </div>
      )}

      {activeTab === "skills" && (
        <div className="space-y-6">
          <p className="text-muted-foreground">
            Methodology skills package practical methods into reusable agent instructions with triggers, steps, and quality checks.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {skills.map((skill, i) => (
              <div key={i} className="p-5 rounded-xl border border-border bg-card">
                <h3 className="font-semibold mb-2">{skill.name}</h3>
                <p className="text-sm text-muted-foreground">{skill.desc}</p>
              </div>
            ))}
          </div>
          <a
            href="https://loopengineering.app/methodology-skill-generator/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500 text-white font-medium hover:bg-cyan-600 transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            Open Skill Generator
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}
    </div>
  );
}
