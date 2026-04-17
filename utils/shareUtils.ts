import { FullReport } from '../services/apiService';

/**
 * Encode a report into a URL-safe base64 string.
 * We strip sources and use short keys to keep the URL compact.
 */
export function encodeShareData(report: FullReport): string {
  const slim: any = {
    s: report.stockData,
    f: { t: report.fundamental.title, sc: report.fundamental.score, su: report.fundamental.summary, k: report.fundamental.keyPoints },
    m: { t: report.momentum.title, sc: report.momentum.score, su: report.momentum.summary, k: report.momentum.keyPoints },
    se: { t: report.sentiment.title, sc: report.sentiment.score, su: report.sentiment.summary, k: report.sentiment.keyPoints },
    d: report.decision,
    th: report.mainThesis,
  };

  if (report.compatibility && report.compatibility.stockElement) {
    const c = report.compatibility;
    slim.c = {
      se: c.stockElement, sen: c.stockElementEn, ser: c.stockElementReason,
      p: c.pillars, ude: c.userDominantElement, le: c.luckyElements,
      mo: c.monthly, ye: c.yearly, lt: c.longTerm,
      os: c.overallScore, v: c.verdict, vd: c.verdictDetail,
    };
  }

  const json = JSON.stringify(slim);
  // btoa doesn't handle unicode well, so we encode first
  return btoa(unescape(encodeURIComponent(json)));
}

/**
 * Decode share data from base64 string back to a FullReport.
 */
export function decodeShareData(encoded: string): FullReport | null {
  try {
    const json = decodeURIComponent(escape(atob(encoded)));
    const slim = JSON.parse(json);

    const report: FullReport = {
      stockData: slim.s,
      fundamental: { title: slim.f.t, score: slim.f.sc, summary: slim.f.su, keyPoints: slim.f.k },
      momentum:    { title: slim.m.t, score: slim.m.sc, summary: slim.m.su, keyPoints: slim.m.k },
      sentiment:   { title: slim.se.t, score: slim.se.sc, summary: slim.se.su, keyPoints: slim.se.k },
      decision: slim.d,
      mainThesis: slim.th,
      sources: [],
      compatibility: null,
    };

    if (slim.c) {
      report.compatibility = {
        stockElement: slim.c.se,
        stockElementEn: slim.c.sen,
        stockElementReason: slim.c.ser,
        pillars: slim.c.p,
        userDominantElement: slim.c.ude,
        luckyElements: slim.c.le,
        monthly: slim.c.mo,
        yearly: slim.c.ye,
        longTerm: slim.c.lt,
        overallScore: slim.c.os,
        verdict: slim.c.v,
        verdictDetail: slim.c.vd,
      };
    }

    return report;
  } catch (e) {
    console.error('[shareUtils] Failed to decode share data:', e);
    return null;
  }
}

/**
 * Build the full share URL for a report.
 */
export function buildShareURL(report: FullReport): string {
  const data = encodeShareData(report);
  const origin = window.location.origin;
  return `${origin}/#share=${data}`;
}

/**
 * Check if the current URL is a share link and extract data.
 */
export function getShareDataFromURL(): FullReport | null {
  const hash = window.location.hash;
  if (!hash.startsWith('#share=')) return null;
  const encoded = hash.slice(7); // remove '#share='
  return decodeShareData(encoded);
}

/**
 * Fetch a QR code as a data URL from a public API.
 * Falls back to a simple text placeholder if the API fails.
 */
export async function generateQRDataURL(url: string, size = 200): Promise<string> {
  try {
    const apiUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(url)}&size=${size}x${size}&bgcolor=0f172a&color=ffffff&format=png`;
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error('QR API failed');
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    // Fallback: generate a simple placeholder canvas
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = '#ffffff';
    ctx.font = `${size / 10}px monospace`;
    ctx.textAlign = 'center';
    ctx.fillText('扫码查看', size / 2, size / 2 - 10);
    ctx.fillText('完整报告', size / 2, size / 2 + 15);
    return canvas.toDataURL('image/png');
  }
}
