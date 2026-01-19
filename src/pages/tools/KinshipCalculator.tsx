import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { RotateCcw, ArrowLeft, Copy, Share2, History, Volume2 } from 'lucide-react';
// @ts-ignore
import relationship from 'relationship.js';

interface HistoryItem {
  id: string;
  relation: string;
  result: string[];
  gender: 0 | 1;
  timestamp: number;
}

export default function KinshipCalculator() {
  const { t } = useTranslation();
  const [gender, setGender] = useState<0 | 1>(1); // 1 for male, 0 for female
  const [relationChain, setRelationChain] = useState<string[]>([]);
  const [result, setResult] = useState<string[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    const saved = localStorage.getItem('kinship-history');
    return saved ? JSON.parse(saved) : [];
  });
  const [inputValue, setInputValue] = useState('');

  const relations = [
    { label: '父', value: '爸爸' },
    { label: '母', value: '妈妈' },
    { label: '夫', value: '老公' },
    { label: '妻', value: '老婆' },
    { label: '子', value: '儿子' },
    { label: '女', value: '女儿' },
    { label: '兄', value: '哥哥' },
    { label: '弟', value: '弟弟' },
    { label: '姐', value: '姐姐' },
    { label: '妹', value: '妹妹' },
  ];

  useEffect(() => {
    calculate();
  }, [relationChain, gender]);

  const calculate = () => {
    if (relationChain.length === 0) {
      setResult([]);
      return;
    }
    const text = relationChain.join('的');
    try {
      const res = relationship({ text, sex: gender });
      setResult(res || []);
    } catch (e) {
      setResult([]);
    }
  };

  useEffect(() => {
    if (result.length > 0 && relationChain.length > 0) {
      // Auto save logic can go here if needed in the future
    }
  }, [result, relationChain]);

  const handleAddRelation = (value: string) => {
    setRelationChain([...relationChain, value]);
  };

  const handleUndo = () => {
    setRelationChain(relationChain.slice(0, -1));
  };

  const handleReset = () => {
    setRelationChain([]);
    setResult([]);
    setInputValue('');
  };

  const handleSaveToHistory = () => {
    if (result.length > 0) {
      const newItem: HistoryItem = {
        id: Date.now().toString(),
        relation: relationChain.join('的'),
        result,
        gender,
        timestamp: Date.now(),
      };
      const newHistory = [newItem, ...history].slice(0, 50); // Keep last 50
      setHistory(newHistory);
      localStorage.setItem('kinship-history', JSON.stringify(newHistory));
    }
  };

  const handleShare = async () => {
    const text = `${t('tools.kinship.share_text', '我正在查询亲戚称呼')}：${relationChain.join('的')} -> ${result.join('/')}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: t('tools.kinship.title'),
          text: text,
        });
      } catch (err) {
        console.error('Share failed:', err);
      }
    } else {
      navigator.clipboard.writeText(text);
      // Ideally show a toast here
    }
  };
  
  const handleCopy = () => {
     if (result.length > 0) {
        navigator.clipboard.writeText(result.join(' / '));
     }
  };

  const handleSpeak = () => {
      if (result.length > 0 && 'speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(result.join('或者'));
          utterance.lang = 'zh-CN';
          window.speechSynthesis.speak(utterance);
      }
  };
  
  // Reverse lookup
  const handleReverseLookup = () => {
      if(!inputValue) return;
      try {
          // relationship.js supports finding relation from title?
          // Documentation says: relationship({text:'舅舅',reverse:true,sex:1})
          const res = relationship({ text: inputValue, reverse: true, sex: gender });
          setResult(res || []);
      } catch (e) {
          setResult([]);
      }
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('tools.kinship.title', '中国亲戚称呼计算器')}
          </h1>
          <div className="flex gap-2">
             <button
              onClick={() => setGender(1)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                gender === 1
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200'
              }`}
            >
              {t('tools.kinship.male', '我是男性')}
            </button>
            <button
              onClick={() => setGender(0)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                gender === 0
                  ? 'bg-pink-600 text-white'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200'
              }`}
            >
              {t('tools.kinship.female', '我是女性')}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Input */}
          <div className="space-y-6">
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl min-h-[120px] flex flex-col justify-center relative border border-gray-200 dark:border-gray-700">
               <span className="text-gray-500 dark:text-gray-400 text-sm absolute top-3 left-4">
                  {t('tools.kinship.current_relation', '当前关系')}
               </span>
               <div className="text-lg font-medium text-gray-800 dark:text-gray-200 mt-4 break-words">
                  {relationChain.length === 0 ? (
                      <span className="text-gray-400">{t('tools.kinship.placeholder', '请选择关系...')}</span>
                  ) : (
                      <>
                        <span className="text-blue-600 dark:text-blue-400 font-bold">我</span>
                        {relationChain.map((rel, index) => (
                            <span key={index}>
                                <span className="mx-1 text-gray-400">的</span>
                                <span className="text-gray-800 dark:text-gray-200">{rel}</span>
                            </span>
                        ))}
                      </>
                  )}
               </div>
                {relationChain.length > 0 && (
                    <div className="absolute bottom-3 right-3 flex gap-2">
                         <button onClick={handleUndo} className="p-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors" title={t('common.undo', '撤销')}>
                            <RotateCcw size={18} />
                         </button>
                         <button onClick={handleReset} className="p-1.5 text-red-500 hover:text-red-700 transition-colors" title={t('common.reset', '重置')}>
                            <ArrowLeft size={18} />
                         </button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-5 gap-3">
              {relations.map((rel) => (
                <button
                  key={rel.label}
                  onClick={() => handleAddRelation(rel.value)}
                  className="aspect-square flex items-center justify-center text-lg font-medium bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-200 dark:hover:border-blue-800 hover:text-blue-600 dark:hover:text-blue-400 transition-all shadow-sm active:scale-95"
                >
                  {rel.label}
                </button>
              ))}
            </div>
            
             <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('tools.kinship.reverse_lookup', '称呼反查 (如: 舅舅)')}
                </label>
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="输入称呼..."
                    />
                    <button 
                        onClick={handleReverseLookup}
                        className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                    >
                        {t('common.search', '查询')}
                    </button>
                </div>
            </div>
          </div>

          {/* Right Column: Result & History */}
          <div className="space-y-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl border border-blue-100 dark:border-blue-900/50 min-h-[160px] flex flex-col justify-center items-center text-center relative">
               <span className="text-blue-500 dark:text-blue-400 text-sm absolute top-4 left-4 font-medium uppercase tracking-wider">
                  {t('tools.kinship.result', '计算结果')}
               </span>
               
               {result.length > 0 ? (
                   <>
                        <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                            {result.join(' / ')}
                        </div>
                        <div className="flex gap-3 mt-4">
                             <button onClick={handleCopy} className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-sm text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors" title={t('common.copy', '复制')}>
                                <Copy size={20} />
                             </button>
                              <button onClick={handleSpeak} className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-sm text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors" title={t('common.speak', '朗读')}>
                                <Volume2 size={20} />
                             </button>
                             <button onClick={handleShare} className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-sm text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors" title={t('common.share', '分享')}>
                                <Share2 size={20} />
                             </button>
                        </div>
                   </>
               ) : (
                   <span className="text-gray-400 dark:text-gray-500 italic">
                       {t('tools.kinship.waiting', '等待计算...')}
                   </span>
               )}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2 bg-gray-50 dark:bg-gray-900/50">
                    <History size={16} className="text-gray-500" />
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('common.history', '查询历史')}
                    </h3>
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                    {history.length === 0 ? (
                        <div className="p-8 text-center text-gray-400 text-sm">
                            {t('common.no_history', '暂无历史记录')}
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100 dark:divide-gray-700">
                            {history.map((item) => (
                                <div key={item.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors flex justify-between items-center group">
                                    <div>
                                        <div className="text-sm text-gray-900 dark:text-gray-100 font-medium mb-1">
                                            {item.relation || item.result.join('/')}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {new Date(item.timestamp).toLocaleString()}
                                            <span className="mx-2">•</span>
                                            {item.gender === 1 ? '男' : '女'}
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => {
                                            setRelationChain(item.relation.split('的').filter(Boolean));
                                            setResult(item.result);
                                            setGender(item.gender);
                                        }}
                                        className="text-blue-600 text-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        {t('common.load', '加载')}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-100 dark:border-amber-900/50 text-amber-800 dark:text-amber-200 text-sm">
            <h4 className="font-bold mb-2 flex items-center gap-2">
                💡 {t('tools.kinship.tips_title', '使用小贴士')}
            </h4>
            <ul className="list-disc list-inside space-y-1 opacity-90">
                <li>{t('tools.kinship.tip1', '点击"父"、"母"等按钮依次添加关系。')}</li>
                <li>{t('tools.kinship.tip2', '支持"称呼反查"，例如输入"舅舅"查看是什么关系。')}</li>
                <li>{t('tools.kinship.tip3', '不同地区称呼可能存在差异，结果仅供参考。')}</li>
            </ul>
        </div>
      </div>
    </div>
  );
}
