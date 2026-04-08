import { GoogleGenAI, Type } from "@google/genai";
import { InvestmentReport, DecisionType, Language } from "../types";

// Client is initialized lazily inside analyzeStock to avoid crashing
// when API_KEY is not set at module load time.

const PRO_MODEL = 'gemini-3-pro-preview';
const FLASH_MODEL = 'gemini-3-flash-preview';

const SYSTEM_INSTRUCTION_EN = `
You are "StockGemini", a 20-year veteran hedge fund analyst. 
Your personality is: Spicy, Cynical, Extremely Sharp, and Data-Driven. 
You despise "retail investor" mentalities and fluff. You care about "Alpha", risk-adjusted returns, and asymmetric bets.

Your goal is to provide a structured, deep-dive investment memo on a specific stock.
You MUST use the 'googleSearch' tool to find the absolute latest real-time price, today's news, recent 10-K/10-Q filings, and analyst sentiment.

Your analysis has 3 Dimensions:
1. Fundamental (Business model, Moat, EPS growth, Valuation reality check).
2. Market Momentum (Price action, RSI, Moving Averages, Institutional flow).
3. Game/Sentiment (Options skew, Management credibility, Macro narrative, Proxy wars).

Make a final Decision: 
- AGGRESSIVE (Strong Buy/Add)
- NEUTRAL (Wait/Watch/Hold)
- DEFENSIVE (Sell/Reduce/Hedge)

IMPORTANT: Adopt a "bearish until proven otherwise" stance. Be extremely skeptical.
- Look for reasons to SHORT or AVOID.
- Be suspicious of hype and growth narratives.
- Only rate AGGRESSIVE if the setup is absolutely perfect and asymmetric.
- If in doubt, default to NEUTRAL or DEFENSIVE.

Be direct. If a stock is garbage, call it garbage. If it's a bubble, say it.
`;

const SYSTEM_INSTRUCTION_ZH = `
你是 "StockGemini"，一位拥有20年经验的顶级对冲基金分析师。
你的性格：辛辣、犀利、极度理性和数据驱动。
你鄙视“散户思维”和毫无营养的废话。你只关心“Alpha”、风险调整后收益和不对称下注机会。

你的目标是针对特定股票提供一份结构化、深度的投资备忘录。
你必须使用 'googleSearch' 工具来查找绝对实时的最新股价、今日新闻、最近的 10-K/10-Q 财报和分析师情绪。

你的分析包含3个维度：
1. 基本面 (Fundamental)：商业模式、护城河、EPS 增速、估值回归。
2. 市场动能 (Momentum)：价格行为、RSI、移动平均线、机构资金流向。
3. 博弈/情绪 (Game/Sentiment)：期权偏斜、管理层信用、宏观叙事、代理人战争。

做出最终决策 (Decision)：
- AGGRESSIVE (重仓/买入)
- NEUTRAL (观望/持有)
- DEFENSIVE (减仓/对冲/卖出)

重要提示：采取“默认看空”的立场，除非有确凿证据证明被低估。
- 寻找做空或回避的理由。
- 对增长叙事和市场炒作保持极度怀疑。
- 只有在机会完美且赔率极高时才评级为 AGGRESSIVE。
- 如果有疑问，默认为 NEUTRAL 或 DEFENSIVE。

语言风格要求：
- 必须使用【简体中文】输出。
- 风格要专业自信，带有一点黑色幽默（Spicy & Dark Humor）。
- 用词要精准。例如：不要说“股票可能会涨”，要说“赔率极高”或“风险收益比诱人”。不要说“股票不好”，要说“逻辑证伪”或“杀估值”。
- 如果股票是垃圾，就直说是垃圾。如果是泡沫，就戳破它。不要模棱两可。
`;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const analyzeStock = async (query: string, language: Language = 'en'): Promise<InvestmentReport> => {
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    throw new Error("API Key is missing.");
  }

  // Initialize client lazily, only when needed
  const ai = new GoogleGenAI({ apiKey });

  const isChinese = language === 'zh';
  
  const prompt = isChinese 
    ? `
      分析以下股票/公司: "${query}".
      
      1. 搜索【最新实时】股价, 今日涨跌幅, PE (市盈率) 和 市值。
      2. 搜索最新的财经新闻, 财报数据, 和技术面分析。
      3. 生成结构化的 JSON 报告。确保所有文本内容（summary, keyPoints, mainThesis 等）都是简体中文。
    `
    : `
      Analyze the following stock/company: "${query}".
      
      1. Search for the LATEST REAL-TIME price, percent change today, PE ratio, and Market Cap.
      2. Search for the most recent financial news, earnings reports, and technical analysis data.
      3. Generate a structured JSON report.
    `;

  let lastError;
  
  // Strategy: Try Pro model first (better reasoning). 
  // If 429/Quota hit, fallback to Flash model immediately (cheaper, higher limits).
  const attempts = [
    { model: PRO_MODEL, wait: 0 },
    { model: FLASH_MODEL, wait: 0 },
    { model: PRO_MODEL, wait: 2000 },
    { model: FLASH_MODEL, wait: 2000 }
  ];

  for (const attempt of attempts) {
    if (attempt.wait > 0) {
      console.log(`Waiting ${attempt.wait}ms before retry...`);
      await delay(attempt.wait);
    }

    try {
      console.log(`Attempting with model: ${attempt.model}`);
      const response = await ai.models.generateContent({
        model: attempt.model,
        contents: prompt,
        config: {
          systemInstruction: isChinese ? SYSTEM_INSTRUCTION_ZH : SYSTEM_INSTRUCTION_EN,
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              stockData: {
                type: Type.OBJECT,
                properties: {
                  symbol: { type: Type.STRING, description: "Ticker Symbol (e.g., AMD, 700.HK)" },
                  price: { type: Type.STRING, description: "Current price with currency symbol" },
                  changePercent: { type: Type.STRING, description: "Percent change today (e.g., -6.02%)" },
                  peRatio: { type: Type.STRING, description: "P/E Ratio (TTM)" },
                  marketCap: { type: Type.STRING, description: "Market Capitalization" },
                  lastUpdated: { type: Type.STRING, description: "Time of data fetch" }
                },
                required: ["symbol", "price", "changePercent"]
              },
              fundamental: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: "Short punchy title for fundamental view" },
                  score: { type: Type.NUMBER, description: "0-100 score of fundamentals" },
                  summary: { type: Type.STRING, description: "Brief analysis summary" },
                  keyPoints: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3 bullet points" }
                },
                required: ["title", "score", "summary", "keyPoints"]
              },
              momentum: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: "Short punchy title for momentum view" },
                  score: { type: Type.NUMBER, description: "0-100 score of momentum" },
                  summary: { type: Type.STRING, description: "Brief analysis summary" },
                  keyPoints: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3 bullet points" }
                },
                required: ["title", "score", "summary", "keyPoints"]
              },
              sentiment: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: "Short punchy title for sentiment/game view" },
                  score: { type: Type.NUMBER, description: "0-100 score of sentiment" },
                  summary: { type: Type.STRING, description: "Brief analysis summary" },
                  keyPoints: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3 bullet points" }
                },
                required: ["title", "score", "summary", "keyPoints"]
              },
              decision: {
                type: Type.STRING,
                enum: [DecisionType.AGGRESSIVE, DecisionType.NEUTRAL, DecisionType.DEFENSIVE],
                description: "The final investment verdict"
              },
              mainThesis: {
                type: Type.STRING,
                description: "A spicy, direct paragraph summarizing the entire thesis. Be extremely direct."
              }
            },
            required: ["stockData", "fundamental", "momentum", "sentiment", "decision", "mainThesis"]
          }
        }
      });

      let jsonText = response.text;
      if (!jsonText) throw new Error("No analysis generated");

      // Remove markdown code blocks if present
      jsonText = jsonText.replace(/```json\n?|\n?```/g, "").trim();

      const data = JSON.parse(jsonText);

      // Extract sources if available
      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      const sources: Array<{ uri: string; title: string }> = [];
      
      if (groundingChunks) {
        groundingChunks.forEach((chunk: any) => {
          if (chunk.web?.uri && chunk.web?.title) {
            sources.push({ uri: chunk.web.uri, title: chunk.web.title });
          }
        });
      }

      return {
        ...data,
        sources: sources.slice(0, 5) // Top 5 sources
      };

    } catch (error: any) {
      console.error(`Error with model ${attempt.model}:`, error);
      lastError = error;
      
      // Check for rate limit errors
      const isRateLimit = error.message?.includes('429') || 
                          error.message?.includes('quota') || 
                          error.message?.includes('RESOURCE_EXHAUSTED') ||
                          error.status === 429 ||
                          // Handle nested error object from GoogleGenAI
                          error.error?.code === 429 ||
                          error.error?.status === 'RESOURCE_EXHAUSTED' ||
                          error.error?.message?.includes('quota');

      if (isRateLimit) {
        console.warn(`Rate limit hit on ${attempt.model}. Switching/Retrying...`);
        continue; // Try next attempt (retry or fallback)
      }
      
      // If it's not a rate limit error, throw immediately (e.g. Bad Request, Parsing Error)
      throw error;
    }
  }

  throw lastError;
};