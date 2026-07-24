import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Copy, Check, Download, FileText, Sparkles, Search } from "lucide-react";

const GITIGNORE_TEMPLATES: Record<string, { name: string; content: string }> = {
  node: {
    name: "Node.js",
    content: `# Dependencies
node_modules/
package-lock.json
yarn.lock
pnpm-lock.yaml

# Build outputs
dist/
build/
.out/

# Environment
.env
.env.local
.env.*.local

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*

# Testing
coverage/
.nyc_output/

# Cache
.cache/
.parcel-cache/

# Misc
.DS_Store
*.log
*.tmp
*.temp`,
  },
  python: {
    name: "Python",
    content: `# Byte-compiled / optimized
__pycache__/
*.py[cod]
*$py.class
*.so

# Distribution
dist/
build/
*.egg-info/

# Virtual environments
venv/
env/
ENV/
.venv/

# Environment
.env
.env.local
*.local

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# Testing
.pytest_cache/
.coverage
htmlcov/
*.cover

# Jupyter
.ipynb_checkpoints/

# Misc
.DS_Store
*.log
*.pot
*.pyc`,
  },
  react: {
    name: "React",
    content: `# Dependencies
node_modules/
package-lock.json

# Build
dist/
build/
*.esbuild-bundle-analyzer.stats.json

# Environment
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Testing
coverage/

# Cache
.cache/
.parcel-cache/

# Misc
.DS_Store
*.log
npm-debug.log*
yarn-debug.log*`,
  },
  vue: {
    name: "Vue",
    content: `# Dependencies
node_modules/

# Build
dist/
*.tsbuildinfo

# Environment
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/

# Testing
coverage/

# Cache
.cache/
.parcel-cache/

# Misc
.DS_Store
*.log`,
  },
  go: {
    name: "Go",
    content: `# Binaries
*.exe
*.exe~
*.dll
*.so
*.dylib

# Test binary
*.test

# Output
*.out
*.exe

# Vendor (if using modules)
vendor/

# Environment
.env
.env.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# Misc
.DS_Store
*.log`,
  },
  rust: {
    name: "Rust",
    content: `# Build
/target/
Cargo.lock

# Environment
.env
.env.local

# IDE
.vscode/
.idea/
*.rs.bk

# Misc
.DS_Store
*.log
debug/
release/`,
  },
  java: {
    name: "Java",
    content: `# Compiled
*.class

# Build
target/
build/

# IDE
.vscode/
.idea/
*.iml
*.ipr
*.iws

# Gradle
.gradle/
gradle/

# Environment
.env
.env.local

# Logs
*.log
logs/

# Misc
.DS_Store
*.tmp`,
  },
  ruby: {
    name: "Ruby",
    content: `# Bundler
.bundle/
vendor/bundle/

# Coverage
coverage/

# Logs
log/*.log
*.log

# Environment
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/

# Misc
.DS_Store
*.swp
*.swo
*~
tmp/
temp/`,
  },
  dotnet: {
    name: ".NET",
    content: `# Build results
bin/
obj/
[Bb]uild/
[Ll]og/
[Ll]ogs/

# User-specific
*.user
*.userosscache
*.suo
*.cache

# IDE
.vs/
.vscode/
*.swp
.idea/

# Environment
appsettings.Development.json
appsettings.*.local.json

# NuGet
packages/
*.nupkg
*.snupkg

# Misc
.DS_Store
*.log`,
  },
  terraform: {
    name: "Terraform",
    content: `# Local .terraform
.terraform/
.terraform.lock.hcl

# Plan files
*.tfplan
*.tfstate
*.tfstate.backup
*.tfstate.d

# Environment
.env
*..auto.tfvars
override.tf

# Crash logs
crash.log
crash.*.log

# IDE
.vscode/
.idea/`,
  },
  kubernetes: {
    name: "Kubernetes",
    content: `# Kubernetes secrets
*.pem
*-credentials.yaml
secrets.yaml

# Environment
.env
.env.local

# Build
*.tar
*.tar.gz

# Misc
.DS_Store
*.log`,
  },
  unity: {
    name: "Unity",
    content: `# Unity
/[Ll]ibrary/
/[Tt]emp/
/[Oo]bj/
/[Bb]uild/
/[Bb]uilds/
/[Ll]ogs/
/[Uu]ser[Ss]ettings/

# Builds
*.apk
*.aab
*.unitypackage

# IDE
.vscode/
.idea/

# Misc
.DS_Store
*.log`,
  },
};

const LANGUAGES = Object.entries(GITIGNORE_TEMPLATES).map(([key, val]) => ({
  key,
  name: val.name,
}));

export default function GitignoreGenerator() {
    const [selected, setSelected] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const toggleLanguage = (key: string) => {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const selectAll = () => {
    setSelected(LANGUAGES.map((l) => l.key));
  };

  const clearAll = () => {
    setSelected([]);
  };

  const content = selected
    .map((key) => {
      const template = GITIGNORE_TEMPLATES[key];
      return `# === ${template.name} ===\n${template.content}`;
    })
    .join("\n\n");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = ".gitignore";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const filteredLanguages = LANGUAGES.filter((l) =>
    l.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 rounded-lg bg-gradient-to-br from-orange-500/20 to-amber-500/20 border border-orange-500/30">
          <FileText className="w-5 h-5 text-orange-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">.gitignore Generator</h1>
          <p className="text-sm text-muted-foreground">
            Generate .gitignore files for your project
          </p>
        </div>
      </div>

      {/* Trust Banner */}
      <div className="flex items-center gap-2 px-4 py-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5">
        <Sparkles className="w-4 h-4 text-emerald-400" />
        <p className="text-sm text-emerald-400">
          100% Local Processing — all generation happens in your browser
        </p>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Left: Language Selection */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium">Select Technologies</h2>
            <div className="flex gap-2 text-xs">
              <button
                onClick={selectAll}
                className="text-muted-foreground hover:text-foreground"
              >
                Select All
              </button>
              <span className="text-muted-foreground">|</span>
              <button
                onClick={clearAll}
                className="text-muted-foreground hover:text-foreground"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search technologies..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Language List */}
          <div className="flex flex-wrap gap-2">
            {filteredLanguages.map((lang) => (
              <button
                key={lang.key}
                onClick={() => toggleLanguage(lang.key)}
                className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${
                  selected.includes(lang.key)
                    ? "bg-orange-500/10 text-orange-400 border-orange-500/30"
                    : "bg-muted/50 border-transparent hover:bg-muted"
                }`}
              >
                {lang.name}
                {selected.includes(lang.key) && (
                  <span className="ml-1 text-xs opacity-70">✓</span>
                )}
              </button>
            ))}
          </div>

          {/* Selection Count */}
          <p className="text-xs text-muted-foreground">
            {selected.length} of {LANGUAGES.length} selected
          </p>
        </div>

        {/* Right: Preview */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium">Preview</h2>
            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                disabled={!content}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border border-border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    Copy
                  </>
                )}
              </button>
              <button
                onClick={handleDownload}
                disabled={!content}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Download className="w-3 h-3" />
                Download .gitignore
              </button>
            </div>
          </div>

          {/* Content Preview */}
          <div className="rounded-lg border border-border bg-card">
            <div className="px-4 py-2 border-b border-border bg-muted/30">
              <span className="text-xs text-muted-foreground font-mono">.gitignore</span>
            </div>
            <pre className="p-4 text-xs font-mono whitespace-pre-wrap overflow-auto max-h-[500px]">
              {content || (
                <span className="text-muted-foreground italic">
                  Select technologies above to generate .gitignore...
                </span>
              )}
            </pre>
          </div>

          {/* Tips */}
          <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-4">
            <h3 className="text-xs font-medium text-cyan-400 uppercase tracking-wide mb-2">
              Tips
            </h3>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Add .gitignore before your first commit</li>
              <li>• You can have multiple .gitignore files in subdirectories</li>
              <li>• Use git check-ignore -v to debug ignored files</li>
              <li>• Templates are based on GitHub's gitignore repository</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-xs text-muted-foreground text-center pt-4 border-t border-border">
        <p>
          Based on{" "}
          <a
            href="https://github.com/github/gitignore"
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-400 hover:underline"
          >
            github/gitignore
          </a>
        </p>
      </div>
    </div>
  );
}
