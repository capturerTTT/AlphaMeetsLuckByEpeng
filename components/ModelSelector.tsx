import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Zap, Brain } from 'lucide-react';
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
    labelZh: 'Gemini',
    sublabel: 'Live Google Search grounding',
    sublabelZh: '实时 Google 搜索数据',
    icon: <Zap className="w-4 h-4 text-blue-400" />,
    badge: 'LIVE',
    badgeColor: 'bg-green-500/20 text-green-400 border border-green-500/30',
  },
  {
    id: 'claude',
    label: 'Claude',
    labelZh: 'Claude',
    sublabel: 'Deep reasoning, training data',
    sublabelZh: '深度推理，训练数据',
    icon: <Brain className="w-4 h-4 text-purple-400" />,
    badge: 'DEEP',
    badgeColor: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
  },
];

const ModelSelector: React.FC<ModelSelectorProps> = ({ model, setModel, language }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
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
        title={isChinese ? '切换 AI 模型' : 'Switch AI Model'}
      >
        {current.icon}
        <span className="text-white font-semibold">{current.id === 'gemini' ? 'Gemini' : 'Claude'}</span>
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
              {isChinese ? '选择 AI 引擎' : 'Select AI Engine'}
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
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${m.badgeColor}`}>
                    {m.badge}
                  </span>
                  {model === m.id && (
                    <span className="ml-auto text-[10px] text-gemini-accent">✓ Active</span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isChinese ? m.sublabelZh : m.sublabel}
                </p>
              </div>
            </button>
          ))}

          {/* Warning note */}
          <div className="px-4 py-2 border-t border-slate-800 bg-slate-900/50">
            <p className="text-[10px] text-slate-600 leading-relaxed">
              {isChinese
                ? 'Claude 无实时搜索，数据基于训练截止日期。需设置 ANTHROPIC_API_KEY。'
                : 'Claude lacks live search. Data is from training cutoff. Requires ANTHROPIC_API_KEY.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelSelector;
