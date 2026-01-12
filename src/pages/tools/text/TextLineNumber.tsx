import React, { useState } from 'react';
import { ListOrdered, Copy, RotateCcw, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function TextLineNumber() {
  const { t } = useTranslation();
  const [text, setText] = useState('');
  const [start, setStart] = useState(1);
  const [format, setFormat] = useState('.');
  const [separator, setSeparator] = useState(' ');
  const [mode, setMode] = useState<'line' | 'paragraph'>('line');
  const [message, setMessage] = useState('');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setMessage(t('common.copied') || 'Copied!');
      setTimeout(() => setMessage(''), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const processText = () => {
    let lines = text.split(/\r?\n/);
    let counter = start;

    if (mode === 'line') {
      const result = lines.map(line => {
        // Skip adding number if line is empty?? Maybe option. For now, number all lines.
        const numStr = `${counter}${format}${separator}`;
        counter++;
        return `${numStr}${line}`;
      });
      setText(result.join('\n'));
    } else {
      // Paragraph mode
      // Split by empty lines, number non-empty blocks
      // This is trickier because we need to preserve whitespace structure or rebuild it
      // Simple approach: Split by double newline, number non-empty
      const paragraphs = text.split(/(\r?\n\s*\r?\n)/);
      const result = paragraphs.map(p => {
        if (!p.trim()) return p; // Return whitespace separators as is
        const numStr = `${counter}${format}${separator}`;
        counter++;
        return `${numStr}${p}`;
      });
      setText(result.join(''));
    }
  };

  const removeNumbers = () => {
    // Attempt to remove patterns like "1. ", "1) ", "(1) " at start of lines
    // Regex: ^\s*(\d+|[a-z]|[A-Z])([.)\]]|\s)\s*
    const regex = /^\s*(\(?\d+[.)\]]?)\s*/gm;
    setText(text.replace(regex, ''));
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
          <ListOrdered size={24} />
        </div>
        <h1 className="text-2xl font-bold">Add Line Numbers</h1>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste your text here..."
              className="w-full h-96 p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none font-mono text-sm"
            />
            <div className="flex justify-between items-center mt-4">
               <div className="flex gap-2">
                 <button
                    onClick={removeNumbers}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <X size={14} /> Remove Numbers
                  </button>
               </div>
               <div className="flex gap-2">
                <button
                  onClick={() => setText('')}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <RotateCcw size={16} />
                  Clear
                </button>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <Copy size={16} />
                  {message || 'Copy'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-4">
            <h3 className="font-semibold text-gray-700">Settings</h3>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Mode</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setMode('line')}
                  className={`px-3 py-2 text-sm rounded-lg border ${mode === 'line' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'border-gray-200 hover:bg-gray-50'}`}
                >
                  Line by Line
                </button>
                <button
                  onClick={() => setMode('paragraph')}
                  className={`px-3 py-2 text-sm rounded-lg border ${mode === 'paragraph' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'border-gray-200 hover:bg-gray-50'}`}
                >
                  Paragraphs
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Start Number</label>
              <input
                type="number"
                value={start}
                onChange={(e) => setStart(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Format Style</label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value=".">1.</option>
                <option value=")">1)</option>
                <option value="">1</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Separator</label>
              <input
                type="text"
                value={separator}
                onChange={(e) => setSeparator(e.target.value)}
                placeholder="Space"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <button
              onClick={processText}
              className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors"
            >
              Add Numbers
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
