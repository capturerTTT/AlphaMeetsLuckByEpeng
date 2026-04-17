import { FullReport } from '../services/apiService';
import { DecisionType } from '../types';

// ─── URL-safe base64 ─────────────────────────────────────────────────────────
function toUrlSafeB64(str: string): string {
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function fromUrlSafeB64(b64: string): string {
  let s = b64.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  return decodeURIComponent(escape(atob(s)));
}

// ─── Truncate helper ─────────────────────────────────────────────────────────
function trunc(s: string | undefined, max: number): string {
  if (!s) return '';
  return s.length > max ? s.slice(0, max) + '…' : s;
}

/**
 * Encode a report into a COMPACT URL-safe string.
 * We use ultra-short keys and truncate text to keep the QR scannable.
 * Target: under 1200 characters total URL length.
 */
export function encodeShareData(report: FullReport): string {
  // Decision as single char
  const d = report.decision === DecisionType.AGGRESSIVE ? 'A' : report.decision === DecisionType.DEFENSIVE ? 'D' : 'N';

  const slim: any = {
    // Stock data — keep essential fields only
    y: report.stockData.symbol,
    p: report.stockData.price,
    c: report.stockData.changePercent,
    r: report.stockData.peRatio || '',
    k: report.stockData.marketCap || '',
    u: trunc(report.stockData.lastUpdated, 20),
    // Decision + thesis
    d,
    h: trunc(report.mainThesis, 80),
    // 3 dimensions — score + short title only (no summary/keyPoints to save space)
    f: [report.fundamental.score, trunc(report.fundamental.title, 20)],
    m: [report.momentum.score, trunc(report.momentum.title, 20)],
    s: [report.sentiment.score, trunc(report.sentiment.title, 20)],
  };

  // Compatibility — only include verdict + score + elements (skip timeframes)
  if (report.compatibility?.stockElement) {
    const cp = report.compatibility;
    slim.x = {
      e: cp.stockElement,
      n: cp.stockElementEn || '',
      v: trunc(cp.verdict, 10),
      o: cp.overallScore ?? 0,
      t: trunc(cp.verdictDetail, 40),
      // Pillars as compact string
      l: cp.pillars ? `${cp.pillars.yearPillar}|${cp.pillars.monthPillar}|${cp.pillars.dayPillar}|${cp.pillars.hourPillar}` : '',
    };
  }

  return toUrlSafeB64(JSON.stringify(slim));
}

/**
 * Decode compact share data back to a FullReport (with some fields stubbed).
 */
export function decodeShareData(encoded: string): FullReport | null {
  try {
    const slim = JSON.parse(fromUrlSafeB64(encoded));

    const decision =
      slim.d === 'A' ? DecisionType.AGGRESSIVE :
      slim.d === 'D' ? DecisionType.DEFENSIVE :
                        DecisionType.NEUTRAL;

    const report: FullReport = {
      stockData: {
        symbol: slim.y || '?',
        price: slim.p || '?',
        changePercent: slim.c || '?',
        peRatio: slim.r || '-',
        marketCap: slim.k || '-',
        lastUpdated: slim.u || '',
      },
      fundamental: { title: slim.f?.[1] || '', score: slim.f?.[0] ?? 0, summary: '', keyPoints: [] },
      momentum:    { title: slim.m?.[1] || '', score: slim.m?.[0] ?? 0, summary: '', keyPoints: [] },
      sentiment:   { title: slim.s?.[1] || '', score: slim.s?.[0] ?? 0, summary: '', keyPoints: [] },
      decision,
      mainThesis: slim.h || '',
      sources: [],
      compatibility: null,
    };

    if (slim.x) {
      const pillarsArr = (slim.x.l || '').split('|');
      report.compatibility = {
        stockElement: slim.x.e || '',
        stockElementEn: slim.x.n || '',
        stockElementReason: '',
        pillars: pillarsArr.length === 4 ? {
          yearPillar: pillarsArr[0], monthPillar: pillarsArr[1],
          dayPillar: pillarsArr[2], hourPillar: pillarsArr[3], yearElement: '',
        } : undefined as any,
        userDominantElement: '',
        luckyElements: [],
        monthly: { score: 0, title: '', reading: '' },
        yearly: { score: 0, title: '', reading: '' },
        longTerm: { score: 0, title: '', reading: '' },
        overallScore: slim.x.o ?? 0,
        verdict: slim.x.v || '',
        verdictDetail: slim.x.t || '',
      };
    }

    return report;
  } catch (e) {
    console.error('[shareUtils] Decode failed:', e);
    return null;
  }
}

/**
 * Build the share URL. Target: under ~800 chars for reliable QR scanning.
 */
export function buildShareURL(report: FullReport): string {
  const data = encodeShareData(report);
  return `${window.location.origin}/#s=${data}`;
}

/**
 * Check if the current URL is a share link.
 */
export function getShareDataFromURL(): FullReport | null {
  const hash = window.location.hash;
  // Support both #s= (new compact) and #share= (legacy)
  if (hash.startsWith('#s=')) return decodeShareData(hash.slice(3));
  if (hash.startsWith('#share=')) return decodeShareData(hash.slice(7));
  return null;
}

/**
 * Generate a QR code as a data URL.
 * Uses qrserver.com API with fallback to a canvas placeholder.
 */
export async function generateQRDataURL(url: string, size = 200): Promise<string> {
  try {
    // Use a reliable public QR API
    const apiUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(url)}&size=${size}x${size}&bgcolor=0f172a&color=ffffff&format=png&ecc=L`;
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error(`QR API ${response.status}`);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.warn('[QR] API failed, using fallback:', e);
    // Fallback: simple canvas with text
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${size / 8}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('扫码查看', size / 2, size / 2 - 8);
    ctx.fillText('完整报告', size / 2, size / 2 + size / 8 + 4);
    return canvas.toDataURL('image/png');
  }
}
