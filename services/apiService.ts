/**
 * Frontend API service — calls the server-side /api/analyze endpoint.
 * API keys are NEVER exposed to the browser.
 */
import { InvestmentReport, Language, ModelProvider } from '../types';

export const analyzeStock = async (
  query: string,
  language: Language,
  model: ModelProvider,
): Promise<InvestmentReport> => {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, language, model }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
    throw new Error(err?.error ?? `Request failed with status ${response.status}`);
  }

  return response.json();
};
