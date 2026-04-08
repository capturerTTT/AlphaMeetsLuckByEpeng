import React from 'react';
import { InvestmentReport, DecisionType } from '../types';
import { X, Clock, TrendingUp, TrendingDown, MinusCircle, ChevronRight } from 'lucide-react';

interface HistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  history: InvestmentReport[];
  onSelect: (report: InvestmentReport) => void;
}

const HistorySidebar: React.FC<HistorySidebarProps> = ({ isOpen, onClose, history, onSelect }) => {
  return (
    <>
      {/* Overlay */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Sidebar Panel */}
      <div className={`fixed top-0 right-0 h-full w-80 md:w-96 bg-slate-900 border-l border-slate-700 shadow-2xl transform transition-transform duration-300 ease-out z-50 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div className="flex items-center gap-2 text-white font-bold text-lg">
            <Clock className="w-5 h-5 text-gemini-accent" />
            <span>Search History</span>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto h-[calc(100vh-80px)] p-4 space-y-3">
          {history.length === 0 ? (
            <div className="text-center text-slate-500 py-10">
              <p className="text-sm">No recent analysis found.</p>
            </div>
          ) : (
            history.map((item, index) => {
              // Determine icon and color based on decision
              let Icon = MinusCircle;
              let colorClass = 'text-yellow-400';
              let borderClass = 'border-yellow-500/30 hover:bg-yellow-900/10';

              if (item.decision === DecisionType.AGGRESSIVE) {
                Icon = TrendingUp;
                colorClass = 'text-green-400';
                borderClass = 'border-green-500/30 hover:bg-green-900/10';
              } else if (item.decision === DecisionType.DEFENSIVE) {
                Icon = TrendingDown;
                colorClass = 'text-red-400';
                borderClass = 'border-red-500/30 hover:bg-red-900/10';
              }

              return (
                <button
                  key={`${item.stockData.symbol}-${index}`}
                  onClick={() => onSelect(item)}
                  className={`w-full text-left p-4 rounded-xl border bg-slate-800/50 transition-all group relative overflow-hidden ${borderClass}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-bold text-slate-200 text-lg">{item.stockData.symbol}</h4>
                      <p className="text-xs text-slate-500 font-mono">{item.stockData.lastUpdated}</p>
                    </div>
                    <Icon className={`w-5 h-5 ${colorClass}`} />
                  </div>
                  
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-2xl font-mono font-bold text-white">{item.stockData.price}</span>
                    <span className={`text-sm font-mono ${item.stockData.changePercent.includes('-') ? 'text-red-400' : 'text-green-400'}`}>
                      {item.stockData.changePercent}
                    </span>
                  </div>

                  <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronRight className="w-6 h-6 text-slate-400" />
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </>
  );
};

export default HistorySidebar;
