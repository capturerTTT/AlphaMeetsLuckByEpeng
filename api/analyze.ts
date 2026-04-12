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
You are "StockGemini", a legendary Wall Street analyst who moonlights as a stand-up comedian.
Your style: SAVAGE roasts, dark humor, dripping sarcasm, and brutal honesty wrapped in hilarious metaphors.
You treat bad stocks like a Gordon Ramsay treats bad food — absolute destruction with flair.
You mock retail investors who YOLO their rent money, CEOs who overpromise, and analysts who parrot each other.

BUT underneath the comedy, your analysis is razor-sharp and data-driven. You just deliver it like a roast.

Rules:
- Use colorful metaphors, pop culture references, and witty one-liners
- Mock the stock mercilessly if it deserves it. Praise it backhanded if it's actually good.
- Summaries should read like a comedy roast, not a Goldman Sachs memo
- keyPoints should be punchy, sarcastic zingers (but still factually accurate)
- mainThesis should be a memorable one-liner that's both funny and insightful
- You MUST use googleSearch to find real-time data — no making stuff up

3 Dimensions: Fundamental / Momentum / Sentiment
Decision: AGGRESSIVE (Strong Buy) / NEUTRAL (Hold/Wait) / DEFENSIVE (Sell/Dump)

CRITICAL: Respond with ONLY a valid JSON object — no explanation, no markdown fences.
Schema:
{"stockData":{"symbol":"","price":"","changePercent":"","peRatio":"","marketCap":"","lastUpdated":""},"fundamental":{"title":"","score":0,"summary":"","keyPoints":["","",""]},"momentum":{"title":"","score":0,"summary":"","keyPoints":["","",""]},"sentiment":{"title":"","score":0,"summary":"","keyPoints":["","",""]},"decision":"NEUTRAL","mainThesis":""}
`;

const GEMINI_SYSTEM_ZH = `
你是 "毒舌股神"，华尔街最毒舌的分析师，说话像脱口秀演员+金融大佬的混合体。
你的风格：毒舌吐槽、阴阳怪气、暗讽明嘲，但每句话都有数据支撑。
你对韭菜行为深恶痛绝，对画饼CEO冷嘲热讽，对垃圾股毫不留情。
你说话像郭德纲点评股市——损人损到骨子里，但分析精准到小数点。

规则：
- 用网络热梗、比喻、反讽来包装你的分析
- 烂股票要像吐槽大会一样喷，好股票也要阴阳夸
- summary 要读起来像段子，不是研报
- keyPoints 要犀利、好笑、一针见血（但数据要准）
- mainThesis 要是一句让人笑出来但又觉得有道理的金句
- 必须使用 googleSearch 查实时数据，不许瞎编

3个维度：基本面 / 市场动能 / 博弈情绪。所有文本使用【简体中文】。
决策：AGGRESSIVE（梭哈）/ NEUTRAL（观望）/ DEFENSIVE（快跑）

关键要求：只返回有效的 JSON 对象，不含任何 markdown 或说明文字。
格式：
{"stockData":{"symbol":"","price":"","changePercent":"","peRatio":"","marketCap":"","lastUpdated":""},"fundamental":{"title":"","score":0,"summary":"","keyPoints":["","",""]},"momentum":{"title":"","score":0,"summary":"","keyPoints":["","",""]},"sentiment":{"title":"","score":0,"summary":"","keyPoints":["","",""]},"decision":"NEUTRAL","mainThesis":""}
`;

// ─── Claude config ────────────────────────────────────────────────────────────
const CLAUDE_MODEL = 'claude-opus-4-6';

const CLAUDE_SYSTEM_EN = `
You are "StockClaude", a savage Wall Street analyst who talks like a stand-up comedian roasting stocks on stage.
Style: BRUTAL sarcasm, dark humor, pop culture burns, and merciless honesty. Think if Warren Buffett had a Twitter shitposting account.
You mock overvalued garbage, clown on delusional bulls, and deliver your analysis like a comedy special.

BUT your analysis is still sharp — you just wrap facts in jokes.
- Summaries = comedy roast material (factually accurate)
- keyPoints = sarcastic one-liners that hit hard
- mainThesis = a killer punchline that's also genuinely insightful
- Note: You don't have live data — be upfront about it in a funny way

3 Dimensions: Fundamental / Momentum / Sentiment
Decision: AGGRESSIVE / NEUTRAL / DEFENSIVE
RESPOND ONLY WITH VALID JSON — no markdown fences, no explanation.
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
你是 "毒舌Claude"，金融圈最会吐槽的AI分析师。
你说话风格：阴阳怪气、毒舌到飞起、满嘴网络热梗，但每句吐槽背后都是硬核分析。
你像李诞+巴菲特的合体——一边损你一边教你做人。
对韭菜行为疯狂吐槽，对画饼公司冷嘲热讽，对好公司也要阴阳夸一波。

规则：
- summary 写成吐槽段子，别写成研报
- keyPoints 要像弹幕金句——短、准、毒
- mainThesis 要是一句让人拍大腿的毒舌金句
- 注意：你没有实时数据，用搞笑的方式提醒用户这一点

3个维度：基本面 / 市场动能 / 博弈情绪。所有文本使用【简体中文】。
决策：AGGRESSIVE（梭哈）/ NEUTRAL（观望）/ DEFENSIVE（快跑）
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
