export enum DecisionType {
  AGGRESSIVE = 'AGGRESSIVE', // Buy
  NEUTRAL = 'NEUTRAL',       // Hold/Wait
  DEFENSIVE = 'DEFENSIVE'    // Sell
}

export type Language = 'en' | 'zh';

export type ModelProvider = 'gemini' | 'kimi';

export interface StockData {
  symbol: string;
  price: string;
  changePercent: string;
  peRatio: string;
  marketCap: string;
  lastUpdated: string;
}

export interface DimensionAnalysis {
  title: string;
  score: number; // 0-100
  summary: string;
  keyPoints: string[];
}

export interface InvestmentReport {
  stockData: StockData;
  fundamental: DimensionAnalysis;
  momentum: DimensionAnalysis;
  sentiment: DimensionAnalysis;
  decision: DecisionType;
  mainThesis: string;
  sources: Array<{ uri: string; title: string }>;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
}

// ─── BaZi / Fortune Feature ───────────────────────────────────────────────────

export interface BaziInfo {
  birthYear: number;
  birthMonth: number;
  birthDay: number;
  birthHour?: number;   // 0–23, optional
  birthLocation: string;
  pillars?: BaziPillars; // pre-calculated on frontend before sending to API
}

export interface BaziPillars {
  yearPillar: string;   // e.g. "甲子"
  monthPillar: string;  // e.g. "丙寅"
  dayPillar: string;    // e.g. "庚午"
  hourPillar: string;   // e.g. "壬子" or "时辰未知"
  yearElement: string;  // 五行 dominant from year stem
}

export interface FortuneTimeframe {
  score: number;        // 0–100
  title: string;        // e.g. "贵人相助" / "险象环生"
  reading: string;      // fortune-teller style prose
}

export interface FortuneReading {
  stockElement: string;        // 金木水火土
  stockElementEn: string;      // Metal / Wood / Water / Fire / Earth
  stockElementReason: string;  // why this stock belongs to this element
  pillars: BaziPillars;
  userDominantElement: string; // user's dominant 五行
  luckyElements: string[];     // 喜用神
  monthly: FortuneTimeframe;
  yearly: FortuneTimeframe;
  longTerm: FortuneTimeframe;
  overallScore: number;
  verdict: string;             // e.g. "命中注定" / "有缘无分"
  verdictDetail: string;       // one punchy line summarizing the whole reading
}
