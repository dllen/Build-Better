import React from 'react';
import { Link } from 'react-router-dom';
import {
  Type,
  Replace,
  ArrowDownAZ,
  ListOrdered,
  Code,
  Sparkles,
  Smile,
  Wand2,
  AlignLeft,
  FileText,
  GitCompare,
  Workflow,
  Filter,
  Dices,
  ArrowRightLeft,
  Languages,
  AlignJustify,
  Space,
  Sigma,
  Hash,
  Pen,
  Columns,
  Eraser,
} from 'lucide-react';

const TOOLS = [
  { path: '/tools/text/case', icon: Type, title: 'Case Converter', desc: 'Uppercase, lowercase, title case, camelCase, etc.' },
  { path: '/tools/text/replace', icon: Replace, title: 'Text Replacer', desc: 'Find and replace with regex and batch support.' },
  { path: '/tools/text/deduplicate', icon: Filter, title: 'Text Deduper', desc: 'Remove duplicate lines or tokens from text.' },
  { path: '/tools/text/sort', icon: ArrowDownAZ, title: 'Sorter & Reverser', desc: 'Sort lines alphabetically, numerically, or reverse text.' },
  { path: '/tools/text/numbers', icon: ListOrdered, title: 'Add Line Numbers', desc: 'Add or remove line numbers and paragraph numbering.' },
  { path: '/tools/text/html', icon: Code, title: 'Text to HTML', desc: 'Convert plain text to HTML paragraphs and lists.' },
  { path: '/tools/text/symbols', icon: Sparkles, title: 'Symbol Picker', desc: 'Copy special symbols, math, currency, and arrows.' },
  { path: '/tools/text/emojis', icon: Smile, title: 'Emoji Picker', desc: 'Browse and copy emojis by category.' },
  { path: '/tools/text/fancy', icon: Wand2, title: 'Fancy Text', desc: 'Generate bold, italic, script, and bubble text styles.' },
  { path: '/tools/text/typesetter', icon: AlignLeft, title: 'Typesetter', desc: 'Auto-format spacing between English and Chinese.' },
  { path: '/tools/text/stats', icon: FileText, title: 'Text Statistics', desc: 'Count words, chars, lines, and analyze frequency.' },
  { path: '/tools/text/similarity', icon: GitCompare, title: 'Similarity', desc: 'Compare two texts and calculate similarity percentage.' },
  { path: '/tools/text/diff', icon: GitCompare, title: 'Text Diff', desc: 'Compare two texts line by line or character by character.' },
  { path: '/tools/text/workflow', icon: Workflow, title: 'Workflow', desc: 'Chain multiple operations into a custom pipeline.' },
  { path: '/text/random', icon: Dices, title: 'Random Generator', desc: 'Generate random strings with custom character sets.' },
  { path: '/text/transpose', icon: ArrowRightLeft, title: 'Row ↔ Column', desc: 'Split a delimited row into lines, or join lines into one row.' },
  { path: '/text/pinyin', icon: Languages, title: 'Pinyin Converter', desc: 'Convert Chinese characters to pinyin with tone marks.' },
  { path: '/text/full-half-width', icon: Type, title: 'Full/Half Width', desc: 'Convert between full-width and half-width characters.' },
  { path: '/text/simplified-traditional', icon: Languages, title: 'Simplified ↔ Traditional', desc: 'Convert between simplified and traditional Chinese characters.' },
  { path: '/text/vertical', icon: AlignJustify, title: 'Vertical Text', desc: 'Display text vertically for classical Chinese layout.' },
  { path: '/text/spacing', icon: Space, title: 'Text Spacing', desc: 'Insert separators between characters, words, or lines.' },
  { path: '/text/list-sum', icon: Sigma, title: 'List Sum', desc: 'Sum, average, min, max of numeric lists.' },
  { path: '/text/stroke-count', icon: Hash, title: 'Stroke Count', desc: 'Count strokes for Chinese characters with per-character breakdown.' },
  { path: '/text/stroke-order', icon: Pen, title: 'Stroke Order', desc: 'Display stroke count for each Chinese character.' },
  { path: '/text/column-substr', icon: Columns, title: 'Column Substr', desc: 'Extract a specific column from delimited data.' },
  { path: '/text/numbering', icon: ListOrdered, title: 'Numbering', desc: 'Add or remove line numbers from text.' },
  { path: '/text/clear-chars', icon: Eraser, title: 'Text Cleaner', desc: 'Remove Chinese, English, digits, punctuation, or whitespace.' },
];

export default function TextTools() {
  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Text Processing Suite</h1>
        <p className="text-gray-600">A comprehensive collection of tools for manipulating, analyzing, and formatting text.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {TOOLS.map((tool) => (
          <Link 
            key={tool.path} 
            to={tool.path}
            className="group bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-blue-300 transition-all"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <tool.icon size={24} />
              </div>
              <h3 className="font-semibold text-gray-900">{tool.title}</h3>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">
              {tool.desc}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
