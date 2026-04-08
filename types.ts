export enum DecisionType {
  AGGRESSIVE = 'AGGRESSIVE', // Buy
  NEUTRAL = 'NEUTRAL',       // Hold/Wait
  DEFENSIVE = 'DEFENSIVE'    // Sell
}

export type Language = 'en' | 'zh';

export type ModelProvider = 'gemini' | 'claude';

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
