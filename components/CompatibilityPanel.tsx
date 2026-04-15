import React from 'react';
import { FortuneReading, Language } from '../types';

interface CompatibilityPanelProps {
  reading: FortuneReading;
  language: Language;
}

const ELEMENT_COLORS: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  金: { bg: 'bg-yellow-900/30', border: 'border-yellow-500/40', text: 'text-yellow-300', glow: 'shadow-yellow-900/30' },
  木: { bg: 'bg-green-900/30',  border: 'border-green-500/40',  text: 'text-green-300',  glow: 'shadow-green-900/30'  },
  水: { bg: 'bg-blue-900/30',   border: 'border-blue-500/40',   text: 'text-blue-300',   glow: 'shadow-blue-900/30'   },
  火: { bg: 'bg-red-900/30',    border: 'border-red-500/40',    text: 'text-red-300',    glow: 'shadow-red-900/30'    },
  土: { bg: 'bg-orange-900/30', border: 'border-orange-500/40', text: 'text-orange-300', glow: 'shadow-orange-900/30' },
};

const SCORE_COLOR = (s: number) =>
  s >= 75 ? 'text-green-400'  :
  s >= 55 ? 'text-amber-400'  :
  s >= 35 ? 'text-orange-400' :
            'text-red-400';

const SCORE_RING = (s: number) =>
  s >= 75 ? '#4ade80' :  // green-400
  s >= 55 ? '#fbbf24' :  // amber-400
  s >= 35 ? '#fb923c' :  // orange-400
            '#f87171';   // red-400

const VERDICT_STYLE: Record<string, string> = {
  '命中注定': 'text-green-300 border-green-500/40 bg-green-900/20',
  '天作之合': 'text-green-300 border-green-500/40 bg-green-900/20',
  '有缘无分': 'text-amber-300 border-amber-500/40 bg-amber-900/20',
  '且行且珍惜': 'text-amber-300 border-amber-500/40 bg-amber-900/20',
  '凶多吉少': 'text-red-300   border-red-500/40   bg-red-900/20',
  '缘分尽了': 'text-red-300   border-red-500/40   bg-red-900/20',
  'Destined': 'text-green-300 border-green-500/40 bg-green-900/20',
  'Promising': 'text-amber-300 border-amber-500/40 bg-amber-900/20',
  'Risky': 'text-red-300   border-red-500/40   bg-red-900/20',
};

function ScoreCircle({ score, size = 64 }: { score: number; size?: number }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = SCORE_RING(score);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="absolute -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#1e293b" strokeWidth="4" />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
      </svg>
      <span className={`font-mono font-bold text-sm ${SCORE_COLOR(score)}`}>{score}</span>
    </div>
  );
}

function PillarBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[10px] text-slate-500 font-mono">{label}</span>
      <div className="bg-slate-800 border border-amber-500/20 rounded-lg px-3 py-2 text-center">
        <span className="text-amber-300 font-bold text-lg tracking-widest">{value}</span>
      </div>
    </div>
  );
}

function TimeframeCard({ title, timeframe, language }: { title: string; timeframe: { score: number; title: string; reading: string }; language: Language }) {
  return (
    <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">{title}</span>
        <ScoreCircle score={timeframe.score} size={52} />
      </div>
      <div>
        <h4 className={`font-bold text-sm mb-1 ${SCORE_COLOR(timeframe.score)}`}>{timeframe.title}</h4>
        <p className="text-xs text-slate-400 leading-relaxed">{timeframe.reading}</p>
      </div>
    </div>
  );
}

const CompatibilityPanel: React.FC<CompatibilityPanelProps> = ({ reading, language }) => {
  const isCN = language === 'zh';

  // Defensive: if critical data is missing, don't render at all
  if (!reading || !reading.stockElement) return null;

  const elemColors = ELEMENT_COLORS[reading.stockElement] ?? ELEMENT_COLORS['土'];
  const verdictStyle = VERDICT_STYLE[reading.verdict] ?? 'text-slate-300 border-slate-600 bg-slate-800/40';

  // Provide safe defaults for pillars in case they're missing
  const pillars = reading.pillars ?? { yearPillar: '?', monthPillar: '?', dayPillar: '?', hourPillar: '?', yearElement: '?' };
  const monthly  = reading.monthly  ?? { score: 0, title: '-', reading: '-' };
  const yearly   = reading.yearly   ?? { score: 0, title: '-', reading: '-' };
  const longTerm = reading.longTerm ?? { score: 0, title: '-', reading: '-' };

  const overallLabel = isCN ? '总体匹配' : 'Overall Match';
  const pillarsLabel = isCN ? '你的四柱命盘' : 'Your Four Pillars';
  const stockElemLabel = isCN ? '股票五行属性' : 'Stock Element';
  const userElemLabel = isCN ? '你的用神' : 'Your Lucky Element';
  const monthLabel = isCN ? '当月运势' : 'This Month';
  const yearLabel  = isCN ? '当年运势' : 'This Year';
  const longLabel  = isCN ? '长期缘分' : 'Long-Term';

  return (
    <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-amber-500/20 rounded-2xl p-6 md:p-8 space-y-7 shadow-2xl shadow-amber-900/10">

      {/* Header */}
      <div className="text-center space-y-1">
        <p className="text-xs font-mono text-amber-500/60 tracking-widest uppercase">☯ 命理股票缘分测算</p>
        <h3 className="text-xl font-bold text-amber-300">
          {isCN ? '八字 × 股票 匹配报告' : 'BaZi × Stock Destiny Report'}
        </h3>
      </div>

      {/* Four Pillars */}
      <div>
        <p className="text-xs text-slate-500 font-mono mb-3">{pillarsLabel}</p>
        <div className="flex flex-wrap gap-4 justify-center md:justify-start">
          <PillarBox label={isCN ? '年柱' : 'Year'} value={pillars.yearPillar} />
          <PillarBox label={isCN ? '月柱' : 'Month'} value={pillars.monthPillar} />
          <PillarBox label={isCN ? '日柱' : 'Day'}   value={pillars.dayPillar} />
          <PillarBox label={isCN ? '时柱' : 'Hour'}  value={pillars.hourPillar} />
        </div>
      </div>

      {/* Elements Row */}
      <div className="flex flex-wrap gap-4">
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${elemColors.bg} ${elemColors.border}`}>
          <span className="text-2xl">
            {reading.stockElement === '金' ? '🪙' : reading.stockElement === '木' ? '🌿' :
             reading.stockElement === '水' ? '💧' : reading.stockElement === '火' ? '🔥' : '🌍'}
          </span>
          <div>
            <p className="text-xs text-slate-500 font-mono">{stockElemLabel}</p>
            <p className={`font-bold text-sm ${elemColors.text}`}>
              {reading.stockElement}（{reading.stockElementEn}）
            </p>
            <p className="text-xs text-slate-500 max-w-[200px]">{reading.stockElementReason}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border bg-purple-900/20 border-purple-500/30">
          <span className="text-2xl">🔮</span>
          <div>
            <p className="text-xs text-slate-500 font-mono">{userElemLabel}</p>
            <p className="font-bold text-sm text-purple-300">
              {reading.userDominantElement}
            </p>
            <p className="text-xs text-slate-500">{isCN ? `喜神：${(reading.luckyElements ?? []).join('、')}` : `Lucky: ${(reading.luckyElements ?? []).join(', ')}`}</p>
          </div>
        </div>
      </div>

      {/* Three Timeframes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <TimeframeCard title={monthLabel} timeframe={monthly}  language={language} />
        <TimeframeCard title={yearLabel}  timeframe={yearly}   language={language} />
        <TimeframeCard title={longLabel}  timeframe={longTerm} language={language} />
      </div>

      {/* Overall Verdict */}
      <div className={`rounded-xl border p-5 flex flex-col md:flex-row md:items-center gap-5 ${verdictStyle}`}>
        <div className="flex items-center gap-4">
          <ScoreCircle score={reading.overallScore ?? 0} size={72} />
          <div>
            <p className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-1">{overallLabel}</p>
            <p className="text-xl font-bold">{reading.verdict ?? '-'}</p>
          </div>
        </div>
        <div className="md:border-l md:border-slate-700 md:pl-5">
          <p className="text-sm leading-relaxed text-slate-300 italic">「{reading.verdictDetail ?? ''}」</p>
        </div>
      </div>

      <p className="text-center text-xs text-slate-700">
        {isCN ? '* 本报告仅供娱乐，不构成投资建议。亏了别找大师算。' : '* Entertainment only. Not financial advice. Losses not covered by destiny.'}
      </p>
    </div>
  );
};

export default CompatibilityPanel;
