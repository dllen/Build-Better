import React, { useState } from 'react';
import { Sparkles, Search, Copy, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const CATEGORIES = {
  'Common': ['©', '®', '™', '•', '€', '£', '¥', '¢', '§', '¶', '°', '∞', '≠', '≈', '±'],
  'Math': ['∀', '∃', '∅', '∇', '∈', '∉', '∋', '∏', '∑', '−', '∗', '√', '∝', '∞', '∠', '∧', '∨', '∩', '∪', '∫', '∴', '∼', '≅', '≈', '≠', '≡', '≤', '≥', '⊂', '⊃', '⊄', '⊆', '⊇', '⊕', '⊗', '⊥', '⋅'],
  'Arrows': ['←', '↑', '→', '↓', '↔', '↕', '↖', '↗', '↘', '↙', '⇐', '⇑', '⇒', '⇓', '⇔', '⇕', '⇖', '⇗', '⇘', '⇙', '➔', '➜', '➝', '➞', '➤'],
  'Currency': ['$', '€', '£', '¥', '¢', '₽', '₹', '₩', '₺', '₱', '฿', '₫', '₦', '₴', '₵', '₭', '₪'],
  'Punctuation': ['—', '–', '…', '“', '”', '‘', '’', '«', '»', '‹', '›', '¡', '¿', '†', '‡', '•', '·'],
  'Greek': ['α', 'β', 'γ', 'δ', 'ε', 'ζ', 'η', 'θ', 'ι', 'κ', 'λ', 'μ', 'ν', 'ξ', 'ο', 'π', 'ρ', 'σ', 'τ', 'υ', 'φ', 'χ', 'ψ', 'ω', 'Α', 'Β', 'Γ', 'Δ', 'Ε', 'Ζ', 'Η', 'Θ', 'Ι', 'Κ', 'Λ', 'Μ', 'Ν', 'Ξ', 'Ο', 'Π', 'Ρ', 'Σ', 'Τ', 'Υ', 'Φ', 'Χ', 'Ψ', 'Ω'],
  'Superscript': ['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹', '⁺', '⁻', '⁼', '⁽', '⁾', 'ⁿ'],
  'Subscript': ['₀', '₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉', '₊', '₋', '₌', '₍', '₎', 'ₐ', 'ₑ', 'ₒ', 'ₓ', 'ₔ']
};

export default function SymbolPicker() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('All');

  const handleCopy = (symbol: string) => {
    navigator.clipboard.writeText(symbol);
    setCopied(symbol);
    setTimeout(() => setCopied(null), 1000);
  };

  const filteredSymbols = Object.entries(CATEGORIES).flatMap(([cat, symbols]) => 
    symbols.map(s => ({ symbol: s, category: cat }))
  ).filter(({ symbol, category }) => {
    const matchesSearch = !search || symbol.includes(search); // Basic check, maybe extend to names if we had them
    const matchesCategory = activeCategory === 'All' || activeCategory === category;
    return matchesSearch && matchesCategory;
  });

  // Unique list to avoid duplicates when showing All
  const uniqueSymbols = Array.from(new Set(filteredSymbols.map(s => s.symbol)));

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <div className="p-2 bg-yellow-100 text-yellow-600 rounded-lg">
          <Sparkles size={24} />
        </div>
        <h1 className="text-2xl font-bold">Special Symbols</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search symbols..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
            <button
              onClick={() => setActiveCategory('All')}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeCategory === 'All' 
                  ? 'bg-yellow-100 text-yellow-700' 
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              All
            </button>
            {Object.keys(CATEGORIES).map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  activeCategory === cat 
                    ? 'bg-yellow-100 text-yellow-700' 
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-3">
          {uniqueSymbols.map((symbol, i) => (
            <button
              key={`${symbol}-${i}`}
              onClick={() => handleCopy(symbol)}
              className="aspect-square flex items-center justify-center text-xl bg-gray-50 hover:bg-yellow-50 border border-gray-100 hover:border-yellow-200 rounded-lg transition-all relative group"
            >
              {symbol}
              {copied === symbol && (
                <div className="absolute inset-0 bg-yellow-100 rounded-lg flex items-center justify-center animate-in fade-in zoom-in duration-200">
                  <Check size={16} className="text-yellow-600" />
                </div>
              )}
            </button>
          ))}
        </div>
        
        {uniqueSymbols.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No symbols found matching your criteria.
          </div>
        )}
      </div>
    </div>
  );
}
