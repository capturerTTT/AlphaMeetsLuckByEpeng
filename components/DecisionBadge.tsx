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
      label = isEn ? 'AGGRESSIVE' : '激进买入';
      subLabel = isEn ? 'Strong Buy • High Conviction' : '强力买入 • 高确信度';
      break;
    case DecisionType.DEFENSIVE:
      colorClass = 'bg-red-900/50 text-red-400 border-red-500/50';
      icon = <TrendingDown className="w-5 h-5 mr-2" />;
      label = isEn ? 'DEFENSIVE' : '防御减仓';
      subLabel = isEn ? 'Reduce Exposure • High Risk' : '降低仓位 • 风险警示';
      break;
    case DecisionType.NEUTRAL:
    default:
      colorClass = 'bg-yellow-900/50 text-yellow-400 border-yellow-500/50';
      icon = <MinusCircle className="w-5 h-5 mr-2" />;
      label = isEn ? 'NEUTRAL' : '中立观望';
      subLabel = isEn ? 'Watchlist • Wait for Setup' : '加入自选 • 等待时机';
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
