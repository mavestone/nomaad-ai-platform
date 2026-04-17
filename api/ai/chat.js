// Vercel serverless function — streams AI responses to the client.
// POST /api/ai/chat
// Body: {
//   messages: [{ role: 'user'|'assistant', content: string }, ...],
//   system?: string,
//   context?: object,          // { view, selectedId, selectedName }
//   model?: string             // provider-specific override
// }
//
// Streams Server-Sent Events:
//   { type: 'text_delta', text: '...' }
//   { type: 'message_stop' }
//   { type: 'error', error: '...' }
//
// Provider switching via env vars:
//   AI_PROVIDER=groq      -> GROQ_API_KEY + model like "openai/gpt-oss-120b"
//   AI_PROVIDER=anthropic -> ANTHROPIC_API_KEY + model like "claude-sonnet-4-5"
//
// Defaults to 'groq' if unset (free tier for dev/testing).

export const config = { runtime: 'nodejs' };

const PROVIDERS = {
  groq: {
    url: 'https://api.groq.com/openai/v1/chat/completions',
    envKey: 'GROQ_API_KEY',
    defaultModel: 'openai/gpt-oss-120b',
    format: 'openai',
  },
  anthropic: {
    url: 'https://api.anthropic.com/v1/messages',
    envKey: 'ANTHROPIC_API_KEY',
    defaultModel: 'claude-sonnet-4-5',
    format: 'anthropic',
  },
};

const SYSTEM_BASE = `You are Nomaad's built-in AI assistant for solo creatives and freelancers.
You help with running a creative business: clients, projects, invoices, messages, and calendar.

Style:
- Direct, concise, action-oriented. No fluff, no filler.
- When the user asks a task-question, give the shortest useful answer.
- If you need data you don't have, ask for exactly what you need — don't hallucinate records.
- Never invent client names, invoice amounts, or project details. If you're unsure, say so.

You're embedded inside the Nomaad app. The user can see the same screen you're helping with.`;

function buildSystem(userSystem, context) {
  const parts = [SYSTEM_BASE];
  if (context?.view) parts.push(`Current view: ${context.view}`);
  if (context?.selectedName) {
    parts.push(`Selected: ${context.selectedName}${context.selectedId ? ` (id: ${context.selectedId})` : ''}`);
  }
  if (userSystem) parts.push(userSystem);
  return parts.join('\n\n');
}

async function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (c) => { data += c; });
    req.on('end', () => {
      try { resolve(JSON.parse(data || '{}')); }
      catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const providerName = (process.env.AI_PROVIDER || 'groq').toLowerCase();
  const provider = PROVIDERS[providerName];
  if (!provider) {
    res.status(500).json({ error: `Unknown AI_PROVIDER: ${providerName}` });
    return;
  }

  const apiKey = process.env[provider.envKey];
  if (!apiKey) {
    res.status(500).json({ error: `${provider.envKey} not configured` });
    return;
  }

  let payload;
  try { payload = await readBody(req); }
  catch { res.status(400).json({ error: 'Invalid JSON' }); return; }

  const { messages, system, context, model, max_tokens = 2048 } = payload;

  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: 'messages[] required' });
    return;
  }

  const clean = messages
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && m.content)
    .map((m) => ({ role: m.role, content: String(m.content) }));

  if (clean.length === 0) {
    res.status(400).json({ error: 'No valid messages' });
    return;
  }

  // Set up SSE
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  if (typeof res.flushHeaders === 'function') res.flushHeaders();
  const send = (o) => res.write(`data: ${JSON.stringify(o)}\n\n`);

  const systemPrompt = buildSystem(system, context);
  const chosenModel = model || provider.defaultModel;

  // ── Build request for provider ─────────────────────────────────
  let upstream;
  try {
    if (provider.format === 'anthropic') {
      upstream = await fetch(provider.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: chosenModel,
          max_tokens,
          stream: true,
          system: systemPrompt,
          messages: clean,
        }),
      });
    } else {
      // OpenAI-compatible (Groq, OpenRouter, etc.)
      upstream = await fetch(provider.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: chosenModel,
          max_tokens,
          stream: true,
          messages: [
            { role: 'system', content: systemPrompt },
            ...clean,
          ],
        }),
      });
    }
  } catch (err) {
    send({ type: 'error', error: `Upstream fetch failed: ${err.message}` });
    res.end();
    return;
  }

  if (!upstream.ok) {
    const errText = await upstream.text().catch(() => '');
    send({ type: 'error', error: `${providerName} ${upstream.status}: ${errText.slice(0, 500)}` });
    res.end();
    return;
  }

  const reader = upstream.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let idx;
      while ((idx = buffer.indexOf('\n\n')) !== -1) {
        const frame = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 2);

        const dataLine = frame.split('\n').find((l) => l.startsWith('data:'));
        if (!dataLine) continue;

        const raw = dataLine.slice(5).trim();
        if (!raw) continue;

        // OpenAI-style [DONE] sentinel
        if (raw === '[DONE]') {
          send({ type: 'message_stop' });
          continue;
        }

        let evt;
        try { evt = JSON.parse(raw); } catch { continue; }

        if (provider.format === 'anthropic') {
          if (evt.type === 'content_block_delta' && evt.delta?.type === 'text_delta') {
            send({ type: 'text_delta', text: evt.delta.text });
          } else if (evt.type === 'message_stop') {
            send({ type: 'message_stop' });
          } else if (evt.type === 'error') {
            send({ type: 'error', error: evt.error?.message || 'Unknown error' });
          }
        } else {
          // OpenAI-compatible format
          const delta = evt.choices?.[0]?.delta?.content;
          if (delta) send({ type: 'text_delta', text: delta });
          if (evt.choices?.[0]?.finish_reason) {
            send({ type: 'message_stop' });
          }
        }
      }
    }
  } catch (err) {
    send({ type: 'error', error: `Stream read failed: ${err.message}` });
  }

  res.end();
}
