import React, { useEffect, useState } from 'react';
import { FullReport } from '../services/apiService';
import { DecisionType } from '../types';
import { generateQRDataURL } from '../utils/shareUtils';
import { Share2, Check, Heart, Copy } from 'lucide-react';

interface SharePageViewProps {
  report: FullReport;
}

const DECISION_META: Record<DecisionType, { label: string; color: string; bg: string; border: string }> = {
  [DecisionType.AGGRESSIVE]: { label: '强力追求 💚',    color: '#4ade80', bg: 'rgba(74,222,128,0.12)',  border: 'rgba(74,222,128,0.35)' },
  [DecisionType.DEFENSIVE]:  { label: '快逃吧 🚨',      color: '#f87171', bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.35)' },
  [DecisionType.NEUTRAL]:    { label: '认识就好 🤔',    color: '#fbbf24', bg: 'rgba(251,191,36,0.12)',  border: 'rgba(251,191,36,0.35)' },
};

const SharePageView: React.FC<SharePageViewProps> = ({ report }) => {
  const [qrDataURL, setQrDataURL] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const symbol = report.stockData.symbol;
  const displayName = report.stockData.name || symbol;
  const decision = DECISION_META[report.decision];
  const isPositive =
    report.stockData.changePercent.startsWith('+') ||
    !report.stockData.changePercent.startsWith('-');

  const compat = report.compatibility;
  const hasCompat = !!(compat && compat.stockElement);

  useEffect(() => {
    generateQRDataURL(window.location.href, 220)
      .then(setQrDataURL)
      .catch(e => console.warn('QR generation failed', e));
  }, []);

  const handleShare = async () => {
    const url = window.location.href;
    const title = `我和${displayName}谈恋爱了！`;
    const text = `${title} · ${compat?.verdict ?? ''}匹配度${compat?.overallScore ?? ''}/100`;

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch {
        // user cancelled or share failed — fall through to copy
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // last-ditch fallback: prompt
      window.prompt('复制以下链接分享：', url);
    }
  };

  const handleCTA = () => {
    localStorage.removeItem('baziInfo');
    window.location.href = window.location.origin;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-indigo-950/30 to-slate-950 text-slate-200 font-sans flex flex-col items-center px-4 py-6 sm:py-12">

      {/* Branding */}
      <div className="text-center mb-4 sm:mb-6">
        <p className="text-[10px] sm:text-xs font-mono text-slate-500 tracking-[0.3em]">ALPHAMEETSLUCK.COM</p>
      </div>

      {/* Poster Card */}
      <div className="w-full max-w-xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-700/60 rounded-3xl p-5 sm:p-8 shadow-2xl shadow-indigo-950/40">

        {/* Title */}
        <div className="text-center mb-5 sm:mb-7">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight mb-1">
            我和 <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-pink-400">{displayName}</span> 谈恋爱了！
          </h1>
          {displayName !== symbol && (
            <p className="text-xs text-slate-500 font-mono">{symbol}</p>
          )}
          <p className="text-xs sm:text-sm text-slate-500 mt-1">找只股票谈恋爱 · AlphaMeetsLuck</p>
        </div>

        {/* Stock Data */}
        <div className="flex items-center justify-between bg-slate-800/60 border border-slate-700/50 rounded-2xl px-4 sm:px-6 py-4 mb-4">
          <div>
            <p className="text-2xl sm:text-3xl font-mono font-bold text-white">{report.stockData.price}</p>
            <p className={`text-sm sm:text-base font-mono font-semibold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
              {report.stockData.changePercent}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">P/E {report.stockData.peRatio}</p>
            <p className="text-xs text-slate-500">市值 {report.stockData.marketCap}</p>
          </div>
        </div>

        {/* Decision */}
        <div
          className="text-center font-extrabold text-lg sm:text-2xl rounded-2xl py-3 mb-4 border"
          style={{ color: decision.color, background: decision.bg, borderColor: decision.border }}
        >
          恋爱大师判定：{decision.label}
        </div>

        {/* Thesis */}
        <div className="bg-slate-800/40 border-l-4 border-amber-400/70 rounded-xl px-4 sm:px-5 py-4 mb-4">
          <p className="text-[10px] sm:text-xs font-mono text-amber-400/80 tracking-widest mb-1.5">☯ 恋爱大师一句话点评</p>
          <p className="text-sm sm:text-base italic text-slate-200 leading-relaxed">"{report.mainThesis}"</p>
        </div>

        {/* Compatibility */}
        {hasCompat && (
          <div className="text-center bg-amber-500/10 border border-amber-500/25 rounded-xl px-4 py-3 mb-5">
            <p className="text-sm sm:text-base text-amber-300 font-semibold">
              🔮 命理匹配：{compat!.verdict} · {compat!.overallScore}/100
            </p>
            {compat!.verdictDetail && (
              <p className="text-xs sm:text-sm text-amber-200/80 mt-1 italic">「{compat!.verdictDetail}」</p>
            )}
          </div>
        )}

        {/* QR + CTA */}
        <div className="flex items-center gap-4 bg-slate-950/60 border border-slate-800 rounded-2xl p-4 sm:p-5">
          <div className="flex-1 min-w-0">
            <p className="text-sm sm:text-base font-bold text-white mb-1">扫码查看完整报告</p>
            <p className="text-[11px] sm:text-xs text-slate-500 leading-relaxed">
              包含基本面 / 动能 / 情绪三维分析<br />以及命理八字匹配详情
            </p>
          </div>
          <div className="bg-white rounded-lg p-1.5 flex-shrink-0" style={{ width: 104, height: 104 }}>
            {qrDataURL ? (
              <img src={qrDataURL} alt="QR Code" className="w-full h-full block" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-500">生成中...</div>
            )}
          </div>
        </div>

        <p className="text-center text-[10px] text-slate-600 mt-4">* 纯属娱乐，不构成投资建议</p>
      </div>

      {/* Action Buttons */}
      <div className="w-full max-w-xl mt-5 sm:mt-6 flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleShare}
          className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 bg-gradient-to-r from-indigo-500 to-pink-500 hover:from-indigo-400 hover:to-pink-400 text-white font-bold rounded-xl transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-indigo-900/30"
        >
          {copied ? (
            <><Check className="w-5 h-5" /> 链接已复制</>
          ) : (
            <><Share2 className="w-5 h-5" /> 分享给好友</>
          )}
        </button>
        <button
          onClick={handleCTA}
          className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl transition-all border border-slate-700"
        >
          <Heart className="w-4 h-4" />
          我也要谈恋爱
        </button>
      </div>

      <p className="text-[10px] text-slate-700 mt-6">alphameetsluck.com</p>
    </div>
  );
};

export default SharePageView;
