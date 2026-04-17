import React from 'react';
import { FullReport } from '../services/apiService';
import { DecisionType } from '../types';

interface ShareCardProps {
  report: FullReport;
  qrDataURL: string;
  stockName: string; // user's original search query (readable name)
}

/**
 * A fixed-size card designed to be captured as a share image.
 * Rendered off-screen, then html2canvas captures it.
 */
const ShareCard: React.FC<ShareCardProps> = ({ report, qrDataURL, stockName }) => {
  const symbol = report.stockData.symbol;
  // Prefer AI-returned company name, fall back to user's search query
  const displayName = report.stockData.name || stockName || symbol;
  const decision = report.decision;

  const decisionLabel =
    decision === DecisionType.AGGRESSIVE ? '强力追求 💚' :
    decision === DecisionType.DEFENSIVE  ? '快逃吧 🚨' :
                                           '认识就好 🤔';

  const decisionColor =
    decision === DecisionType.AGGRESSIVE ? '#4ade80' :
    decision === DecisionType.DEFENSIVE  ? '#f87171' :
                                           '#fbbf24';

  const isPositive = report.stockData.changePercent.startsWith('+') || !report.stockData.changePercent.startsWith('-');

  // Compatibility verdict if available
  const compat = report.compatibility;
  const verdictLine = compat?.verdict ? `${compat.verdict} · 匹配度 ${compat.overallScore ?? '?'}/100` : '';

  return (
    <div
      id="share-card"
      style={{
        width: 600,
        padding: 40,
        background: 'linear-gradient(180deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        color: '#e2e8f0',
        position: 'fixed',
        left: -9999,
        top: 0,
        zIndex: -1,
      }}
    >
      {/* Top Branding */}
      <div style={{ textAlign: 'center', marginBottom: 8, fontSize: 12, color: '#94a3b8', letterSpacing: 3, fontFamily: 'monospace' }}>
        ALPHAMEETSLUCK.COM
      </div>

      {/* Main Title */}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: 32, fontWeight: 800, color: '#ffffff', marginBottom: 4 }}>
          我和 <span style={{ color: '#818cf8' }}>{displayName}</span> 谈恋爱了！
        </div>
        {displayName !== symbol && (
          <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 0 }}>{symbol}</div>
        )}
        <div style={{ fontSize: 14, color: '#64748b' }}>
          找只股票谈恋爱 · AlphaMeetsLuck
        </div>
      </div>

      {/* Stock Data Row */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'rgba(30,41,59,0.8)', borderRadius: 12, padding: '16px 24px',
        marginBottom: 16, border: '1px solid rgba(100,116,139,0.3)',
      }}>
        <div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#fff', fontFamily: 'monospace' }}>{report.stockData.price}</div>
          <div style={{ fontSize: 14, color: isPositive ? '#4ade80' : '#f87171', fontFamily: 'monospace', fontWeight: 600 }}>
            {report.stockData.changePercent}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>P/E {report.stockData.peRatio}</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>市值 {report.stockData.marketCap}</div>
        </div>
      </div>

      {/* Decision Badge */}
      <div style={{
        textAlign: 'center', fontSize: 22, fontWeight: 800, color: decisionColor,
        padding: '12px 0', marginBottom: 16,
        background: `rgba(${decision === DecisionType.AGGRESSIVE ? '74,222,128' : decision === DecisionType.DEFENSIVE ? '248,113,113' : '251,191,36'},0.1)`,
        borderRadius: 12, border: `1px solid ${decisionColor}33`,
      }}>
        恋爱大师判定：{decisionLabel}
      </div>

      {/* Thesis */}
      <div style={{
        background: 'rgba(30,41,59,0.6)', borderRadius: 12, padding: '16px 20px',
        marginBottom: 16, borderLeft: '3px solid #d4a574',
      }}>
        <div style={{ fontSize: 10, color: '#d4a574', letterSpacing: 2, fontFamily: 'monospace', marginBottom: 6 }}>
          ☯ 恋爱大师一句话点评
        </div>
        <div style={{ fontSize: 15, color: '#cbd5e1', lineHeight: 1.6, fontStyle: 'italic' }}>
          "{report.mainThesis}"
        </div>
      </div>

      {/* Compatibility Verdict (if available) */}
      {verdictLine && (
        <div style={{
          textAlign: 'center', fontSize: 14, color: '#fbbf24', marginBottom: 16,
          padding: '10px 0', background: 'rgba(251,191,36,0.08)', borderRadius: 8,
          border: '1px solid rgba(251,191,36,0.2)',
        }}>
          🔮 命理匹配：{verdictLine}
        </div>
      )}

      {/* Bottom: QR + CTA */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(15,23,42,0.9)', borderRadius: 12, padding: '16px 20px',
        border: '1px solid rgba(100,116,139,0.2)',
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
            扫码查看完整报告
          </div>
          <div style={{ fontSize: 12, color: '#64748b' }}>
            包含基本面、动能、情绪三维分析
          </div>
          <div style={{ fontSize: 12, color: '#64748b' }}>
            以及命理八字匹配详情
          </div>
        </div>
        <div style={{
          width: 100, height: 100, borderRadius: 8, overflow: 'hidden',
          border: '2px solid rgba(129,140,248,0.3)', flexShrink: 0,
          background: '#ffffff',
        }}>
          <img
            src={qrDataURL}
            alt="QR Code"
            style={{ width: '100%', height: '100%', display: 'block' }}
            crossOrigin="anonymous"
          />
        </div>
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', marginTop: 16, fontSize: 10, color: '#475569' }}>
        * 纯属娱乐，不构成投资建议 · alphameetsluck.com
      </div>
    </div>
  );
};

export default ShareCard;
