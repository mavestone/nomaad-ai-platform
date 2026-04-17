// Vercel serverless function — streams Anthropic responses to the client.
// POST /api/ai/chat
// Body: {
//   messages: [{ role: 'user'|'assistant', content: string }, ...],
//   system?: string,           // optional system prompt override
//   context?: object,          // { view, selectedId, selectedName } — injected into system
//   model?: string             // override; default claude-sonnet-4-5
// }
//
// Streams Server-Sent Events. Each `data:` line is a JSON blob:
//   { type: 'text_delta', text: '...' }
//   { type: 'message_stop' }
//   { type: 'error', error: '...' }
//
// Required env: ANTHROPIC_API_KEY
//
// NOTE: Tool use (read_clients, create_task, etc.) will be added in the
// next iteration. This first cut is pure chat to get the surface live.

export const config = { runtime: 'nodejs' };

const DEFAULT_MODEL = 'claude-sonnet-4-5';
const DEFAULT_MAX_TOKENS = 2048;

const SYSTEM_BASE = `You are Nomaad's built-in AI assistant for solo creatives and freelancers.
You help with running a creative business: clients, projects, invoices, messages, and calendar.

Style:
- Direct, concise, action-oriented. No fluff, no filler.
- When the user asks a task-question, give the shortest useful answer.
- If you need data you don't have, ask for exactly what you need — don't hallucinate records.
- Never invent client names, invoice amounts, or project details. If you're unsure, say so.

You're currently embedded inside the Nomaad app. The user can see the same screen you're helping with.`;

function buildSystem(userSystem, context) {
  const parts = [SYSTEM_BASE];
  if (context?.view) {
    parts.push(`Current view: ${context.view}`);
  }
  if (context?.selectedName) {
    parts.push(`Selected: ${context.selectedName}${context.selectedId ? ` (id: ${context.selectedId})` : ''}`);
  }
  if (userSystem) parts.push(userSystem);
  return parts.join('\n\n');
}

async function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => { data += chunk; });
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

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });
    return;
  }

  let payload;
  try {
    payload = await readBody(req);
  } catch {
    res.status(400).json({ error: 'Invalid JSON body' });
    return;
  }

  const {
    messages,
    system,
    context,
    model = DEFAULT_MODEL,
    max_tokens = DEFAULT_MAX_TOKENS,
  } = payload;

  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: 'messages[] is required' });
    return;
  }

  // Sanitise — strip any roles other than user/assistant, coerce content to string
  const cleanMessages = messages
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && m.content)
    .map((m) => ({ role: m.role, content: String(m.content) }));

  if (cleanMessages.length === 0) {
    res.status(400).json({ error: 'No valid messages' });
    return;
  }

  // Set up SSE
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  if (typeof res.flushHeaders === 'function') res.flushHeaders();

  const send = (obj) => {
    res.write(`data: ${JSON.stringify(obj)}\n\n`);
  };

  let upstream;
  try {
    upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens,
        stream: true,
        system: buildSystem(system, context),
        messages: cleanMessages,
      }),
    });
  } catch (err) {
    send({ type: 'error', error: `Upstream fetch failed: ${err.message}` });
    res.end();
    return;
  }

  if (!upstream.ok) {
    const errText = await upstream.text().catch(() => '');
    send({ type: 'error', error: `Anthropic ${upstream.status}: ${errText.slice(0, 500)}` });
    res.end();
    return;
  }

  // Parse Anthropic's SSE stream and forward just the text deltas.
  const reader = upstream.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // Anthropic SSE frames are separated by blank lines
      let idx;
      while ((idx = buffer.indexOf('\n\n')) !== -1) {
        const frame = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 2);

        // Each frame has lines like:
        //   event: content_block_delta
        //   data: {...}
        const dataLine = frame.split('\n').find((l) => l.startsWith('data:'));
        if (!dataLine) continue;

        const raw = dataLine.slice(5).trim();
        if (!raw) continue;

        let evt;
        try { evt = JSON.parse(raw); } catch { continue; }

        if (evt.type === 'content_block_delta' && evt.delta?.type === 'text_delta') {
          send({ type: 'text_delta', text: evt.delta.text });
        } else if (evt.type === 'message_stop') {
          send({ type: 'message_stop' });
        } else if (evt.type === 'error') {
          send({ type: 'error', error: evt.error?.message || 'Unknown upstream error' });
        }
      }
    }
  } catch (err) {
    send({ type: 'error', error: `Stream read failed: ${err.message}` });
  }

  res.end();
}
