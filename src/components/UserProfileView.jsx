import { useState, useRef, useCallback } from "react";
import { supabase } from "../lib/supabase";

// ── Constants ─────────────────────────────────────────────────────────────────
const VOLT = "#ccfd01";
const VOLTD = "#b8e300";

const ROLE_COLORS = {
  freelancer: VOLT,
  agency:     "#5AC8FA",
  consultant: "#FFB340",
  creative:   "#AF52DE",
  developer:  "#64D2FF",
  default:    "#FF6259",
};

const ROLE_LABELS = {
  freelancer: "Freelancer",
  agency:     "Agency",
  consultant: "Consultant",
  creative:   "Creative",
  developer:  "Developer",
  other:      "Other",
};

const ROLE_EMOJIS = {
  freelancer: "💻",
  agency:     "🏢",
  consultant: "🎯",
  creative:   "🎨",
  developer:  "⚙️",
  other:      "✨",
};

const AVAIL_CONFIG = {
  available: { label: "Available", color: "#34C759" },
  busy:      { label: "Busy",      color: "#FFB340" },
  away:      { label: "Away",      color: "#8b8fa3" },
};

const PROJECT_CATS = ["Photo", "Video", "Design", "Development", "Branding", "Motion", "Other"];

const UNSPLASH_IDS = [
  "1618005198919-d3d4b5a92ead",
  "1558655146-364adaf1fda9",
  "1561070791-2526d30994b5",
  "1541701494587-cb58502866ab",
  "1497366754035-f200968a6e72",
  "1558618666-fcd25c85cd64",
  "1521737604893-d14f6ea5a863",
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function getInitials(name) {
  if (!name) return "?";
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

function getRoleColor(businessType) {
  return ROLE_COLORS[businessType] || ROLE_COLORS.default;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Avatar({ profile, size = 80 }) {
  const roleColor = getRoleColor(profile?.business_type);
  const avail = profile?.availability || "away";
  const availColor = AVAIL_CONFIG[avail]?.color || AVAIL_CONFIG.away.color;

  return (
    <div style={{ position: "relative", display: "inline-block", flexShrink: 0 }}>
      {profile?.avatar_url ? (
        <img
          src={profile.avatar_url}
          alt={profile.full_name || "Avatar"}
          style={{
            width: size, height: size, borderRadius: "50%",
            objectFit: "cover",
            border: "3px solid #08080a",
            boxShadow: `0 4px 24px rgba(0,0,0,0.5), 0 0 0 2px ${roleColor}55`,
          }}
        />
      ) : (
        <div style={{
          width: size, height: size, borderRadius: "50%",
          background: `linear-gradient(135deg, ${roleColor}dd, ${roleColor}66)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: size * 0.3, fontWeight: 700, color: "#08080a",
          border: "3px solid #08080a",
          boxShadow: `0 4px 24px rgba(0,0,0,0.5), 0 0 0 2px ${roleColor}55`,
          letterSpacing: -0.5, userSelect: "none",
        }}>
          {getInitials(profile?.full_name)}
        </div>
      )}
      <div style={{
        position: "absolute", bottom: 4, right: 4,
        width: 14, height: 14, borderRadius: "50%",
        background: availColor,
        border: "2.5px solid #08080a",
        boxShadow: `0 0 8px ${availColor}99`,
      }} />
    </div>
  );
}

function RoleBadge({ businessType }) {
  const color = getRoleColor(businessType);
  const label = ROLE_LABELS[businessType] || "Creative";
  const emoji = ROLE_EMOJIS[businessType] || "✨";
  const hex = color.replace("#", "");
  const r = parseInt(hex.slice(0,2), 16);
  const g = parseInt(hex.slice(2,4), 16);
  const b = parseInt(hex.slice(4,6), 16);
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "4px 12px", borderRadius: 20,
      background: `rgba(${r},${g},${b},0.15)`,
      border: `1px solid rgba(${r},${g},${b},0.3)`,
      color, fontSize: 12, fontWeight: 600,
    }}>
      {emoji} {label}
    </span>
  );
}

function SocialLinks({ links, editing, editedLinks, onChangeLink }) {
  const socials = [
    {
      key: "twitter", label: "Twitter / X", placeholder: "@handle",
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>,
    },
    {
      key: "instagram", label: "Instagram", placeholder: "@handle",
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>,
    },
    {
      key: "linkedin", label: "LinkedIn", placeholder: "linkedin.com/in/handle",
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"/><circle cx="4" cy="4" r="2"/></svg>,
    },
    {
      key: "website", label: "Website", placeholder: "https://example.com",
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>,
    },
  ];

  if (editing) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {socials.map(s => (
          <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 9, flexShrink: 0,
              background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "rgba(255,255,255,0.4)",
            }}>{s.icon}</div>
            <input
              value={editedLinks?.[s.key] || ""}
              onChange={e => onChangeLink(s.key, e.target.value)}
              placeholder={s.placeholder}
              style={{
                flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 9, padding: "7px 11px", fontSize: 13, color: "#f0f0f5",
                outline: "none", caretColor: VOLT, fontFamily: "inherit", transition: "border 0.2s",
              }}
              onFocus={e => e.target.style.border = `1px solid ${VOLT}`}
              onBlur={e => e.target.style.border = "1px solid rgba(255,255,255,0.08)"}
            />
          </div>
        ))}
      </div>
    );
  }

  const hasAny = links && Object.values(links).some(v => v);
  if (!hasAny) return <div style={{ fontSize: 13, color: "rgba(139,143,163,0.5)", fontStyle: "italic" }}>No links added yet.</div>;

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {socials.map(s => {
        const val = links?.[s.key];
        if (!val) return null;
        return (
          <a
            key={s.key}
            href={s.key === "website" ? val : s.key === "linkedin" ? `https://${val.replace(/^https?:\/\//,"")}` : `https://${s.key}.com/${val.replace(/^@/,"")}`}
            target="_blank" rel="noopener noreferrer" title={val}
            style={{
              width: 36, height: 36, borderRadius: 10,
              background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "rgba(255,255,255,0.5)", textDecoration: "none", transition: "all 0.2s ease",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "#fff"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "rgba(255,255,255,0.5)"; }}
          >{s.icon}</a>
        );
      })}
    </div>
  );
}

function ProjectCard({ project, index, editing, onEdit, onDelete }) {
  const [hovered, setHovered] = useState(false);
  const coverUrl = project.cover_url || `https://images.unsplash.com/photo-${UNSPLASH_IDS[index % UNSPLASH_IDS.length]}?w=400&q=80`;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative", borderRadius: 16, overflow: "hidden",
        background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
        transform: hovered ? "scale(1.025)" : "scale(1)",
        boxShadow: hovered ? "0 8px 32px rgba(0,0,0,0.4)" : "0 2px 8px rgba(0,0,0,0.2)",
        transition: "transform 0.25s cubic-bezier(.4,0,.2,1), box-shadow 0.25s ease",
        animation: `fadeUp 0.4s ease ${index * 0.06}s backwards`,
      }}
    >
      <div style={{ height: 130, overflow: "hidden", position: "relative" }}>
        <img
          src={coverUrl} alt={project.title}
          style={{
            width: "100%", height: "100%", objectFit: "cover",
            transform: hovered ? "scale(1.06)" : "scale(1)",
            transition: "transform 0.4s ease",
          }}
          onError={e => { e.target.style.display = "none"; }}
        />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 40%, rgba(8,8,10,0.7) 100%)" }} />
        {project.category && (
          <span style={{
            position: "absolute", top: 10, left: 10,
            background: "rgba(8,8,10,0.7)", backdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,0.12)", borderRadius: 20,
            padding: "3px 10px", fontSize: 10, fontWeight: 700,
            color: "rgba(255,255,255,0.8)", letterSpacing: 0.5, textTransform: "uppercase",
          }}>{project.category}</span>
        )}
      </div>
      <div style={{ padding: "10px 12px 12px" }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#f0f0f5", marginBottom: 2 }}>{project.title}</div>
        {project.year && <div style={{ fontSize: 12, color: "#8b8fa3" }}>{project.year}</div>}
      </div>
      {editing && hovered && (
        <div style={{
          position: "absolute", inset: 0, background: "rgba(8,8,10,0.75)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
        }}>
          <button onClick={() => onEdit(project)} style={{
            display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.08)",
            color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Edit
          </button>
          <button onClick={() => onDelete(project.id)} style={{
            display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 10,
            border: "1px solid rgba(255,59,48,0.25)", background: "rgba(255,59,48,0.1)",
            color: "#FF453A", fontSize: 13, fontWeight: 600, cursor: "pointer",
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
          </button>
        </div>
      )}
    </div>
  );
}

function AddProjectForm({ onSave, onCancel }) {
  const [form, setForm] = useState({ title: "", category: "Design", year: new Date().getFullYear(), cover_url: "" });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const inp = {
    width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 10, padding: "9px 12px", fontSize: 13, color: "#f0f0f5",
    outline: "none", caretColor: VOLT, fontFamily: "inherit", boxSizing: "border-box", transition: "border 0.2s",
  };
  return (
    <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: "18px 16px", marginBottom: 16 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: "#f0f0f5", marginBottom: 14 }}>New Project</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <input autoFocus value={form.title} onChange={e => set("title", e.target.value)} placeholder="Project title" style={inp}
          onFocus={e => e.target.style.border = `1px solid ${VOLT}`} onBlur={e => e.target.style.border = "1px solid rgba(255,255,255,0.08)"}/>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <select value={form.category} onChange={e => set("category", e.target.value)} style={{ ...inp, cursor: "pointer", appearance: "none" }}
            onFocus={e => e.target.style.border = `1px solid ${VOLT}`} onBlur={e => e.target.style.border = "1px solid rgba(255,255,255,0.08)"}>
            {PROJECT_CATS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <input type="number" value={form.year} onChange={e => set("year", parseInt(e.target.value) || new Date().getFullYear())} placeholder="Year" style={inp}
            onFocus={e => e.target.style.border = `1px solid ${VOLT}`} onBlur={e => e.target.style.border = "1px solid rgba(255,255,255,0.08)"}/>
        </div>
        <input value={form.cover_url} onChange={e => set("cover_url", e.target.value)} placeholder="Cover image URL (optional)" style={inp}
          onFocus={e => e.target.style.border = `1px solid ${VOLT}`} onBlur={e => e.target.style.border = "1px solid rgba(255,255,255,0.08)"}/>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        <button onClick={() => { if (form.title.trim()) onSave(form); }} disabled={!form.title.trim()} style={{
          flex: 1, padding: "9px", borderRadius: 10, border: "none",
          background: form.title.trim() ? `linear-gradient(135deg, ${VOLT}, ${VOLTD})` : "rgba(255,255,255,0.06)",
          color: form.title.trim() ? "#0a0a0a" : "#8b8fa3",
          fontSize: 13, fontWeight: 700, cursor: form.title.trim() ? "pointer" : "not-allowed",
        }}>Save Project</button>
        <button onClick={onCancel} style={{ padding: "9px 16px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", background: "transparent", color: "#8b8fa3", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
      </div>
    </div>
  );
}

function EditProjectForm({ project, onSave, onCancel }) {
  const [form, setForm] = useState({ ...project });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const inp = {
    width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 10, padding: "9px 12px", fontSize: 13, color: "#f0f0f5",
    outline: "none", caretColor: VOLT, fontFamily: "inherit", boxSizing: "border-box", transition: "border 0.2s",
  };
  return (
    <div style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${VOLT}44`, borderRadius: 16, padding: "18px 16px", marginBottom: 16 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: "#f0f0f5", marginBottom: 14 }}>Edit Project</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <input autoFocus value={form.title} onChange={e => set("title", e.target.value)} placeholder="Project title" style={inp}
          onFocus={e => e.target.style.border = `1px solid ${VOLT}`} onBlur={e => e.target.style.border = "1px solid rgba(255,255,255,0.08)"}/>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <select value={form.category} onChange={e => set("category", e.target.value)} style={{ ...inp, cursor: "pointer", appearance: "none" }}
            onFocus={e => e.target.style.border = `1px solid ${VOLT}`} onBlur={e => e.target.style.border = "1px solid rgba(255,255,255,0.08)"}>
            {PROJECT_CATS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <input type="number" value={form.year} onChange={e => set("year", parseInt(e.target.value) || new Date().getFullYear())} placeholder="Year" style={inp}
            onFocus={e => e.target.style.border = `1px solid ${VOLT}`} onBlur={e => e.target.style.border = "1px solid rgba(255,255,255,0.08)"}/>
        </div>
        <input value={form.cover_url || ""} onChange={e => set("cover_url", e.target.value)} placeholder="Cover image URL (optional)" style={inp}
          onFocus={e => e.target.style.border = `1px solid ${VOLT}`} onBlur={e => e.target.style.border = "1px solid rgba(255,255,255,0.08)"}/>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        <button onClick={() => onSave(form)} style={{ flex: 1, padding: "9px", borderRadius: 10, border: "none", background: `linear-gradient(135deg, ${VOLT}, ${VOLTD})`, color: "#0a0a0a", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Save Changes</button>
        <button onClick={onCancel} style={{ padding: "9px 16px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", background: "transparent", color: "#8b8fa3", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function UserProfileView({ t, dark, onClose, user, profile, updateProfile, signOut }) {
  const [editing, setEditing]             = useState(false);
  const [saving, setSaving]               = useState(false);
  const [saveError, setSaveError]         = useState(null);
  const [usernameError, setUsernameError] = useState(null);
  const [copiedLink, setCopiedLink]       = useState(false);
  const [addingProject, setAddingProject] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [editedProfile, setEditedProfile] = useState(null);
  const copyTimeoutRef = useRef();

  const shareableUrl = profile?.username
    ? `${profile.username}.nomaad.ai`
    : `nomaad.ai/p/${profile?.id?.slice(0, 8) || "unknown"}`;

  // Username 7-day rate limit
  const usernameChangedAt = profile?.username_changed_at;
  const daysSinceChange = usernameChangedAt
    ? (Date.now() - new Date(usernameChangedAt)) / (1000 * 60 * 60 * 24)
    : 999;
  const canChangeUsername = daysSinceChange >= 7;
  const daysUntilCanChange = Math.ceil(7 - daysSinceChange);

  const startEditing = useCallback(() => {
    setEditedProfile({
      full_name:          profile?.full_name || "",
      bio:                profile?.bio || "",
      location:           profile?.location || "",
      availability:       profile?.availability || "away",
      social_links:       { ...(profile?.social_links || {}) },
      username:           profile?.username || "",
      portfolio_projects: [...(profile?.portfolio_projects || [])],
    });
    setSaveError(null);
    setUsernameError(null);
    setEditing(true);
  }, [profile]);

  const cancelEditing = () => {
    setEditing(false);
    setEditedProfile(null);
    setAddingProject(false);
    setEditingProject(null);
    setSaveError(null);
    setUsernameError(null);
  };

  const saveChanges = async () => {
    if (!editedProfile) return;
    setSaveError(null);
    setUsernameError(null);

    const newUsername = editedProfile.username?.trim().toLowerCase() || null;
    const usernameChanged = newUsername !== (profile?.username || null);

    if (usernameChanged && newUsername) {
      if (!canChangeUsername) {
        setUsernameError(`You can change your username again in ${daysUntilCanChange} day${daysUntilCanChange === 1 ? "" : "s"}`);
        return;
      }
      const { data: existing } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", newUsername)
        .neq("id", user.id)
        .maybeSingle();
      if (existing) {
        setUsernameError("That username is already taken");
        return;
      }
    }

    setSaving(true);
    const updates = {
      full_name:          editedProfile.full_name,
      bio:                editedProfile.bio,
      location:           editedProfile.location,
      availability:       editedProfile.availability,
      social_links:       editedProfile.social_links,
      portfolio_projects: editedProfile.portfolio_projects,
      username:           newUsername,
      ...(usernameChanged && newUsername ? { username_changed_at: new Date().toISOString() } : {}),
    };

    try {
      const result = await updateProfile(updates);
      if (result?.error) {
        setSaveError(result.error.message || "Failed to save. Please try again.");
      } else {
        setEditing(false);
        setEditedProfile(null);
        setAddingProject(false);
        setEditingProject(null);
      }
    } catch (err) {
      setSaveError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const setField = (key, val) => setEditedProfile(p => ({ ...p, [key]: val }));
  const setSocialLink = (key, val) => setEditedProfile(p => ({ ...p, social_links: { ...p.social_links, [key]: val } }));

  const addProject = (form) => {
    const project = { id: Date.now().toString(), ...form };
    setEditedProfile(p => ({ ...p, portfolio_projects: [...(p.portfolio_projects || []), project] }));
    setAddingProject(false);
  };

  const updateProject = (updated) => {
    setEditedProfile(p => ({
      ...p,
      portfolio_projects: p.portfolio_projects.map(pr => pr.id === updated.id ? updated : pr),
    }));
    setEditingProject(null);
  };

  const deleteProject = (id) => {
    setEditedProfile(p => ({ ...p, portfolio_projects: p.portfolio_projects.filter(pr => pr.id !== id) }));
    if (editingProject?.id === id) setEditingProject(null);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(`https://${shareableUrl}`).catch(() => {});
    setCopiedLink(true);
    clearTimeout(copyTimeoutRef.current);
    copyTimeoutRef.current = setTimeout(() => setCopiedLink(false), 2000);
  };

  const dp = editing ? editedProfile : profile;
  const projects = dp?.portfolio_projects || [];
  const socialLinks = dp?.social_links || {};

  const inp = {
    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 10, padding: "8px 12px", fontSize: 14, color: "#f0f0f5",
    outline: "none", caretColor: VOLT, fontFamily: "inherit",
    transition: "border 0.2s", width: "100%", boxSizing: "border-box",
  };

  return (
    <div style={{
      width: "100%", height: "100%", overflowY: "auto",
      background: "#08080a",
      fontFamily: "-apple-system,'SF Pro Display',system-ui,sans-serif",
      WebkitFontSmoothing: "antialiased", color: "#f0f0f5",
    }}>

      {/* ── Banner ── */}
      <div style={{ position: "relative", width: "100%", height: 180, overflow: "hidden", flexShrink: 0 }}>
        {/* Photo strip */}
        <div style={{ display: "flex", width: "100%", height: "100%" }}>
          {UNSPLASH_IDS.slice(0, 5).map(id => (
            <img key={id} src={`https://images.unsplash.com/photo-${id}?w=500&q=75`} alt=""
              style={{ flex: 1, height: "100%", objectFit: "cover" }} />
          ))}
        </div>
        {/* Gradient overlay */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(8,8,10,0.1) 30%, rgba(8,8,10,0.65) 100%)" }} />

        {/* Top-right actions */}
        <div style={{ position: "absolute", top: 14, right: 16, display: "flex", gap: 8, alignItems: "center" }}>
          {!editing ? (
            <>
              <button onClick={startEditing} style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "7px 16px", borderRadius: 20,
                background: "rgba(8,8,10,0.55)", backdropFilter: "blur(12px)",
                border: "1px solid rgba(255,255,255,0.18)",
                color: "#f0f0f5", fontSize: 13, fontWeight: 600, cursor: "pointer",
              }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                Edit Profile
              </button>
              {signOut && (
                <button onClick={() => signOut()} title="Sign out" style={{
                  width: 34, height: 34, borderRadius: "50%",
                  background: "rgba(8,8,10,0.55)", backdropFilter: "blur(12px)",
                  border: "1px solid rgba(255,255,255,0.18)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "rgba(255,255,255,0.6)", cursor: "pointer",
                }}>
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
                    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              )}
            </>
          ) : (
            <>
              <button onClick={cancelEditing} style={{
                padding: "7px 14px", borderRadius: 20,
                background: "rgba(8,8,10,0.55)", backdropFilter: "blur(12px)",
                border: "1px solid rgba(255,255,255,0.18)",
                color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: 600, cursor: "pointer",
              }}>Cancel</button>
              <button onClick={saveChanges} disabled={saving} style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "7px 18px", borderRadius: 20, border: "none",
                background: saving ? "rgba(204,253,1,0.5)" : `linear-gradient(135deg, ${VOLT}, ${VOLTD})`,
                color: "#0a0a0a", fontSize: 13, fontWeight: 700, cursor: saving ? "wait" : "pointer",
                boxShadow: saving ? "none" : "0 2px 16px rgba(204,253,1,0.25)",
              }}>
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Hero info ── */}
      <div style={{ padding: "0 28px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        {/* Avatar — pulled up over banner with negative margin, LinkedIn-style */}
        <div style={{ marginTop: -44, marginBottom: 14 }}>
          <Avatar profile={editing ? { ...profile, availability: editedProfile?.availability } : profile} size={96} />
        </div>

        {/* Name */}
        {editing ? (
          <input
            value={editedProfile?.full_name || ""}
            onChange={e => setField("full_name", e.target.value)}
            placeholder="Your name"
            style={{ ...inp, fontSize: 26, fontWeight: 800, letterSpacing: -0.5, marginBottom: 12, padding: "6px 10px" }}
            onFocus={e => e.target.style.border = `1px solid ${VOLT}`}
            onBlur={e => e.target.style.border = "1px solid rgba(255,255,255,0.1)"}
          />
        ) : (
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#f0f0f5", letterSpacing: -0.5, margin: "0 0 8px", lineHeight: 1.15 }}>
            {profile?.full_name || profile?.business_name || "Your Name"}
          </h1>
        )}

        {/* Role badge + availability */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
          <RoleBadge businessType={profile?.business_type} />
          {editing ? (
            <div style={{ display: "flex", gap: 6 }}>
              {Object.entries(AVAIL_CONFIG).map(([key, cfg]) => {
                const active = editedProfile?.availability === key;
                return (
                  <button key={key} onClick={() => setField("availability", key)} style={{
                    display: "flex", alignItems: "center", gap: 5,
                    padding: "4px 12px", borderRadius: 20,
                    border: `1px solid ${active ? cfg.color + "55" : "rgba(255,255,255,0.1)"}`,
                    background: active ? `${cfg.color}18` : "transparent",
                    color: active ? cfg.color : "#8b8fa3",
                    fontSize: 12, fontWeight: 600, cursor: "pointer",
                  }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: active ? cfg.color : "rgba(139,143,163,0.4)" }} />
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          ) : (() => {
            const avail = profile?.availability || "away";
            const cfg = AVAIL_CONFIG[avail];
            return (
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "4px 12px", borderRadius: 20,
                background: `${cfg.color}18`, border: `1px solid ${cfg.color}44`,
                color: cfg.color, fontSize: 12, fontWeight: 600,
              }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.color }} />
                {cfg.label}
              </span>
            );
          })()}
        </div>

        {/* Bio */}
        {editing ? (
          <textarea
            value={editedProfile?.bio || ""}
            onChange={e => setField("bio", e.target.value)}
            placeholder="Write a short bio or headline…"
            rows={2}
            style={{ ...inp, resize: "vertical", lineHeight: 1.6, marginBottom: 12 }}
            onFocus={e => e.target.style.border = `1px solid ${VOLT}`}
            onBlur={e => e.target.style.border = "1px solid rgba(255,255,255,0.1)"}
          />
        ) : profile?.bio ? (
          <p style={{ fontSize: 14, color: "rgba(240,240,245,0.6)", lineHeight: 1.7, margin: "0 0 12px", maxWidth: 560 }}>
            {profile.bio}
          </p>
        ) : null}

        {/* Location + public link row */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          {editing ? (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 14 }}>📍</span>
              <input
                value={editedProfile?.location || ""}
                onChange={e => setField("location", e.target.value)}
                placeholder="Location"
                style={{ ...inp, width: 180, fontSize: 13 }}
                onFocus={e => e.target.style.border = `1px solid ${VOLT}`}
                onBlur={e => e.target.style.border = "1px solid rgba(255,255,255,0.1)"}
              />
            </div>
          ) : profile?.location ? (
            <span style={{ fontSize: 13, color: "#8b8fa3", display: "flex", alignItems: "center", gap: 5 }}>
              <span>📍</span>{profile.location}
            </span>
          ) : null}

          {/* Public profile pill */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 20, padding: "5px 8px 5px 14px",
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(139,143,163,0.6)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
              <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
            </svg>
            <span style={{ fontSize: 12, color: "#8b8fa3" }}>{shareableUrl}</span>
            <button onClick={copyLink} style={{
              padding: "3px 10px", borderRadius: 12, border: "none",
              background: copiedLink ? "rgba(52,199,89,0.15)" : "rgba(255,255,255,0.06)",
              color: copiedLink ? "#34C759" : "#8b8fa3",
              fontSize: 11, fontWeight: 600, cursor: "pointer",
            }}>
              {copiedLink ? "✓ Copied" : "Copy"}
            </button>
          </div>
        </div>

        {/* Save error */}
        {saveError && (
          <div style={{
            marginTop: 12, padding: "9px 14px", borderRadius: 10,
            background: "rgba(255,69,58,0.1)", border: "1px solid rgba(255,69,58,0.25)",
            color: "#FF453A", fontSize: 13,
          }}>{saveError}</div>
        )}
      </div>

      {/* ── Body: two columns ── */}
      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr" }}>

        {/* Left: details */}
        <div style={{
          padding: "24px 20px 48px",
          borderRight: "1px solid rgba(255,255,255,0.06)",
          display: "flex", flexDirection: "column", gap: 24, minHeight: 400,
        }}>

          {/* Profile URL / username */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(139,143,163,0.6)", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 10 }}>
              Profile URL
            </div>
            {editing ? (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <input
                    value={editedProfile?.username || ""}
                    onChange={e => { setField("username", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "")); setUsernameError(null); }}
                    placeholder="your-username"
                    disabled={!canChangeUsername && !!profile?.username}
                    style={{
                      ...inp, fontSize: 13, flex: 1,
                      opacity: (!canChangeUsername && !!profile?.username) ? 0.5 : 1,
                    }}
                    onFocus={e => e.target.style.border = `1px solid ${VOLT}`}
                    onBlur={e => e.target.style.border = "1px solid rgba(255,255,255,0.1)"}
                  />
                  <span style={{ fontSize: 12, color: "#8b8fa3", whiteSpace: "nowrap" }}>.nomaad.ai</span>
                </div>
                {usernameError && <div style={{ fontSize: 12, color: "#FF453A", marginTop: 5 }}>{usernameError}</div>}
                {!canChangeUsername && profile?.username && (
                  <div style={{ fontSize: 12, color: "#8b8fa3", marginTop: 5 }}>
                    🔒 Can change again in {daysUntilCanChange} day{daysUntilCanChange === 1 ? "" : "s"}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ fontSize: 13, color: "#8b8fa3" }}>
                {profile?.username ? (
                  <a href={`https://${shareableUrl}`} target="_blank" rel="noopener noreferrer"
                    style={{ color: VOLT, textDecoration: "none", fontWeight: 500 }}>
                    {shareableUrl} ↗
                  </a>
                ) : (
                  <span style={{ color: "rgba(139,143,163,0.5)", fontStyle: "italic" }}>No username set yet</span>
                )}
              </div>
            )}
          </div>

          {/* Social links */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(139,143,163,0.6)", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 10 }}>
              Links
            </div>
            <SocialLinks links={socialLinks} editing={editing} editedLinks={editedProfile?.social_links} onChangeLink={setSocialLink} />
          </div>

          {/* Sign out — bottom of left col */}
          {signOut && !editing && (
            <div style={{ marginTop: "auto", paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <button
                onClick={() => signOut()}
                style={{
                  display: "flex", alignItems: "center", gap: 7, width: "100%",
                  padding: "9px 14px", borderRadius: 10,
                  background: "transparent", border: "1px solid rgba(255,255,255,0.07)",
                  color: "rgba(255,255,255,0.35)", fontSize: 13, fontWeight: 500, cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={e => { e.currentTarget.style.color = "#FF453A"; e.currentTarget.style.borderColor = "rgba(255,69,58,0.3)"; }}
                onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,0.35)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; }}
              >
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Sign Out
              </button>
            </div>
          )}
        </div>

        {/* Right: portfolio */}
        <div style={{ padding: "24px 24px 48px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: "#f0f0f5", letterSpacing: -0.3, margin: 0 }}>Portfolio</h2>
              <div style={{ fontSize: 12, color: "#8b8fa3", marginTop: 3 }}>
                {projects.length} {projects.length === 1 ? "project" : "projects"}
              </div>
            </div>
            {editing && (
              <button
                onClick={() => { setAddingProject(true); setEditingProject(null); }}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "7px 14px", borderRadius: 10,
                  background: "rgba(204,253,1,0.08)", border: `1px solid ${VOLT}33`,
                  color: VOLT, fontSize: 13, fontWeight: 700, cursor: "pointer",
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Add Project
              </button>
            )}
          </div>

          {editing && addingProject && <AddProjectForm onSave={addProject} onCancel={() => setAddingProject(false)} />}

          {projects.length > 0 ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
              {projects.map((project, i) => (
                editingProject?.id === project.id ? (
                  <div key={project.id} style={{ gridColumn: "1 / -1" }}>
                    <EditProjectForm project={editingProject} onSave={updateProject} onCancel={() => setEditingProject(null)} />
                  </div>
                ) : (
                  <ProjectCard
                    key={project.id} project={project} index={i} editing={editing}
                    onEdit={(p) => { setEditingProject(p); setAddingProject(false); }}
                    onDelete={deleteProject}
                  />
                )
              ))}
            </div>
          ) : !addingProject ? (
            <div
              onClick={editing ? () => setAddingProject(true) : undefined}
              style={{
                border: "2px dashed rgba(255,255,255,0.09)", borderRadius: 20,
                padding: "60px 32px", textAlign: "center",
                cursor: editing ? "pointer" : "default", transition: "border-color 0.2s",
              }}
              onMouseEnter={e => { if (editing) e.currentTarget.style.borderColor = `${VOLT}44`; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)"; }}
            >
              <div style={{ fontSize: 40, marginBottom: 14 }}>🗂️</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: "#f0f0f5", marginBottom: 6 }}>
                {editing ? "Add your first project" : "No projects yet"}
              </div>
              <div style={{ fontSize: 13, color: "#8b8fa3" }}>
                {editing ? "Click to add a project to your portfolio" : "Projects will appear here once added"}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes spin   { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
