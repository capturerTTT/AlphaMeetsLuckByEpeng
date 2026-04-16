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

// ─── Kimi config ─────────────────────────────────────────────────────────────
const KIMI_MODEL = 'kimi-k2.5';
const KIMI_API_URL = 'https://api.moonshot.ai/v1/chat/completions';

const KIMI_SYSTEM_EN = `
You are "StockKimi", a savage Wall Street analyst who talks like a stand-up comedian.
Style: BRUTAL sarcasm, dark humor, pop culture burns, merciless honesty.
You mock overvalued garbage, clown on delusional bulls, deliver analysis like a comedy roast.

Your analysis is still razor-sharp — just wrapped in jokes.
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

const KIMI_SYSTEM_ZH = `
你是 "毒舌Kimi"，金融圈最毒舌的AI分析师，月之暗面出品。
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

// ─── BaZi / Fortune types (inlined) ──────────────────────────────────────────
interface BaziPillars {
  yearPillar: string;
  monthPillar: string;
  dayPillar: string;
  hourPillar: string;
  yearElement: string;
}
interface BaziInfo {
  birthYear: number;
  birthMonth: number;
  birthDay: number;
  birthHour?: number;
  birthLocation: string;
  pillars?: BaziPillars; // pre-calculated on frontend
}

// ─── Fortune system prompts ───────────────────────────────────────────────────
const FORTUNE_SYSTEM_ZH = `
你是"铁口直断算命大师"，精通八字命理、紫微斗数、五行相生相克，同时也是个脱口秀演员。
你被请来给投资者做"命理股票缘分测算"——就像传统合八字一样，但是对象换成了股票。
你的语气：神秘笃定、阴阳怪气、偶尔冒出一句让人喷饭的神吐槽。分析严肃，表达毒舌。

你将根据用户的生辰八字和目标股票，输出匹配度报告。

返回格式（仅JSON，不含任何markdown）：
{
  "stockElement": "金|木|水|火|土",
  "stockElementEn": "Metal|Wood|Water|Fire|Earth",
  "stockElementReason": "（一句话：为何该股属于此五行）",
  "userDominantElement": "（用户日元五行或推断用神，如"木"）",
  "luckyElements": ["（喜用神1）", "（喜用神2）"],
  "monthly": {
    "score": 0,
    "title": "（3-5字：本月运势标题，要有趣）",
    "reading": "（2-3句：当月流月分析，算命大师风格，夹杂幽默）"
  },
  "yearly": {
    "score": 0,
    "title": "（3-5字：今年运势标题）",
    "reading": "（2-3句：当年流年分析）"
  },
  "longTerm": {
    "score": 0,
    "title": "（3-5字：长期命局标题）",
    "reading": "（2-3句：长期命局相生相克分析）"
  },
  "overallScore": 0,
  "verdict": "命中注定|天作之合|有缘无分|且行且珍惜|凶多吉少|缘分尽了",
  "verdictDetail": "（一句毒舌金句总结整个缘分，让人笑完之后若有所思）"
}
`;

const FORTUNE_SYSTEM_EN = `
You are "MasterFate", a legendary BaZi fortune teller who also does stand-up comedy.
You calculate the "destiny compatibility" between a person's Four Pillars of Destiny and a stock they want to invest in.
Style: mystical, deadpan, with punchy one-liners. Think: ancient Chinese wisdom meets Wall Street roast.

Return ONLY valid JSON (no markdown):
{
  "stockElement": "Metal|Wood|Water|Fire|Earth",
  "stockElementEn": "Metal|Wood|Water|Fire|Earth",
  "stockElementReason": "(one sentence: why this stock belongs to this element)",
  "userDominantElement": "(user's day master element, e.g. 'Wood')",
  "luckyElements": ["element1", "element2"],
  "monthly": {
    "score": 0,
    "title": "(3-5 words: this month's fortune title, punchy)",
    "reading": "(2-3 sentences: monthly flow analysis in fortune-teller + comedy style)"
  },
  "yearly": {
    "score": 0,
    "title": "(3-5 words: this year title)",
    "reading": "(2-3 sentences)"
  },
  "longTerm": {
    "score": 0,
    "title": "(3-5 words: long-term title)",
    "reading": "(2-3 sentences)"
  },
  "overallScore": 0,
  "verdict": "Destined|Promising|Complicated|Risky|Doomed",
  "verdictDetail": "(one savage/funny/insightful one-liner summarizing the whole reading)"
}
`;

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
    { model: FLASH_MODEL, wait: 0    },
    { model: PRO_MODEL,   wait: 2000 },
    { model: FLASH_MODEL, wait: 4000 },
    { model: FLASH_MODEL, wait: 7000 },
    { model: FLASH_MODEL, wait: 10000 },
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

// ─── Kimi analysis ───────────────────────────────────────────────────────────
async function analyzeWithKimi(query: string, language: string) {
  const apiKey = process.env.KIMI_API_KEY;
  if (!apiKey) throw new Error("KIMI_API_KEY is not configured on the server.");

  const isChinese = language === 'zh';
  const prompt = isChinese
    ? `请对以下股票/公司进行深度分析："${query}"。`
    : `Perform a deep-dive analysis on: "${query}".`;

  const response = await fetch(KIMI_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: KIMI_MODEL,
      messages: [
        { role: 'system', content: isChinese ? KIMI_SYSTEM_ZH : KIMI_SYSTEM_EN },
        { role: 'user',   content: prompt },
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Kimi API error ${response.status}: ${err}`);
  }

  const raw = await response.json();
  let jsonText: string = raw?.choices?.[0]?.message?.content ?? '';
  jsonText = jsonText.replace(/```json\n?|\n?```/g, '').trim();
  const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON found in Kimi response");
  const data = JSON.parse(jsonMatch[0]);
  return { ...data, sources: [] };
}

// ─── Fortune / BaZi reading ──────────────────────────────────────────────────
async function analyzeCompatibility(
  query: string,
  stockSymbol: string,
  stockDecision: string,
  stockThesis: string,
  baziInfo: BaziInfo,
  language: string,
) {
  const isChinese = language === 'zh';
  const pillars   = baziInfo.pillars;

  const pillarsStr = pillars
    ? `年柱：${pillars.yearPillar}  月柱：${pillars.monthPillar}  日柱：${pillars.dayPillar}  时柱：${pillars.hourPillar}`
    : `出生：${baziInfo.birthYear}年${baziInfo.birthMonth}月${baziInfo.birthDay}日（时辰未知）`;

  const today = new Date();
  const currentYear  = today.getFullYear();
  const currentMonth = today.getMonth() + 1;

  const prompt = isChinese
    ? `【投资者八字信息】
${pillarsStr}
出生地：${baziInfo.birthLocation}

【股票信息】
代码/名称：${query}
（请根据该股票/公司的行业、业务性质，自行判断其五行属性）

【当前时间】${currentYear}年${currentMonth}月

请根据以上信息，做出这只股票与该投资者的命理匹配度分析。
考虑：股票行业五行属性、投资者日元及喜用神、当月流月（${currentYear}年${currentMonth}月）、当年流年（${currentYear}年）、长期命局。
每个时间维度给出0-100的匹配分数。总分亦为0-100。
用算命大师的口吻写，但要幽默毒舌，不要正经。`
    : `[Investor BaZi]
${pillarsStr}
Birth location: ${baziInfo.birthLocation}

[Stock]
Ticker/Name: ${query}
(Determine the stock's Five Element nature yourself based on its industry and business type)

[Current date] ${currentYear}-${String(currentMonth).padStart(2,'0')}

Perform a BaZi compatibility reading between this stock and this investor.
Consider: stock's Five Element nature based on industry, investor's day master element,
monthly flow (${currentMonth}/${currentYear}), yearly flow (${currentYear}), and long-term compatibility.
Score each timeframe 0-100 and overall 0-100.
Write in fortune-teller style with humor and some edge.`;

  // Use Gemini for fortune (no live data needed, fast)
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY missing');

  const ai = new GoogleGenAI({ apiKey });

  // Stagger start by 2s so we don't slam the API at the exact same time
  // as the stock analysis call that runs in parallel.
  await delay(2000);

  const attempts = [
    { model: FLASH_MODEL, wait: 0    },
    { model: FLASH_MODEL, wait: 3000 },
    { model: FLASH_MODEL, wait: 5000 },
    { model: FLASH_MODEL, wait: 8000 },
  ];

  let lastErr: any;
  for (const attempt of attempts) {
    if (attempt.wait) await delay(attempt.wait);
    try {
      const response = await ai.models.generateContent({
        model: attempt.model,
        contents: prompt,
        config: {
          systemInstruction: isChinese ? FORTUNE_SYSTEM_ZH : FORTUNE_SYSTEM_EN,
          // No googleSearch needed for fortune reading — it's pure AI interpretation
        },
      });

      let text = (response.text ?? '').replace(/```json\n?|\n?```/g, '').trim();
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) throw new Error('No JSON in fortune response');
      return JSON.parse(match[0]);
    } catch (err: any) {
      lastErr = err;
      const msg = (err?.message ?? '').toString();
      const retryable = msg.includes('429') || msg.includes('503') || msg.includes('UNAVAILABLE') || msg.includes('RESOURCE_EXHAUSTED');
      if (!retryable) throw err;
    }
  }
  throw lastErr;
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

  const { query, language = 'en', model = 'gemini', bazi } = req.body ?? {};

  if (!query || typeof query !== 'string' || !query.trim()) {
    return res.status(400).json({ error: 'query is required' });
  }

  try {
    const hasBazi = bazi && bazi.birthYear && bazi.birthLocation;

    if (hasBazi) {
      // ── Run BOTH calls in PARALLEL so total time = max(stock, fortune) not sum ──
      const [stockResult, fortuneResult] = await Promise.allSettled([
        model === 'claude'
          ? analyzeWithClaude(query.trim(), language)
          : model === 'kimi'
          ? analyzeWithKimi(query.trim(), language)
          : analyzeWithGemini(query.trim(), language),
        // Fortune reading uses a placeholder thesis since we don't have the stock result yet.
        // We pass the raw query — the fortune AI will determine stock element from the name.
        analyzeCompatibility(
          query.trim(),
          query.trim(),   // symbol placeholder — AI infers from query
          'NEUTRAL',       // decision placeholder
          '',              // thesis placeholder
          bazi as BaziInfo,
          language,
        ),
      ]);

      if (stockResult.status === 'rejected') {
        throw stockResult.reason;
      }

      const result = stockResult.value;
      let fortune = fortuneResult.status === 'fulfilled' ? fortuneResult.value : null;

      if (fortuneResult.status === 'rejected') {
        console.warn('[/api/analyze] Fortune reading failed (non-fatal):', fortuneResult.reason?.message);
      }

      // Inject pre-calculated pillars from frontend into the fortune response
      // (The AI doesn't return pillars — we calculated them on the frontend)
      if (fortune && (bazi as BaziInfo).pillars) {
        fortune.pillars = (bazi as BaziInfo).pillars;
      }

      return res.status(200).json({ ...result, compatibility: fortune });
    }

    // No BaZi — just stock analysis
    const result = model === 'claude'
      ? await analyzeWithClaude(query.trim(), language)
      : model === 'kimi'
      ? await analyzeWithKimi(query.trim(), language)
      : await analyzeWithGemini(query.trim(), language);

    return res.status(200).json(result);
  } catch (err: any) {
    console.error('[/api/analyze]', err);
    return res.status(500).json({ error: err?.message ?? 'Analysis failed' });
  }
}
