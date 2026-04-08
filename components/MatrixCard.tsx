import React from 'react';
import { DimensionAnalysis, Language } from '../types';
import { CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';
import CopyButton from './CopyButton';

interface MatrixCardProps {
  type: 'Fundamental' | 'Momentum' | 'Sentiment';
  data: DimensionAnalysis;
  language: Language;
}

const MatrixCard: React.FC<MatrixCardProps> = ({ type, data, language }) => {
  
  // Determine color theme based on score
  let scoreColor = 'text-gray-400';
  let progressColor = 'bg-gray-600';
  
  if (data.score >= 70) {
    scoreColor = 'text-green-400';
    progressColor = 'bg-green-500';
  } else if (data.score >= 40) {
    scoreColor = 'text-yellow-400';
    progressColor = 'bg-yellow-500';
  } else {
    scoreColor = 'text-red-400';
    progressColor = 'bg-red-500';
  }

  const getIcon = () => {
    switch(type) {
      case 'Fundamental': return <CheckCircle2 className="w-5 h-5 text-blue-400" />;
      case 'Momentum': return <AlertCircle className="w-5 h-5 text-purple-400" />;
      case 'Sentiment': return <AlertTriangle className="w-5 h-5 text-orange-400" />;
    }
  };

  const getTitle = () => {
    if (language === 'en') return type;
    switch(type) {
      case 'Fundamental': return '基本面强度';
      case 'Momentum': return '市场动能';
      case 'Sentiment': return '博弈与情绪';
    }
  };

  // Construct copyable text
  const copyText = `${getTitle()} (${data.score}/100)\n\n${data.title}\n${data.summary}\n\nKey Points:\n${data.keyPoints?.map(p => `• ${p}`).join('\n')}`;

  return (
    <div className="bg-gemini-card border border-slate-700/50 rounded-xl p-5 hover:border-slate-600 transition-colors h-full flex flex-col relative group">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-2">
          {getIcon()}
          <h3 className="font-bold text-slate-200">{getTitle()}</h3>
        </div>
        <div className={`font-mono font-bold text-xl ${scoreColor}`}>
          {data.score}<span className="text-sm text-slate-500">/100</span>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="w-full bg-slate-800 h-1.5 rounded-full mb-4">
        <div 
          className={`h-1.5 rounded-full ${progressColor} transition-all duration-1000`} 
          style={{ width: `${data.score}%` }}
        ></div>
      </div>

      <div className="mb-4">
        <h4 className="text-sm font-semibold text-slate-300 mb-1">{data.title}</h4>
        <p className="text-sm text-slate-400 leading-relaxed">{data.summary}</p>
      </div>

      <div className="mt-auto pt-4 border-t border-slate-700/50 pb-2">
        <ul className="space-y-2">
          {(data.keyPoints || []).map((point, idx) => (
            <li key={idx} className="flex items-start text-xs text-slate-300">
              <span className="mr-2 text-slate-500">•</span>
              {point}
            </li>
          ))}
          {(!data.keyPoints || data.keyPoints.length === 0) && (
             <li className="text-xs text-slate-500 italic">
                {language === 'en' ? 'No key points available' : '暂无关键点'}
             </li>
          )}
        </ul>
      </div>

      <CopyButton text={copyText} />
    </div>
  );
};

export default MatrixCard;