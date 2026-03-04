import React, { useState } from 'react';
import { ArrowDownAZ, Copy, RotateCcw, Shuffle, ArrowUpDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function TextSorter() {
  const { t } = useTranslation();
  const [text, setText] = useState('');
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

  const getLines = () => text.split(/\r?\n/);
  const setLines = (lines: string[]) => setText(lines.join('\n'));

  const sortAlphaAsc = () => {
    const lines = getLines();
    lines.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
    setLines(lines);
  };

  const sortAlphaDesc = () => {
    const lines = getLines();
    lines.sort((a, b) => b.localeCompare(a, undefined, { numeric: true, sensitivity: 'base' }));
    setLines(lines);
  };

  const sortLengthAsc = () => {
    const lines = getLines();
    lines.sort((a, b) => a.length - b.length);
    setLines(lines);
  };

  const sortLengthDesc = () => {
    const lines = getLines();
    lines.sort((a, b) => b.length - a.length);
    setLines(lines);
  };

  const reverseLines = () => {
    const lines = getLines();
    lines.reverse();
    setLines(lines);
  };

  const reverseText = () => {
    setText(text.split('').reverse().join(''));
  };

  const reverseEachLine = () => {
    const lines = getLines();
    const reversed = lines.map(line => line.split('').reverse().join(''));
    setLines(reversed);
  };

  const shuffleLines = () => {
    const lines = getLines();
    for (let i = lines.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [lines[i], lines[j]] = [lines[j], lines[i]];
    }
    setLines(lines);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
          <ArrowDownAZ size={24} />
        </div>
        <h1 className="text-2xl font-bold">Text Sorter & Reverser</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter text to sort (one item per line)..."
          className="w-full h-64 p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none font-mono text-sm"
        />

        <div className="flex justify-between items-center mt-4">
          <div className="text-sm text-gray-500">
            {text ? text.split(/\r?\n/).length : 0} lines
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
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Copy size={16} />
              {message || 'Copy'}
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Sorting</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button onClick={sortAlphaAsc} className="p-3 bg-white border border-gray-200 rounded-lg hover:border-purple-500 hover:text-purple-600 transition-all font-medium flex items-center justify-center gap-2">
              <ArrowDownAZ size={18} /> A-Z (Natural)
            </button>
            <button onClick={sortAlphaDesc} className="p-3 bg-white border border-gray-200 rounded-lg hover:border-purple-500 hover:text-purple-600 transition-all font-medium flex items-center justify-center gap-2">
              <ArrowDownAZ size={18} className="rotate-180" /> Z-A (Natural)
            </button>
            <button onClick={sortLengthAsc} className="p-3 bg-white border border-gray-200 rounded-lg hover:border-purple-500 hover:text-purple-600 transition-all font-medium flex items-center justify-center gap-2">
              <ArrowUpDown size={18} /> Length (Shortest)
            </button>
            <button onClick={sortLengthDesc} className="p-3 bg-white border border-gray-200 rounded-lg hover:border-purple-500 hover:text-purple-600 transition-all font-medium flex items-center justify-center gap-2">
              <ArrowUpDown size={18} /> Length (Longest)
            </button>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Manipulation</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button onClick={reverseLines} className="p-3 bg-white border border-gray-200 rounded-lg hover:border-purple-500 hover:text-purple-600 transition-all font-medium flex items-center justify-center gap-2">
              <ArrowUpDown size={18} /> Reverse Line Order
            </button>
            <button onClick={shuffleLines} className="p-3 bg-white border border-gray-200 rounded-lg hover:border-purple-500 hover:text-purple-600 transition-all font-medium flex items-center justify-center gap-2">
              <Shuffle size={18} /> Shuffle Lines
            </button>
            <button onClick={reverseEachLine} className="p-3 bg-white border border-gray-200 rounded-lg hover:border-purple-500 hover:text-purple-600 transition-all font-medium flex items-center justify-center gap-2">
              Reverse Text (Line)
            </button>
            <button onClick={reverseText} className="p-3 bg-white border border-gray-200 rounded-lg hover:border-purple-500 hover:text-purple-600 transition-all font-medium flex items-center justify-center gap-2">
              Reverse Entire Text
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
