import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Zap } from 'lucide-react';
import { ModelProvider, Language } from '../types';

interface ModelSelectorProps {
  model: ModelProvider;
  setModel: (model: ModelProvider) => void;
  language: Language;
}

const models: {
  id: ModelProvider;
  label: string;
  labelZh: string;
  sublabel: string;
  sublabelZh: string;
  icon: React.ReactNode;
  badge: string;
  badgeColor: string;
}[] = [
  {
    id: 'gemini',
    label: 'Gemini',
    labelZh: '加州谷派',
    sublabel: 'Live Google Search grounding',
    sublabelZh: '实时 Google 搜索，数据最新',
    icon: <Zap className="w-4 h-4 text-blue-400" />,
    badge: 'LIVE',
    badgeColor: 'bg-green-500/20 text-green-400 border border-green-500/30',
  },
  {
    id: 'kimi',
    label: 'Kimi',
    labelZh: '北京月记',
    sublabel: 'Moonshot AI, 256K context',
    sublabelZh: '月之暗面，25万字上下文',
    icon: <Zap className="w-4 h-4 text-cyan-400" />,
    badge: 'K2',
    badgeColor: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30',
  },
];

const ModelSelector: React.FC<ModelSelectorProps> = ({ model, setModel, language }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const current = models.find(m => m.id === model)!;
  const isChinese = language === 'zh';

  return (
    <div className="relative" ref={ref}>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[10px] sm:text-xs font-mono text-slate-300 transition-all min-w-0 sm:min-w-[130px]"
        title={isChinese ? '大师选择' : 'Switch AI Model'}
      >
        {current.icon}
        <span className="text-white font-semibold">{isChinese ? current.labelZh : current.label}</span>
        <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded font-bold ${current.badgeColor}`}>
          {current.badge}
        </span>
        <ChevronDown className={`w-3 h-3 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden animate-fade-in">
          <div className="px-3 py-2 border-b border-slate-800">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">
              {isChinese ? '🔮 大师选择' : 'Select AI Engine'}
            </p>
          </div>
          {models.map(m => (
            <button
              key={m.id}
              onClick={() => { setModel(m.id); setOpen(false); }}
              className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-800 ${
                model === m.id ? 'bg-slate-800/80' : ''
              }`}
            >
              <div className="mt-0.5">{m.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white">
                    {isChinese ? m.labelZh : m.label}
                  </span>
                  {isChinese && (
                    <span className="text-[10px] text-slate-500">{m.label}</span>
                  )}
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${m.badgeColor}`}>
                    {m.badge}
                  </span>
                  {model === m.id && (
                    <span className="ml-auto text-[10px] text-gemini-accent">✓</span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isChinese ? m.sublabelZh : m.sublabel}
                </p>
              </div>
            </button>
          ))}

          <div className="px-4 py-2 border-t border-slate-800 bg-slate-900/50">
            <p className="text-[10px] text-slate-600 leading-relaxed">
              {isChinese
                ? '默认「加州谷派」实时搜索；调用失败自动切换「北京月记」。'
                : 'Gemini has live search. Falls back to Kimi if unavailable.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelSelector;
