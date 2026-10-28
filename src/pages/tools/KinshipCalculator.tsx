import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { RotateCcw, ArrowLeft, Copy, Share2, History, Volume2, Lightbulb } from 'lucide-react';
import relationship from 'relationship-ts';

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    } catch {
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

  const _handleSaveToHistory = () => {
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
      } catch {
          setResult([]);
      }
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="bg-card dark:bg-muted rounded-xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-foreground dark:text-card-foreground">
            {t('tools.kinship.title', '中国亲戚称呼计算器')}
          </h1>
          <div className="flex gap-2">
             <button
              onClick={() => setGender(1)}
              className={`px-4 py-2 rounded-lg transition-colors ${ gender === 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground dark:bg-secondary dark:text-muted-foreground hover:bg-border' }`}
            >
              {t('tools.kinship.male', '我是男性')}
            </button>
            <button
              onClick={() => setGender(0)}
              className={`px-4 py-2 rounded-lg transition-colors ${ gender === 0 ? 'bg-destructive text-destructive-foreground' : 'bg-muted text-muted-foreground dark:bg-secondary dark:text-muted-foreground hover:bg-border' }`}
            >
              {t('tools.kinship.female', '我是女性')}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Input */}
          <div className="space-y-6">
            <div className="bg-muted dark:bg-muted p-4 rounded-xl min-h-[120px] flex flex-col justify-center relative dark:border-border">
               <span className="text-muted-foreground dark:text-muted-foreground text-sm absolute top-3 left-4">
                  {t('tools.kinship.current_relation', '当前关系')}
               </span>
               <div className="text-lg font-medium text-foreground dark:text-muted-foreground mt-4 break-words">
                  {relationChain.length === 0 ? (
                      <span className="text-muted-foreground">{t('tools.kinship.placeholder', '请选择关系...')}</span>
                  ) : (
                      <>
                        <span className="text-primary dark:text-primary font-bold">我</span>
                        {relationChain.map((rel, index) => (
                            <span key={index}>
                                <span className="mx-1 text-muted-foreground">的</span>
                                <span className="text-foreground dark:text-muted-foreground">{rel}</span>
                            </span>
                        ))}
                      </>
                  )}
               </div>
                {relationChain.length > 0 && (
                    <div className="absolute bottom-3 right-3 flex gap-2">
                         <button onClick={handleUndo} className="p-1.5 text-muted-foreground hover:text-muted-foreground dark:hover:text-muted-foreground transition-colors" title={t('common.undo', '撤销')}>
                            <RotateCcw size={18} />
                         </button>
                         <button onClick={handleReset} className="p-1.5 text-destructive hover:text-destructive transition-colors" title={t('common.reset', '重置')}>
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
                  className="aspect-square flex items-center justify-center text-lg font-medium bg-muted dark:bg-muted dark:border-border rounded-xl hover:bg-primary/10 dark:hover:bg-primary/20 hover:border-border dark:hover:border-border hover:text-primary dark:hover:text-primary transition-colors transition-transform active:scale-95"
                >
                  {rel.label}
                </button>
              ))}
            </div>
            
             <div className="pt-4 border-t border-border dark:border-border">
                <label className="block text-sm font-medium text-muted-foreground dark:text-muted-foreground mb-2">
                    {t('tools.kinship.reverse_lookup', '称呼反查 (如: 舅舅)')}
                </label>
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        className="flex-1 px-4 py-2 border border-border dark:border-border rounded-lg bg-card dark:bg-muted text-foreground dark:text-card-foreground focus:ring-2 focus:ring-ring outline-none"
                        placeholder="输入称呼..."
                    />
                    <button 
                        onClick={handleReverseLookup}
                        className="btn"
                    >
                        {t('common.search', '查询')}
                    </button>
                </div>
            </div>
          </div>

          {/* Right Column: Result & History */}
          <div className="space-y-6">
            <div className="bg-primary/10 dark:bg-primary/20 p-6 rounded-xl border border-border dark:border-border/50 min-h-[160px] flex flex-col justify-center items-center text-center relative">
               <span className="text-primary dark:text-primary text-sm absolute top-4 left-4 font-medium">
                  {t('tools.kinship.result', '计算结果')}
               </span>
               
               {result.length > 0 ? (
                   <>
                        <div className="text-3xl font-bold text-foreground dark:text-card-foreground mb-2">
                            {result.join(' / ')}
                        </div>
                        <div className="flex gap-3 mt-4">
                             <button onClick={handleCopy} className="p-2 bg-muted dark:bg-muted rounded-full text-muted-foreground dark:text-muted-foreground hover:text-primary dark:hover:text-primary transition-colors" title={t('common.copy', '复制')}>
                                <Copy size={20} />
                             </button>
                              <button onClick={handleSpeak} className="p-2 bg-muted dark:bg-muted rounded-full text-muted-foreground dark:text-muted-foreground hover:text-primary dark:hover:text-primary transition-colors" title={t('common.speak', '朗读')}>
                                <Volume2 size={20} />
                             </button>
                             <button onClick={handleShare} className="p-2 bg-muted dark:bg-muted rounded-full text-muted-foreground dark:text-muted-foreground hover:text-primary dark:hover:text-primary transition-colors" title={t('common.share', '分享')}>
                                <Share2 size={20} />
                             </button>
                        </div>
                   </>
               ) : (
                   <span className="text-muted-foreground dark:text-muted-foreground italic">
                       {t('tools.kinship.waiting', '等待计算...')}
                   </span>
               )}
            </div>

            <div className="bg-muted dark:bg-muted rounded-xl dark:border-border overflow-hidden">
                <div className="px-4 py-3 border-b border-border dark:border-border flex items-center gap-2 bg-muted dark:bg-muted/50">
                    <History size={16} className="text-muted-foreground" />
                    <h3 className="text-sm font-medium text-muted-foreground dark:text-muted-foreground">
                        {t('common.history', '查询历史')}
                    </h3>
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                    {history.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground text-sm">
                            {t('common.no_history', '暂无历史记录')}
                        </div>
                    ) : (
                        <div className="divide-y divide-border dark:divide-border">
                            {history.map((item) => (
                                <div key={item.id} className="p-4 hover:bg-muted dark:hover:bg-secondary/50 transition-colors flex justify-between items-center group">
                                    <div>
                                        <div className="text-sm text-foreground dark:text-muted-foreground font-medium mb-1">
                                            {item.relation || item.result.join('/')}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
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
                                        className="text-primary text-sm opacity-0 group-hover:opacity-100 transition-opacity"
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

        <div className="mt-8 bg-primary/10 dark:bg-primary/20 p-4 rounded-lg border border-border dark:border-border/50 text-primary dark:text-primary text-sm">
            <h4 className="font-bold mb-2 flex items-center gap-2">
                <Lightbulb className="h-4 w-4 shrink-0" aria-hidden="true" />
                {t('tools.kinship.tips_title', '使用小贴士')}
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
