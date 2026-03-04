import React, { useState } from 'react';
import { Replace, Copy, RotateCcw, Plus, Trash2, History } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type ReplacementPair = {
  find: string;
  replace: string;
  useRegex: boolean;
  caseSensitive: boolean;
};

export default function TextReplacer() {
  const { t } = useTranslation();
  const [text, setText] = useState('');
  const [pairs, setPairs] = useState<ReplacementPair[]>([
    { find: '', replace: '', useRegex: false, caseSensitive: false }
  ]);
  const [history, setHistory] = useState<string[]>([]);
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

  const addPair = () => {
    setPairs([...pairs, { find: '', replace: '', useRegex: false, caseSensitive: false }]);
  };

  const removePair = (index: number) => {
    setPairs(pairs.filter((_, i) => i !== index));
  };

  const updatePair = (index: number, field: keyof ReplacementPair, value: any) => {
    const newPairs = [...pairs];
    newPairs[index] = { ...newPairs[index], [field]: value };
    setPairs(newPairs);
  };

  const processReplacement = () => {
    let result = text;
    // Save to history before modifying
    setHistory(prev => [text, ...prev].slice(0, 10));

    pairs.forEach(pair => {
      if (!pair.find) return;

      try {
        if (pair.useRegex) {
          const flags = pair.caseSensitive ? 'g' : 'gi';
          const regex = new RegExp(pair.find, flags);
          result = result.replace(regex, pair.replace);
        } else {
          // Escape special regex chars if not using regex but want global replace
          // Or just use split/join for simple global replace
          if (!pair.caseSensitive) {
             // Case insensitive string replace is tricky without regex
             const regex = new RegExp(pair.find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
             result = result.replace(regex, pair.replace);
          } else {
             result = result.split(pair.find).join(pair.replace);
          }
        }
      } catch (e) {
        console.error('Invalid regex', e);
      }
    });

    setText(result);
  };

  const undo = () => {
    if (history.length > 0) {
      const previous = history[0];
      setText(previous);
      setHistory(history.slice(1));
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <div className="p-2 bg-green-100 text-green-600 rounded-lg">
          <Replace size={24} />
        </div>
        <h1 className="text-2xl font-bold">Text Replacer</h1>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter text here..."
              className="w-full h-96 p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none font-mono text-sm"
            />
            <div className="flex justify-between items-center mt-4">
               <div className="flex gap-2">
                 <button
                    onClick={undo}
                    disabled={history.length === 0}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50"
                  >
                    <History size={14} /> Undo
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
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Copy size={16} />
                  {message || 'Copy Result'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-700">Replacements</h3>
              <button 
                onClick={addPair}
                className="text-sm text-green-600 hover:text-green-700 flex items-center gap-1"
              >
                <Plus size={14} /> Add Rule
              </button>
            </div>
            
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              {pairs.map((pair, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-medium text-gray-500">Rule #{index + 1}</span>
                    {pairs.length > 1 && (
                      <button onClick={() => removePair(index)} className="text-gray-400 hover:text-red-500">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                  
                  <input
                    type="text"
                    value={pair.find}
                    onChange={(e) => updatePair(index, 'find', e.target.value)}
                    placeholder="Find..."
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-green-500"
                  />
                  <input
                    type="text"
                    value={pair.replace}
                    onChange={(e) => updatePair(index, 'replace', e.target.value)}
                    placeholder="Replace with..."
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-green-500"
                  />
                  
                  <div className="flex gap-4 mt-2">
                    <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={pair.useRegex}
                        onChange={(e) => updatePair(index, 'useRegex', e.target.checked)}
                        className="rounded text-green-600 focus:ring-green-500"
                      />
                      Regex
                    </label>
                    <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={pair.caseSensitive}
                        onChange={(e) => updatePair(index, 'caseSensitive', e.target.checked)}
                        className="rounded text-green-600 focus:ring-green-500"
                      />
                      Match Case
                    </label>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={processReplacement}
              className="w-full mt-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
            >
              Replace All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
