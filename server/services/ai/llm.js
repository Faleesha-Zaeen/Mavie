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

import crypto from 'node:crypto';
import * as cache from '../cache.js';

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
export async function askJSON({ system, user, maxTokens = 2500, image = null }) {
  // Cache is consulted BEFORE the provider, so a clone with no keys at all
  // still replays recorded responses. This is what makes the demo path
  // quota-proof and offline-safe.
  const cacheKey = { system, user, image: image ? imageFingerprint(image) : null };
  const cached = cache.read('llm', cacheKey);
  if (cached != null) return cached;

  const p = provider();
  if (p === 'mock') return null;

  // Free-tier quotas are per-minute, and MAVIE fires the two agents at once.
  // A short backoff turns a burst 429 into a slightly slower success instead of
  // a silent drop to the deterministic reasoner.
  const RETRY_DELAYS = [1200, 3500];

  for (let attempt = 0; attempt <= RETRY_DELAYS.length; attempt++) {
    try {
      const raw = p === 'openai'
        ? await callOpenAI({ system, user, maxTokens, image })
        : await callGemini({ system, user, maxTokens, image });
      const parsed = extractJSON(raw);
      if (parsed) return cache.write('llm', cacheKey, parsed);
      throw new Error('response was not valid JSON');
    } catch (err) {
      const retryable = /429|503|rate|quota|timeout|fetch failed/i.test(err.message);
      if (retryable && attempt < RETRY_DELAYS.length) {
        await sleep(RETRY_DELAYS[attempt]);
        continue;
      }
      console.warn(`[llm] ${p} call failed, falling back to deterministic reasoner:`, err.message);
      return null;
    }
  }
  return null;
}

/** Hash the image so cache keys stay small and stable. */
const imageFingerprint = (dataUrl) =>
  crypto.createHash('sha256').update(dataUrl).digest('hex').slice(0, 32);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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
        {
          role: 'user',
          content: image
            ? [{ type: 'text', text: user }, { type: 'image_url', image_url: { url: image } }]
            : user,
        },
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

/**
 * Free-tier quota is metered PER MODEL
 * (GenerateRequestsPerDayPerProjectPerModel), so exhausting one model's daily
 * allowance does not touch the next. MAVIE walks down this list rather than
 * dropping to the deterministic reasoner for the rest of the day.
 */
const GEMINI_FALLBACKS = [
  'gemini-flash-latest',
  'gemini-2.5-flash',
  'gemini-3.1-flash-lite',
  'gemini-2.5-flash-lite',
  'gemini-flash-lite-latest',
];

/** Models known to be out of daily quota, so we stop retrying them. */
const exhausted = new Set();

function geminiModels() {
  const primary = process.env.GEMINI_MODEL || 'gemini-3.5-flash';
  return [primary, ...GEMINI_FALLBACKS.filter((m) => m !== primary)]
    .filter((m) => !exhausted.has(m));
}

async function callGemini({ system, user, maxTokens, image }) {
  const models = geminiModels();
  if (!models.length) throw new Error('all Gemini models are out of daily quota');

  let lastErr;
  for (const model of models) {
    try {
      return await callGeminiModel({ model, system, user, maxTokens, image });
    } catch (err) {
      lastErr = err;
      if (/daily quota/i.test(err.message)) {
        exhausted.add(model);
        console.warn(`[llm] ${model} out of daily quota — trying next model`);
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
}

async function callGeminiModel({ model, system, user, maxTokens, image }) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;

  const parts = [{ text: user }];
  if (image) {
    // Data URLs arrive as "data:image/png;base64,AAAA…" — Gemini wants the
    // mime type and the payload separately.
    const [meta, payload] = image.split(',');
    parts.push({
      inline_data: {
        mime_type: (meta.match(/data:(.*?);/) || [, 'image/jpeg'])[1],
        data: payload,
      },
    });
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: 'user', parts }],
      generationConfig: {
        responseMimeType: 'application/json',
        maxOutputTokens: maxTokens,
        temperature: 0.4,
      },
    }),
  });
  if (!res.ok) {
    // Distinguish "this model is done for today" from a transient burst limit,
    // because the two need completely different handling.
    if (res.status === 429) {
      const body = await res.json().catch(() => ({}));
      const daily = JSON.stringify(body.error?.details || '').includes('PerDay');
      throw new Error(daily ? `Gemini ${model}: daily quota exhausted` : `Gemini 429 rate limit`);
    }
    throw new Error(`Gemini ${res.status}`);
  }
  const data = await res.json();

  // Gemini 3.x spends "thinking" tokens against maxOutputTokens. If the budget
  // runs out mid-object the JSON is truncated, so surface that as a real error
  // rather than letting a half-written object reach the decision engine.
  const finish = data.candidates?.[0]?.finishReason;
  if (finish === 'MAX_TOKENS') {
    throw new Error('Gemini hit MAX_TOKENS — raise maxTokens for this call');
  }

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
