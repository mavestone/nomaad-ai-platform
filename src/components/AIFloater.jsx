import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";

const VOLT = "#ccfd01";
const VOLTD = "#b8e300";

// ── Tool definitions (Anthropic format, sent to API) ──────────────────────────
const TOOL_DEFS = [
  {
    name: "get_clients",
    description: "Fetch the user's clients from their CRM. Use when they ask about clients, contacts, or who they work with.",
    input_schema: {
      type: "object",
      properties: {
        limit:  { type: "integer", description: "Max results (default 20, max 50)" },
        search: { type: "string",  description: "Optional: filter by name or company" },
      },
    },
  },
  {
    name: "get_projects",
    description: "Fetch projects. Use when they ask about work in progress, deadlines, deliverables, or project status.",
    input_schema: {
      type: "object",
      properties: {
        status: { type: "string", description: "Filter by status: briefing | production | review | delivered | invoiced" },
        limit:  { type: "integer", description: "Max results (default 20)" },
      },
    },
  },
  {
    name: "get_invoices",
    description: "Fetch invoices. Use when they ask about money owed, unpaid bills, revenue, or payment history.",
    input_schema: {
      type: "object",
      properties: {
        status: { type: "string", description: "Filter by status: draft | sent | paid | overdue" },
        limit:  { type: "integer", description: "Max results (default 20)" },
      },
    },
  },
  {
    name: "get_tasks",
    description: "Fetch open tasks. Use when they ask what's on their to-do list, what's due, or what needs doing.",
    input_schema: {
      type: "object",
      properties: {
        limit: { type: "integer", description: "Max results (default 20)" },
      },
    },
  },
  {
    name: "get_calendar_events",
    description: "Fetch upcoming calendar events and meetings.",
    input_schema: {
      type: "object",
      properties: {
        days_ahead: { type: "integer", description: "How many days ahead to look (default 7, max 30)" },
      },
    },
  },
  {
    name: "create_task",
    description: "Create a new task for the user. Use when they ask you to add a task, reminder, or to-do item.",
    input_schema: {
      type: "object",
      properties: {
        title:      { type: "string", description: "Task title — concise and actionable" },
        due_date:   { type: "string", description: "ISO 8601 date string (optional)" },
        project_id: { type: "string", description: "UUID of the project to attach to (optional)" },
      },
      required: ["title"],
    },
  },
  {
    name: "get_financial_summary",
    description: "Get an income/expense summary for a date range. Use for questions about earnings, cashflow, or financial health.",
    input_schema: {
      type: "object",
      properties: {
        days: { type: "integer", description: "How many days back to include (default 30)" },
      },
    },
  },
];

// ── Tool executor (runs against Supabase client-side) ─────────────────────────
async function executeTool(name, input, userId) {
  try {
    switch (name) {
      case "get_clients": {
        let q = supabase
          .from("clients")
          .select("id,name,email,company,phone,tags,created_at")
          .limit(Math.min(input.limit || 20, 50));
        if (input.search) {
          q = q.or(`name.ilike.%${input.search}%,company.ilike.%${input.search}%`);
        }
        const { data, error } = await q;
        if (error) return { error: error.message };
        return { clients: data, count: data.length };
      }

      case "get_projects": {
        let q = supabase
          .from("projects")
          .select("id,name,title,status,client_id,due_date,description,color")
          .limit(input.limit || 20);
        if (input.status) q = q.eq("status", input.status);
        const { data, error } = await q;
        if (error) return { error: error.message };
        return { projects: (data || []).map(p => ({ ...p, name: p.name || p.title })), count: data?.length };
      }

      case "get_invoices": {
        let q = supabase
          .from("invoices")
          .select("id,number,amount,currency,status,client_id,due_date,paid_at,issued_at,notes")
          .limit(input.limit || 20);
        if (input.status) q = q.eq("status", input.status);
        const { data, error } = await q;
        if (error) return { error: error.message };
        const total = (data || []).reduce((s, i) => s + (Number(i.amount) || 0), 0);
        return { invoices: data, count: data?.length, total_amount: total };
      }

      case "get_tasks": {
        const { data, error } = await supabase
          .from("tasks")
          .select("id,title,due_date,completed_at,project_id,tags")
          .is("completed_at", null)
          .order("due_date", { ascending: true, nullsLast: true })
          .limit(input.limit || 20);
        if (error) return { error: error.message };
        return { tasks: data, count: data?.length };
      }

      case "get_calendar_events": {
        const daysAhead = Math.min(input.days_ahead || 7, 30);
        const future = new Date();
        future.setDate(future.getDate() + daysAhead);
        const { data, error } = await supabase
          .from("calendar_events")
          .select("id,title,start_time,end_time,type,description,location")
          .gte("start_time", new Date().toISOString())
          .lte("start_time", future.toISOString())
          .order("start_time")
          .limit(20);
        if (error) return { error: error.message };
        return { events: data, count: data?.length };
      }

      case "create_task": {
        if (!userId) return { error: "Not authenticated" };
        const { data, error } = await supabase
          .from("tasks")
          .insert({
            title: input.title,
            due_date: input.due_date || null,
            project_id: input.project_id || null,
            user_id: userId,
          })
          .select()
          .single();
        if (error) return { error: error.message };
        return { success: true, task: data, message: `Task created: "${input.title}"` };
      }

      case "get_financial_summary": {
        const days = input.days || 30;
        const since = new Date();
        since.setDate(since.getDate() - days);
        const { data, error } = await supabase
          .from("transactions")
          .select("amount,type,date,description")
          .gte("date", since.toISOString());
        if (error) return { error: error.message };
        const txs = data || [];
        const income  = txs.filter(t => t.type === "income").reduce((s, t) => s + (Number(t.amount) || 0), 0);
        const expense = txs.filter(t => t.type === "expense").reduce((s, t) => s + (Number(t.amount) || 0), 0);
        return { period_days: days, income, expenses: expense, net: income - expense, transaction_count: txs.length };
      }

      default:
        return { error: `Unknown tool: ${name}` };
    }
  } catch (err) {
    return { error: err.message };
  }
}

// ── Tool name → human label ───────────────────────────────────────────────────
const TOOL_LABELS = {
  get_clients:          "Reading clients…",
  get_projects:         "Reading projects…",
  get_invoices:         "Reading invoices…",
  get_tasks:            "Reading tasks…",
  get_calendar_events:  "Reading calendar…",
  create_task:          "Creating task…",
  get_financial_summary:"Reading financials…",
};

// ── Main component ────────────────────────────────────────────────────────────
export default function AIFloater({ t, dark, mobile, context }) {
  const { user } = useAuth();

  // Display messages: [{role, content, toolActivity?}]
  const [messages, setMessages] = useState([]);
  // Full API history (includes tool_use/tool_result content arrays)
  const apiHistoryRef = useRef([]);

  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  // ── Keyboard: ⌘J / Esc ───────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "j") { e.preventDefault(); setOpen((v) => !v); }
      else if (e.key === "Escape" && open) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 80); }, [open]);
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  // ── Core stream function ──────────────────────────────────────────────────
  const streamRequest = useCallback(async (apiMessages, signal, onTextDelta, onToolCalls, onStop, onError) => {
    let res;
    try {
      res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal,
        body: JSON.stringify({
          messages: apiMessages,
          context,
          tools: TOOL_DEFS,
        }),
      });
    } catch (err) {
      if (err.name !== "AbortError") onError(err.message);
      return;
    }

    if (!res.ok || !res.body) {
      const errText = await res.text().catch(() => "");
      onError(`API error ${res.status}: ${errText.slice(0, 200)}`);
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });

      let idx;
      while ((idx = buf.indexOf("\n\n")) !== -1) {
        const frame = buf.slice(0, idx).trim();
        buf = buf.slice(idx + 2);
        if (!frame.startsWith("data:")) continue;
        const raw = frame.slice(5).trim();
        if (!raw) continue;

        let evt;
        try { evt = JSON.parse(raw); } catch { continue; }

        if (evt.type === "text_delta")   onTextDelta(evt.text);
        else if (evt.type === "tool_calls") onToolCalls(evt.calls);
        else if (evt.type === "message_stop") onStop();
        else if (evt.type === "error") onError(evt.error || "Stream error");
      }
    }
  }, [context]);

  // ── Tool-calling loop ─────────────────────────────────────────────────────
  const runConversation = useCallback(async (apiMessages, signal) => {
    let continueLoop = true;
    let assistantTextBuffer = "";
    let assistantToolCalls = [];

    const appendMsg = (idx, patch) => {
      setMessages(prev => {
        const out = [...prev];
        if (out[idx]) out[idx] = { ...out[idx], ...patch };
        return out;
      });
    };

    while (continueLoop) {
      continueLoop = false;
      assistantTextBuffer = "";
      assistantToolCalls = [];

      // Add empty assistant bubble for this round
      let bubbleIdx;
      setMessages(prev => { bubbleIdx = prev.length; return [...prev, { role: "assistant", content: "", toolActivity: null }]; });

      await new Promise((resolve, reject) => {
        streamRequest(
          apiMessages,
          signal,
          // onTextDelta
          (text) => {
            assistantTextBuffer += text;
            appendMsg(bubbleIdx, { content: assistantTextBuffer });
          },
          // onToolCalls
          (calls) => { assistantToolCalls = calls; },
          // onStop
          resolve,
          // onError
          (err) => { if (err !== "AbortError") setError(err); resolve(); }
        );
      });

      if (signal.aborted) break;

      // Finalize assistant API message
      if (assistantToolCalls.length > 0) {
        // Build Anthropic-format assistant message with tool_use blocks
        const assistantContent = [];
        if (assistantTextBuffer) assistantContent.push({ type: "text", text: assistantTextBuffer });
        for (const call of assistantToolCalls) {
          assistantContent.push({ type: "tool_use", id: call.id, name: call.name, input: call.input });
        }
        apiMessages = [...apiMessages, { role: "assistant", content: assistantContent }];

        // Show tool activity in bubble
        const toolLabel = assistantToolCalls.map(c => TOOL_LABELS[c.name] || `Running ${c.name}…`).join(" ");
        appendMsg(bubbleIdx, { toolActivity: toolLabel });

        // Execute each tool
        const toolResultContent = [];
        for (const call of assistantToolCalls) {
          const result = await executeTool(call.name, call.input, user?.id);
          toolResultContent.push({
            type: "tool_result",
            tool_use_id: call.id,
            content: JSON.stringify(result),
          });
        }

        // Add tool results to API history
        apiMessages = [...apiMessages, { role: "user", content: toolResultContent }];

        // Clear tool activity, continue loop
        appendMsg(bubbleIdx, { toolActivity: null });
        continueLoop = true;
      } else {
        // Normal end — finalize
        apiMessages = [
          ...apiMessages,
          { role: "assistant", content: assistantTextBuffer || "" },
        ];
      }
    }

    apiHistoryRef.current = apiMessages;
  }, [streamRequest, user]);

  // ── Send ──────────────────────────────────────────────────────────────────
  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || streaming) return;
    setError(null);
    setInput("");
    setStreaming(true);

    // Add user message to display + API history
    setMessages(prev => [...prev, { role: "user", content: text }]);
    const updatedHistory = [...apiHistoryRef.current, { role: "user", content: text }];

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      await runConversation(updatedHistory, controller.signal);
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }, [input, streaming, runConversation]);

  const stop = () => { abortRef.current?.abort(); setStreaming(false); };
  const reset = () => {
    stop();
    setMessages([]);
    apiHistoryRef.current = [];
    setError(null);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  const width = mobile ? "100vw" : 380;
  const height = mobile ? "calc(100vh - 16px)" : "calc(100vh - 28px)";

  return (
    <>
      {!open && (
        <button onClick={() => setOpen(true)} title="Open AI (⌘J)"
          style={{
            position: "fixed", bottom: 22, right: 22,
            width: 52, height: 52, borderRadius: "50%",
            background: `linear-gradient(135deg,${VOLT},${VOLTD})`,
            color: "#0a0a0a", border: "none", cursor: "pointer",
            boxShadow: "0 8px 28px rgba(204,253,1,0.35), 0 2px 8px rgba(0,0,0,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 200, transition: "transform 0.2s ease",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.06)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
        >
          <SparkleIcon />
        </button>
      )}

      {open && (
        <aside style={{
          position: "fixed", top: mobile ? 8 : 14, right: mobile ? 8 : 14,
          width, height, borderRadius: 24,
          background: t.sidebar, border: `1px solid ${t.sidebarBorder}`,
          boxShadow: t.sidebarShadow, backdropFilter: "blur(40px) saturate(1.8)",
          display: "flex", flexDirection: "column", zIndex: 400,
          overflow: "hidden", animation: "aiSlideIn 0.28s cubic-bezier(.4,0,.2,1)",
        }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "16px 16px 12px", borderBottom: `1px solid ${t.divider}` }}>
            <div style={{ width: 30, height: 30, borderRadius: 9, background: `linear-gradient(135deg,${VOLT},${VOLTD})`, display: "flex", alignItems: "center", justifyContent: "center", color: "#0a0a0a" }}>
              <SparkleIcon size={15} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: t.text }}>Nomaad AI</div>
              <div style={{ fontSize: 11, color: t.muted, marginTop: 1 }}>
                {context?.view ? `${context.view}${context.selectedName ? ` · ${context.selectedName}` : ""}` : "Ask anything"}
              </div>
            </div>
            {messages.length > 0 && (
              <button onClick={reset} title="New chat" style={iconBtn(t)}><NewIcon /></button>
            )}
            <button onClick={() => setOpen(false)} title="Close (Esc)" style={iconBtn(t)}><XIcon /></button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: 14 }}>
            {messages.length === 0 && (
              <EmptyState t={t} dark={dark} onPick={(p) => { setInput(p); inputRef.current?.focus(); }} />
            )}

            {messages.map((m, i) => (
              <MessageBubble key={i} role={m.role} content={m.content} toolActivity={m.toolActivity} t={t} dark={dark} streaming={streaming && i === messages.length - 1 && m.role === "assistant"} />
            ))}

            {error && (
              <div style={{ padding: "10px 12px", borderRadius: 10, background: dark ? "rgba(255,69,58,0.1)" : "rgba(255,59,48,0.08)", color: t.red, fontSize: 12, border: `1px solid ${dark ? "rgba(255,69,58,0.25)" : "rgba(255,59,48,0.2)"}` }}>
                {error}
              </div>
            )}
          </div>

          {/* Composer */}
          <div style={{ padding: "12px 14px 14px", borderTop: `1px solid ${t.divider}` }}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 8, padding: "10px 12px", borderRadius: 14, background: t.input, border: `1px solid ${t.inputBorder}` }}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                rows={1}
                placeholder="Ask about your business…"
                style={{ flex: 1, minHeight: 20, maxHeight: 140, resize: "none", outline: "none", border: "none", background: "transparent", color: t.text, fontSize: 13, fontFamily: "inherit", lineHeight: 1.5 }}
              />
              {streaming ? (
                <button onClick={stop} title="Stop" style={sendBtn(t, true)}><StopIcon /></button>
              ) : (
                <button onClick={send} disabled={!input.trim()} style={sendBtn(t, false, !input.trim())}><SendIcon /></button>
              )}
            </div>
            <div style={{ fontSize: 10, color: t.muted, marginTop: 8, textAlign: "center" }}>⌘J to toggle · Shift+Enter for newline</div>
          </div>
        </aside>
      )}

      <style>{`
        @keyframes aiSlideIn { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:translateX(0); } }
        @keyframes aiDot { 0%,60%,100% { opacity:0.3; transform:translateY(0); } 30% { opacity:1; transform:translateY(-2px); } }
        @keyframes toolPulse { 0%,100% { opacity:0.6; } 50% { opacity:1; } }
      `}</style>
    </>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function MessageBubble({ role, content, toolActivity, t, dark, streaming }) {
  const isUser = role === "user";
  const isEmpty = !content && !toolActivity;

  return (
    <div style={{ display: "flex", flexDirection: isUser ? "row-reverse" : "row", gap: 8, alignItems: "flex-start" }}>
      {!isUser && (
        <div style={{ width: 24, height: 24, borderRadius: 8, background: `linear-gradient(135deg,${VOLT},${VOLTD})`, display: "flex", alignItems: "center", justifyContent: "center", color: "#0a0a0a", flexShrink: 0, marginTop: 2 }}>
          <SparkleIcon size={11} />
        </div>
      )}
      <div style={{ maxWidth: "82%", display: "flex", flexDirection: "column", gap: 6 }}>
        {toolActivity && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", borderRadius: 8, background: dark ? "rgba(204,253,1,0.07)" : "rgba(204,253,1,0.12)", border: `1px solid rgba(204,253,1,0.2)`, animation: "toolPulse 1.5s infinite" }}>
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
              <circle cx="5.5" cy="5.5" r="4.5" stroke={VOLT} strokeWidth="1.2"/>
              <path d="M5.5 3V5.5L7 7" stroke={VOLT} strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            <span style={{ fontSize: 11, color: VOLT, fontWeight: 500 }}>{toolActivity}</span>
          </div>
        )}
        {(content || isEmpty) && (
          <div style={{ padding: "10px 13px", borderRadius: 14, background: isUser ? (dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)") : "transparent", color: t.text, fontSize: 13, lineHeight: 1.55, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
            {content || (streaming && isEmpty ? <Dots /> : <span style={{ color: t.muted }}>…</span>)}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ t, dark, onPick }) {
  const prompts = [
    "What should I focus on today?",
    "Which invoices are unpaid?",
    "Summarise my active projects",
    "Add a task: follow up with client",
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 10 }}>
      <div style={{ fontSize: 13, color: t.text, fontWeight: 500 }}>Hey — I can see your real data.</div>
      <div style={{ fontSize: 12, color: t.sub, marginBottom: 6 }}>Ask me anything or try:</div>
      {prompts.map((p, i) => (
        <button key={i} onClick={() => onPick(p)}
          style={{ textAlign: "left", padding: "10px 12px", borderRadius: 11, background: dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.025)", border: `1px solid ${t.cardBorder}`, color: t.text, fontSize: 12.5, fontFamily: "inherit", cursor: "pointer" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.025)"; }}
        >{p}</button>
      ))}
    </div>
  );
}

function Dots() {
  return (
    <span style={{ display: "inline-flex", gap: 3 }}>
      {[0, 1, 2].map((i) => (
        <span key={i} style={{ width: 4, height: 4, borderRadius: "50%", background: "currentColor", animation: `aiDot 1.2s ${i * 0.18}s infinite ease-in-out`, display: "inline-block" }} />
      ))}
    </span>
  );
}

// ── Style helpers ─────────────────────────────────────────────────────────────
const iconBtn = (t) => ({ width: 28, height: 28, borderRadius: 8, background: "transparent", border: "none", color: t.sub, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" });
const sendBtn = (t, stopping, disabled) => ({ width: 32, height: 32, borderRadius: 10, background: disabled ? (t.muted + "30") : `linear-gradient(135deg,${VOLT},${VOLTD})`, color: "#0a0a0a", border: "none", cursor: disabled ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, opacity: disabled ? 0.5 : 1, transition: "all 0.15s" });

// ── Icons ─────────────────────────────────────────────────────────────────────
function SparkleIcon({ size = 14 }) {
  return <svg width={size} height={size} viewBox="0 0 20 20" fill="none"><path d="M10 2L11.5 7.5L17 9L11.5 10.5L10 16L8.5 10.5L3 9L8.5 7.5L10 2Z" fill="currentColor" stroke="currentColor" strokeWidth="0.5" strokeLinejoin="round"/></svg>;
}
function SendIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 8L14 2L10 14L8 9L2 8Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/></svg>;
}
function StopIcon() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><rect x="3" y="3" width="8" height="8" rx="1.5"/></svg>;
}
function XIcon() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 3L11 11M11 3L3 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>;
}
function NewIcon() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 2V12M2 7H12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>;
}
