import React, { useMemo, useState } from 'react';
import { ExternalLink, Star, GitFork, Search, Filter, Github, Languages, Tag, Calendar } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// 导入 GitHub Stars 数据
import githubStarsData from '@/data/github-stars.json';

interface StarredRepo {
  name: string;
  full_name: string;
  description: string;
  url: string;
  stars: number;
  forks: number;
  language: string;
  topics: string[];
  updated_at: string;
  owner_avatar: string;
  license: string;
}

interface GithubStarsData {
  username: string;
  fetched_at: string;
  total_count: number;
  stars: StarredRepo[];
  by_language: Record<string, StarredRepo[]>;
  by_topic: Record<string, StarredRepo[]>;
}

// 安全地转换数据
const data = githubStarsData as GithubStarsData;

const GithubStars = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'stars' | 'updated' | 'name'>('stars');
  const [showTop, setShowTop] = useState<number>(50); // 默认显示前50个

  const languages = useMemo(() => {
    return ['All', ...Object.keys(data.by_language)];
  }, []);

  const filteredAndSortedRepos = useMemo(() => {
    let repos = [...data.stars];

    // Filter by language
    if (selectedLanguage !== 'All') {
      repos = repos.filter(repo => repo.language === selectedLanguage);
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      repos = repos.filter(repo =>
        repo.name.toLowerCase().includes(term) ||
        repo.description.toLowerCase().includes(term) ||
        repo.full_name.toLowerCase().includes(term) ||
        repo.topics.some(t => t.toLowerCase().includes(term))
      );
    }

    // Sort
    repos.sort((a, b) => {
      switch (sortBy) {
        case 'stars':
          return b.stars - a.stars;
        case 'updated':
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    return repos.slice(0, showTop);
  }, [selectedLanguage, searchTerm, sortBy, showTop]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getLanguageColor = (lang: string) => {
    const colors: Record<string, string> = {
      'TypeScript': 'bg-blue-500',
      'JavaScript': 'bg-yellow-500',
      'Python': 'bg-green-500',
      'Go': 'bg-cyan-500',
      'Rust': 'bg-orange-500',
      'Java': 'bg-red-500',
      'C++': 'bg-purple-500',
      'C': 'bg-gray-500',
      'Ruby': 'bg-pink-500',
      'PHP': 'bg-indigo-500',
      'Swift': 'bg-orange-400',
      'Kotlin': 'bg-purple-400',
      'Vue': 'bg-green-400',
      'CSS': 'bg-blue-400',
      'HTML': 'bg-orange-300',
      'Shell': 'bg-green-600',
      'Makefile': 'bg-gray-600',
      'Jupyter Notebook': 'bg-orange-500',
    };
    return colors[lang] || 'bg-gray-400';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Github className="h-10 w-10 text-gray-900 dark:text-white" />
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
              我的 GitHub Stars
            </h1>
          </div>
          <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 dark:text-gray-400">
            收藏的优质开源项目，按技术栈和话题分类整理
          </p>
          <div className="mt-4 flex items-center justify-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <Star className="h-4 w-4 text-yellow-500" />
              {data.total_count} Stars
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
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md leading-5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="搜索项目名称、描述或话题..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-3">
            {/* Language Filter */}
            <div className="flex items-center gap-2">
              <Languages className="h-4 w-4 text-gray-400" />
              <select
                className="border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm py-1.5 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
              >
                {languages.map(lang => (
                  <option key={lang} value={lang}>
                    {lang === 'All' ? `全部语言 (${data.total_count})` : `${lang} (${data.by_language[lang]?.length || 0})`}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                className="border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm py-1.5 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
              >
                <option value="stars">按 Stars 数</option>
                <option value="updated">按更新时间</option>
                <option value="name">按名称</option>
              </select>
            </div>

            {/* Show Count */}
            <select
              className="border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm py-1.5 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              value={showTop}
              onChange={(e) => setShowTop(Number(e.target.value))}
            >
              <option value={20}>显示 20 个</option>
              <option value={50}>显示 50 个</option>
              <option value={100}>显示 100 个</option>
              <option value={data.stars.length}>显示全部</option>
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-6 flex flex-wrap gap-2">
          {Object.entries(data.by_language)
            .sort((a, b) => b[1].length - a[1].length)
            .slice(0, 8)
            .map(([lang, repos]) => (
              <button
                key={lang}
                onClick={() => setSelectedLanguage(lang)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  selectedLanguage === lang
                    ? 'bg-indigo-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                <span className={`inline-block w-2 h-2 rounded-full ${getLanguageColor(lang)} mr-1`}></span>
                {lang} ({repos.length})
              </button>
            ))}
        </div>

        {/* Results */}
        <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          找到 {filteredAndSortedRepos.length} 个项目
        </div>

        {/* Projects Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredAndSortedRepos.map((repo) => (
            <div
              key={repo.full_name}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors group"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                    {repo.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    {repo.full_name.split('/')[0]}
                  </p>
                </div>
                <a
                  href={repo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 p-1.5 text-gray-400 hover:text-indigo-500 transition-colors"
                  title="在 GitHub 查看"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2 min-h-[2.5rem]">
                {repo.description || '暂无描述'}
              </p>

              {/* Topics */}
              {repo.topics.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {repo.topics.slice(0, 4).map(topic => (
                    <span
                      key={topic}
                      className="px-2 py-0.5 text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 rounded-full"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              )}

              {/* Meta */}
              <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <span className={`w-2.5 h-2.5 rounded-full ${getLanguageColor(repo.language)}`}></span>
                  {repo.language}
                </span>
                <span className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 text-yellow-500" />
                  {repo.stars.toLocaleString()}
                </span>
                <span className="flex items-center gap-1">
                  <GitFork className="h-3.5 w-3.5" />
                  {repo.forks.toLocaleString()}
                </span>
                {repo.license && (
                  <span className="text-xs" title={repo.license}>
                    📜 {repo.license.split(' ')[0]}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredAndSortedRepos.length === 0 && (
          <div className="text-center py-12">
            <Github className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              没有找到匹配的项目
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              尝试调整搜索条件或清除筛选
            </p>
          </div>
        )}

        {/* Footer CTA */}
        <div className="mt-12 text-center">
          <a
            href={`https://github.com/${data.username}?tab=stars`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
          >
            <Github className="h-5 w-5" />
            在 GitHub 查看全部 Stars
          </a>
        </div>
      </div>
    </div>
  );
};

export default GithubStars;
