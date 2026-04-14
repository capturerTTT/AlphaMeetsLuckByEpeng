/**
 * Frontend API service — calls the server-side /api/analyze endpoint.
 * API keys are NEVER exposed to the browser.
 */
import { InvestmentReport, Language, ModelProvider, BaziInfo, FortuneReading } from '../types';

export interface FullReport extends InvestmentReport {
  compatibility?: FortuneReading | null;
}

export const analyzeStock = async (
  query: string,
  language: Language,
  model: ModelProvider,
  bazi?: BaziInfo | null,
): Promise<FullReport> => {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, language, model, bazi: bazi ?? undefined }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
    throw new Error(err?.error ?? `Request failed with status ${response.status}`);
  }

  return response.json();
};
