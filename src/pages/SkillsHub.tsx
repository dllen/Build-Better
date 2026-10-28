import React, { useMemo, useState } from 'react';
import { ExternalLink, Download, Search, Filter, Puzzle, User, Calendar, Globe } from 'lucide-react';

// 导入 Skills Hub 数据
import skillsHubData from '@/data/skills-hub.json';

interface Skill {
  name: string;
  description: string;
  author: string | { username: string; avatarUrl?: string | null; trustLevel?: string };
  installs: number;
  category: string | { name: string; slug: string };
  url: string;
  icon: string;
}

interface SkillsHubData {
  source: string;
  fetched_at: string;
  total_count: number;
  browse_url: string;
  skills: Skill[];
}

const data = skillsHubData as SkillsHubData;

// 从对象或字符串中提取作者名
const getAuthorName = (author: Skill['author']) =>
  typeof author === 'object' ? author.username : author;

// 从对象或字符串中提取分类名
const getCategoryName = (cat: Skill['category']) =>
  typeof cat === 'object' ? cat.name : cat;

const SkillsHub = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'installs' | 'name' | 'author'>('installs');
  const [showTop, setShowTop] = useState<number>(50);

  // 从数据中提取所有分类
  const categories = useMemo(() => {
    const cats = new Set<string>();
    data.skills.forEach(skill => {
      const catName = getCategoryName(skill.category);
      if (catName) cats.add(catName);
    });
    return ['All', ...Array.from(cats).sort()];
  }, []);

  const filteredAndSortedSkills = useMemo(() => {
    let skills = [...data.skills];

    // Filter by category
    if (selectedCategory !== 'All') {
      skills = skills.filter(skill => getCategoryName(skill.category) === selectedCategory);
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      skills = skills.filter(skill =>
        skill.name.toLowerCase().includes(term) ||
        skill.description.toLowerCase().includes(term) ||
        getAuthorName(skill.author).toLowerCase().includes(term) ||
        getCategoryName(skill.category).toLowerCase().includes(term)
      );
    }

    // Sort
    skills.sort((a, b) => {
      switch (sortBy) {
        case 'installs':
          return b.installs - a.installs;
        case 'name':
          return a.name.localeCompare(b.name);
        case 'author':
          return getAuthorName(a.author).localeCompare(getAuthorName(b.author));
        default:
          return 0;
      }
    });

    return skills.slice(0, showTop);
  }, [selectedCategory, searchTerm, sortBy, showTop]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatInstalls = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toLocaleString();
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'productivity': 'bg-info',
      'development': 'bg-success',
      'writing': 'bg-primary',
      'research': 'bg-accent',
      'design': 'bg-cool',
      'data': 'bg-info',
      'automation': 'bg-primary',
      'communication': 'bg-cool',
      'education': 'bg-success',
      'business': 'bg-destructive',
    };
    const key = category.toLowerCase();
    return colors[key] || 'bg-muted-foreground';
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Puzzle className="h-10 w-10 text-primary" />
            <h1 className="text-3xl font-extrabold text-foreground sm:text-4xl">
              Skills Hub 导航
            </h1>
          </div>
          <p className="mt-3 max-w-2xl mx-auto text-xl text-muted-foreground">
            来自 skills-hub.ai 的热门 Skills 合集，按安装量排序
          </p>
          <div className="mt-4 flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Puzzle className="h-4 w-4 text-primary" />
              {data.total_count} Skills
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              更新于 {formatDate(data.fetched_at)}
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
          {/* Search */}
          <div className="relative w-full lg:w-96">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-muted-foreground" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-border rounded-md leading-5 bg-muted text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring sm:text-sm"
              placeholder="搜索 Skills 名称、描述或作者..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-3">
            {/* Category Filter */}
            {categories.length > 1 && (
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <select
                  className="border border-border rounded-md bg-muted text-foreground text-sm py-1.5 px-3 focus:outline-none focus:ring-1 focus:ring-ring"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>
                      {cat === 'All' ? `全部分类 (${data.total_count})` : cat}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Sort */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                className="border border-border rounded-md bg-muted text-foreground text-sm py-1.5 px-3 focus:outline-none focus:ring-1 focus:ring-ring"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'installs' | 'name' | 'author')}
              >
                <option value="installs">按安装量</option>
                <option value="name">按名称</option>
                <option value="author">按作者</option>
              </select>
            </div>

            {/* Show Count */}
            <select
              className="border border-border rounded-md bg-muted text-foreground text-sm py-1.5 px-3 focus:outline-none focus:ring-1 focus:ring-ring"
              value={showTop}
              onChange={(e) => setShowTop(Number(e.target.value))}
            >
              <option value={20}>显示 20 个</option>
              <option value={50}>显示 50 个</option>
              <option value={100}>显示 100 个</option>
              <option value={data.skills.length}>显示全部</option>
            </select>
          </div>
        </div>

        {/* Category Tags */}
        {categories.length > 1 && (
          <div className="mb-6 flex flex-wrap gap-2">
            {categories
              .filter(c => c !== 'All')
              .sort((a, b) => {
                const countA = data.skills.filter(s => getCategoryName(s.category) === a).length;
                const countB = data.skills.filter(s => getCategoryName(s.category) === b).length;
                return countB - countA;
              })
              .slice(0, 10)
              .map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    selectedCategory === cat
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-ink-2 hover:bg-accent'
                  }`}
                >
                  <span className={`inline-block w-2 h-2 rounded-full ${getCategoryColor(cat)} mr-1`}></span>
                  {cat}
                </button>
              ))}
          </div>
        )}

        {/* Results */}
        <div className="text-sm text-muted-foreground mb-4">
          找到 {filteredAndSortedSkills.length} 个 Skills
        </div>

        {/* Skills Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredAndSortedSkills.map((skill, index) => (
            <div
              key={`${skill.name}-${index}`}
              className="bg-card rounded-lg border border-border p-4 hover:border-primary/40 transition-colors group"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {skill.icon ? (
                    <img
                      src={skill.icon}
                      alt={skill.name}
                      className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                      <Puzzle className="h-5 w-5 text-primary" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold text-foreground truncate">
                      {skill.name}
                    </h3>
                    {skill.author && (
                      <p className="text-sm text-muted-foreground truncate flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {getAuthorName(skill.author)}
                      </p>
                    )}
                  </div>
                </div>
                {skill.url && (
                  <a
                    href={skill.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 p-1.5 text-muted-foreground hover:text-primary transition-colors flex-shrink-0"
                    title="查看详情"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>

              <p className="text-sm text-ink-2 mb-3 line-clamp-2 min-h-[2.5rem]">
                {skill.description || '暂无描述'}
              </p>

              {/* Category Tag */}
              {getCategoryName(skill.category) && (
                <div className="flex flex-wrap gap-1 mb-3">
                  <span
                    className="px-2 py-0.5 text-xs bg-muted text-ink-2 rounded-full"
                  >
                    {getCategoryName(skill.category)}
                  </span>
                </div>
              )}

              {/* Meta */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {skill.installs > 0 && (
                  <span className="flex items-center gap-1">
                    <Download className="h-3.5 w-3.5 text-success" />
                    {formatInstalls(skill.installs)}
                  </span>
                )}
                {getCategoryName(skill.category) && (
                  <span className="flex items-center gap-1">
                    <Globe className="h-3.5 w-3.5" />
                    {getCategoryName(skill.category)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredAndSortedSkills.length === 0 && (
          <div className="text-center py-12">
            <Puzzle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              没有找到匹配的 Skills
            </h3>
            <p className="text-muted-foreground">
              尝试调整搜索条件或清除筛选
            </p>
          </div>
        )}

        {/* Footer CTA */}
        <div className="mt-12 text-center">
          <a
            href={data.browse_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            <Globe className="h-5 w-5" />
            访问 Skills Hub 探索更多
          </a>
        </div>
      </div>
    </div>
  );
};

export default SkillsHub;