import React from 'react';
import { BrainCircuit, Globe, History } from 'lucide-react';
import { Language, ModelProvider } from '../types';
import ModelSelector from './ModelSelector';

interface HeaderProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  onOpenHistory: () => void;
  model: ModelProvider;
  setModel: (model: ModelProvider) => void;
}

const Header: React.FC<HeaderProps> = ({ language, setLanguage, onOpenHistory, model, setModel }) => {
  return (
    <header className="py-6 px-4 md:px-8 border-b border-slate-800 bg-gemini-dark sticky top-0 z-50 backdrop-blur-md bg-opacity-80">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 rounded-lg relative overflow-hidden group">
            <BrainCircuit className="w-6 h-6 text-white relative z-10" />
            <div className="absolute inset-0 bg-yellow-400/20 blur-sm group-hover:animate-pulse"></div>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">AlphaMeetsLuck <span className="text-gemini-gold text-xs align-top font-mono">ALPHA</span></h1>
            <p className="text-xs text-slate-400 hidden sm:block">
              {language === 'en' ? 'Hedge Fund Fengshui Analyst' : '风水驱动对冲基金分析师'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenHistory}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
            title="History"
          >
            <History className="w-5 h-5" />
          </button>

          {/* Model Selector */}
          <ModelSelector model={model} setModel={setModel} language={language} />

          {/* Language Toggle */}
          <button
            onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-mono text-slate-300 transition-all"
          >
            <Globe className="w-3 h-3" />
            <span className={language === 'en' ? 'text-white font-bold' : 'text-slate-500'}>EN</span>
            <span className="text-slate-600">|</span>
            <span className={language === 'zh' ? 'text-white font-bold' : 'text-slate-500'}>中文</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
