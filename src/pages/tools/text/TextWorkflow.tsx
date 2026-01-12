import React, { useState, useEffect } from 'react';
import { Workflow, Plus, Trash2, ArrowDown, Play, Save, RotateCcw, Copy, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type OperationType = 'uppercase' | 'lowercase' | 'trim' | 'replace' | 'sort' | 'reverse' | 'lines';

type Step = {
  id: string;
  type: OperationType;
  params: Record<string, any>;
};

const OPERATIONS: { value: OperationType; label: string }[] = [
  { value: 'uppercase', label: 'To Uppercase' },
  { value: 'lowercase', label: 'To Lowercase' },
  { value: 'trim', label: 'Trim Whitespace' },
  { value: 'replace', label: 'Find & Replace' },
  { value: 'sort', label: 'Sort Lines' },
  { value: 'reverse', label: 'Reverse' },
  { value: 'lines', label: 'Add Line Numbers' },
];

export default function TextWorkflow() {
  const { t } = useTranslation();
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [steps, setSteps] = useState<Step[]>([]);
  const [copied, setCopied] = useState(false);

  const addStep = (type: OperationType) => {
    setSteps([...steps, { id: Date.now().toString(), type, params: {} }]);
  };

  const removeStep = (id: string) => {
    setSteps(steps.filter(s => s.id !== id));
  };

  const updateStepParam = (id: string, key: string, value: any) => {
    setSteps(steps.map(s => s.id === id ? { ...s, params: { ...s.params, [key]: value } } : s));
  };

  const runWorkflow = () => {
    let result = input;
    
    for (const step of steps) {
      switch (step.type) {
        case 'uppercase':
          result = result.toUpperCase();
          break;
        case 'lowercase':
          result = result.toLowerCase();
          break;
        case 'trim':
          result = result.trim().split('\n').map(l => l.trim()).join('\n');
          break;
        case 'replace':
          if (step.params.find) {
            const flags = step.params.regex ? (step.params.case ? 'g' : 'gi') : 'g';
            try {
              const search = step.params.regex 
                ? new RegExp(step.params.find, flags)
                : step.params.find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escape if not regex
              
              // Simple string replaceAll if not regex
              if (!step.params.regex) {
                 result = result.split(step.params.find).join(step.params.replace || '');
              } else {
                 result = result.replace(search, step.params.replace || '');
              }
            } catch (e) {
              console.error('Invalid regex', e);
            }
          }
          break;
        case 'sort':
          const lines = result.split('\n');
          if (step.params.desc) {
            lines.sort((a, b) => b.localeCompare(a));
          } else {
            lines.sort((a, b) => a.localeCompare(b));
          }
          result = lines.join('\n');
          break;
        case 'reverse':
          if (step.params.mode === 'lines') {
            result = result.split('\n').reverse().join('\n');
          } else {
            result = result.split('').reverse().join('');
          }
          break;
        case 'lines':
          result = result.split('\n').map((l, i) => `${i + 1}. ${l}`).join('\n');
          break;
      }
    }
    
    setOutput(result);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1000);
  };

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <div className="p-2 bg-slate-100 text-slate-600 rounded-lg">
          <Workflow size={24} />
        </div>
        <h1 className="text-2xl font-bold">Text Workflow Automation</h1>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 h-full flex flex-col">
            <h3 className="font-semibold text-gray-700 mb-4">Workflow Steps</h3>
            
            <div className="flex-1 space-y-3 overflow-y-auto min-h-[300px] mb-4">
              {steps.map((step, index) => (
                <div key={step.id} className="relative">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 group">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-sm text-slate-700">
                        {index + 1}. {OPERATIONS.find(op => op.value === step.type)?.label}
                      </span>
                      <button onClick={() => removeStep(step.id)} className="text-slate-400 hover:text-red-500">
                        <Trash2 size={14} />
                      </button>
                    </div>
                    
                    {/* Step Configs */}
                    {step.type === 'replace' && (
                      <div className="space-y-2">
                        <input
                          type="text"
                          placeholder="Find"
                          value={step.params.find || ''}
                          onChange={e => updateStepParam(step.id, 'find', e.target.value)}
                          className="w-full px-2 py-1 text-xs border rounded"
                        />
                        <input
                          type="text"
                          placeholder="Replace"
                          value={step.params.replace || ''}
                          onChange={e => updateStepParam(step.id, 'replace', e.target.value)}
                          className="w-full px-2 py-1 text-xs border rounded"
                        />
                        <label className="flex items-center gap-1 text-xs text-slate-600">
                          <input 
                            type="checkbox" 
                            checked={step.params.regex || false}
                            onChange={e => updateStepParam(step.id, 'regex', e.target.checked)}
                          /> Regex
                        </label>
                      </div>
                    )}
                    
                    {step.type === 'sort' && (
                      <label className="flex items-center gap-1 text-xs text-slate-600">
                        <input 
                          type="checkbox" 
                          checked={step.params.desc || false}
                          onChange={e => updateStepParam(step.id, 'desc', e.target.checked)}
                        /> Descending
                      </label>
                    )}

                    {step.type === 'reverse' && (
                      <select 
                        value={step.params.mode || 'text'}
                        onChange={e => updateStepParam(step.id, 'mode', e.target.value)}
                        className="w-full px-2 py-1 text-xs border rounded"
                      >
                        <option value="text">Reverse Text</option>
                        <option value="lines">Reverse Lines</option>
                      </select>
                    )}
                  </div>
                  {index < steps.length - 1 && (
                    <div className="flex justify-center my-1 text-slate-300">
                      <ArrowDown size={16} />
                    </div>
                  )}
                </div>
              ))}
              
              {steps.length === 0 && (
                <div className="text-center py-8 text-slate-400 text-sm">
                  No steps added. Add operations to build your workflow.
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              {OPERATIONS.map(op => (
                <button
                  key={op.value}
                  onClick={() => addStep(op.value)}
                  className="px-2 py-1.5 text-xs bg-white border border-slate-200 hover:border-slate-400 rounded text-slate-700 transition-colors text-left flex items-center gap-1"
                >
                  <Plus size={12} /> {op.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-gray-700">Input</label>
              <button onClick={() => setInput('')} className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1">
                <RotateCcw size={12} /> Clear
              </button>
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter text to process..."
              className="w-full h-48 p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent resize-none font-mono text-sm"
            />
          </div>

          <div className="flex justify-center">
            <button
              onClick={runWorkflow}
              className="flex items-center gap-2 px-6 py-2 bg-slate-800 text-white rounded-full hover:bg-slate-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <Play size={18} fill="currentColor" /> Run Workflow
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-gray-700">Output</label>
              <button onClick={handleCopy} className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1">
                {copied ? <Check size={12} /> : <Copy size={12} />} {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <textarea
              readOnly
              value={output}
              placeholder="Result will appear here..."
              className="w-full h-48 p-3 border border-gray-200 rounded-lg bg-slate-50 font-mono text-sm resize-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
