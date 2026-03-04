import React, { useState, useEffect } from 'react';
import { Code, Copy, RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function TextToHtml() {
  const { t } = useTranslation();
  const [text, setText] = useState('');
  const [html, setHtml] = useState('');
  const [message, setMessage] = useState('');
  
  // Options
  const [wrapTag, setWrapTag] = useState('p');
  const [convertNewlines, setConvertNewlines] = useState(false);
  const [escapeHtml, setEscapeHtml] = useState(true);
  const [addAttributes, setAddAttributes] = useState('');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(html);
      setMessage(t('common.copied') || 'Copied!');
      setTimeout(() => setMessage(''), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const escape = (str: string) => {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  useEffect(() => {
    if (!text) {
      setHtml('');
      return;
    }

    let processed = text;
    if (escapeHtml) {
      processed = escape(processed);
    }

    if (convertNewlines) {
      processed = processed.replace(/\n/g, '<br/>\n');
    }

    // Split by double newline to form blocks if wrapping with block tags
    if (['p', 'div', 'li', 'h1', 'h2', 'h3'].includes(wrapTag)) {
       const blocks = text.split(/\r?\n\s*\r?\n/).filter(b => b.trim());
       const result = blocks.map(block => {
         let content = block;
         if (escapeHtml) content = escape(content);
         if (convertNewlines) content = content.replace(/\n/g, '<br/>\n');
         
         const attrs = addAttributes ? ` ${addAttributes}` : '';
         return `<${wrapTag}${attrs}>${content}</${wrapTag}>`;
       });
       setHtml(result.join('\n'));
    } else {
       // Single wrap or none
       const attrs = addAttributes ? ` ${addAttributes}` : '';
       setHtml(wrapTag ? `<${wrapTag}${attrs}>${processed}</${wrapTag}>` : processed);
    }

  }, [text, wrapTag, convertNewlines, escapeHtml, addAttributes]);

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
          <Code size={24} />
        </div>
        <h1 className="text-2xl font-bold">Text to HTML Converter</h1>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Input Text</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter plain text..."
            className="w-full h-96 p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none font-mono text-sm"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">HTML Output</label>
          <textarea
            readOnly
            value={html}
            className="w-full h-96 p-4 border border-gray-200 rounded-lg bg-gray-50 font-mono text-sm text-gray-600 resize-none"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Wrap with:</span>
            <select
              value={wrapTag}
              onChange={(e) => setWrapTag(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-orange-500"
            >
              <option value="p">&lt;p&gt;</option>
              <option value="div">&lt;div&gt;</option>
              <option value="span">&lt;span&gt;</option>
              <option value="li">&lt;li&gt;</option>
              <option value="h1">&lt;h1&gt;</option>
              <option value="h2">&lt;h2&gt;</option>
              <option value="">None</option>
            </select>
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={convertNewlines}
              onChange={(e) => setConvertNewlines(e.target.checked)}
              className="rounded text-orange-600 focus:ring-orange-500"
            />
            Convert newlines to &lt;br/&gt;
          </label>

          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={escapeHtml}
              onChange={(e) => setEscapeHtml(e.target.checked)}
              className="rounded text-orange-600 focus:ring-orange-500"
            />
            Escape HTML characters
          </label>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Attributes:</span>
            <input
              type="text"
              value={addAttributes}
              onChange={(e) => setAddAttributes(e.target.value)}
              placeholder='class="text-red"'
              className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-100">
          <button
            onClick={() => setText('')}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RotateCcw size={16} />
            Clear
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            <Copy size={16} />
            {message || 'Copy HTML'}
          </button>
        </div>
      </div>
    </div>
  );
}
