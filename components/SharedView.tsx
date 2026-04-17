import React from 'react';
import { FullReport } from '../services/apiService';
import { Language, DecisionType } from '../types';
import DecisionBadge from './DecisionBadge';
import { BrainCircuit, Heart } from 'lucide-react';

interface SharedViewProps {
  report: FullReport;
}

/**
 * Read-only view of a shared report.
 * Shown when someone opens a share link (scans the QR code).
 */
const SharedView: React.FC<SharedViewProps> = ({ report }) => {
  const language: Language = 'zh'; // Shared view defaults to Chinese

  const isPositiveChange = report.stockData.changePercent.startsWith('+') ||
    !report.stockData.changePercent.startsWith('-');

  const handleCTA = () => {
    // Clear the hash and go to the main page
    window.location.href = window.location.origin;
  };

  return (
    <div className="min-h-screen bg-gemini-dark text-slate-200 font-sans overflow-x-hidden">

      {/* Simple Header */}
      <header className="py-4 px-4 sm:px-8 border-b border-slate-800 bg-gemini-dark/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-1.5 rounded-lg">
              <BrainCircuit className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm sm:text-lg font-bold text-white">AlphaMeetsLuck</h1>
              <p className="text-[10px] sm:text-xs text-slate-400">找只股票谈恋爱</p>
            </div>
          </div>
          <button
            onClick={handleCTA}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-400 hover:to-purple-400 text-white text-xs sm:text-sm font-bold rounded-full transition-all hover:scale-105 active:scale-95 shadow-lg shadow-pink-900/30"
          >
            <Heart className="w-4 h-4" />
            <span>我也要谈恋爱</span>
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-3 sm:px-4 md:px-8 py-6 sm:py-10 pb-32">

        {/* Hero Title */}
        <div className="text-center mb-6 sm:mb-10">
          <p className="text-xs sm:text-sm text-slate-500 font-mono mb-2">有人和股票谈了一场恋爱 💘</p>
          <h2 className="text-2xl sm:text-4xl font-bold text-white mb-2">
            我和 <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">{report.stockData.symbol}</span> 的恋爱报告
          </h2>
          <p className="text-sm text-slate-400">{report.stockData.lastUpdated}</p>
        </div>

        <div className="space-y-4 sm:space-y-8">

          {/* Stock Data + Decision */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="lg:col-span-3 bg-gemini-card border border-slate-700 rounded-xl p-4 sm:p-6 flex flex-col gap-4 shadow-2xl">
              <h2 className="text-2xl sm:text-3xl font-bold text-white">{report.stockData.symbol}</h2>
              <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-3 sm:gap-8 items-end">
                <div>
                  <span className="block text-[10px] sm:text-xs text-slate-500 font-mono uppercase">现价</span>
                  <span className="text-xl sm:text-3xl font-mono font-bold text-white">{report.stockData.price}</span>
                </div>
                <div>
                  <span className="block text-[10px] sm:text-xs text-slate-500 font-mono uppercase">涨跌幅</span>
                  <span className={`text-lg sm:text-xl font-mono font-bold ${isPositiveChange ? 'text-green-400' : 'text-red-400'}`}>
                    {report.stockData.changePercent}
                  </span>
                </div>
                <div className="hidden sm:block w-px h-12 bg-slate-700 mx-2"></div>
                <div>
                  <span className="block text-[10px] sm:text-xs text-slate-500 font-mono uppercase">市盈率</span>
                  <span className="text-lg sm:text-xl font-mono text-slate-200">{report.stockData.peRatio}</span>
                </div>
                <div>
                  <span className="block text-[10px] sm:text-xs text-slate-500 font-mono uppercase">市值</span>
                  <span className="text-lg sm:text-xl font-mono text-slate-200">{report.stockData.marketCap}</span>
                </div>
              </div>
            </div>
            <div className="lg:col-span-1">
              <DecisionBadge decision={report.decision} language={language} />
            </div>
          </div>

          {/* Thesis */}
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 border border-slate-700/50 rounded-xl p-4 sm:p-6 md:p-8 relative overflow-hidden shadow-lg">
            <div className="absolute top-0 left-0 w-1 h-full bg-gemini-gold"></div>
            <h3 className="text-gemini-gold font-mono text-[10px] sm:text-xs tracking-widest uppercase mb-2 sm:mb-3 flex items-center gap-2">
              <span className="text-base sm:text-lg">☯</span> 恋爱大师一句话点评
            </h3>
            <p className="text-sm sm:text-lg md:text-xl leading-relaxed font-light text-slate-200">
              "{report.mainThesis}"
            </p>
          </div>

          {/* Compact 3D Scores */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            {[
              { label: '基本面', data: report.fundamental },
              { label: '市场动能', data: report.momentum },
              { label: '博弈情绪', data: report.sentiment },
            ].map(({ label, data }) => {
              const color = data.score >= 70 ? 'text-green-400 border-green-500/40' : data.score >= 40 ? 'text-yellow-400 border-yellow-500/40' : 'text-red-400 border-red-500/40';
              return (
                <div key={label} className={`bg-gemini-card border rounded-xl p-3 sm:p-5 text-center ${color.split(' ')[1]}`}>
                  <div className="text-[10px] sm:text-xs text-slate-500 font-mono mb-1">{label}</div>
                  <div className={`text-2xl sm:text-3xl font-mono font-bold ${color.split(' ')[0]}`}>{data.score}</div>
                  <div className="text-[10px] sm:text-xs text-slate-400 mt-1 truncate">{data.title}</div>
                </div>
              );
            })}
          </div>

          {/* Compact Compatibility Verdict */}
          {report.compatibility?.stockElement && (
            <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-amber-500/20 rounded-xl p-4 sm:p-6 text-center space-y-3">
              <p className="text-[10px] sm:text-xs font-mono text-amber-500/60 tracking-widest uppercase">☯ 命理匹配</p>
              <div className="flex items-center justify-center gap-4">
                <span className="text-3xl">{report.compatibility.stockElement === '金' ? '🪙' : report.compatibility.stockElement === '木' ? '🌿' : report.compatibility.stockElement === '水' ? '💧' : report.compatibility.stockElement === '火' ? '🔥' : '🌍'}</span>
                <div>
                  <div className="text-xl sm:text-2xl font-bold text-amber-300">{report.compatibility.verdict}</div>
                  <div className="text-sm text-slate-400">匹配度 {report.compatibility.overallScore}/100</div>
                </div>
              </div>
              {report.compatibility.verdictDetail && (
                <p className="text-xs sm:text-sm text-slate-300 italic">「{report.compatibility.verdictDetail}」</p>
              )}
              {report.compatibility.pillars?.yearPillar && (
                <div className="flex justify-center gap-3 mt-2">
                  {['年', '月', '日', '时'].map((lbl, i) => {
                    const vals = [report.compatibility!.pillars?.yearPillar, report.compatibility!.pillars?.monthPillar, report.compatibility!.pillars?.dayPillar, report.compatibility!.pillars?.hourPillar];
                    return (
                      <div key={lbl} className="text-center">
                        <div className="text-[10px] text-slate-500">{lbl}柱</div>
                        <div className="text-amber-300 font-bold text-sm bg-slate-800 border border-amber-500/20 rounded px-2 py-1">{vals[i]}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Big CTA at bottom */}
        <div className="mt-10 sm:mt-16 text-center">
          <div className="inline-block bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700 rounded-2xl p-6 sm:p-10 max-w-md mx-auto">
            <p className="text-3xl sm:text-4xl mb-3">💘</p>
            <h3 className="text-lg sm:text-xl font-bold text-white mb-2">
              你也想和股票谈恋爱？
            </h3>
            <p className="text-sm text-slate-400 mb-5">
              输入你的生辰八字，找到命中注定的股票宝宝
            </p>
            <button
              onClick={handleCTA}
              className="w-full px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-400 hover:to-purple-400 text-white font-bold rounded-xl transition-all hover:scale-105 active:scale-95 shadow-xl shadow-pink-900/30 text-sm sm:text-base"
            >
              我也要和股票谈恋爱 →
            </button>
            <p className="text-[10px] text-slate-600 mt-3">alphameetsluck.com · 纯属娱乐，不构成投资建议</p>
          </div>
        </div>

      </main>
    </div>
  );
};

export default SharedView;
