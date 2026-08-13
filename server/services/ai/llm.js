/**
 * LLM provider abstraction.
 *
 * MAVIE uses ONE primary provider, chosen by AI_PROVIDER.
 * When no key is configured the provider is "mock" — a deterministic local
 * reasoner. That keeps the whole app runnable with zero configuration, which
 * matters a lot the night before a demo.
 *
 * The LLM is a REASONING layer only. It never scores, ranks or decides.
 */

const provider = () => {
  const p = (process.env.AI_PROVIDER || 'mock').toLowerCase();
  if (p === 'openai' && process.env.OPENAI_API_KEY) return 'openai';
  if (p === 'gemini' && process.env.GEMINI_API_KEY) return 'gemini';
  return 'mock';
};

export const activeProvider = provider;
export const isLive = () => provider() !== 'mock';

/**
 * Ask the LLM for JSON. Always returns a parsed object, or null on any failure —
 * callers are expected to have a deterministic fallback.
 */
export async function askJSON({ system, user, maxTokens = 900 }) {
  const p = provider();
  if (p === 'mock') return null;

  try {
    const raw = p === 'openai'
      ? await callOpenAI({ system, user, maxTokens })
      : await callGemini({ system, user, maxTokens });
    return extractJSON(raw);
  } catch (err) {
    console.warn(`[llm] ${p} call failed, falling back to deterministic reasoner:`, err.message);
    return null;
  }
}

async function callOpenAI({ system, user, maxTokens }) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      response_format: { type: 'json_object' },
      max_tokens: maxTokens,
      temperature: 0.4,
    }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}

async function callGemini({ system, user, maxTokens }) {
  const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: 'user', parts: [{ text: user }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        maxOutputTokens: maxTokens,
        temperature: 0.4,
      },
    }),
  });
  if (!res.ok) throw new Error(`Gemini ${res.status}`);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

function extractJSON(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}
