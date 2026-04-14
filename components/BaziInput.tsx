import React, { useState } from 'react';
import { BaziInfo, Language } from '../types';
import { Sparkles, ChevronDown, ChevronUp, MapPin, Calendar } from 'lucide-react';

interface BaziInputProps {
  baziInfo: BaziInfo | null;
  onBaziChange: (info: BaziInfo | null) => void;
  language: Language;
}

const currentYear = new Date().getFullYear();
const YEARS  = Array.from({ length: 100 }, (_, i) => currentYear - i);
const MONTHS = Array.from({ length: 12 },  (_, i) => i + 1);
const DAYS   = Array.from({ length: 31 },  (_, i) => i + 1);
const HOURS  = Array.from({ length: 24 },  (_, i) => i);

const HOUR_NAMES_ZH = [
  '子时(23-01)', '子时(23-01)', '丑时(01-03)', '丑时(01-03)',
  '寅时(03-05)', '寅时(03-05)', '卯时(05-07)', '卯时(07-07)',
  '辰时(07-09)', '辰时(07-09)', '巳时(09-11)', '巳时(09-11)',
  '午时(11-13)', '午时(11-13)', '未时(13-15)', '未时(13-15)',
  '申时(15-17)', '申时(15-17)', '酉时(17-19)', '酉时(17-19)',
  '戌时(19-21)', '戌时(19-21)', '亥时(21-23)', '亥时(21-23)',
];

const BaziInput: React.FC<BaziInputProps> = ({ baziInfo, onBaziChange, language }) => {
  const [expanded, setExpanded] = useState(false);
  const [year,     setYear]     = useState(1990);
  const [month,    setMonth]    = useState(6);
  const [day,      setDay]      = useState(15);
  const [hour,     setHour]     = useState<number | undefined>(undefined);
  const [location, setLocation] = useState('');

  const isCN = language === 'zh';

  const handleConfirm = () => {
    onBaziChange({ birthYear: year, birthMonth: month, birthDay: day, birthHour: hour, birthLocation: location || (isCN ? '未知' : 'Unknown') });
  };

  const handleClear = () => {
    onBaziChange(null);
  };

  const selectClass =
    'bg-slate-900 border border-slate-600 text-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-amber-500/60 cursor-pointer';

  return (
    <div className="max-w-2xl mx-auto">
      {/* Toggle Button */}
      <button
        type="button"
        onClick={() => setExpanded(v => !v)}
        className={`w-full flex items-center justify-between gap-3 px-5 py-3 rounded-xl border transition-all text-sm font-medium ${
          baziInfo
            ? 'bg-amber-900/30 border-amber-500/40 text-amber-300'
            : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:border-amber-500/40 hover:text-amber-300'
        }`}
      >
        <span className="flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          {baziInfo
            ? (isCN ? `✨ 已设定八字 — ${baziInfo.birthYear}年${baziInfo.birthMonth}月${baziInfo.birthDay}日 · ${baziInfo.birthLocation}` : `✨ BaZi set — ${baziInfo.birthYear}/${baziInfo.birthMonth}/${baziInfo.birthDay} · ${baziInfo.birthLocation}`)
            : (isCN ? '✨ 输入你的八字，测算与股票的命理缘分' : '✨ Add your birth info to reveal stock destiny match')
          }
        </span>
        {expanded ? <ChevronUp className="w-4 h-4 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 flex-shrink-0" />}
      </button>

      {/* Expanded Form */}
      {expanded && (
        <div className="mt-2 p-5 bg-slate-900/80 border border-amber-500/20 rounded-xl backdrop-blur-sm space-y-5 animate-fade-in">

          {/* Mystical header */}
          <div className="text-center">
            <p className="text-amber-400/70 text-xs font-mono tracking-widest uppercase">
              {isCN ? '☯ 生辰八字测算  ·  金木水火土  ·  命理匹配' : '☯ Four Pillars of Destiny  ·  Five Elements  ·  Fate Match'}
            </p>
          </div>

          {/* Birth Date Row */}
          <div>
            <label className="flex items-center gap-2 text-xs text-slate-400 mb-2 font-mono uppercase">
              <Calendar className="w-3.5 h-3.5" />
              {isCN ? '出生日期' : 'Birth Date'}
            </label>
            <div className="flex gap-2 flex-wrap">
              <select value={year} onChange={e => setYear(+e.target.value)} className={selectClass}>
                {YEARS.map(y => <option key={y} value={y}>{y}{isCN ? '年' : ''}</option>)}
              </select>
              <select value={month} onChange={e => setMonth(+e.target.value)} className={selectClass}>
                {MONTHS.map(m => <option key={m} value={m}>{isCN ? `${m}月` : `Month ${m}`}</option>)}
              </select>
              <select value={day} onChange={e => setDay(+e.target.value)} className={selectClass}>
                {DAYS.map(d => <option key={d} value={d}>{isCN ? `${d}日` : `Day ${d}`}</option>)}
              </select>
            </div>
          </div>

          {/* Birth Hour Row (optional) */}
          <div>
            <label className="flex items-center gap-2 text-xs text-slate-400 mb-2 font-mono uppercase">
              <span className="text-amber-500/60">⏰</span>
              {isCN ? '出生时辰（选填，更精准）' : 'Birth Hour (optional, more accurate)'}
            </label>
            <select
              value={hour ?? ''}
              onChange={e => setHour(e.target.value === '' ? undefined : +e.target.value)}
              className={selectClass}
            >
              <option value="">{isCN ? '不知道（可不填）' : 'Unknown (skip)'}</option>
              {HOURS.map(h => (
                <option key={h} value={h}>
                  {isCN ? `${String(h).padStart(2,'0')}:00 ${HOUR_NAMES_ZH[h]}` : `${String(h).padStart(2,'0')}:00`}
                </option>
              ))}
            </select>
          </div>

          {/* Birth Location Row */}
          <div>
            <label className="flex items-center gap-2 text-xs text-slate-400 mb-2 font-mono uppercase">
              <MapPin className="w-3.5 h-3.5" />
              {isCN ? '出生地点' : 'Birth Location'}
            </label>
            <input
              type="text"
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder={isCN ? '如：北京、上海、广州 …' : 'e.g. Beijing, New York, London …'}
              className="w-full bg-slate-900 border border-slate-600 text-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-amber-500/60 placeholder-slate-600"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={() => { handleConfirm(); setExpanded(false); }}
              className="flex-1 bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium py-2.5 rounded-lg transition-all"
            >
              {isCN ? '✨ 确认，测算缘分' : '✨ Confirm & Read Destiny'}
            </button>
            {baziInfo && (
              <button
                type="button"
                onClick={() => { handleClear(); setExpanded(false); }}
                className="px-4 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm rounded-lg transition-all"
              >
                {isCN ? '清除' : 'Clear'}
              </button>
            )}
          </div>

          <p className="text-center text-xs text-slate-600">
            {isCN
              ? '* 纯属娱乐，不构成任何投资建议。信八字不如信财报。'
              : '* For entertainment only. Trust earnings reports, not star signs.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default BaziInput;
