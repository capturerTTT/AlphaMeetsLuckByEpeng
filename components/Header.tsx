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
    <header className="py-3 sm:py-6 px-3 sm:px-8 border-b border-slate-800 bg-gemini-dark sticky top-0 z-50 backdrop-blur-md bg-opacity-80">
      <div className="max-w-7xl mx-auto flex justify-between items-center gap-2">
        {/* Logo — shrink on mobile */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-shrink-0">
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-1.5 sm:p-2 rounded-lg relative overflow-hidden group">
            <BrainCircuit className="w-5 h-5 sm:w-6 sm:h-6 text-white relative z-10" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm sm:text-xl font-bold tracking-tight text-white truncate">
              AlphaMeetsLuck <span className="text-gemini-gold text-[10px] sm:text-xs align-top font-mono">ALPHA</span>
            </h1>
            <p className="text-[10px] sm:text-xs text-slate-400 hidden sm:block">
              {language === 'en' ? 'Find a Stock to Fall in Love With' : '找只股票谈恋爱'}
            </p>
          </div>
        </div>

        {/* Controls — compact on mobile */}
        <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
          <button
            onClick={onOpenHistory}
            className="p-1.5 sm:p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
            title="History"
          >
            <History className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Model Selector */}
          <ModelSelector model={model} setModel={setModel} language={language} />

          {/* Language Toggle */}
          <button
            onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')}
            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[10px] sm:text-xs font-mono text-slate-300 transition-all"
          >
            <Globe className="w-3 h-3 hidden sm:block" />
            <span className={language === 'en' ? 'text-white font-bold' : 'text-slate-500'}>EN</span>
            <span className="text-slate-600">|</span>
            <span className={language === 'zh' ? 'text-white font-bold' : 'text-slate-500'}>中</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
