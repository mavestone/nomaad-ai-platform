import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";

const VOLT = "#ccfd01";
const VOLTD = "#b8e300";

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

const SKILLS = [
  { id: "video_editing", label: "Video Editing", emoji: "🎬" },
  { id: "graphic_design", label: "Graphic Design", emoji: "🎨" },
  { id: "web_dev", label: "Web Dev", emoji: "💻" },
  { id: "copywriting", label: "Copywriting", emoji: "📝" },
  { id: "photography", label: "Photography", emoji: "📸" },
  { id: "motion", label: "Motion Graphics", emoji: "✨" },
  { id: "strategy", label: "Brand Strategy", emoji: "🎯" },
  { id: "3d", label: "3D Design", emoji: "🧊" },
];

const STEPS = ["Welcome", "Your Role", "Your Skills", "Your Tools", "Your Business", "Location & Currency", "Your Profile", "Done"];

const CURRENCIES = [
  { code: "USD", symbol: "$", label: "US Dollar", country: "🇺🇸" },
  { code: "GBP", symbol: "£", label: "British Pound", country: "🇬🇧" },
  { code: "EUR", symbol: "€", label: "Euro", country: "🇪🇺" },
  { code: "CAD", symbol: "C$", label: "Canadian Dollar", country: "🇨🇦" },
  { code: "AUD", symbol: "A$", label: "Australian Dollar", country: "🇦🇺" },
  { code: "JPY", symbol: "¥", label: "Japanese Yen", country: "🇯🇵" },
];

function getInitials(name) {
  if (!name) return "?";
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

export default function OnboardingView() {
  const { user, profile, updateProfile, session } = useAuth();
  const [step, setStep]               = useState(0);
  const [role, setRole]               = useState(null);
  const [skills, setSkills]           = useState(new Set());
  const [features, setFeatures]       = useState(new Set(["clients", "projects"]));
  const [businessName, setBusinessName] = useState(profile?.business_name || "");
  const [username, setUsername]       = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [bio, setBio]                 = useState("");
  const [currency, setCurrency]       = useState("USD");
  const [timezone, setTimezone]       = useState(Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");
  const [location, setLocation]        = useState("");
  const [avatarFile, setAvatarFile]   = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [saving, setSaving]           = useState(false);
  const [direction, setDirection]     = useState(1);

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

  const toggleSkill = (id) => {
    setSkills(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const finish = async () => {
    setSaving(true);
    try {
      let avatar_url = null;

      // Upload avatar to Supabase Storage if provided
      if (avatarFile && user?.id) {
        const ext = avatarFile.name.split(".").pop();
        const path = `${user.id}/avatar.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(path, avatarFile, { upsert: true, contentType: avatarFile.type });

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from("avatars")
            .getPublicUrl(path);
          avatar_url = publicUrl;
        }
      }

      const updates = {
        onboarding_complete: true,
        business_type: role,
        business_name: businessName.trim() || null,
        use_cases: [...features],
        skills: [...skills],
        username: username.trim().toLowerCase() || null,
        bio: bio.trim() || null,
        location: location.trim() || null,
        currency: currency,
        timezone: timezone,
        ...(avatar_url ? { avatar_url } : {}),
      };

      // Use raw fetch so auth lock doesn't stall us
      if (session?.access_token) {
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/profiles?id=eq.${user.id}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              "apikey": import.meta.env.VITE_SUPABASE_ANON_KEY,
              "Authorization": `Bearer ${session.access_token}`,
              "Prefer": "return=minimal",
            },
            body: JSON.stringify(updates),
          }
        );
        if (res.ok) {
          // Trigger context refresh so App.jsx sees onboarding_complete = true
          await updateProfile({});
        } else {
          // Fallback to context method
          await updateProfile(updates);
        }
      } else {
        await updateProfile(updates);
      }
    } catch (err) {
      console.error("Onboarding finish error:", err);
      // Try fallback
      await updateProfile({
        onboarding_complete: true,
        business_type: role,
        business_name: businessName.trim() || null,
        use_cases: [...features],
        skills: [...skills],
        username: username.trim().toLowerCase() || null,
        bio: bio.trim() || null,
      });
    }
  };

  const progress = step / (STEPS.length - 1);
  const inp = {
    width: "100%", background: "rgba(255,255,255,0.04)",
    border: "1.5px solid rgba(255,255,255,0.1)", borderRadius: 14,
    padding: "14px 18px", fontSize: 15, fontWeight: 500, color: "#fff",
    outline: "none", boxSizing: "border-box", caretColor: VOLT,
    transition: "border 0.2s", fontFamily: "inherit",
  };

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
          background: `linear-gradient(90deg, ${VOLT}, ${VOLTD})`,
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
      <div style={{ width: "100%", maxWidth: 520, display: "flex", flexDirection: "column", alignItems: "center", gap: 32 }}>

        {/* ── Step 0: Welcome ── */}
        {step === 0 && (
          <div style={{ textAlign: "center", animation: "fadeUp 0.5s ease" }}>
            <div style={{
              width: 72, height: 72, borderRadius: 22, margin: "0 auto 28px",
              background: `linear-gradient(135deg,${VOLT},${VOLTD})`,
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
            <button type="button" onClick={() => go(1)} style={primaryBtn}>Let's go →</button>
          </div>
        )}

        {/* ── Step 1: Role ── */}
        {step === 1 && (
          <div style={{ width: "100%", animation: "fadeUp 0.4s ease" }}>
            <h2 style={heading}>What best describes you?</h2>
            <p style={sub}>This helps us tailor your dashboard.</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 24 }}>
              {ROLES.map(r => (
                <button type="button" key={r.id} onClick={() => setRole(r.id)} style={{
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
              <button type="button" onClick={() => go(0)} style={ghostBtn}>← Back</button>
              <button type="button" onClick={() => go(2)} disabled={!role} style={{ ...primaryBtn, opacity: role ? 1 : 0.4 }}>Continue →</button>
            </div>
          </div>
        )}

        {/* ── Step 2: Skills ── */}
        {step === 2 && (
          <div style={{ width: "100%", animation: "fadeUp 0.4s ease" }}>
            <h2 style={heading}>What are your primary skills?</h2>
            <p style={sub}>Select the core services you offer to clients.</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 24 }}>
              {SKILLS.map(s => {
                const on = skills.has(s.id);
                return (
                  <button type="button" key={s.id} onClick={() => toggleSkill(s.id)} style={{
                    ...optionCard,
                    border: `1.5px solid ${on ? VOLT : "rgba(255,255,255,0.08)"}`,
                    background: on ? "rgba(204,253,1,0.07)" : "rgba(255,255,255,0.03)",
                    boxShadow: on ? "0 0 0 1px rgba(204,253,1,0.15)" : "none",
                    position: "relative", alignItems: "center", flexDirection: "row", gap: 12,
                    padding: "16px",
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
                    <span style={{ fontSize: 24, display: "block" }}>{s.emoji}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: on ? VOLT : "#fff", display: "block" }}>{s.label}</span>
                  </button>
                );
              })}
            </div>
            <div style={navRow}>
              <button type="button" onClick={() => go(1)} style={ghostBtn}>← Back</button>
              <button type="button" onClick={() => go(3)} disabled={skills.size === 0} style={{ ...primaryBtn, opacity: skills.size ? 1 : 0.4 }}>Continue →</button>
            </div>
          </div>
        )}

        {/* ── Step 3: Features ── */}
        {step === 3 && (
          <div style={{ width: "100%", animation: "fadeUp 0.4s ease" }}>
            <h2 style={heading}>What will you use Nomaad for?</h2>
            <p style={sub}>Pick everything that applies — you can change this later.</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 24 }}>
              {FEATURES.map(f => {
                const on = features.has(f.id);
                return (
                  <button type="button" key={f.id} onClick={() => toggleFeature(f.id)} style={{
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
              <button type="button" onClick={() => go(2)} style={ghostBtn}>← Back</button>
              <button type="button" onClick={() => go(4)} disabled={features.size === 0} style={{ ...primaryBtn, opacity: features.size ? 1 : 0.4 }}>Continue →</button>
            </div>
          </div>
        )}

        {/* ── Step 4: Business name ── */}
        {step === 4 && (
          <div style={{ width: "100%", animation: "fadeUp 0.4s ease" }}>
            <h2 style={heading}>What's your business called?</h2>
            <p style={sub}>This appears across your workspace. You can update it anytime.</p>
            <input
              autoFocus
              value={businessName}
              onChange={e => setBusinessName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && go(5)}
              placeholder="e.g. Studio Maverick"
              style={{ ...inp, marginTop: 24, fontSize: 18, fontWeight: 600 }}
              onFocus={e => e.target.style.border = `1.5px solid ${VOLT}`}
              onBlur={e => e.target.style.border = "1.5px solid rgba(255,255,255,0.1)"}
            />
            <p style={{ fontSize: 12, color: "#8b8fa3", marginTop: 10 }}>
              Don't have one yet? No problem — skip for now.
            </p>
            <div style={navRow}>
              <button type="button" onClick={() => go(3)} style={ghostBtn}>← Back</button>
              <div style={{ display: "flex", gap: 10 }}>
                <button type="button" onClick={() => go(5)} style={ghostBtn}>Skip</button>
                <button type="button" onClick={() => go(5)} style={primaryBtn}>Continue →</button>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 5: Location & Currency ── */}
        {step === 5 && (
          <div style={{ width: "100%", animation: "fadeUp 0.4s ease" }}>
            <h2 style={heading}>Where are you based?</h2>
            <p style={sub}>This helps with currencies, timezones, and client contacts.</p>
            
            {/* Location input */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "rgba(139,143,163,0.8)", letterSpacing: 0.6, textTransform: "uppercase", display: "block", marginBottom: 8 }}>
                City & Country
              </label>
              <input
                autoFocus
                value={location}
                onChange={e => setLocation(e.target.value)}
                onKeyDown={e => e.key === "Enter" && go(6)}
                placeholder="e.g. London, UK"
                style={{ ...inp, fontSize: 16 }}
                onFocus={e => e.target.style.border = `1.5px solid ${VOLT}`}
                onBlur={e => e.target.style.border = "1.5px solid rgba(255,255,255,0.1)"}
              />
            </div>

            {/* Currency selector */}
            <div style={{ marginBottom: 8 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "rgba(139,143,163,0.8)", letterSpacing: 0.6, textTransform: "uppercase", display: "block", marginBottom: 8 }}>
                Currency
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                {CURRENCIES.map(c => (
                  <button type="button" key={c.code} onClick={() => setCurrency(c.code)} style={{
                    ...optionCard,
                    padding: "12px 10px",
                    border: `1.5px solid ${currency === c.code ? VOLT : "rgba(255,255,255,0.08)"}`,
                    background: currency === c.code ? "rgba(204,253,1,0.07)" : "rgba(255,255,255,0.03)",
                  }}>
                    <span style={{ fontSize: 18, marginBottom: 4, display: "block", color: "#fff" }}>{c.country} {c.symbol}</span>
                    <span style={{ fontSize: 11, color: currency === c.code ? VOLT : "#fff", fontWeight: 600 }}>{c.code}</span>
                  </button>
                ))}
              </div>
            </div>

            <div style={navRow}>
              <button type="button" onClick={() => go(4)} style={ghostBtn}>← Back</button>
              <div style={{ display: "flex", gap: 10 }}>
                <button type="button" onClick={() => go(6)} style={ghostBtn}>Skip</button>
                <button type="button" onClick={() => go(6)} style={primaryBtn}>Continue →</button>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 6: Profile (avatar + username + bio) ── */}
        {step === 6 && (
          <div style={{ width: "100%", animation: "fadeUp 0.4s ease" }}>
            <h2 style={heading}>Set up your public profile</h2>
            <p style={sub}>Clients will see this when they visit your Nomaad page.</p>

            {/* Avatar upload */}
            <div style={{ display: "flex", justifyContent: "center", marginTop: 24, marginBottom: 20 }}>
              <label style={{ cursor: "pointer", position: "relative", display: "inline-block" }}>
                <input
                  type="file" accept="image/*"
                  onChange={handleAvatarChange}
                  style={{ display: "none" }}
                />
                <div style={{
                  width: 96, height: 96, borderRadius: "50%",
                  background: avatarPreview
                    ? `url(${avatarPreview}) center/cover`
                    : `linear-gradient(135deg, ${VOLT}cc, ${VOLT}66)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 28, fontWeight: 800, color: "#0a0a0a",
                  border: `3px solid ${VOLT}44`,
                  boxShadow: "0 4px 24px rgba(204,253,1,0.15)",
                  overflow: "hidden",
                }}>
                  {!avatarPreview && getInitials(profile?.full_name || user?.user_metadata?.full_name)}
                </div>
                {/* Camera badge */}
                <div style={{
                  position: "absolute", bottom: 2, right: 2,
                  width: 28, height: 28, borderRadius: "50%",
                  background: VOLT, border: "2.5px solid #08080a",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0a0a0a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                </div>
              </label>
            </div>
            <p style={{ textAlign: "center", fontSize: 12, color: "#8b8fa3", marginBottom: 20, marginTop: -8 }}>
              Click to upload a photo
            </p>

            {/* Username */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "rgba(139,143,163,0.8)", letterSpacing: 0.6, textTransform: "uppercase", display: "block", marginBottom: 8 }}>
                Username
              </label>
              <div style={{ position: "relative" }}>
                <input
                  value={username}
                  onChange={e => {
                    setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
                    setUsernameError("");
                  }}
                  placeholder="your-username"
                  style={{ ...inp, paddingRight: 100 }}
                  onFocus={e => e.target.style.border = `1.5px solid ${VOLT}`}
                  onBlur={e => e.target.style.border = "1.5px solid rgba(255,255,255,0.1)"}
                />
                <span style={{
                  position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
                  fontSize: 13, color: "#8b8fa3", pointerEvents: "none",
                }}>.nomaad.ai</span>
              </div>
              {usernameError && (
                <p style={{ fontSize: 12, color: "#FF453A", marginTop: 6 }}>{usernameError}</p>
              )}
              {username && !usernameError && (
                <p style={{ fontSize: 12, color: VOLT, marginTop: 6 }}>
                  ✓ Your page will be at {username}.nomaad.ai
                </p>
              )}
              {!username && (
                <p style={{ fontSize: 12, color: "#8b8fa3", marginTop: 6 }}>
                  Lowercase letters, numbers and hyphens only. You can change this later.
                </p>
              )}
            </div>

            {/* Bio */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "rgba(139,143,163,0.8)", letterSpacing: 0.6, textTransform: "uppercase", display: "block", marginBottom: 8 }}>
                Bio
              </label>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder="Short bio or tagline — e.g. 'Brand designer helping startups launch fast'"
                rows={3}
                style={{
                  ...inp, resize: "vertical", lineHeight: 1.6,
                  fontSize: 14,
                }}
                onFocus={e => e.target.style.border = `1.5px solid ${VOLT}`}
                onBlur={e => e.target.style.border = "1.5px solid rgba(255,255,255,0.1)"}
              />
            </div>

            <div style={navRow}>
              <button type="button" onClick={() => go(4)} style={ghostBtn}>← Back</button>
              <div style={{ display: "flex", gap: 10 }}>
                <button type="button" onClick={() => go(7)} style={ghostBtn}>Skip</button>
                <button type="button" onClick={() => go(7)} style={primaryBtn}>Continue →</button>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 7: Done ── */}
        {step === 7 && (
          <div style={{ textAlign: "center", animation: "fadeUp 0.5s ease" }}>
            <div style={{ fontSize: 72, marginBottom: 24 }}>🎉</div>
            <h1 style={{ fontSize: 34, fontWeight: 800, color: "#fff", letterSpacing: -1, marginBottom: 12 }}>
              You're all set{businessName ? `, ${businessName}` : ""}!
            </h1>
            <p style={{ fontSize: 15, color: "#8b8fa3", lineHeight: 1.7, maxWidth: 360, margin: "0 auto 16px" }}>
              Your workspace is ready. We've customised Nomaad based on your choices.
            </p>
            {username && (
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "8px 16px", borderRadius: 20, marginBottom: 28,
                background: "rgba(204,253,1,0.08)", border: "1px solid rgba(204,253,1,0.2)",
                fontSize: 13, color: VOLT, fontWeight: 600,
              }}>
                🌐 {username}.nomaad.ai
              </div>
            )}
            {!username && <div style={{ marginBottom: 28 }} />}
            <button type="button" onClick={finish} disabled={saving} style={{ ...primaryBtn, minWidth: 200, opacity: saving ? 0.7 : 1 }}>
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
        input::placeholder, textarea::placeholder { color: #454859; }
        textarea { font-family: -apple-system,'SF Pro Display',system-ui,sans-serif; }
      `}</style>
    </div>
  );
}

// ── Shared styles ──────────────────────────────────────────────────────────────
const primaryBtn = {
  background: `linear-gradient(135deg,#ccfd01,#b8e300)`,
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
