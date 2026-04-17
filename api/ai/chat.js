// Vercel serverless function — streams AI responses with tool calling.
// POST /api/ai/chat
// Body: {
//   messages: [{ role, content }],   // content may be string OR Anthropic content array
//   system?: string,
//   context?: object,
//   model?: string,
//   tools?: ToolDefinition[]         // Anthropic-format tool defs from client
// }
//
// SSE events emitted:
//   { type: 'text_delta',  text: '...' }
//   { type: 'tool_calls',  calls: [{ id, name, input }] }  ← client must execute + follow up
//   { type: 'message_stop' }
//   { type: 'error',       error: '...' }

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
- Direct, concise, action-oriented. No fluff.
- When the user asks a task-question, give the shortest useful answer.
- ALWAYS use your tools to fetch real data before answering questions about clients, projects, invoices, tasks, or events.
- Never invent names, amounts, or dates. If data is missing, say so.
- When you create something (task, note), confirm it with a brief "Done — [what you did]".

You're embedded inside the Nomaad app. The user sees the same screen you're helping with.`;

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

// Convert Anthropic tool defs → OpenAI tool defs
function toOpenAITools(tools) {
  if (!tools?.length) return undefined;
  return tools.map(t => ({
    type: 'function',
    function: {
      name: t.name,
      description: t.description,
      parameters: t.input_schema || { type: 'object', properties: {} },
    },
  }));
}

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

  const providerName = (process.env.AI_PROVIDER || 'groq').toLowerCase();
  const provider = PROVIDERS[providerName];
  if (!provider) { res.status(500).json({ error: `Unknown AI_PROVIDER: ${providerName}` }); return; }

  const apiKey = process.env[provider.envKey];
  if (!apiKey) { res.status(500).json({ error: `${provider.envKey} not configured` }); return; }

  let payload;
  try { payload = await readBody(req); }
  catch { res.status(400).json({ error: 'Invalid JSON' }); return; }

  const { messages, system, context, model, max_tokens = 2048, tools } = payload;

  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: 'messages[] required' });
    return;
  }

  // Clean messages — allow both string content and content arrays (tool_result format)
  const clean = messages
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && m.content)
    .map((m) => ({
      role: m.role,
      content: Array.isArray(m.content) ? m.content : String(m.content),
    }));

  if (clean.length === 0) { res.status(400).json({ error: 'No valid messages' }); return; }

  // Set up SSE
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  if (typeof res.flushHeaders === 'function') res.flushHeaders();
  const send = (o) => res.write(`data: ${JSON.stringify(o)}\n\n`);

  const systemPrompt = buildSystem(system, context);
  const chosenModel = model || provider.defaultModel;

  // ── Build upstream request ──────────────────────────────────────
  let upstream;
  try {
    if (provider.format === 'anthropic') {
      const body = {
        model: chosenModel,
        max_tokens,
        stream: true,
        system: systemPrompt,
        messages: clean,
      };
      if (tools?.length) body.tools = tools;

      upstream = await fetch(provider.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(body),
      });
    } else {
      // OpenAI-compatible (Groq)
      const body = {
        model: chosenModel,
        max_tokens,
        stream: true,
        messages: [{ role: 'system', content: systemPrompt }, ...clean],
      };
      const oaiTools = toOpenAITools(tools);
      if (oaiTools) body.tools = oaiTools;

      upstream = await fetch(provider.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
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

  // Tool use tracking (Anthropic)
  let toolUseBlocks = [];
  let currentToolBlock = null;  // { id, name, inputBuffer }

  // Tool calls tracking (OpenAI)
  let openaiToolCalls = {};  // index → {id, name, args}

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
        if (!raw || raw === '[DONE]') {
          if (raw === '[DONE]') send({ type: 'message_stop' });
          continue;
        }

        let evt;
        try { evt = JSON.parse(raw); } catch { continue; }

        if (provider.format === 'anthropic') {
          // ── Anthropic streaming ──
          if (evt.type === 'content_block_start') {
            const cb = evt.content_block;
            if (cb?.type === 'tool_use') {
              currentToolBlock = { id: cb.id, name: cb.name, inputBuffer: '' };
            }
          } else if (evt.type === 'content_block_delta') {
            const delta = evt.delta;
            if (delta?.type === 'text_delta') {
              send({ type: 'text_delta', text: delta.text });
            } else if (delta?.type === 'input_json_delta' && currentToolBlock) {
              currentToolBlock.inputBuffer += delta.partial_json;
            }
          } else if (evt.type === 'content_block_stop') {
            if (currentToolBlock) {
              let input = {};
              try { input = JSON.parse(currentToolBlock.inputBuffer || '{}'); } catch {}
              toolUseBlocks.push({ id: currentToolBlock.id, name: currentToolBlock.name, input });
              currentToolBlock = null;
            }
          } else if (evt.type === 'message_delta') {
            if (evt.delta?.stop_reason === 'tool_use' && toolUseBlocks.length > 0) {
              send({ type: 'tool_calls', calls: toolUseBlocks });
              toolUseBlocks = [];
            } else if (evt.delta?.stop_reason === 'end_turn') {
              send({ type: 'message_stop' });
            }
          } else if (evt.type === 'message_stop') {
            send({ type: 'message_stop' });
          } else if (evt.type === 'error') {
            send({ type: 'error', error: evt.error?.message || 'Unknown error' });
          }
        } else {
          // ── OpenAI-compatible (Groq) ──
          const choice = evt.choices?.[0];
          if (!choice) continue;

          const delta = choice.delta;
          if (delta?.content) {
            send({ type: 'text_delta', text: delta.content });
          }

          // Collect tool calls from streaming deltas
          if (delta?.tool_calls) {
            for (const tc of delta.tool_calls) {
              const i = tc.index ?? 0;
              if (!openaiToolCalls[i]) openaiToolCalls[i] = { id: '', name: '', argsBuffer: '' };
              if (tc.id) openaiToolCalls[i].id = tc.id;
              if (tc.function?.name) openaiToolCalls[i].name = tc.function.name;
              if (tc.function?.arguments) openaiToolCalls[i].argsBuffer += tc.function.arguments;
            }
          }

          if (choice.finish_reason === 'tool_calls') {
            const calls = Object.values(openaiToolCalls).map(tc => {
              let input = {};
              try { input = JSON.parse(tc.argsBuffer || '{}'); } catch {}
              return { id: tc.id, name: tc.name, input };
            });
            send({ type: 'tool_calls', calls });
            openaiToolCalls = {};
          } else if (choice.finish_reason) {
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
