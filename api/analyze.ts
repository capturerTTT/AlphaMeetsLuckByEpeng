/**
 * Vercel Serverless Function — /api/analyze
 * Handles all AI API calls server-side so API keys never reach the browser.
 * Supports both Gemini (with live Google Search) and Claude models.
 */

import { GoogleGenAI, Type } from "@google/genai";

// ─── Types (inlined to avoid cross-boundary import issues) ───────────────────
enum DecisionType {
  AGGRESSIVE = 'AGGRESSIVE',
  NEUTRAL    = 'NEUTRAL',
  DEFENSIVE  = 'DEFENSIVE',
}

// ─── Gemini config ────────────────────────────────────────────────────────────
const PRO_MODEL   = 'gemini-2.5-pro';
const FLASH_MODEL = 'gemini-2.5-flash';

const GEMINI_SYSTEM_EN = `
You are "StockGemini", a 20-year veteran hedge fund analyst.
Your personality is: Spicy, Cynical, Extremely Sharp, and Data-Driven.
You despise "retail investor" mentalities and fluff. You care about "Alpha", risk-adjusted returns, and asymmetric bets.

Your goal is to provide a structured, deep-dive investment memo on a specific stock.
You MUST use the googleSearch tool to find the absolute latest real-time price, today's news, recent filings, and analyst sentiment.

Your analysis has 3 Dimensions:
1. Fundamental (Business model, Moat, EPS growth, Valuation reality check).
2. Market Momentum (Price action, RSI, Moving Averages, Institutional flow).
3. Game/Sentiment (Options skew, Management credibility, Macro narrative, Proxy wars).

Make a final Decision: AGGRESSIVE (Strong Buy) / NEUTRAL (Hold/Wait) / DEFENSIVE (Sell/Reduce)
Adopt a "bearish until proven otherwise" stance. Be direct. If it's garbage, say so.

CRITICAL: You MUST respond with ONLY a valid JSON object — no explanation before or after, no markdown fences.
Use this exact schema:
{"stockData":{"symbol":"","price":"","changePercent":"","peRatio":"","marketCap":"","lastUpdated":""},"fundamental":{"title":"","score":0,"summary":"","keyPoints":["","",""]},"momentum":{"title":"","score":0,"summary":"","keyPoints":["","",""]},"sentiment":{"title":"","score":0,"summary":"","keyPoints":["","",""]},"decision":"NEUTRAL","mainThesis":""}
`;

const GEMINI_SYSTEM_ZH = `
你是 "StockGemini"，一位拥有20年经验的顶级对冲基金分析师。
性格：辛辣、犀利、极度理性。必须使用 googleSearch 工具查找最新实时数据。
分析3个维度：基本面 / 市场动能 / 博弈情绪。默认看空立场。所有文本使用【简体中文】。

关键要求：只返回有效的 JSON 对象，不含任何 markdown 或说明文字。
使用此格式：
{"stockData":{"symbol":"","price":"","changePercent":"","peRatio":"","marketCap":"","lastUpdated":""},"fundamental":{"title":"","score":0,"summary":"","keyPoints":["","",""]},"momentum":{"title":"","score":0,"summary":"","keyPoints":["","",""]},"sentiment":{"title":"","score":0,"summary":"","keyPoints":["","",""]},"decision":"NEUTRAL","mainThesis":""}
`;

// ─── Claude config ────────────────────────────────────────────────────────────
const CLAUDE_MODEL = 'claude-opus-4-6';

const CLAUDE_SYSTEM_EN = `
You are "StockClaude", a 20-year veteran hedge fund analyst powered by Claude.
Spicy, Cynical, Data-Driven. No fluff. Bearish until proven otherwise.
Analyze Fundamental / Momentum / Sentiment. Decision: AGGRESSIVE / NEUTRAL / DEFENSIVE.
RESPOND ONLY WITH VALID JSON — no markdown fences, no explanation outside the JSON.
Schema:
{
  "stockData": { "symbol": "", "price": "", "changePercent": "", "peRatio": "", "marketCap": "", "lastUpdated": "⚠️ Training data, not live" },
  "fundamental": { "title": "", "score": 0, "summary": "", "keyPoints": ["","",""] },
  "momentum":    { "title": "", "score": 0, "summary": "", "keyPoints": ["","",""] },
  "sentiment":   { "title": "", "score": 0, "summary": "", "keyPoints": ["","",""] },
  "decision": "AGGRESSIVE|NEUTRAL|DEFENSIVE",
  "mainThesis": ""
}
`;

const CLAUDE_SYSTEM_ZH = `
你是 "StockClaude"，顶级对冲基金分析师，由 Claude 提供支持。
辛辣犀利，默认看空。分析基本面/动能/情绪，输出简体中文。
仅返回有效 JSON，不含任何 markdown 或说明文字。
Schema:
{
  "stockData": { "symbol": "", "price": "", "changePercent": "", "peRatio": "", "marketCap": "", "lastUpdated": "⚠️ 基于训练数据，非实时" },
  "fundamental": { "title": "", "score": 0, "summary": "", "keyPoints": ["","",""] },
  "momentum":    { "title": "", "score": 0, "summary": "", "keyPoints": ["","",""] },
  "sentiment":   { "title": "", "score": 0, "summary": "", "keyPoints": ["","",""] },
  "decision": "AGGRESSIVE|NEUTRAL|DEFENSIVE",
  "mainThesis": ""
}
`;

// ─── Gemini response schema ───────────────────────────────────────────────────
const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    stockData: {
      type: Type.OBJECT,
      properties: {
        symbol:        { type: Type.STRING },
        price:         { type: Type.STRING },
        changePercent: { type: Type.STRING },
        peRatio:       { type: Type.STRING },
        marketCap:     { type: Type.STRING },
        lastUpdated:   { type: Type.STRING },
      },
      required: ["symbol", "price", "changePercent"],
    },
    fundamental: {
      type: Type.OBJECT,
      properties: {
        title:     { type: Type.STRING },
        score:     { type: Type.NUMBER },
        summary:   { type: Type.STRING },
        keyPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ["title", "score", "summary", "keyPoints"],
    },
    momentum: {
      type: Type.OBJECT,
      properties: {
        title:     { type: Type.STRING },
        score:     { type: Type.NUMBER },
        summary:   { type: Type.STRING },
        keyPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ["title", "score", "summary", "keyPoints"],
    },
    sentiment: {
      type: Type.OBJECT,
      properties: {
        title:     { type: Type.STRING },
        score:     { type: Type.NUMBER },
        summary:   { type: Type.STRING },
        keyPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ["title", "score", "summary", "keyPoints"],
    },
    decision:   { type: Type.STRING, enum: [DecisionType.AGGRESSIVE, DecisionType.NEUTRAL, DecisionType.DEFENSIVE] },
    mainThesis: { type: Type.STRING },
  },
  required: ["stockData", "fundamental", "momentum", "sentiment", "decision", "mainThesis"],
};

// ─── Helper ───────────────────────────────────────────────────────────────────
const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

// ─── Gemini analysis ──────────────────────────────────────────────────────────
async function analyzeWithGemini(query: string, language: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured on the server.");

  const ai = new GoogleGenAI({ apiKey });
  const isChinese = language === 'zh';

  const prompt = isChinese
    ? `分析以下股票/公司: "${query}"。搜索最新实时股价、今日涨跌幅、PE和市值。生成结构化JSON报告，所有文本使用简体中文。`
    : `Analyze: "${query}". Search for LATEST real-time price, day change %, PE ratio, Market Cap. Generate structured JSON report.`;

  const attempts = [
    { model: PRO_MODEL,   wait: 0    },
    { model: FLASH_MODEL, wait: 0    },
    { model: PRO_MODEL,   wait: 3000 },
    { model: FLASH_MODEL, wait: 3000 },
    { model: FLASH_MODEL, wait: 5000 },
  ];

  let lastError: any;
  for (const attempt of attempts) {
    if (attempt.wait > 0) await delay(attempt.wait);
    try {
      // Note: Gemini 2.5 does not allow responseMimeType + googleSearch together.
      // We rely on the system prompt to enforce JSON output and parse it from text.
      const response = await ai.models.generateContent({
        model: attempt.model,
        contents: prompt,
        config: {
          systemInstruction: isChinese ? GEMINI_SYSTEM_ZH : GEMINI_SYSTEM_EN,
          tools: [{ googleSearch: {} }],
        },
      });

      let jsonText = response.text ?? '';
      // Strip markdown fences and extract JSON object
      jsonText = jsonText.replace(/```json\n?|\n?```/g, '').trim();
      const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found in Gemini response");
      const data = JSON.parse(jsonMatch[0]);

      const groundingChunks = (response as any).candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
      const sources = groundingChunks
        .filter((c: any) => c.web?.uri && c.web?.title)
        .map((c: any) => ({ uri: c.web.uri, title: c.web.title }))
        .slice(0, 5);

      return { ...data, sources };
    } catch (err: any) {
      lastError = err;
      const msg = (err?.message ?? '').toString();
      const isRetryable =
        msg.includes('429') ||
        msg.includes('503') ||
        msg.includes('quota') ||
        msg.includes('RESOURCE_EXHAUSTED') ||
        msg.includes('UNAVAILABLE') ||
        msg.includes('overloaded') ||
        msg.includes('high demand');
      if (!isRetryable) throw err;
      console.warn(`[analyze] Retryable error on ${attempt.model}: ${msg.slice(0, 120)}`);
    }
  }
  throw lastError;
}

// ─── Claude analysis ──────────────────────────────────────────────────────────
async function analyzeWithClaude(query: string, language: string) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured on the server.");

  const isChinese = language === 'zh';
  const prompt = isChinese
    ? `请对以下股票/公司进行深度分析："${query}"。`
    : `Perform a deep-dive analysis on: "${query}".`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 4096,
      system: isChinese ? CLAUDE_SYSTEM_ZH : CLAUDE_SYSTEM_EN,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Claude API error ${response.status}: ${err}`);
  }

  const raw = await response.json();
  let jsonText: string = raw?.content?.[0]?.text ?? '';
  jsonText = jsonText.replace(/```json\n?|\n?```/g, '').trim();
  const data = JSON.parse(jsonText);
  return { ...data, sources: [] };
}

// ─── Vercel handler ───────────────────────────────────────────────────────────
export default async function handler(req: any, res: any) {
  // CORS headers — allow your own domain + localhost in dev
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { query, language = 'en', model = 'gemini' } = req.body ?? {};

  if (!query || typeof query !== 'string' || !query.trim()) {
    return res.status(400).json({ error: 'query is required' });
  }

  try {
    const result = model === 'claude'
      ? await analyzeWithClaude(query.trim(), language)
      : await analyzeWithGemini(query.trim(), language);

    return res.status(200).json(result);
  } catch (err: any) {
    console.error('[/api/analyze]', err);
    return res.status(500).json({ error: err?.message ?? 'Analysis failed' });
  }
}
