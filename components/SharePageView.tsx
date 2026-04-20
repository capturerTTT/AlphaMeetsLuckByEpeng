import React, { useEffect, useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { FullReport } from '../services/apiService';
import { DecisionType } from '../types';
import { generateQRDataURL } from '../utils/shareUtils';
import { Download, Copy, Check, X, Loader2, Heart, Flame, AlertTriangle } from 'lucide-react';

interface SharePageViewProps {
  report: FullReport;
  onClose: () => void;
}

// Decision → 标题文案 + 视觉系
const DECISION_THEME: Record<DecisionType, {
  bigTitle: (name: string) => string;
  subTitle: string;
  badge: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
  border: string;
  gradient: string;
  emoji: string;
}> = {
  [DecisionType.AGGRESSIVE]: {
    bigTitle: (name) => `我和 ${name} 谈恋爱了！`,
    subTitle: 'Ta 就是我的真命天股 💘',
    badge: '强力追求 💚',
    icon: <Heart className="w-6 h-6" />,
    color: '#4ade80',
    bg: 'rgba(74,222,128,0.12)',
    border: 'rgba(74,222,128,0.45)',
    gradient: 'from-emerald-400 via-green-300 to-lime-300',
    emoji: '💕',
  },
  [DecisionType.DEFENSIVE]: {
    bigTitle: (name) => `${name} 就是个渣，我不可能和 Ta 在一起！`,
    subTitle: '提醒亲友，速速远离 🚫',
    badge: '快逃吧 🚨',
    icon: <AlertTriangle className="w-6 h-6" />,
    color: '#f87171',
    bg: 'rgba(248,113,113,0.12)',
    border: 'rgba(248,113,113,0.45)',
    gradient: 'from-rose-400 via-red-300 to-orange-300',
    emoji: '🚫',
  },
  [DecisionType.NEUTRAL]: {
    bigTitle: (name) => `我和 ${name}？普通朋友而已`,
    subTitle: '保持距离观察，不深交 🤝',
    badge: '认识就好 🤔',
    icon: <Flame className="w-6 h-6" />,
    color: '#fbbf24',
    bg: 'rgba(251,191,36,0.12)',
    border: 'rgba(251,191,36,0.45)',
    gradient: 'from-amber-300 via-yellow-300 to-orange-300',
    emoji: '🤔',
  },
};

const SCORE_COLOR = (score: number): string => {
  if (score >= 75) return '#4ade80';
  if (score >= 50) return '#fbbf24';
  return '#f87171';
};

const HOMEPAGE_URL = 'https://www.alphameetsluck.com/';

const SharePageView: React.FC<SharePageViewProps> = ({ report, onClose }) => {
  const captureRef = useRef<HTMLDivElement>(null);
  const [qrDataURL, setQrDataURL] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const symbol = report.stockData.symbol;
  const displayName = report.stockData.name || symbol;
  const theme = DECISION_THEME[report.decision];
  const isPositive =
    report.stockData.changePercent.startsWith('+') ||
    !report.stockData.changePercent.startsWith('-');

  const compat = report.compatibility;
  const hasCompat = !!(compat && compat.stockElement);

  // QR encodes ONLY the homepage — never overflows, always scannable
  useEffect(() => {
    generateQRDataURL(HOMEPAGE_URL, 220)
      .then(setQrDataURL)
      .catch(e => console.warn('QR generation failed', e));
  }, []);

  // Lock body scroll while modal open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  const captureCard = async (): Promise<Blob | null> => {
    if (!captureRef.current) return null;
    const dataUrl = await toPng(captureRef.current, {
      cacheBust: true,
      pixelRatio: 2,
      backgroundColor: '#0f172a',
    });
    const res = await fetch(dataUrl);
    return await res.blob();
  };

  const handleSaveImage = async () => {
    setErrorMsg('');
    setSaving(true);
    try {
      const blob = await captureCard();
      if (!blob) throw new Error('Capture failed');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const safeName = displayName.replace(/[\/\\:*?"<>|]/g, '_');
      a.download = `AlphaMeetsLuck_${safeName}_${symbol}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e: any) {
      console.error('Save image failed', e);
      setErrorMsg('图片保存失败，请截屏分享 📸');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyImage = async () => {
    setErrorMsg('');
    setSaving(true);
    try {
      const blob = await captureCard();
      if (!blob) throw new Error('Capture failed');
      // ClipboardItem may not exist on older Safari
      if (typeof (window as any).ClipboardItem === 'undefined' || !navigator.clipboard?.write) {
        setErrorMsg('当前浏览器不支持复制图片，请改用"下载图片"');
        return;
      }
      await navigator.clipboard.write([
        new (window as any).ClipboardItem({ 'image/png': blob }),
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e: any) {
      console.error('Copy image failed', e);
      setErrorMsg('图片复制失败，请改用"下载图片"');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      {/* Top control bar */}
      <div className="sticky top-0 z-10 bg-slate-950/85 backdrop-blur border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="text-xs sm:text-sm text-slate-400">📸 长按图片可保存 · 或点下方按钮</div>
        <button
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          className="p-2 hover:bg-slate-800 rounded-lg text-slate-300"
          aria-label="关闭"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Capture target */}
      <div
        className="flex flex-col items-center px-3 sm:px-6 py-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          ref={captureRef}
          className="w-full max-w-[440px] bg-gradient-to-b from-slate-950 via-indigo-950/40 to-slate-950 text-slate-100 font-sans"
          style={{ padding: '28px 24px 24px' }}
        >
          {/* Brand */}
          <div className="text-center mb-3">
            <p className="text-[10px] font-mono text-slate-500 tracking-[0.35em]">ALPHAMEETSLUCK.COM</p>
            <p className="text-[10px] text-slate-600 mt-0.5">找只股票谈恋爱 · 命理 × 阿尔法</p>
          </div>

          {/* Eye-catching title */}
          <div className="text-center my-5">
            <div className="text-5xl mb-2">{theme.emoji}</div>
            <h1
              className={`text-[26px] leading-tight font-extrabold text-transparent bg-clip-text bg-gradient-to-r ${theme.gradient} mb-1.5`}
              style={{ wordBreak: 'break-word' }}
            >
              {theme.bigTitle(displayName)}
            </h1>
            <p className="text-sm text-slate-400">{theme.subTitle}</p>
            {displayName !== symbol && (
              <p className="text-[11px] text-slate-600 font-mono mt-1">{symbol}</p>
            )}
          </div>

          {/* Stock data */}
          <div className="bg-slate-800/70 border border-slate-700 rounded-2xl px-5 py-4 mb-4">
            <div className="flex items-end justify-between mb-2">
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">现价</p>
                <p className="text-3xl font-mono font-bold text-white leading-none">{report.stockData.price}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">涨跌</p>
                <p className={`text-2xl font-mono font-bold leading-none ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {report.stockData.changePercent}
                </p>
              </div>
            </div>
            <div className="flex justify-between text-xs text-slate-500 pt-2 border-t border-slate-700/60">
              <span>P/E <span className="text-slate-300 font-mono">{report.stockData.peRatio || '-'}</span></span>
              <span>市值 <span className="text-slate-300 font-mono">{report.stockData.marketCap || '-'}</span></span>
            </div>
          </div>

          {/* Decision badge */}
          <div
            className="flex items-center justify-center gap-2 font-extrabold text-xl rounded-2xl py-3 mb-4 border-2"
            style={{ color: theme.color, background: theme.bg, borderColor: theme.border }}
          >
            {theme.icon}
            <span>恋爱大师判定：{theme.badge}</span>
          </div>

          {/* Main thesis — 毒舌评论 full text */}
          <div className="bg-slate-800/50 border-l-4 border-amber-400 rounded-xl px-4 py-3.5 mb-4">
            <p className="text-[10px] font-mono text-amber-400 tracking-widest mb-1.5">☯ 大师一句话点评</p>
            <p className="text-[15px] italic text-slate-100 leading-relaxed">"{report.mainThesis}"</p>
          </div>

          {/* 3D Matrix */}
          <div className="space-y-2.5 mb-4">
            <p className="text-[10px] font-mono text-slate-500 tracking-widest text-center">— 三维深度透视 —</p>
            {[
              { label: '基本面', d: report.fundamental, emoji: '💎' },
              { label: '动能',   d: report.momentum,    emoji: '⚡️' },
              { label: '情绪',   d: report.sentiment,   emoji: '🌊' },
            ].map(({ label, d, emoji }) => (
              <div key={label} className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5 text-sm font-bold text-slate-200">
                    <span>{emoji}</span>
                    <span>{label} · {d.title}</span>
                  </div>
                  <div
                    className="text-sm font-mono font-bold px-2 py-0.5 rounded-md"
                    style={{ color: SCORE_COLOR(d.score), background: `${SCORE_COLOR(d.score)}20` }}
                  >
                    {d.score}
                  </div>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed mb-1.5">{d.summary}</p>
                {d.keyPoints && d.keyPoints.length > 0 && (
                  <ul className="space-y-0.5">
                    {d.keyPoints.slice(0, 3).map((p, i) => (
                      <li key={i} className="text-[11px] text-slate-400 leading-snug pl-2 border-l border-slate-700">
                        {p}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>

          {/* Compatibility — only if available */}
          {hasCompat && compat && (
            <div className="bg-gradient-to-br from-amber-950/40 to-purple-950/40 border border-amber-500/30 rounded-xl p-3.5 mb-4">
              <p className="text-[10px] font-mono text-amber-300 tracking-widest mb-2 text-center">🔮 命 理 八 字 匹 配 度 🔮</p>

              <div className="text-center mb-2.5">
                <p className="text-amber-200 font-bold text-lg">{compat.verdict} · {compat.overallScore}/100</p>
                {compat.verdictDetail && (
                  <p className="text-xs text-amber-100/80 italic mt-0.5">「{compat.verdictDetail}」</p>
                )}
                {compat.stockElement && (
                  <p className="text-[11px] text-amber-300/70 mt-1">
                    Ta 属 <span className="font-bold">{compat.stockElement}</span>
                    {compat.stockElementReason && <span className="text-amber-200/50"> · {compat.stockElementReason}</span>}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { k: '本月', tf: compat.monthly },
                  { k: '本年', tf: compat.yearly },
                  { k: '长期', tf: compat.longTerm },
                ].filter(x => x.tf).map(({ k, tf }) => (
                  <div key={k} className="bg-slate-900/60 rounded-lg p-2 border border-amber-500/15">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-amber-300/80">{k}</span>
                      <span className="text-[11px] font-mono font-bold" style={{ color: SCORE_COLOR(tf!.score) }}>{tf!.score}</span>
                    </div>
                    <p className="text-[10px] text-slate-300 font-bold leading-tight mb-0.5">{tf!.title}</p>
                    <p className="text-[9px] text-slate-400 leading-snug">{tf!.reading}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* QR + CTA footer */}
          <div className="flex items-center gap-3 bg-slate-900/70 border border-slate-700/60 rounded-2xl p-3 mt-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white mb-0.5">扫码也找你的股票宝宝</p>
              <p className="text-[10px] text-slate-500 leading-snug">
                输入八字 + 股票代码<br />解锁专属命理投资报告
              </p>
            </div>
            <div className="bg-white rounded-lg p-1.5 flex-shrink-0" style={{ width: 86, height: 86 }}>
              {qrDataURL ? (
                <img src={qrDataURL} alt="QR" className="w-full h-full block" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[9px] text-slate-400">…</div>
              )}
            </div>
          </div>

          <p className="text-center text-[9px] text-slate-600 mt-2.5">
            * 纯属娱乐，不构成投资建议 · alphameetsluck.com
          </p>
        </div>

        {/* Action buttons */}
        <div className="w-full max-w-[440px] mt-5 flex flex-col gap-2.5">
          <div className="flex gap-2">
            <button
              onClick={handleSaveImage}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-500 to-pink-500 hover:from-indigo-400 hover:to-pink-400 disabled:opacity-60 disabled:cursor-wait text-white font-bold rounded-xl transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-indigo-900/30"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
              <span>{saving ? '生成中…' : '下载图片'}</span>
            </button>
            <button
              onClick={handleCopyImage}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-60 text-slate-100 font-bold rounded-xl transition-all border border-slate-700"
            >
              {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
              <span>{copied ? '已复制' : '复制图片'}</span>
            </button>
          </div>
          {errorMsg && (
            <div className="text-center text-xs text-rose-300 bg-rose-900/30 border border-rose-700/40 rounded-lg px-3 py-2">
              {errorMsg}
            </div>
          )}
          <p className="text-center text-[11px] text-slate-500">
            iOS 用户也可<span className="text-slate-300">长按上方图片</span>直接保存
          </p>
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          className="mt-6 mb-4 px-6 py-2.5 text-sm text-slate-400 hover:text-slate-200 transition-colors"
        >
          关闭返回
        </button>
      </div>
    </div>
  );
};

export default SharePageView;
