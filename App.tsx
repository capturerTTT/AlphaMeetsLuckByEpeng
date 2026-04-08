import React, { useState, useEffect } from 'react';
import html2canvas from 'html2canvas';
import Header from './components/Header';
import MatrixCard from './components/MatrixCard';
import DecisionBadge from './components/DecisionBadge';
import HistorySidebar from './components/HistorySidebar';
import CopyButton from './components/CopyButton';
import { analyzeStock } from './services/apiService';
import { InvestmentReport, Language, ModelProvider } from './types';
import { Search, Loader2, ArrowRight, ExternalLink, AlertTriangle, RotateCcw, Share2, Download, BrainCircuit } from 'lucide-react';

const App: React.FC = () => {
  const [query, setQuery] = useState('');
  const [language, setLanguage] = useState<Language>('en');
  const [model, setModel] = useState<ModelProvider>('gemini');
  const [report, setReport] = useState<InvestmentReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  
  // History State
  const [history, setHistory] = useState<InvestmentReport[]>(() => {
    try {
      const saved = localStorage.getItem('stockGeminiHistory');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Save history whenever it changes
  useEffect(() => {
    localStorage.setItem('stockGeminiHistory', JSON.stringify(history));
  }, [history]);

  const addToHistory = (newReport: InvestmentReport) => {
    setHistory(prev => {
      // Remove duplicates of the same stock symbol to keep only the latest version
      const filtered = prev.filter(item => item.stockData.symbol !== newReport.stockData.symbol);
      // Add new report to top, limit to 20
      return [newReport, ...filtered].slice(0, 20);
    });
  };

  const handleHistorySelect = (selectedReport: InvestmentReport) => {
    setReport(selectedReport);
    setQuery(selectedReport.stockData.symbol);
    setIsHistoryOpen(false);
    setError(null);
    // We do NOT trigger a new analysis here, just restore the view.
  };

  const fetchAnalysis = async (searchQuery: string, targetLanguage: Language, activeModel: ModelProvider = model) => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError(null);

    try {
      // All AI calls go through the server-side /api/analyze endpoint.
      // API keys are never sent to the browser.
      const data = await analyzeStock(searchQuery, targetLanguage, activeModel);
      setReport(data);
      addToHistory(data);
    } catch (err: any) {
      console.error("Search failed:", err);
      const msg = err?.message ?? '';
      const isQuota = msg.includes('429') || msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED');

      if (isQuota) {
        setError(
          targetLanguage === 'en'
            ? "API quota exceeded. Please try again in a few minutes."
            : "API 配额已耗尽，请稍等几分钟后重试。"
        );
      } else {
        setError(
          targetLanguage === 'en'
            ? `Analysis failed: ${msg || 'Unknown error'}. Please try again.`
            : `分析失败：${msg || '未知错误'}，请重试。`
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Auto-detect Chinese input
    const hasChinese = /[\u4e00-\u9fa5]/.test(query);
    let targetLang = language;
    
    if (hasChinese && language !== 'zh') {
      setLanguage('zh');
      targetLang = 'zh';
    }

    // Clear report only on explicit new search to show fresh state
    setReport(null);
    await fetchAnalysis(query, targetLang);
  };

  // Re-analyze when language changes, if a report is already present
  useEffect(() => {
    if (report) {
      // Use the symbol from the current report to ensure consistency
      fetchAnalysis(report.stockData.symbol, language);
    }
  }, [language]);

  const handleShare = async () => {
    if (!report) return;
    setIsCapturing(true);

    const element = document.getElementById('report-capture-area');
    if (element) {
      try {
        const canvas = await html2canvas(element, {
          backgroundColor: '#0f172a',
          scale: 2, // Higher resolution
          useCORS: true,
          logging: false
        });

        const image = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        
        const date = new Date().toISOString().split('T')[0];
        const stockName = report.stockData.symbol;
        const filename = `《${stockName}》的《${date}》运势.png`;
        
        link.href = image;
        link.download = filename;
        link.click();
      } catch (e) {
        console.error("Screenshot failed:", e);
      }
    }
    setIsCapturing(false);
  };

  const isPositiveChange = report?.stockData.changePercent.startsWith('+') || 
                           (report && !report.stockData.changePercent.startsWith('-'));

  // Translations
  const t = {
    titlePrefix: language === 'en' ? "Where is the " : "",
    alpha: language === 'en' ? "Alpha" : "宝贝股票",
    titleSuffix: language === 'en' ? " hiding today?" : "今日运势",
    placeholder: language === 'en' ? "Enter ticker (e.g., AMD, 700.HK) or name..." : "输入代码 (如 AMD, 700.HK) 或名称...",
    supportText: language === 'en' ? "Supports US, HK, and CN markets. Data grounded by Google Search." : "支持美股、港股和A股。基于 Google 实时搜索数据。",
    snapshot: language === 'en' ? "Real-time Snapshot" : "实时看板",
    price: language === 'en' ? "Price" : "现价",
    change: language === 'en' ? "Day Change" : "涨跌幅",
    pe: language === 'en' ? "P/E Ratio" : "市盈率 (TTM)",
    mktCap: language === 'en' ? "Mkt Cap" : "市值",
    thesisHeader: language === 'en' ? "Analyst's Spicy Diagnosis" : "分析师毒舌号脉",
    sources: language === 'en' ? "Live Data Sources" : "实时数据来源",
    noSources: language === 'en' ? "Data synthesized from internal knowledge base." : "数据基于内部知识库综合生成。",
    cached: language === 'en' ? "Viewing cached result." : "当前为历史快照。",
    refresh: language === 'en' ? "Refresh Analysis" : "重新分析",
  };

  return (
    <div className="min-h-screen bg-gemini-dark text-slate-200 font-sans selection:bg-gemini-accent selection:text-white overflow-x-hidden relative">
      
      {/* Feng Shui Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 opacity-10">
        {/* Large Rotating Bagua/Octagon */}
        <div className="absolute -top-[10%] -left-[10%] w-[50vw] h-[50vw] border-8 border-slate-600/30 rounded-full animate-spin-slow">
           <div className="absolute inset-4 border border-slate-600/20 rounded-full"></div>
           {/* Bagua Lines simulation */}
           <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-full bg-slate-600/20"></div>
           <div className="absolute top-1/2 left-0 -translate-y-1/2 w-full h-1 bg-slate-600/20"></div>
           <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-full bg-slate-600/20 rotate-45"></div>
           <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-full bg-slate-600/20 -rotate-45"></div>
        </div>

        {/* Tai Chi Symbol hint in bottom right */}
        <div className="absolute -bottom-20 -right-20 w-96 h-96 rounded-full border border-slate-500/20 opacity-20 animate-reverse-spin-slow flex items-center justify-center">
            <div className="w-full h-1/2 bg-slate-500/10 rounded-t-full absolute top-0"></div>
            <div className="w-1/2 h-full bg-slate-500/10 rounded-l-full absolute left-0"></div>
            <div className="w-16 h-16 bg-slate-400/30 rounded-full absolute top-16"></div>
            <div className="w-16 h-16 border border-slate-400/30 rounded-full absolute bottom-16"></div>
        </div>
      </div>

      <div className="relative z-10">
        <Header
          language={language}
          setLanguage={setLanguage}
          onOpenHistory={() => setIsHistoryOpen(true)}
          model={model}
          setModel={setModel}
        />

        <HistorySidebar 
          isOpen={isHistoryOpen} 
          onClose={() => setIsHistoryOpen(false)}
          history={history}
          onSelect={handleHistorySelect}
        />

        <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12 pb-24">
          
          {/* Search Section */}
          <section className="mb-12 max-w-2xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">
              {t.titlePrefix}<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">{t.alpha}</span>{t.titleSuffix}
            </h2>
            
            <form onSubmit={handleSearch} className="relative group">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                <Search className="w-5 h-5 text-slate-500 group-focus-within:text-gemini-accent transition-colors" />
              </div>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t.placeholder}
                className="w-full pl-12 pr-4 py-4 bg-slate-800/50 border border-slate-700 rounded-2xl focus:ring-2 focus:ring-gemini-accent focus:border-transparent outline-none text-lg text-white placeholder-slate-500 transition-all shadow-lg backdrop-blur-sm"
              />
              <button 
                type="submit" 
                disabled={loading || !query.trim()}
                className="absolute right-2 top-2 bottom-2 bg-blue-600 hover:bg-blue-500 text-white px-6 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-blue-900/20"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>
                    {report && report.stockData.symbol === query ? <RotateCcw className="w-4 h-4" /> : <ArrowRight className="w-5 h-5" />}
                  </>
                )}
              </button>
            </form>
            <p className="mt-4 text-sm text-slate-500">
              {t.supportText}
            </p>
          </section>

          {/* Error State */}
          {error && (
            <div className="max-w-2xl mx-auto bg-red-900/20 border border-red-500/50 text-red-200 p-4 rounded-xl flex items-center gap-3 mb-8 animate-fade-in backdrop-blur-sm">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {/* Loading State Skeleton */}
          {loading && (
            <div className="max-w-6xl mx-auto animate-pulse">
              <div className="h-24 bg-slate-800/50 rounded-xl mb-6 w-full"></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="h-64 bg-slate-800/50 rounded-xl"></div>
                <div className="h-64 bg-slate-800/50 rounded-xl"></div>
                <div className="h-64 bg-slate-800/50 rounded-xl"></div>
              </div>
              <div className="h-32 bg-slate-800/50 rounded-xl w-full"></div>
            </div>
          )}

          {/* Results Section - Wrapped for Screenshot */}
          {report && !loading && (
            <div id="report-capture-area" className="animate-fade-in-up max-w-6xl mx-auto space-y-8 p-4 md:p-6 rounded-3xl bg-gemini-dark/80 backdrop-blur-sm border border-slate-800/50">
              
              {/* 1. Real-time Dashboard Bar */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3 bg-gemini-card border border-slate-700 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xl relative overflow-hidden">
                  {/* Subtle BG pattern for card */}
                  <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                    <BrainCircuit className="w-32 h-32" />
                  </div>

                  <div className="relative z-10">
                    <h2 className="text-3xl font-bold text-white tracking-tight">{report.stockData.symbol}</h2>
                    <div className="flex items-center gap-2 text-sm text-slate-400 mt-1">
                       <span>{t.snapshot}</span>
                       <span className="text-slate-600">•</span>
                       <span className="font-mono text-slate-500 text-xs">{report.stockData.lastUpdated}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-8 items-end relative z-10">
                    <div>
                      <span className="block text-xs text-slate-500 font-mono uppercase">{t.price}</span>
                      <span className="text-3xl font-mono font-bold text-white">{report.stockData.price}</span>
                    </div>
                    <div>
                      <span className="block text-xs text-slate-500 font-mono uppercase">{t.change}</span>
                      <span className={`text-xl font-mono font-bold ${isPositiveChange ? 'text-green-400' : 'text-red-400'}`}>
                        {report.stockData.changePercent}
                      </span>
                    </div>
                    <div className="hidden md:block w-px h-12 bg-slate-700 mx-2"></div>
                    <div>
                      <span className="block text-xs text-slate-500 font-mono uppercase">{t.pe}</span>
                      <span className="text-xl font-mono text-slate-200">{report.stockData.peRatio}</span>
                    </div>
                    <div>
                      <span className="block text-xs text-slate-500 font-mono uppercase">{t.mktCap}</span>
                      <span className="text-xl font-mono text-slate-200">{report.stockData.marketCap}</span>
                    </div>
                  </div>
                </div>

                {/* Decision Badge */}
                <div className="lg:col-span-1">
                  <DecisionBadge decision={report.decision} language={language} />
                </div>
              </div>

              {/* 2. The Thesis (Chat bubble style) */}
              <div className="bg-gradient-to-r from-slate-800 to-slate-900 border border-slate-700/50 rounded-xl p-6 md:p-8 relative overflow-hidden group shadow-lg">
                 <div className="absolute top-0 left-0 w-1 h-full bg-gemini-gold"></div>
                 <h3 className="text-gemini-gold font-mono text-xs tracking-widest uppercase mb-3 flex items-center gap-2">
                    <span className="text-lg">☯</span> {t.thesisHeader}
                 </h3>
                 <p className="text-lg md:text-xl leading-relaxed font-light text-slate-200">
                   "{report.mainThesis}"
                 </p>
                 <CopyButton text={report.mainThesis} />
              </div>

              {/* 3. 3D Assessment Matrix */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <MatrixCard type="Fundamental" data={report.fundamental} language={language} />
                <MatrixCard type="Momentum" data={report.momentum} language={language} />
                <MatrixCard type="Sentiment" data={report.sentiment} language={language} />
              </div>

              {/* 4. Sources / Grounding */}
              <div className="pt-8 border-t border-slate-800">
                 <div className="flex items-center gap-3 mb-4">
                   <h4 className="text-sm font-semibold text-slate-500">{t.sources}</h4>
                   <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold border ${
                     model === 'claude'
                       ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                       : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                   }`}>
                     {model === 'claude' ? '⚡ Claude' : '🔍 Gemini + Google Search'}
                   </span>
                 </div>
                 <div className="flex flex-wrap gap-3">
                   {report.sources.length > 0 ? (
                     report.sources.map((source, idx) => (
                       <a
                         key={idx}
                         href={source.uri}
                         target="_blank"
                         rel="noopener noreferrer"
                         className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs text-slate-400 transition-colors border border-slate-700"
                       >
                         <ExternalLink className="w-3 h-3" />
                         <span className="max-w-[200px] truncate">{source.title}</span>
                       </a>
                     ))
                   ) : (
                     <span className="text-xs text-slate-600 italic">{t.noSources}</span>
                   )}
                 </div>
              </div>

            </div>
          )}
        </main>

        {/* Floating Share Button */}
        {report && (
          <button
            onClick={handleShare}
            disabled={isCapturing}
            className="fixed bottom-8 right-8 bg-gemini-accent hover:bg-sky-400 text-gemini-dark p-4 rounded-full shadow-xl shadow-sky-900/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 z-30 flex items-center justify-center"
            title={language === 'en' ? "Share Report" : "分享报告"}
          >
            {isCapturing ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <Share2 className="w-6 h-6" />
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default App;