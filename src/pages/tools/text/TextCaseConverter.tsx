import React, { useState } from 'react';
import { Type, Copy, RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function TextCaseConverter() {
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

  const toUpperCase = () => setText(text.toUpperCase());
  const toLowerCase = () => setText(text.toLowerCase());
  
  const toTitleCase = () => {
    setText(text.toLowerCase().replace(/(?:^|\s)\w/g, match => match.toUpperCase()));
  };

  const toSentenceCase = () => {
    setText(text.toLowerCase().replace(/(^\w|\.\s+\w)/gm, match => match.toUpperCase()));
  };

  const toToggleCase = () => {
    setText(text.split('').map(c => 
      c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase()
    ).join(''));
  };

  const toCamelCase = () => {
    setText(text
      .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => 
        index === 0 ? word.toLowerCase() : word.toUpperCase()
      )
      .replace(/\s+/g, '')
    );
  };

  const toSnakeCase = () => {
    setText(text
      .match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g)
      ?.map(x => x.toLowerCase())
      .join('_') || text
    );
  };

  const toKebabCase = () => {
    setText(text
      .match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g)
      ?.map(x => x.toLowerCase())
      .join('-') || text
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
          <Type size={24} />
        </div>
        <h1 className="text-2xl font-bold">Text Case Converter</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter text here..."
          className="w-full h-64 p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
        />

        <div className="flex justify-between items-center mt-4">
          <div className="text-sm text-gray-500">
            {text.length} characters | {text.split(/\s+/).filter(w => w.length > 0).length} words
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
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Copy size={16} />
              {message || 'Copy'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button onClick={toUpperCase} className="p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-500 hover:text-blue-600 transition-all font-medium">UPPERCASE</button>
        <button onClick={toLowerCase} className="p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-500 hover:text-blue-600 transition-all font-medium">lowercase</button>
        <button onClick={toTitleCase} className="p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-500 hover:text-blue-600 transition-all font-medium">Title Case</button>
        <button onClick={toSentenceCase} className="p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-500 hover:text-blue-600 transition-all font-medium">Sentence case</button>
        <button onClick={toToggleCase} className="p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-500 hover:text-blue-600 transition-all font-medium">tOGGLE cASE</button>
        <button onClick={toCamelCase} className="p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-500 hover:text-blue-600 transition-all font-medium">camelCase</button>
        <button onClick={toSnakeCase} className="p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-500 hover:text-blue-600 transition-all font-medium">snake_case</button>
        <button onClick={toKebabCase} className="p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-500 hover:text-blue-600 transition-all font-medium">kebab-case</button>
      </div>
    </div>
  );
}
