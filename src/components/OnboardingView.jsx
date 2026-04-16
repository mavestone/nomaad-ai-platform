import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";

const VOLT = "#ccfd01";

const ROLES = [
  { id: "freelancer",  label: "Freelancer",       emoji: "💻", desc: "Solo work, multiple clients" },
  { id: "agency",      label: "Agency Owner",      emoji: "🏢", desc: "Team, retainer clients" },
  { id: "consultant",  label: "Consultant",        emoji: "🎯", desc: "Advisory, strategy work" },
  { id: "creative",    label: "Creative Director", emoji: "🎨", desc: "Design, video, content" },
  { id: "developer",   label: "Developer",         emoji: "⚙️", desc: "Code, products, SaaS" },
  { id: "other",       label: "Something else",    emoji: "✨", desc: "I'll figure it out" },
];

const FEATURES = [
  { id: "clients",   label: "Client Management", emoji: "👥", desc: "Track contacts & pipelines" },
  { id: "projects",  label: "Project Tracking",  emoji: "📋", desc: "Tasks, kanban, deadlines" },
  { id: "invoicing", label: "Invoicing",          emoji: "💰", desc: "Send invoices, track payments" },
  { id: "messages",  label: "Messages",           emoji: "💬", desc: "WhatsApp, email in one inbox" },
  { id: "calendar",  label: "Calendar",           emoji: "📅", desc: "Schedule & booking" },
  { id: "docs",      label: "Documents",          emoji: "📄", desc: "Store & share files" },
];

const STEPS = ["Welcome", "Your Role", "Your Tools", "Your Business", "Done"];

export default function OnboardingView() {
  const { user, profile, updateProfile } = useAuth();
  const [step, setStep]             = useState(0);
  const [role, setRole]             = useState(null);
  const [features, setFeatures]     = useState(new Set(["clients", "projects"]));
  const [businessName, setBusinessName] = useState(profile?.business_name || "");
  const [saving, setSaving]         = useState(false);
  const [direction, setDirection]   = useState(1); // 1=forward, -1=back

  const name = profile?.full_name?.split(" ")[0] || user?.user_metadata?.full_name?.split(" ")[0] || "there";

  const go = (n) => {
    setDirection(n > step ? 1 : -1);
    setStep(n);
  };

  const toggleFeature = (id) => {
    setFeatures(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const finish = async () => {
    setSaving(true);
    await updateProfile({
      onboarding_complete: true,
      business_type: role,
      business_name: businessName.trim() || null,
      use_cases: [...features],
    });
    // updateProfile updates context — App.jsx re-renders without onboarding
  };

  const progress = step / (STEPS.length - 1);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "#08080a",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      fontFamily: "-apple-system,'SF Pro Display',system-ui,sans-serif",
      padding: 24,
    }}>
      {/* Background glow */}
      <div style={{
        position: "absolute", top: "15%", left: "50%", transform: "translateX(-50%)",
        width: 600, height: 400, borderRadius: "50%",
        background: "radial-gradient(ellipse, rgba(204,253,1,0.06) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      {/* Progress bar */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "rgba(255,255,255,0.06)" }}>
        <div style={{
          height: "100%", width: `${progress * 100}%`,
          background: `linear-gradient(90deg, ${VOLT}, #b8e300)`,
          transition: "width 0.5s cubic-bezier(.4,0,.2,1)",
          borderRadius: "0 2px 2px 0",
        }} />
      </div>

      {/* Step label */}
      {step > 0 && step < STEPS.length - 1 && (
        <div style={{ position: "absolute", top: 20, right: 28, fontSize: 12, color: "#8b8fa3", letterSpacing: 0.5 }}>
          {step} / {STEPS.length - 2}
        </div>
      )}

      {/* Content */}
      <div style={{
        width: "100%", maxWidth: 520,
        display: "flex", flexDirection: "column", alignItems: "center",
        gap: 32,
      }}>

        {/* ── Step 0: Welcome ──────────────────────────────────────────────── */}
        {step === 0 && (
          <div style={{ textAlign: "center", animation: "fadeUp 0.5s ease" }}>
            <div style={{
              width: 72, height: 72, borderRadius: 22, margin: "0 auto 28px",
              background: "linear-gradient(135deg,#ccfd01,#b8e300)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 30, fontWeight: 900, color: "#0a0a0a",
              boxShadow: "0 4px 32px rgba(204,253,1,0.25)",
            }}>N</div>
            <h1 style={{ fontSize: 36, fontWeight: 800, color: "#fff", letterSpacing: -1.2, marginBottom: 12, lineHeight: 1.1 }}>
              Hey {name} 👋
            </h1>
            <p style={{ fontSize: 16, color: "#8b8fa3", lineHeight: 1.7, maxWidth: 380, margin: "0 auto 40px" }}>
              Welcome to Nomaad — your all-in-one business OS.<br/>
              Let's get your workspace set up in 2 minutes.
            </p>
            <button onClick={() => go(1)} style={primaryBtn}>
              Let's go →
            </button>
          </div>
        )}

        {/* ── Step 1: Role ────────────────────────────────────────────────── */}
        {step === 1 && (
          <div style={{ width: "100%", animation: "fadeUp 0.4s ease" }}>
            <h2 style={heading}>What best describes you?</h2>
            <p style={sub}>This helps us tailor your dashboard.</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 24 }}>
              {ROLES.map(r => (
                <button key={r.id} onClick={() => setRole(r.id)} style={{
                  ...optionCard,
                  border: `1.5px solid ${role === r.id ? VOLT : "rgba(255,255,255,0.08)"}`,
                  background: role === r.id ? "rgba(204,253,1,0.07)" : "rgba(255,255,255,0.03)",
                  boxShadow: role === r.id ? "0 0 0 1px rgba(204,253,1,0.15)" : "none",
                }}>
                  <span style={{ fontSize: 24, marginBottom: 8, display: "block" }}>{r.emoji}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: role === r.id ? VOLT : "#fff", display: "block", marginBottom: 3 }}>{r.label}</span>
                  <span style={{ fontSize: 11.5, color: "#8b8fa3" }}>{r.desc}</span>
                </button>
              ))}
            </div>
            <div style={navRow}>
              <button onClick={() => go(0)} style={ghostBtn}>← Back</button>
              <button onClick={() => go(2)} disabled={!role} style={{ ...primaryBtn, opacity: role ? 1 : 0.4 }}>Continue →</button>
            </div>
          </div>
        )}

        {/* ── Step 2: Features ────────────────────────────────────────────── */}
        {step === 2 && (
          <div style={{ width: "100%", animation: "fadeUp 0.4s ease" }}>
            <h2 style={heading}>What will you use Nomaad for?</h2>
            <p style={sub}>Pick everything that applies — you can change this later.</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 24 }}>
              {FEATURES.map(f => {
                const on = features.has(f.id);
                return (
                  <button key={f.id} onClick={() => toggleFeature(f.id)} style={{
                    ...optionCard,
                    border: `1.5px solid ${on ? VOLT : "rgba(255,255,255,0.08)"}`,
                    background: on ? "rgba(204,253,1,0.07)" : "rgba(255,255,255,0.03)",
                    boxShadow: on ? "0 0 0 1px rgba(204,253,1,0.15)" : "none",
                    position: "relative",
                  }}>
                    {on && (
                      <div style={{
                        position: "absolute", top: 10, right: 10,
                        width: 18, height: 18, borderRadius: "50%",
                        background: VOLT, display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                          <path d="M1 4L3.5 6.5L9 1" stroke="#0a0a0a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    )}
                    <span style={{ fontSize: 22, marginBottom: 8, display: "block" }}>{f.emoji}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: on ? VOLT : "#fff", display: "block", marginBottom: 3 }}>{f.label}</span>
                    <span style={{ fontSize: 11.5, color: "#8b8fa3" }}>{f.desc}</span>
                  </button>
                );
              })}
            </div>
            <div style={navRow}>
              <button onClick={() => go(1)} style={ghostBtn}>← Back</button>
              <button onClick={() => go(3)} disabled={features.size === 0} style={{ ...primaryBtn, opacity: features.size ? 1 : 0.4 }}>Continue →</button>
            </div>
          </div>
        )}

        {/* ── Step 3: Business name ───────────────────────────────────────── */}
        {step === 3 && (
          <div style={{ width: "100%", animation: "fadeUp 0.4s ease" }}>
            <h2 style={heading}>What's your business called?</h2>
            <p style={sub}>This appears across your workspace. You can update it anytime.</p>
            <input
              autoFocus
              value={businessName}
              onChange={e => setBusinessName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && businessName.trim() && go(4)}
              placeholder="e.g. Studio Maverick"
              style={{
                width: "100%", marginTop: 24,
                background: "rgba(255,255,255,0.04)",
                border: "1.5px solid rgba(255,255,255,0.1)",
                borderRadius: 16, padding: "16px 20px",
                fontSize: 18, fontWeight: 600, color: "#fff",
                outline: "none", boxSizing: "border-box",
                caretColor: VOLT,
                transition: "border 0.2s",
              }}
              onFocus={e => e.target.style.border = `1.5px solid ${VOLT}`}
              onBlur={e => e.target.style.border = "1.5px solid rgba(255,255,255,0.1)"}
            />
            <p style={{ fontSize: 12, color: "#8b8fa3", marginTop: 10 }}>
              Don't have one yet? No problem — skip for now.
            </p>
            <div style={navRow}>
              <button onClick={() => go(2)} style={ghostBtn}>← Back</button>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => go(4)} style={ghostBtn}>Skip</button>
                <button onClick={() => go(4)} style={primaryBtn}>Continue →</button>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 4: Done ────────────────────────────────────────────────── */}
        {step === 4 && (
          <div style={{ textAlign: "center", animation: "fadeUp 0.5s ease" }}>
            <div style={{ fontSize: 72, marginBottom: 24 }}>🎉</div>
            <h1 style={{ fontSize: 34, fontWeight: 800, color: "#fff", letterSpacing: -1, marginBottom: 12 }}>
              You're all set{businessName ? `, ${businessName}` : ""}!
            </h1>
            <p style={{ fontSize: 15, color: "#8b8fa3", lineHeight: 1.7, maxWidth: 360, margin: "0 auto 40px" }}>
              Your workspace is ready. We've customised Nomaad based on your choices — everything else can be changed in Settings.
            </p>
            <button onClick={finish} disabled={saving} style={{ ...primaryBtn, minWidth: 200, opacity: saving ? 0.7 : 1 }}>
              {saving ? "Setting up…" : "Go to Dashboard →"}
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        input::placeholder { color: #454859; }
      `}</style>
    </div>
  );
}

// ── Shared styles ──────────────────────────────────────────────────────────────
const primaryBtn = {
  background: "linear-gradient(135deg,#ccfd01,#b8e300)",
  color: "#0a0a0a", border: "none", borderRadius: 14,
  padding: "14px 28px", fontSize: 15, fontWeight: 700,
  cursor: "pointer", letterSpacing: -0.2,
  boxShadow: "0 2px 20px rgba(204,253,1,0.2)",
  transition: "opacity 0.2s, transform 0.1s",
};

const ghostBtn = {
  background: "rgba(255,255,255,0.05)",
  color: "#8b8fa3", border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 14, padding: "14px 22px",
  fontSize: 14, fontWeight: 600, cursor: "pointer",
};

const optionCard = {
  display: "flex", flexDirection: "column", alignItems: "flex-start",
  padding: "18px 16px", borderRadius: 16,
  cursor: "pointer", textAlign: "left",
  transition: "all 0.18s cubic-bezier(.4,0,.2,1)",
};

const heading = {
  fontSize: 26, fontWeight: 800, color: "#fff",
  letterSpacing: -0.8, marginBottom: 6,
};

const sub = {
  fontSize: 14, color: "#8b8fa3", lineHeight: 1.6,
};

const navRow = {
  display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 28,
};
