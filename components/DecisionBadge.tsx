import React from 'react';
import { DecisionType, Language } from '../types';
import { TrendingUp, TrendingDown, MinusCircle } from 'lucide-react';

interface DecisionBadgeProps {
  decision: DecisionType;
  language: Language;
}

const DecisionBadge: React.FC<DecisionBadgeProps> = ({ decision, language }) => {
  let colorClass = '';
  let icon = null;
  let label = '';
  let subLabel = '';

  const isEn = language === 'en';

  switch (decision) {
    case DecisionType.AGGRESSIVE:
      colorClass = 'bg-green-900/50 text-green-400 border-green-500/50';
      icon = <TrendingUp className="w-5 h-5 mr-2" />;
      label = isEn ? 'PURSUE' : '强力追求';
      subLabel = isEn ? 'Soul Mate • Go All In' : '命中注定 • 大胆表白';
      break;
    case DecisionType.DEFENSIVE:
      colorClass = 'bg-red-900/50 text-red-400 border-red-500/50';
      icon = <TrendingDown className="w-5 h-5 mr-2" />;
      label = isEn ? 'RUN AWAY' : '逃吧，不是你的宝贝';
      subLabel = isEn ? 'Not Your Type • Escape Now' : '有缘无分 • 趁早止损';
      break;
    case DecisionType.NEUTRAL:
    default:
      colorClass = 'bg-yellow-900/50 text-yellow-400 border-yellow-500/50';
      icon = <MinusCircle className="w-5 h-5 mr-2" />;
      label = isEn ? 'JUST FRIENDS' : '认识就好';
      subLabel = isEn ? 'Keep in Touch • No Rush' : '先加微信 • 慢慢了解';
      break;
  }

  return (
    <div className={`flex flex-col items-center justify-center p-4 border rounded-xl backdrop-blur-sm ${colorClass} transition-all duration-500`}>
      <div className="flex items-center text-lg font-bold tracking-wider mb-1">
        {icon}
        {label}
      </div>
      <span className="text-xs opacity-80 font-mono uppercase tracking-widest">{subLabel}</span>
    </div>
  );
};

export default DecisionBadge;
