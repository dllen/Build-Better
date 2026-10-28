import React, { useMemo, useState } from 'react';
import { ExternalLink, Search, Filter, Layers } from 'lucide-react';

interface Resource {
  module: string;
  category: string;
  name: string;
  link: string;
  description: string;
}

const RESOURCES: Resource[] = [
  {
    module: "算法模块",
    category: "面试",
    name: "LeetCode Company Wise Problems",
    link: "https://github.com/liquidslr/leetcode-company-wise-problems",
    description: "LeetCode 公司真题列表，包含按公司分类的 LeetCode Premium 题目。"
  }
];

const NonIndieDeveloper = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModule, setSelectedModule] = useState<string>('All');

  const modules = useMemo(() => {
    const mods = Array.from(new Set(RESOURCES.map(r => r.module)));
    return ['All', ...mods];
  }, []);

  const filteredResources = useMemo(() => {
    return RESOURCES.filter(resource => {
      const matchesSearch = 
        resource.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resource.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resource.category.toLowerCase().includes(searchTerm.toLowerCase());
        
      const matchesModule = selectedModule === 'All' || resource.module === selectedModule;
      
      return matchesSearch && matchesModule;
    });
  }, [searchTerm, selectedModule]);

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-extrabold text-foreground sm:text-4xl">
            非独立开发者资源导航
          </h1>
          <p className="mt-3 max-w-2xl mx-auto text-xl text-muted-foreground">
            为职场开发者提供的精选资源、工具与学习路径
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:w-96">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-muted-foreground" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-border rounded-md leading-5 bg-muted text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring sm:text-sm"
              placeholder="搜索资源..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <Filter className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            <select
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              className="block w-full pl-3 pr-10 py-2 text-base border-border focus:outline-none focus:ring-ring focus:border-ring sm:text-sm rounded-md bg-card text-card-foreground"
            >
              {modules.map(mod => (
                <option key={mod} value={mod}>{mod === 'All' ? '所有模块' : mod}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredResources.map((resource, index) => (
            <div key={index} className="flex flex-col bg-card rounded-lg overflow-hidden border border-border">
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex flex-col gap-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent/10 text-primary self-start">
                      {resource.module}
                    </span>
                    <span className="inline-flex items-center text-xs text-muted-foreground">
                      <Layers className="h-3 w-3 mr-1" />
                      {resource.category}
                    </span>
                  </div>
                  <a 
                    href={resource.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    <ExternalLink className="h-5 w-5" />
                  </a>
                </div>
                
                <h3 className="text-xl font-bold text-foreground mb-2">
                  <a href={resource.link} target="_blank" rel="noopener noreferrer" className="hover:underline">
                    {resource.name}
                  </a>
                </h3>
                
                <p className="text-ink-2 text-sm leading-relaxed flex-1">
                  {resource.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NonIndieDeveloper;
