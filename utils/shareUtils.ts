import qrcode from 'qrcode-generator';
import { FullReport } from '../services/apiService';
import { DecisionType } from '../types';

// ─── URL-safe base64 ─────────────────────────────────────────────────────────
function toUrlSafeB64(str: string): string {
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function fromUrlSafeB64(b64: string): string {
  let s = b64.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  return decodeURIComponent(escape(atob(s)));
}

function trunc(s: string | undefined, max: number): string {
  if (!s) return '';
  return s.length > max ? s.slice(0, max) + '…' : s;
}

/**
 * Encode a FULL report into a compact URL-safe string.
 * Includes summaries, keyPoints, compatibility timeframes — but NO private info
 * (no pillars, no birth date, no birth location, no user element).
 */
export function encodeShareData(report: FullReport): string {
  const d = report.decision === DecisionType.AGGRESSIVE ? 'A' : report.decision === DecisionType.DEFENSIVE ? 'D' : 'N';

  const encodeDim = (dim: { title: string; score: number; summary: string; keyPoints: string[] }) => ({
    t: trunc(dim.title, 25),
    c: dim.score,
    s: trunc(dim.summary, 60),
    k: (dim.keyPoints || []).slice(0, 3).map(p => trunc(p, 30)),
  });

  const slim: any = {
    y: report.stockData.symbol,
    n: trunc(report.stockData.name, 30),
    p: report.stockData.price,
    g: report.stockData.changePercent,
    r: report.stockData.peRatio || '',
    k: report.stockData.marketCap || '',
    u: trunc(report.stockData.lastUpdated, 20),
    d,
    h: trunc(report.mainThesis, 100),
    f: encodeDim(report.fundamental),
    m: encodeDim(report.momentum),
    e: encodeDim(report.sentiment),
  };

  // Compatibility — include timeframes BUT exclude private info (pillars, user element, lucky elements)
  if (report.compatibility?.stockElement) {
    const cp = report.compatibility;
    const encTf = (tf: { score: number; title: string; reading: string }) => ({
      c: tf.score, t: trunc(tf.title, 15), r: trunc(tf.reading, 50),
    });
    slim.x = {
      se: cp.stockElement,
      sn: cp.stockElementEn || '',
      sr: trunc(cp.stockElementReason, 30),
      mo: cp.monthly  ? encTf(cp.monthly)  : null,
      ye: cp.yearly   ? encTf(cp.yearly)   : null,
      lt: cp.longTerm ? encTf(cp.longTerm) : null,
      o: cp.overallScore ?? 0,
      v: trunc(cp.verdict, 10),
      vd: trunc(cp.verdictDetail, 50),
      // NO pillars, NO userDominantElement, NO luckyElements — privacy protected
    };
  }

  return toUrlSafeB64(JSON.stringify(slim));
}

/**
 * Decode share data back to a full FullReport.
 * Private fields (pillars, user element) are left empty.
 */
export function decodeShareData(encoded: string): FullReport | null {
  try {
    const slim = JSON.parse(fromUrlSafeB64(encoded));

    const decision =
      slim.d === 'A' ? DecisionType.AGGRESSIVE :
      slim.d === 'D' ? DecisionType.DEFENSIVE :
                        DecisionType.NEUTRAL;

    const decodeDim = (d: any) => ({
      title: d?.t || '', score: d?.c ?? 0, summary: d?.s || '',
      keyPoints: d?.k || [],
    });

    const report: FullReport = {
      stockData: {
        symbol: slim.y || '?', name: slim.n || '', price: slim.p || '?', changePercent: slim.g || '?',
        peRatio: slim.r || '-', marketCap: slim.k || '-', lastUpdated: slim.u || '',
      },
      fundamental: decodeDim(slim.f),
      momentum: decodeDim(slim.m),
      sentiment: decodeDim(slim.e),
      decision,
      mainThesis: slim.h || '',
      sources: [],
      compatibility: null,
    };

    if (slim.x) {
      const decodeTf = (tf: any) => tf ? { score: tf.c ?? 0, title: tf.t || '', reading: tf.r || '' } : { score: 0, title: '-', reading: '-' };
      report.compatibility = {
        stockElement: slim.x.se || '',
        stockElementEn: slim.x.sn || '',
        stockElementReason: slim.x.sr || '',
        pillars: undefined as any,          // PRIVATE — not shared
        userDominantElement: '',             // PRIVATE — not shared
        luckyElements: [],                   // PRIVATE — not shared
        monthly: decodeTf(slim.x.mo),
        yearly: decodeTf(slim.x.ye),
        longTerm: decodeTf(slim.x.lt),
        overallScore: slim.x.o ?? 0,
        verdict: slim.x.v || '',
        verdictDetail: slim.x.vd || '',
      };
    }

    return report;
  } catch (e) {
    console.error('[shareUtils] Decode failed:', e);
    return null;
  }
}

export function buildShareURL(report: FullReport): string {
  const data = encodeShareData(report);
  return `${window.location.origin}/#s=${data}`;
}

export function getShareDataFromURL(): FullReport | null {
  const hash = window.location.hash;
  if (hash.startsWith('#s=')) return decodeShareData(hash.slice(3));
  if (hash.startsWith('#share=')) return decodeShareData(hash.slice(7));
  return null;
}

export function generateQRDataURL(url: string, size = 200): Promise<string> {
  const qr = qrcode(0, 'M');
  qr.addData(url);
  qr.make();

  const moduleCount = qr.getModuleCount();
  const cell = Math.floor(size / moduleCount);
  const dim = cell * moduleCount;

  const canvas = document.createElement('canvas');
  canvas.width = dim;
  canvas.height = dim;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, dim, dim);
  ctx.fillStyle = '#000000';
  for (let r = 0; r < moduleCount; r++) {
    for (let c = 0; c < moduleCount; c++) {
      if (qr.isDark(r, c)) ctx.fillRect(c * cell, r * cell, cell, cell);
    }
  }

  return Promise.resolve(canvas.toDataURL('image/png'));
}
