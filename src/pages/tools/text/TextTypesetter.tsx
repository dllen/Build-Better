import React, { useState } from 'react';
import { AlignLeft, Copy, RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Simple pangu-like implementation
const autoSpacing = (text: string) => {
  // CJK is Chinese, Japanese, Korean
  // Add space between CJK and English/Number
  let result = text;
  
  // CJK followed by ANSI
  result = result.replace(/([\u4e00-\u9fa5\u3040-\u30ff\u31f0-\u31ff])([a-zA-Z0-9])/g, '$1 $2');
  
  // ANSI followed by CJK
  result = result.replace(/([a-zA-Z0-9])([\u4e00-\u9fa5\u3040-\u30ff\u31f0-\u31ff])/g, '$1 $2');
  
  return result;
};

const normalizePunctuation = (text: string) => {
  return text
    .replace(/,/g, '，')
    .replace(/\./g, '。')
    .replace(/\?/g, '？')
    .replace(/!/g, '！')
    .replace(/:/g, '：')
    .replace(/;/g, '；')
    .replace(/\(/g, '（')
    .replace(/\)/g, '）');
};

const normalizeWhitespace = (text: string) => {
  return text
    .replace(/[ \t]+/g, ' ') // Multiple spaces to single
    .replace(/\n\s+/g, '\n') // Remove start of line space
    .replace(/\s+\n/g, '\n') // Remove end of line space
    .replace(/\n{3,}/g, '\n\n'); // Max 2 newlines
};

export default function TextTypesetter() {
  const { t } = useTranslation();
  const [text, setText] = useState('');
  const [message, setMessage] = useState('');
  
  const [opts, setOpts] = useState({
    spacing: true,
    punctuation: false,
    trim: true
  });

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
    let result = text;
    if (opts.spacing) result = autoSpacing(result);
    if (opts.punctuation) result = normalizePunctuation(result);
    if (opts.trim) result = normalizeWhitespace(result);
    setText(result);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <div className="p-2 bg-teal-100 text-teal-600 rounded-lg">
          <AlignLeft size={24} />
        </div>
        <h1 className="text-2xl font-bold">Text Typesetter</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste mixed English/Chinese text here..."
          className="w-full h-64 p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none font-mono text-sm mb-4"
        />

        <div className="flex flex-wrap items-center gap-6 mb-6">
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={opts.spacing}
              onChange={(e) => setOpts({ ...opts, spacing: e.target.checked })}
              className="rounded text-teal-600 focus:ring-teal-500"
            />
            Auto Spacing (CJK-English)
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={opts.punctuation}
              onChange={(e) => setOpts({ ...opts, punctuation: e.target.checked })}
              className="rounded text-teal-600 focus:ring-teal-500"
            />
            Convert to Full-width Punctuation
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={opts.trim}
              onChange={(e) => setOpts({ ...opts, trim: e.target.checked })}
              className="rounded text-teal-600 focus:ring-teal-500"
            />
            Cleanup Whitespace
          </label>
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={() => setText('')}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RotateCcw size={16} />
            Clear
          </button>
          <button
            onClick={processText}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            <AlignLeft size={16} />
            Format
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Copy size={16} />
            {message || 'Copy'}
          </button>
        </div>
      </div>
    </div>
  );
}
