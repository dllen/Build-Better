import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ExternalLink, Search, ChevronRight, CheckCircle2, AlertTriangle, Clock, BookOpen, Wrench, FileText, Target, Sparkles, Zap, Shield, Repeat, Database, Brain, ArrowRight } from "lucide-react";

// Extended Templates data from loopengineering.app
const templates = [
  { name: "PR Babysitter Loop", category: "PR Review", risk: "Medium", desc: "Monitor a pull request until CI is green and review comments are resolved.", cadence: "On every PR" },
  { name: "CI Failure Fix Loop", category: "CI Fix", risk: "Medium", desc: "Fix failing CI by reading logs, applying minimal changes, and rerunning validation.", cadence: "On red CI" },
  { name: "Bug Fixing Loop", category: "Bug Fix", risk: "Medium", desc: "Reproduce a bug, fix the smallest cause, and verify with a regression test.", cadence: "On a bug report" },
  { name: "Code Review Loop", category: "Code Review", risk: "Low", desc: "Automated code review with configurable rules and severity levels.", cadence: "On PR open" },
  { name: "Maker-Checker Loop", category: "Quality", risk: "Medium", desc: "Separation of concerns: one agent executes, another validates.", cadence: "On every task" },
  { name: "SEO Content Refresh Loop", category: "SEO", risk: "Low", desc: "Periodic content refresh based on keyword performance.", cadence: "Weekly" },
  { name: "Keyword Monitoring Loop", category: "SEO", risk: "Low", desc: "Track keyword rankings and trigger content updates.", cadence: "Daily" },
  { name: "Sitemap Change Loop", category: "SEO", risk: "Low", desc: "Auto-detect URL changes and update sitemap.", cadence: "On deployment" },
  { name: "Data Cleaning Loop", category: "Data", risk: "Medium", desc: "Automated data quality checks and corrections.", cadence: "Scheduled" },
  { name: "Research Summary Loop", category: "Research", risk: "Low", desc: "Periodic research summaries from multiple sources.", cadence: "Weekly" },
  { name: "Dependency Update Loop", category: "Maintenance", risk: "Medium", desc: "Safe dependency updates with changelog review.", cadence: "Weekly" },
  { name: "Release Notes Loop", category: "Docs", risk: "Low", desc: "Auto-generate release notes from commits and PRs.", cadence: "On release" },
  { name: "Documentation Loop", category: "Docs", risk: "Low", desc: "Auto-generate and update documentation.", cadence: "On code change" },
  { name: "Refactor Loop", category: "Refactor", risk: "High", desc: "Structured refactoring with safety checks.", cadence: "On refactor request" },
  { name: "Migration Loop", category: "Migration", risk: "Critical", desc: "Framework or library migration with validation.", cadence: "On migration plan" },
  { name: "Email Triage Loop", category: "Triage", risk: "Low", desc: "Sort and prioritize emails with AI assistance.", cadence: "Scheduled" },
  { name: "Methodology Skill Loop", category: "Methodology", risk: "Medium", desc: "Apply structured methodology to complex problems.", cadence: "On complex task" },
  { name: "Quality Checker Loop", category: "Quality", risk: "Medium", desc: "Automated quality checks against defined criteria.", cadence: "On every deliverable" },
  { name: "Skill Routing Evaluation Loop", category: "Evaluation", risk: "Low", desc: "Evaluate and route tasks to appropriate skills.", cadence: "On task intake" },
  { name: "Feedback Improvement Loop", category: "Feedback", risk: "Low", desc: "Collect and act on user feedback systematically.", cadence: "On feedback received" },
];

// Extended Tools data from loopengineering.app
const tools = [
  { name: "Claude Code /goal", category: "Official Docs", maturity: "Official", desc: "Official Claude Code feature for keeping Claude working toward a measurable completion condition.", bestFor: "Durable coding goals, Multi-turn work, Clear validation conditions" },
  { name: "Claude Code /loop", category: "Official Docs", maturity: "Official", desc: "Scheduled prompt and /loop documentation for recurring tasks.", bestFor: "Polling, Recurring prompts, Repeated checks" },
  { name: "Codex Follow a goal", category: "Official Docs", maturity: "Official", desc: "Official Codex guidance for durable goals with validation loops.", bestFor: "Migrations, Refactors, Deploy retries, Long tasks with clear validation" },
  { name: "Codex AGENTS.md", category: "Official Docs", maturity: "Official", desc: "Durable instruction files for AI coding agents.", bestFor: "Project context, Team conventions, Permanent rules" },
  { name: "Codex Skills", category: "Official Docs", maturity: "Official", desc: "Reusable workflow packages for agents.", bestFor: "Reusable patterns, Consistent quality, Shared methods" },
  { name: "Claude Managed Agents", category: "Hosted Agents", maturity: "Official", desc: "Anthropic's managed agent API for durable task execution.", bestFor: "Production workflows, API integration, Scalable agents" },
  { name: "continuous-claude", category: "Loop Runtimes", maturity: "Community", desc: "Open-source orchestrator that runs Claude Code or Codex in a continuous loop.", bestFor: "Autonomous work, CI/CD integration, Persistent agents" },
  { name: "claude-review-loop", category: "Review Loops", maturity: "Community", desc: "Claude Code plugin for automated code review.", bestFor: "PR reviews, Coding standards, Lint feedback" },
  { name: "Mem0", category: "Memory Layers", maturity: "Community", desc: "Memory-first framing for token-rich and token-poor agent loops.", bestFor: "Long conversations, Cross-session context, Memory management" },
  { name: "Ralphify", category: "Loop Runtimes", maturity: "Experimental", desc: "Experimental loop-definition format for local experiments.", bestFor: "Rapid prototyping, Custom loops, Local development" },
  { name: "tutti", category: "Agent Orchestrators", maturity: "Experimental", desc: "Experimental multi-agent framework for complex task orchestration.", bestFor: "Multi-agent workflows, Task delegation, Complex orchestration" },
  { name: "Nimbalyst", category: "Agent Orchestrators", maturity: "Experimental", desc: "Experimental agent orchestrator with focus on safety.", bestFor: "Safe execution, Controlled loops, Experiment tracking" },
];

// Extended Guides data from loopengineering.app
const guides = [
  { title: "What Is Loop Engineering?", category: "Concept", desc: "Designing controlled outer cycles around model-driven work with clear goals, bounded context, and explicit stop rules." },
  { title: "Build Your First Loop", category: "Starter", desc: "Start with one small loop: one discovery source, one outcome, one validation, one stop rule." },
  { title: "Hypothesis, MVP, Validation, Feedback", category: "Design", desc: "Four-part design loop: state hypothesis, run smallest version, collect evidence, decide next steps." },
  { title: "Loop Engineering vs Waterfall", category: "Compare", desc: "Evidence-driven iteration vs upfront design." },
  { title: "Methodology Skills for AI Agents", category: "Skills", desc: "Package human methods into repeatable agent instructions." },
  { title: "How to Validate an Agent Loop", category: "Validation", desc: "Good validation records expected evidence, actual evidence, hypothesis status, and next steps." },
  { title: "Token-rich vs Token-poor Loops", category: "Cost", desc: "Balance between context size and cost efficiency." },
  { title: "How to Stop Agent Loops Safely", category: "Safety", desc: "Hard, pre-defined stop rules: validation passes, N failed iterations, budget hit, or human approval." },
  { title: "Goodhart's Law for AI Agents", category: "Safety", desc: "When a validation metric becomes the target, agents may optimize the metric instead of the real goal." },
  { title: "Open vs Closed Agent Loops", category: "Concept", desc: "Closed loops have clear validation; open loops need stronger supervision." },
  { title: "Memory for Agent Loops", category: "Memory", desc: "What to keep, summarize, retrieve, and forget in long-running loops." },
  { title: "Context Engineering vs Loop Engineering", category: "Compare", desc: "What information vs how to iterate, validate, stop, and report." },
  { title: "Agent Harness vs Loop Engineering", category: "Compare", desc: "Harness validates and executes; loop engineering decides how it iterates." },
  { title: "Worktree Orchestrators Compared", category: "Tools", desc: "Compare Claude Code, Codex, and open-source orchestrators." },
  { title: "Claude Code vs Codex /goal", category: "Tools", desc: "Comparing goal mechanisms across major AI coding agents." },
  { title: "AGENTS.md vs SKILL.md vs RALPH.md", category: "Concept", desc: "Three complementary formats for different use cases." },
  { title: "continuous-claude vs GitHub Actions", category: "Tools", desc: "Autonomous loops vs validation workflows." },
  { title: "Claude Code: /goal vs /loop vs Stop Hook", category: "Tools", desc: "Comparing Claude Code's loop mechanisms." },
];

// Skills data
const skills = [
  { name: "Pyramid Principle", category: "Communication", desc: "Start with answer, then organize supporting points from general to specific." },
  { name: "5 Whys", category: "Analysis", desc: "Root cause analysis through iterative questioning to uncover underlying issues." },
  { name: "SMART Goals", category: "Planning", desc: "Specific, Measurable, Achievable, Relevant, Time-bound objectives." },
  { name: "PDCA", category: "Process", desc: "Plan-Do-Check-Act cycle for continuous improvement and iterative refinement." },
  { name: "SWOT Analysis", category: "Strategy", desc: "Strengths, Weaknesses, Opportunities, Threats framework for strategic planning." },
  { name: "STAR Method", category: "Communication", desc: "Situation, Task, Action, Result structured response for clear communication." },
  { name: "Feynman Technique", category: "Learning", desc: "Explain simply to identify knowledge gaps and deepen understanding." },
  { name: "OKR", category: "Planning", desc: "Objectives and Key Results goal-setting framework for alignment and focus." },
  { name: "WBS", category: "Planning", desc: "Work Breakdown Structure for project decomposition into manageable tasks." },
  { name: "Decision Matrix", category: "Decision", desc: "Weighted criteria analysis for systematic decision making." },
];

const riskColors: Record<string, string> = {
  Low: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10",
  Medium: "text-amber-400 border-amber-400/30 bg-amber-400/10",
  High: "text-orange-400 border-orange-400/30 bg-orange-400/10",
  Critical: "text-red-400 border-red-400/30 bg-red-400/10",
};

const maturityColors: Record<string, string> = {
  Official: "text-cyan-400 border-cyan-400/30 bg-cyan-400/10",
  Stable: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10",
  Experimental: "text-amber-400 border-amber-400/30 bg-amber-400/10",
  Community: "text-purple-400 border-purple-400/30 bg-purple-400/10",
};

type TabType = "overview" | "templates" | "tools" | "guides" | "skills";

export default function LoopEngineering() {
    const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  const templateCategories = ["All", ...Array.from(new Set(templates.map(t => t.category)))];
  const toolCategories = ["All", ...Array.from(new Set(tools.map(t => t.category)))];

  return (
    <div className="space-y-10">
      {/* Hero Section - Loopengineering.app style */}
      <div className="relative">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-cyan-500/10 via-transparent to-transparent rounded-full blur-3xl" />
        </div>
        
        <div className="space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-xs uppercase tracking-wider text-cyan-400 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            AI Agent Workflows
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight">
            Loop Engineering
            <span className="block mt-2 bg-gradient-to-r from-cyan-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent">
              for Safe, Verifiable Workflows
            </span>
          </h1>
          
          <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
            Build copyable AI agent workflows with evidence, stop rules, budget limits, fallbacks, and human approval gates. 
            Everything runs in your browser — nothing is uploaded.
          </p>
          
          <div className="flex flex-wrap gap-3 pt-2">
            <a
              href="https://loopengineering.app/loop-goal-generator/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-cyan-500 text-white font-medium hover:bg-cyan-600 transition-all hover:shadow-lg hover:shadow-cyan-500/25"
            >
              <Target className="w-4 h-4" />
              Build a Loop Goal
              <ExternalLink className="w-3 h-3 opacity-70" />
            </a>
            <a
              href="https://loopengineering.app/templates/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-border hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all"
            >
              <FileText className="w-4 h-4 text-cyan-400" />
              Browse 20+ Templates
              <ExternalLink className="w-3 h-3 opacity-50" />
            </a>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl border border-border bg-card/50">
        {[
          { icon: Zap, text: "Browser-only generators", color: "text-cyan-400" },
          { icon: FileText, text: "Copyable outputs", color: "text-emerald-400" },
          { icon: Shield, text: "Explicit stop rules", color: "text-amber-400" },
          { icon: Repeat, text: "Human approval gates", color: "text-purple-400" },
        ].map((feature, i) => (
          <div key={i} className="flex items-center gap-3 text-sm">
            <feature.icon className={`w-5 h-5 ${feature.color}`} />
            <span className="text-muted-foreground">{feature.text}</span>
          </div>
        ))}
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-border/50">
        <div className="flex gap-1 overflow-x-auto -mb-px">
          {[
            { id: "overview", label: "Overview", icon: Sparkles },
            { id: "templates", label: "Templates", icon: FileText, count: templates.length },
            { id: "tools", label: "Tools", icon: Wrench, count: tools.length },
            { id: "guides", label: "Guides", icon: BookOpen, count: guides.length },
            { id: "skills", label: "Skills", icon: Brain, count: skills.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-cyan-500 text-cyan-400 bg-cyan-500/5"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.count && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.id ? "bg-cyan-500/20" : "bg-muted"
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {activeTab === "overview" && (
        <div className="space-y-8 animate-fade-in">
          {/* Quick Links Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <a
              href="https://loopengineering.app/loop-goal-generator/"
              target="_blank"
              rel="noopener noreferrer"
              className="group p-5 rounded-xl border border-border bg-card hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all"
            >
              <Target className="w-8 h-8 text-cyan-400 mb-3" />
              <h3 className="font-semibold mb-2 group-hover:text-cyan-400 transition-colors">Goal Generator</h3>
              <p className="text-sm text-muted-foreground">Build loop goals with hypothesis, objective, validation, and stop rules.</p>
            </a>
            <a
              href="https://loopengineering.app/methodology-skill-generator/"
              target="_blank"
              rel="noopener noreferrer"
              className="group p-5 rounded-xl border border-border bg-card hover:border-purple-500/50 hover:bg-purple-500/5 transition-all"
            >
              <Sparkles className="w-8 h-8 text-purple-400 mb-3" />
              <h3 className="font-semibold mb-2 group-hover:text-purple-400 transition-colors">Skills Generator</h3>
              <p className="text-sm text-muted-foreground">Turn 5 Whys, SMART, PDCA into agent prompts and SKILL.md files.</p>
            </a>
            <a
              href="https://loopengineering.app/loop-budget-calculator/"
              target="_blank"
              rel="noopener noreferrer"
              className="group p-5 rounded-xl border border-border bg-card hover:border-amber-500/50 hover:bg-amber-500/5 transition-all"
            >
              <Clock className="w-8 h-8 text-amber-400 mb-3" />
              <h3 className="font-semibold mb-2 group-hover:text-amber-400 transition-colors">Budget Calculator</h3>
              <p className="text-sm text-muted-foreground">Estimate token costs for long-running loops.</p>
            </a>
          </div>

          {/* Five Moves Section */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Repeat className="w-5 h-5 text-cyan-400" />
              The Five Moves of a Loop
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {[
                { num: "1", title: "Discover", desc: "Find work to do", icon: Search },
                { num: "2", title: "Handoff", desc: "Pass to agent", icon: ArrowRight },
                { num: "3", title: "Verify", desc: "Check the result", icon: CheckCircle2 },
                { num: "4", title: "Persist", desc: "Save what happened", icon: Database },
                { num: "5", title: "Schedule", desc: "Next pass or stop", icon: Clock },
              ].map((move, i) => (
                <div key={move.num} className="relative text-center p-4 rounded-lg bg-muted/30">
                  {i < 4 && (
                    <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                      <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
                    </div>
                  )}
                  <div className="w-12 h-12 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center mx-auto mb-3 text-lg">
                    {move.num}
                  </div>
                  <div className="font-semibold mb-1">{move.title}</div>
                  <div className="text-xs text-muted-foreground">{move.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Works With */}
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-4 font-mono">Works with</div>
            <div className="flex flex-wrap gap-2">
              {["Claude Code", "Codex", "Cursor", "GitHub Actions", "Ralphify", "Generic Agent"].map((tool) => (
                <span key={tool} className="px-3 py-1.5 rounded-full border border-border bg-muted/30 text-sm font-medium hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-colors cursor-default">
                  {tool}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "templates" && (
        <div className="space-y-6 animate-fade-in">
          {/* Filters */}
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-border bg-background focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2.5 rounded-lg border border-border bg-background focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
            >
              {templateCategories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          
          <div className="text-sm text-muted-foreground font-mono">
            {templates.filter(t => {
              const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) || t.desc.toLowerCase().includes(searchTerm.toLowerCase());
              const matchesCategory = categoryFilter === "All" || t.category === categoryFilter;
              return matchesSearch && matchesCategory;
            }).length} of {templates.length} templates
          </div>

          {/* Templates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates
              .filter((t) => {
                const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) || t.desc.toLowerCase().includes(searchTerm.toLowerCase());
                const matchesCategory = categoryFilter === "All" || t.category === categoryFilter;
                return matchesSearch && matchesCategory;
              })
              .map((template, i) => (
                <a
                  key={i}
                  href={`https://loopengineering.app/templates/${template.name.toLowerCase().replace(/\s+/g, "-")}-loop/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col p-5 rounded-xl border border-white/5 bg-gradient-to-b from-white/[0.04] to-white/[0.01] hover:border-cyan-500/40 transition-all"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs uppercase tracking-wider text-muted-foreground font-mono">{template.category}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-mono ${riskColors[template.risk]}`}>
                      {template.risk}
                    </span>
                  </div>
                  <h3 className="font-semibold mb-2 group-hover:text-cyan-400 transition-colors">{template.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4 flex-1">{template.desc}</p>
                  <div className="flex items-center justify-between pt-3 border-t border-white/5">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Repeat className="w-3 h-3 text-cyan-400" />
                      <span>Run: {template.cadence}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-cyan-400 font-medium">
                      Open template <ChevronRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </div>
                </a>
              ))}
          </div>
        </div>
      )}

      {activeTab === "tools" && (
        <div className="space-y-6 animate-fade-in">
          {/* Warning Banner */}
          <div className="flex gap-3 rounded-xl p-4 border border-amber-500/20 bg-amber-500/5">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-amber-200 font-medium">Verify before production use</p>
              <p className="text-xs text-amber-200/70 mt-1">
                This directory mixes official docs, open-source projects, and experimental runtimes. Verify maturity, licensing, and pricing before using any tool.
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search tools..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-border bg-background focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2.5 rounded-lg border border-border bg-background focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
            >
              {toolCategories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          
          <div className="text-sm text-muted-foreground font-mono">
            {tools.filter(t => {
              const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) || t.desc.toLowerCase().includes(searchTerm.toLowerCase());
              const matchesCategory = categoryFilter === "All" || t.category === categoryFilter;
              return matchesSearch && matchesCategory;
            }).length} of {tools.length} tools
          </div>

          {/* Tools Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tools
              .filter((t) => {
                const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) || t.desc.toLowerCase().includes(searchTerm.toLowerCase());
                const matchesCategory = categoryFilter === "All" || t.category === categoryFilter;
                return matchesSearch && matchesCategory;
              })
              .map((tool, i) => (
                <a
                  key={i}
                  href={`https://loopengineering.app/tools/${tool.name.toLowerCase().replace(/\s+|\//g, "-")}/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col p-5 rounded-xl border border-white/5 bg-gradient-to-b from-white/[0.04] to-white/[0.01] hover:border-cyan-500/40 transition-all"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold group-hover:text-cyan-400 transition-colors">{tool.name}</h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-mono ${maturityColors[tool.maturity]}`}>
                      {tool.maturity}
                    </span>
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 font-mono">{tool.category}</div>
                  <p className="text-sm text-muted-foreground mb-3 flex-1">{tool.desc}</p>
                  <div className="text-xs text-muted-foreground mb-3">
                    <span className="text-muted-foreground/70">Best for: </span>
                    <span className="text-muted-foreground">{tool.bestFor}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-cyan-400 font-medium">
                    View tool <ExternalLink className="w-3 h-3" />
                  </div>
                </a>
              ))}
          </div>
        </div>
      )}

      {activeTab === "guides" && (
        <div className="space-y-6 animate-fade-in">
          {/* Filters */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search guides..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-border bg-background focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
            />
          </div>

          {/* Guides Grid */}
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
                  className="group flex flex-col p-5 rounded-xl border border-white/5 bg-gradient-to-b from-white/[0.04] to-white/[0.01] hover:border-cyan-500/40 transition-all"
                >
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 font-mono">{guide.category}</div>
                  <h3 className="font-semibold mb-2 group-hover:text-cyan-400 transition-colors">{guide.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4 flex-1">{guide.desc}</p>
                  <div className="flex items-center gap-1 text-xs text-cyan-400 font-medium">
                    Read guide <ChevronRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </a>
              ))}
          </div>
        </div>
      )}

      {activeTab === "skills" && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex flex-wrap gap-4 items-center">
            <p className="text-muted-foreground flex-1">
              Methodology skills package practical methods into reusable agent instructions with triggers, steps, and quality checks.
            </p>
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

          {/* Skills Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {skills.map((skill, i) => (
              <div key={i} className="p-5 rounded-xl border border-white/5 bg-gradient-to-b from-white/[0.04] to-white/[0.01]">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold">{skill.name}</h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-mono uppercase">
                    {skill.category}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{skill.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
