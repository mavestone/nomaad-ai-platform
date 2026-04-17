import { useState, useEffect, useRef, useCallback } from "react";

const VOLT = "#ccfd01";
const VOLTD = "#b8e300";

/**
 * AIFloater — context-aware right-rail AI panel.
 *
 * Props:
 *   t        Theme object from App.jsx
 *   dark     boolean
 *   mobile   boolean
 *   context  { view?: string, selectedId?: string, selectedName?: string }
 *            Pass whatever the user has focused so the assistant knows.
 *
 * Keyboard:
 *   ⌘J / Ctrl+J  — toggle open/closed
 *   Esc          — close
 *
 * This first cut is pure chat with streaming. Tool use (read_clients,
 * create_task, send_gmail, etc.) is the next iteration.
 */
export default function AIFloater({ t, dark, mobile, context }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  // ── Keyboard shortcut ⌘J ────────────────────────────────────────
  useEffect(() => {
    const onKey = (e) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "j") {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Focus input on open
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 80);
  }, [open]);

  // Autoscroll on new tokens
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streaming]);

  // ── Send + stream ───────────────────────────────────────────────
  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || streaming) return;
    setError(null);
    setInput("");

    const nextMessages = [
      ...messages,
      { role: "user", content: text },
      { role: "assistant", content: "" },
    ];
    setMessages(nextMessages);
    setStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          messages: nextMessages.slice(0, -1), // drop the empty assistant placeholder
          context,
        }),
      });

      if (!res.ok || !res.body) {
        const errText = await res.text().catch(() => "");
        throw new Error(`API error ${res.status}: ${errText.slice(0, 200)}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let assistantText = "";

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

          if (evt.type === "text_delta") {
            assistantText += evt.text;
            setMessages((prev) => {
              const out = [...prev];
              out[out.length - 1] = { role: "assistant", content: assistantText };
              return out;
            });
          } else if (evt.type === "error") {
            throw new Error(evt.error || "Unknown stream error");
          }
        }
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        setError(err.message);
        setMessages((prev) => {
          const out = [...prev];
          // Remove the empty assistant bubble on error
          if (out[out.length - 1]?.role === "assistant" && !out[out.length - 1].content) {
            out.pop();
          }
          return out;
        });
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }, [input, messages, streaming, context]);

  const stop = () => {
    abortRef.current?.abort();
    setStreaming(false);
  };

  const reset = () => {
    stop();
    setMessages([]);
    setError(null);
  };

  // ── Render ─────────────────────────────────────────────────────
  const width = mobile ? "100vw" : 380;
  const height = mobile ? "calc(100vh - 16px)" : "calc(100vh - 28px)";

  return (
    <>
      {/* Floating toggle button (bottom-right) */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          title="Open AI (⌘J)"
          style={{
            position: "fixed",
            bottom: 22,
            right: 22,
            width: 52,
            height: 52,
            borderRadius: "50%",
            background: `linear-gradient(135deg,${VOLT},${VOLTD})`,
            color: "#0a0a0a",
            border: "none",
            cursor: "pointer",
            boxShadow: "0 8px 28px rgba(204,253,1,0.35), 0 2px 8px rgba(0,0,0,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 200,
            transition: "transform 0.2s ease",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.06)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
        >
          <SparkleIcon />
        </button>
      )}

      {/* Panel */}
      {open && (
        <aside
          style={{
            position: "fixed",
            top: mobile ? 8 : 14,
            right: mobile ? 8 : 14,
            width,
            height,
            borderRadius: 24,
            background: t.sidebar,
            border: `1px solid ${t.sidebarBorder}`,
            boxShadow: t.sidebarShadow,
            backdropFilter: "blur(40px) saturate(1.8)",
            display: "flex",
            flexDirection: "column",
            zIndex: 400,
            overflow: "hidden",
            animation: "aiSlideIn 0.28s cubic-bezier(.4,0,.2,1)",
          }}
        >
          {/* Header */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "16px 16px 12px",
            borderBottom: `1px solid ${t.divider}`,
          }}>
            <div style={{
              width: 30, height: 30, borderRadius: 9,
              background: `linear-gradient(135deg,${VOLT},${VOLTD})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#0a0a0a",
            }}>
              <SparkleIcon size={15} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: t.text }}>Nomaad AI</div>
              <div style={{ fontSize: 11, color: t.muted, marginTop: 1 }}>
                {context?.view ? `Context: ${context.view}${context.selectedName ? ` · ${context.selectedName}` : ""}` : "Ask anything"}
              </div>
            </div>
            {messages.length > 0 && (
              <button onClick={reset} title="New chat" style={iconBtn(t)}>
                <NewIcon />
              </button>
            )}
            <button onClick={() => setOpen(false)} title="Close (Esc)" style={iconBtn(t)}>
              <XIcon />
            </button>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            {messages.length === 0 && (
              <EmptyState t={t} dark={dark} onPick={(p) => { setInput(p); inputRef.current?.focus(); }} />
            )}

            {messages.map((m, i) => (
              <MessageBubble key={i} role={m.role} content={m.content} t={t} dark={dark} />
            ))}

            {streaming && messages[messages.length - 1]?.content === "" && (
              <div style={{ color: t.muted, fontSize: 12, display: "flex", gap: 6, alignItems: "center" }}>
                <Dots /> thinking…
              </div>
            )}

            {error && (
              <div style={{
                padding: "10px 12px",
                borderRadius: 10,
                background: dark ? "rgba(255,69,58,0.1)" : "rgba(255,59,48,0.08)",
                color: t.red,
                fontSize: 12,
                border: `1px solid ${dark ? "rgba(255,69,58,0.25)" : "rgba(255,59,48,0.2)"}`,
              }}>
                {error}
              </div>
            )}
          </div>

          {/* Composer */}
          <div style={{
            padding: "12px 14px 14px",
            borderTop: `1px solid ${t.divider}`,
          }}>
            <div style={{
              display: "flex",
              alignItems: "flex-end",
              gap: 8,
              padding: "10px 12px",
              borderRadius: 14,
              background: t.input,
              border: `1px solid ${t.inputBorder}`,
              transition: "border-color 0.2s",
            }}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                rows={1}
                placeholder="Ask anything about your business…"
                style={{
                  flex: 1,
                  minHeight: 20,
                  maxHeight: 140,
                  resize: "none",
                  outline: "none",
                  border: "none",
                  background: "transparent",
                  color: t.text,
                  fontSize: 13,
                  fontFamily: "inherit",
                  lineHeight: 1.5,
                }}
              />
              {streaming ? (
                <button onClick={stop} title="Stop" style={sendBtn(t, true)}>
                  <StopIcon />
                </button>
              ) : (
                <button
                  onClick={send}
                  disabled={!input.trim()}
                  style={sendBtn(t, false, !input.trim())}
                >
                  <SendIcon />
                </button>
              )}
            </div>
            <div style={{ fontSize: 10, color: t.muted, marginTop: 8, textAlign: "center" }}>
              ⌘J to toggle · Shift+Enter for newline
            </div>
          </div>
        </aside>
      )}

      <style>{`
        @keyframes aiSlideIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes aiDot {
          0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
          30% { opacity: 1; transform: translateY(-2px); }
        }
      `}</style>
    </>
  );
}

// ── Sub-components ────────────────────────────────────────────────

function MessageBubble({ role, content, t, dark }) {
  const isUser = role === "user";
  return (
    <div style={{
      display: "flex",
      flexDirection: isUser ? "row-reverse" : "row",
      gap: 8,
      alignItems: "flex-start",
    }}>
      {!isUser && (
        <div style={{
          width: 24, height: 24, borderRadius: 8,
          background: `linear-gradient(135deg,${VOLT},${VOLTD})`,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#0a0a0a",
          flexShrink: 0,
          marginTop: 2,
        }}>
          <SparkleIcon size={11} />
        </div>
      )}
      <div style={{
        maxWidth: "82%",
        padding: "10px 13px",
        borderRadius: 14,
        background: isUser
          ? (dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)")
          : "transparent",
        color: t.text,
        fontSize: 13,
        lineHeight: 1.55,
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
      }}>
        {content || <span style={{ color: t.muted }}>…</span>}
      </div>
    </div>
  );
}

function EmptyState({ t, dark, onPick }) {
  const prompts = [
    "What should I focus on today?",
    "Draft a follow-up email to a client",
    "Summarize my active projects",
    "Which invoices are overdue?",
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 10 }}>
      <div style={{ fontSize: 13, color: t.text, fontWeight: 500 }}>
        Hey — I can help you run Nomaad.
      </div>
      <div style={{ fontSize: 12, color: t.sub, marginBottom: 8 }}>
        Try one of these:
      </div>
      {prompts.map((p, i) => (
        <button
          key={i}
          onClick={() => onPick(p)}
          style={{
            textAlign: "left",
            padding: "10px 12px",
            borderRadius: 11,
            background: dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.025)",
            border: `1px solid ${t.cardBorder}`,
            color: t.text,
            fontSize: 12.5,
            fontFamily: "inherit",
            cursor: "pointer",
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.025)"; }}
        >
          {p}
        </button>
      ))}
    </div>
  );
}

function Dots() {
  return (
    <span style={{ display: "inline-flex", gap: 3 }}>
      {[0, 1, 2].map((i) => (
        <span key={i} style={{
          width: 4, height: 4, borderRadius: "50%", background: "currentColor",
          animation: `aiDot 1.2s ${i * 0.18}s infinite ease-in-out`,
        }}/>
      ))}
    </span>
  );
}

// ── Style helpers & icons ─────────────────────────────────────────

const iconBtn = (t) => ({
  width: 28, height: 28, borderRadius: 8,
  background: "transparent",
  border: "none",
  color: t.sub,
  cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center",
  transition: "background 0.15s",
});

const sendBtn = (t, stopping, disabled) => ({
  width: 32, height: 32, borderRadius: 10,
  background: disabled
    ? (t.muted + "30")
    : `linear-gradient(135deg,${VOLT},${VOLTD})`,
  color: "#0a0a0a",
  border: "none",
  cursor: disabled ? "default" : "pointer",
  display: "flex", alignItems: "center", justifyContent: "center",
  flexShrink: 0,
  opacity: disabled ? 0.5 : 1,
  transition: "all 0.15s",
});

function SparkleIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path d="M10 2L11.5 7.5L17 9L11.5 10.5L10 16L8.5 10.5L3 9L8.5 7.5L10 2Z"
        fill="currentColor" stroke="currentColor" strokeWidth="0.5" strokeLinejoin="round"/>
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2 8L14 2L10 14L8 9L2 8Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
    </svg>
  );
}

function StopIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
      <rect x="3" y="3" width="8" height="8" rx="1.5"/>
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M3 3L11 11M11 3L3 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  );
}

function NewIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M7 2V12M2 7H12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  );
}
