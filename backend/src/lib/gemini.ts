import { config } from '../config.js';

const CANDIDATE_MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'] as const;
const TIMEOUT_MS = 12_000;

export interface GeminiPart {
  text?: string;
  inlineData?: { mimeType: string; data: string };
}

export interface GeminiContent {
  role: 'user' | 'model';
  parts: GeminiPart[];
}

export interface GeminiCallOptions {
  systemInstruction?: string;
  contents: GeminiContent[];
  responseMimeType?: 'application/json' | 'text/plain';
}

/**
 * Calls Gemini `generateContent` with a model fallback cascade on 429/503.
 * Returns null if `GEMINI_API_KEY` is not configured or all models fail.
 * Never logs request payloads (which may contain health data or meal photos).
 */
export async function callGemini(options: GeminiCallOptions): Promise<string | null> {
  if (!config.GEMINI_API_KEY) return null;

  const body: Record<string, unknown> = {
    contents: options.contents,
  };
  if (options.systemInstruction) {
    body.systemInstruction = { parts: [{ text: options.systemInstruction }] };
  }
  if (options.responseMimeType) {
    body.generationConfig = { responseMimeType: options.responseMimeType };
  }

  for (const model of CANDIDATE_MODELS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(config.GEMINI_API_KEY)}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      if (res.status === 429 || res.status === 503) {
        continue;
      }
      if (!res.ok) {
        return null;
      }
      const data = (await res.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return text;
    } catch {
      // Timeout or network failure -> try next fallback model or return null
    } finally {
      clearTimeout(timer);
    }
  }
  return null;
}
