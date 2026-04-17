import { useState, useEffect, useRef, useCallback } from "react";

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

function getBannerGradient(businessType) {
  const c = getRoleColor(businessType);
  // Hex → rgba helper
  const hex = c.replace("#", "");
  const r = parseInt(hex.slice(0,2), 16);
  const g = parseInt(hex.slice(2,4), 16);
  const b = parseInt(hex.slice(4,6), 16);
  return `linear-gradient(135deg, rgba(${r},${g},${b},0.55) 0%, rgba(${r},${g},${b},0.12) 60%, rgba(8,8,10,0.8) 100%)`;
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
            boxShadow: `0 4px 24px rgba(0,0,0,0.4), 0 0 0 2px ${roleColor}44`,
          }}
        />
      ) : (
        <div style={{
          width: size, height: size, borderRadius: "50%",
          background: `linear-gradient(135deg, ${roleColor}dd, ${roleColor}66)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: size * 0.3, fontWeight: 700, color: "#08080a",
          border: "3px solid #08080a",
          boxShadow: `0 4px 24px rgba(0,0,0,0.4), 0 0 0 2px ${roleColor}44`,
          letterSpacing: -0.5,
          userSelect: "none",
        }}>
          {getInitials(profile?.full_name)}
        </div>
      )}
      {/* Online dot */}
      <div style={{
        position: "absolute", bottom: 4, right: 4,
        width: 14, height: 14, borderRadius: "50%",
        background: availColor,
        border: "2.5px solid #08080a",
        boxShadow: `0 0 8px ${availColor}99`,
        transition: "background 0.3s ease",
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
      key: "twitter",
      label: "Twitter / X",
      placeholder: "@handle",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      ),
    },
    {
      key: "instagram",
      label: "Instagram",
      placeholder: "@handle",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
          <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/>
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
        </svg>
      ),
    },
    {
      key: "linkedin",
      label: "LinkedIn",
      placeholder: "linkedin.com/in/handle",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"/>
          <circle cx="4" cy="4" r="2"/>
        </svg>
      ),
    },
    {
      key: "website",
      label: "Website",
      placeholder: "https://example.com",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="2" y1="12" x2="22" y2="12"/>
          <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
        </svg>
      ),
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
            }}>
              {s.icon}
            </div>
            <input
              value={editedLinks?.[s.key] || ""}
              onChange={e => onChangeLink(s.key, e.target.value)}
              placeholder={s.placeholder}
              style={{
                flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 9, padding: "7px 11px", fontSize: 13, color: "#f0f0f5",
                outline: "none", caretColor: VOLT, fontFamily: "inherit",
                transition: "border 0.2s",
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
  if (!hasAny) return null;

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {socials.map(s => {
        const val = links?.[s.key];
        if (!val) return null;
        return (
          <a
            key={s.key}
            href={s.key === "website" ? val : s.key === "linkedin" ? `https://${val.replace(/^https?:\/\//,"")}` : `https://${s.key}.com/${val.replace(/^@/,"")}`}
            target="_blank"
            rel="noopener noreferrer"
            title={val}
            style={{
              width: 36, height: 36, borderRadius: 10,
              background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "rgba(255,255,255,0.5)", textDecoration: "none",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.16)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "rgba(255,255,255,0.5)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
          >
            {s.icon}
          </a>
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
        cursor: "default",
        transform: hovered ? "scale(1.025)" : "scale(1)",
        boxShadow: hovered ? "0 8px 32px rgba(0,0,0,0.4)" : "0 2px 8px rgba(0,0,0,0.2)",
        transition: "transform 0.25s cubic-bezier(.4,0,.2,1), box-shadow 0.25s ease",
        animation: `fadeUp 0.4s ease ${index * 0.06}s backwards`,
      }}
    >
      {/* Cover */}
      <div style={{ height: 130, overflow: "hidden", position: "relative" }}>
        <img
          src={coverUrl}
          alt={project.title}
          style={{
            width: "100%", height: "100%", objectFit: "cover",
            transform: hovered ? "scale(1.06)" : "scale(1)",
            transition: "transform 0.4s ease",
          }}
          onError={e => { e.target.style.display = "none"; }}
        />
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to bottom, transparent 40%, rgba(8,8,10,0.7) 100%)",
        }} />
        {/* Category badge */}
        {project.category && (
          <span style={{
            position: "absolute", top: 10, left: 10,
            background: "rgba(8,8,10,0.7)", backdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,0.12)", borderRadius: 20,
            padding: "3px 10px", fontSize: 10, fontWeight: 700,
            color: "rgba(255,255,255,0.8)", letterSpacing: 0.5, textTransform: "uppercase",
          }}>
            {project.category}
          </span>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: "10px 12px 12px" }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#f0f0f5", marginBottom: 2, lineHeight: 1.3 }}>
          {project.title}
        </div>
        {project.year && (
          <div style={{ fontSize: 12, color: "#8b8fa3" }}>{project.year}</div>
        )}
      </div>

      {/* Edit overlay */}
      {editing && hovered && (
        <div style={{
          position: "absolute", inset: 0,
          background: "rgba(8,8,10,0.75)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          animation: "fadeIn 0.15s ease",
        }}>
          <button
            onClick={() => onEdit(project)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "8px 16px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.15)",
              background: "rgba(255,255,255,0.08)", color: "#fff",
              fontSize: 13, fontWeight: 600, cursor: "pointer",
              transition: "background 0.2s",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.14)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            Edit
          </button>
          <button
            onClick={() => onDelete(project.id)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "8px 14px", borderRadius: 10, border: "1px solid rgba(255,59,48,0.25)",
              background: "rgba(255,59,48,0.1)", color: "#FF453A",
              fontSize: 13, fontWeight: 600, cursor: "pointer",
              transition: "background 0.2s",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,59,48,0.18)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(255,59,48,0.1)"}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

function AddProjectForm({ onSave, onCancel }) {
  const [form, setForm] = useState({
    title: "", category: "Design", year: new Date().getFullYear(), cover_url: "",
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const inputStyle = {
    width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 10, padding: "9px 12px", fontSize: 13, color: "#f0f0f5",
    outline: "none", caretColor: VOLT, fontFamily: "inherit", boxSizing: "border-box",
    transition: "border 0.2s",
  };

  return (
    <div style={{
      background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 16, padding: "18px 16px", marginTop: 12,
      animation: "fadeUp 0.25s ease",
    }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: "#f0f0f5", marginBottom: 14 }}>New Project</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <input
          autoFocus
          value={form.title} onChange={e => set("title", e.target.value)}
          placeholder="Project title"
          style={inputStyle}
          onFocus={e => e.target.style.border = `1px solid ${VOLT}`}
          onBlur={e => e.target.style.border = "1px solid rgba(255,255,255,0.08)"}
        />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <select
            value={form.category} onChange={e => set("category", e.target.value)}
            style={{ ...inputStyle, cursor: "pointer", appearance: "none", WebkitAppearance: "none" }}
            onFocus={e => e.target.style.border = `1px solid ${VOLT}`}
            onBlur={e => e.target.style.border = "1px solid rgba(255,255,255,0.08)"}
          >
            {PROJECT_CATS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <input
            type="number"
            value={form.year} onChange={e => set("year", parseInt(e.target.value) || new Date().getFullYear())}
            placeholder="Year"
            style={inputStyle}
            onFocus={e => e.target.style.border = `1px solid ${VOLT}`}
            onBlur={e => e.target.style.border = "1px solid rgba(255,255,255,0.08)"}
          />
        </div>
        <input
          value={form.cover_url} onChange={e => set("cover_url", e.target.value)}
          placeholder="Paste image URL (optional)"
          style={inputStyle}
          onFocus={e => e.target.style.border = `1px solid ${VOLT}`}
          onBlur={e => e.target.style.border = "1px solid rgba(255,255,255,0.08)"}
        />
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        <button
          onClick={() => { if (form.title.trim()) onSave(form); }}
          disabled={!form.title.trim()}
          style={{
            flex: 1, padding: "9px", borderRadius: 10, border: "none",
            background: form.title.trim() ? `linear-gradient(135deg, ${VOLT}, ${VOLTD})` : "rgba(255,255,255,0.06)",
            color: form.title.trim() ? "#0a0a0a" : "#8b8fa3",
            fontSize: 13, fontWeight: 700, cursor: form.title.trim() ? "pointer" : "not-allowed",
            transition: "all 0.2s",
          }}
        >
          Save Project
        </button>
        <button
          onClick={onCancel}
          style={{
            padding: "9px 16px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)",
            background: "transparent", color: "#8b8fa3",
            fontSize: 13, fontWeight: 600, cursor: "pointer",
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function EditProjectForm({ project, onSave, onCancel }) {
  const [form, setForm] = useState({ ...project });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const inputStyle = {
    width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 10, padding: "9px 12px", fontSize: 13, color: "#f0f0f5",
    outline: "none", caretColor: VOLT, fontFamily: "inherit", boxSizing: "border-box",
    transition: "border 0.2s",
  };

  return (
    <div style={{
      background: "rgba(255,255,255,0.04)", border: `1px solid ${VOLT}44`,
      borderRadius: 16, padding: "18px 16px", marginTop: 12,
      animation: "fadeUp 0.25s ease",
    }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: "#f0f0f5", marginBottom: 14 }}>Edit Project</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <input autoFocus value={form.title} onChange={e => set("title", e.target.value)} placeholder="Project title" style={inputStyle}
          onFocus={e => e.target.style.border = `1px solid ${VOLT}`} onBlur={e => e.target.style.border = "1px solid rgba(255,255,255,0.08)"}/>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <select value={form.category} onChange={e => set("category", e.target.value)} style={{ ...inputStyle, cursor: "pointer", appearance: "none", WebkitAppearance: "none" }}
            onFocus={e => e.target.style.border = `1px solid ${VOLT}`} onBlur={e => e.target.style.border = "1px solid rgba(255,255,255,0.08)"}>
            {PROJECT_CATS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <input type="number" value={form.year} onChange={e => set("year", parseInt(e.target.value) || new Date().getFullYear())} placeholder="Year" style={inputStyle}
            onFocus={e => e.target.style.border = `1px solid ${VOLT}`} onBlur={e => e.target.style.border = "1px solid rgba(255,255,255,0.08)"}/>
        </div>
        <input value={form.cover_url || ""} onChange={e => set("cover_url", e.target.value)} placeholder="Paste image URL (optional)" style={inputStyle}
          onFocus={e => e.target.style.border = `1px solid ${VOLT}`} onBlur={e => e.target.style.border = "1px solid rgba(255,255,255,0.08)"}/>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        <button onClick={() => onSave(form)} style={{ flex: 1, padding: "9px", borderRadius: 10, border: "none", background: `linear-gradient(135deg, ${VOLT}, ${VOLTD})`, color: "#0a0a0a", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
          Save Changes
        </button>
        <button onClick={onCancel} style={{ padding: "9px 16px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", background: "transparent", color: "#8b8fa3", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function UserProfileView({ t, dark, onClose, user, profile, updateProfile, signOut }) {
  const [editing, setEditing]       = useState(false);
  const [saving,  setSaving]        = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [addingProject, setAddingProject] = useState(false);
  const [editingProject, setEditingProject] = useState(null); // project object or null

  // Editable state — initialised when edit mode opens
  const [editedProfile, setEditedProfile] = useState(null);

  const overlayRef = useRef();
  const copyTimeoutRef = useRef();

  const shareableUsername = profile?.username || (profile?.id ? profile.id.slice(0, 8) : "unknown");
  const shareableUrl = `nomaad.app/p/${shareableUsername}`;

  // Start editing
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
    setEditing(true);
  }, [profile]);

  // Cancel editing
  const cancelEditing = () => {
    setEditing(false);
    setEditedProfile(null);
    setAddingProject(false);
    setEditingProject(null);
  };

  // Save changes
  const saveChanges = async () => {
    if (!editedProfile) return;
    setSaving(true);
    try {
      await updateProfile({
        full_name:          editedProfile.full_name,
        bio:                editedProfile.bio,
        location:           editedProfile.location,
        availability:       editedProfile.availability,
        social_links:       editedProfile.social_links,
        username:           editedProfile.username || null,
        portfolio_projects: editedProfile.portfolio_projects,
      });
      setEditing(false);
      setEditedProfile(null);
      setAddingProject(false);
      setEditingProject(null);
    } catch (err) {
      console.error("Failed to save profile:", err);
    } finally {
      setSaving(false);
    }
  };

  // Field helpers
  const setField = (key, val) => setEditedProfile(p => ({ ...p, [key]: val }));
  const setSocialLink = (key, val) => setEditedProfile(p => ({ ...p, social_links: { ...p.social_links, [key]: val } }));

  // Project helpers
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

  // Copy link
  const copyLink = () => {
    navigator.clipboard.writeText(`https://${shareableUrl}`).catch(() => {});
    setCopiedLink(true);
    clearTimeout(copyTimeoutRef.current);
    copyTimeoutRef.current = setTimeout(() => setCopiedLink(false), 2000);
  };

  // Close on backdrop click
  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose();
  };

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // Determine displayed data (editing → use editedProfile, else profile)
  const dp = editing ? editedProfile : profile;
  const projects = dp?.portfolio_projects || [];
  const socialLinks = dp?.social_links || {};
  const roleColor = getRoleColor(profile?.business_type);

  return (
    <>
      {/* ── Backdrop ── */}
      <div
        ref={overlayRef}
        onClick={handleOverlayClick}
        style={{
          position: "fixed", inset: 0, zIndex: 9000,
          background: "rgba(0,0,0,0.82)",
          backdropFilter: "blur(20px) saturate(1.4)",
          overflowY: "auto",
          animation: "profileOverlayIn 0.3s cubic-bezier(.4,0,.2,1)",
          fontFamily: "-apple-system,'SF Pro Display',system-ui,sans-serif",
          WebkitFontSmoothing: "antialiased",
        }}
      >
        {/* Top-right buttons: Sign Out + Close */}
        <div style={{ position: "fixed", top: 20, right: 20, zIndex: 9100, display: "flex", gap: 8 }}>
          {signOut && (
            <button
              onClick={() => { signOut(); onClose(); }}
              style={{
                height: 40, padding: "0 16px", borderRadius: 20,
                background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
                backdropFilter: "blur(20px)",
                display: "flex", alignItems: "center", gap: 7,
                color: "rgba(255,255,255,0.55)", cursor: "pointer", fontSize: 13, fontWeight: 500,
                transition: "all 0.2s ease", fontFamily: "inherit",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,98,89,0.15)"; e.currentTarget.style.color = "#FF6259"; e.currentTarget.style.borderColor = "rgba(255,98,89,0.3)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "rgba(255,255,255,0.55)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; }}
            >
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Sign Out
            </button>
          )}
          <button
            onClick={onClose}
            style={{
              width: 40, height: 40, borderRadius: "50%",
              background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)",
              backdropFilter: "blur(20px)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "rgba(255,255,255,0.7)", cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.14)"; e.currentTarget.style.color = "#fff"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "rgba(255,255,255,0.7)"; }}
            aria-label="Close profile"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M1.5 1.5L10.5 10.5M10.5 1.5L1.5 10.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Content container */}
        <div
          style={{
            maxWidth: 900, margin: "0 auto", padding: "48px 20px 80px",
            animation: "profileContentIn 0.35s cubic-bezier(.4,0,.2,1)",
          }}
          onClick={e => e.stopPropagation()}
        >
          <div style={{
            display: "grid",
            gridTemplateColumns: "clamp(280px, 38%, 340px) 1fr",
            gap: 20,
            alignItems: "start",
          }}
          className="profile-grid"
          >
            {/* ══════════ LEFT COLUMN ══════════ */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

              {/* Profile Card */}
              <div style={{
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 24, overflow: "hidden",
                boxShadow: "0 8px 40px rgba(0,0,0,0.4)",
              }}>
                {/* Banner */}
                <div style={{
                  height: 120, position: "relative",
                  background: getBannerGradient(profile?.business_type),
                  backgroundImage: [
                    getBannerGradient(profile?.business_type),
                    `radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)`,
                  ].join(", "),
                  backgroundSize: `100% 100%, 20px 20px`,
                }}>
                  {/* Ambient glow blob */}
                  <div style={{
                    position: "absolute", top: -40, right: -40,
                    width: 180, height: 180, borderRadius: "50%",
                    background: `radial-gradient(circle, ${roleColor}55, transparent 70%)`,
                    filter: "blur(30px)",
                    pointerEvents: "none",
                  }} />

                  {/* Edit / Save button in banner */}
                  <div style={{ position: "absolute", top: 12, right: 12 }}>
                    {!editing ? (
                      <button
                        onClick={startEditing}
                        style={{
                          display: "flex", alignItems: "center", gap: 6,
                          padding: "7px 14px", borderRadius: 20,
                          background: "rgba(8,8,10,0.6)", backdropFilter: "blur(12px)",
                          border: "1px solid rgba(255,255,255,0.12)",
                          color: "rgba(255,255,255,0.8)", fontSize: 12, fontWeight: 600,
                          cursor: "pointer", transition: "all 0.2s",
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = "rgba(8,8,10,0.8)"; e.currentTarget.style.color = "#fff"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "rgba(8,8,10,0.6)"; e.currentTarget.style.color = "rgba(255,255,255,0.8)"; }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                        Edit Profile
                      </button>
                    ) : (
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          onClick={cancelEditing}
                          style={{
                            padding: "7px 12px", borderRadius: 20,
                            background: "rgba(8,8,10,0.6)", backdropFilter: "blur(12px)",
                            border: "1px solid rgba(255,255,255,0.12)",
                            color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: 600, cursor: "pointer",
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={saveChanges}
                          disabled={saving}
                          style={{
                            display: "flex", alignItems: "center", gap: 5,
                            padding: "7px 14px", borderRadius: 20,
                            background: saving ? "rgba(204,253,1,0.4)" : `linear-gradient(135deg, ${VOLT}, ${VOLTD})`,
                            border: "none", color: "#0a0a0a", fontSize: 12, fontWeight: 700,
                            cursor: saving ? "wait" : "pointer",
                            transition: "all 0.2s",
                          }}
                        >
                          {saving ? (
                            <>
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: "spin 0.8s linear infinite" }}>
                                <path d="M21 12a9 9 0 11-6.219-8.56"/>
                              </svg>
                              Saving…
                            </>
                          ) : (
                            <>
                              <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                                <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                              Save Changes
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Avatar — overlaps banner bottom */}
                  <div style={{ position: "absolute", bottom: -34, left: 20 }}>
                    <Avatar profile={editing ? { ...profile, availability: editedProfile?.availability } : profile} size={68} />
                  </div>
                </div>

                {/* Profile info body */}
                <div style={{ padding: "44px 20px 20px" }}>
                  {/* Name */}
                  {editing ? (
                    <input
                      value={editedProfile?.full_name || ""}
                      onChange={e => setField("full_name", e.target.value)}
                      placeholder="Your name"
                      style={{
                        width: "100%", background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10,
                        padding: "7px 11px", fontSize: 20, fontWeight: 700,
                        color: "#f0f0f5", outline: "none", caretColor: VOLT,
                        fontFamily: "inherit", letterSpacing: -0.4, boxSizing: "border-box",
                        transition: "border 0.2s", marginBottom: 8,
                      }}
                      onFocus={e => e.target.style.border = `1px solid ${VOLT}`}
                      onBlur={e => e.target.style.border = "1px solid rgba(255,255,255,0.08)"}
                    />
                  ) : (
                    <div style={{ fontSize: 22, fontWeight: 700, color: "#f0f0f5", letterSpacing: -0.5, marginBottom: 6, lineHeight: 1.2 }}>
                      {profile?.full_name || profile?.business_name || "Your Name"}
                    </div>
                  )}

                  {/* Role badge */}
                  <div style={{ marginBottom: 12 }}>
                    <RoleBadge businessType={profile?.business_type} />
                  </div>

                  {/* Location */}
                  {editing ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
                      <span style={{ fontSize: 14, color: "#8b8fa3", flexShrink: 0 }}>📍</span>
                      <input
                        value={editedProfile?.location || ""}
                        onChange={e => setField("location", e.target.value)}
                        placeholder="Your location"
                        style={{
                          flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                          borderRadius: 9, padding: "6px 10px", fontSize: 13, color: "#8b8fa3",
                          outline: "none", caretColor: VOLT, fontFamily: "inherit", transition: "border 0.2s",
                        }}
                        onFocus={e => e.target.style.border = `1px solid ${VOLT}`}
                        onBlur={e => e.target.style.border = "1px solid rgba(255,255,255,0.08)"}
                      />
                    </div>
                  ) : profile?.location ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 10, color: "#8b8fa3", fontSize: 13 }}>
                      <span>📍</span>
                      <span>{profile.location}</span>
                    </div>
                  ) : null}

                  {/* Divider */}
                  <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "12px 0" }} />

                  {/* Bio */}
                  {editing ? (
                    <textarea
                      value={editedProfile?.bio || ""}
                      onChange={e => setField("bio", e.target.value)}
                      placeholder="Write a short bio about yourself…"
                      rows={3}
                      style={{
                        width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: 10, padding: "9px 11px", fontSize: 13, color: "#f0f0f5",
                        outline: "none", caretColor: VOLT, fontFamily: "inherit",
                        lineHeight: 1.6, resize: "vertical", boxSizing: "border-box",
                        transition: "border 0.2s", marginBottom: 12,
                      }}
                      onFocus={e => e.target.style.border = `1px solid ${VOLT}`}
                      onBlur={e => e.target.style.border = "1px solid rgba(255,255,255,0.08)"}
                    />
                  ) : profile?.bio ? (
                    <p style={{ fontSize: 13, color: "#8b8fa3", lineHeight: 1.65, marginBottom: 12 }}>
                      {profile.bio}
                    </p>
                  ) : (
                    <p style={{ fontSize: 13, color: "rgba(139,143,163,0.5)", lineHeight: 1.65, fontStyle: "italic", marginBottom: 12 }}>
                      No bio yet.
                    </p>
                  )}

                  {/* Divider */}
                  <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "12px 0" }} />

                  {/* Availability */}
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(139,143,163,0.7)", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 8 }}>
                      Availability
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      {Object.entries(AVAIL_CONFIG).map(([key, cfg]) => {
                        const active = (editing ? editedProfile?.availability : profile?.availability) === key;
                        return (
                          <button
                            key={key}
                            onClick={() => editing && setField("availability", key)}
                            style={{
                              display: "flex", alignItems: "center", gap: 5,
                              padding: "5px 11px", borderRadius: 20,
                              border: `1px solid ${active ? cfg.color + "55" : "rgba(255,255,255,0.08)"}`,
                              background: active ? `${cfg.color}18` : "transparent",
                              color: active ? cfg.color : "#8b8fa3",
                              fontSize: 12, fontWeight: 600,
                              cursor: editing ? "pointer" : "default",
                              transition: "all 0.25s ease",
                            }}
                          >
                            <div style={{
                              width: 6, height: 6, borderRadius: "50%",
                              background: active ? cfg.color : "rgba(139,143,163,0.4)",
                              transition: "background 0.25s ease",
                            }} />
                            {cfg.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Divider */}
                  <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "12px 0" }} />

                  {/* Shareable link */}
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(139,143,163,0.7)", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 8 }}>
                      Public Profile
                    </div>
                    <div style={{
                      display: "flex", alignItems: "center", gap: 8,
                      background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 12, padding: "8px 10px 8px 12px",
                    }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(139,143,163,0.6)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="2" y1="12" x2="22" y2="12"/>
                        <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
                      </svg>
                      <span style={{ flex: 1, fontSize: 12, color: "#8b8fa3", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {shareableUrl}
                      </span>
                      <button
                        onClick={copyLink}
                        style={{
                          display: "flex", alignItems: "center", gap: 5,
                          padding: "5px 10px", borderRadius: 8, border: "none",
                          background: copiedLink ? "rgba(52,199,89,0.15)" : "rgba(255,255,255,0.06)",
                          color: copiedLink ? "#34C759" : "#8b8fa3",
                          fontSize: 11, fontWeight: 600, cursor: "pointer", flexShrink: 0,
                          transition: "all 0.2s ease",
                        }}
                      >
                        {copiedLink ? (
                          <>
                            <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                              <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            Copied!
                          </>
                        ) : (
                          <>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                            </svg>
                            Copy
                          </>
                        )}
                      </button>
                    </div>

                    {/* Username edit */}
                    {editing && (
                      <div style={{ marginTop: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: 12, color: "#8b8fa3", whiteSpace: "nowrap" }}>nomaad.app/p/</span>
                          <input
                            value={editedProfile?.username || ""}
                            onChange={e => setField("username", e.target.value.replace(/[^a-zA-Z0-9_-]/g, ""))}
                            placeholder="your-username"
                            style={{
                              flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                              borderRadius: 8, padding: "5px 9px", fontSize: 12, color: "#f0f0f5",
                              outline: "none", caretColor: VOLT, fontFamily: "inherit", transition: "border 0.2s",
                            }}
                            onFocus={e => e.target.style.border = `1px solid ${VOLT}`}
                            onBlur={e => e.target.style.border = "1px solid rgba(255,255,255,0.08)"}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Social links */}
                  {(editing || Object.values(socialLinks).some(v => v)) && (
                    <>
                      <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "12px 0" }} />
                      <div style={{ marginBottom: 4 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(139,143,163,0.7)", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 10 }}>
                          Links
                        </div>
                        <SocialLinks
                          links={socialLinks}
                          editing={editing}
                          editedLinks={editedProfile?.social_links}
                          onChangeLink={setSocialLink}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* ══════════ RIGHT COLUMN ══════════ */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Portfolio header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <h2 style={{ fontSize: 22, fontWeight: 700, color: "#f0f0f5", letterSpacing: -0.5, margin: 0 }}>Portfolio</h2>
                  <div style={{ fontSize: 13, color: "#8b8fa3", marginTop: 3 }}>
                    {projects.length} {projects.length === 1 ? "project" : "projects"}
                  </div>
                </div>
                {editing && (
                  <button
                    onClick={() => { setAddingProject(true); setEditingProject(null); }}
                    style={{
                      display: "flex", alignItems: "center", gap: 6,
                      padding: "8px 16px", borderRadius: 12,
                      background: `linear-gradient(135deg, ${VOLT}, ${VOLTD})`,
                      border: "none", color: "#0a0a0a", fontSize: 13, fontWeight: 700,
                      cursor: "pointer", boxShadow: "0 2px 14px rgba(204,253,1,0.2)",
                      transition: "opacity 0.2s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
                    onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    Add Project
                  </button>
                )}
              </div>

              {/* Projects grid */}
              {projects.length > 0 ? (
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: 14,
                }}>
                  {projects.map((project, i) => (
                    editingProject?.id === project.id ? (
                      <div key={project.id} style={{ gridColumn: "1 / -1" }}>
                        <EditProjectForm
                          project={editingProject}
                          onSave={updateProject}
                          onCancel={() => setEditingProject(null)}
                        />
                      </div>
                    ) : (
                      <ProjectCard
                        key={project.id}
                        project={project}
                        index={i}
                        editing={editing}
                        onEdit={(p) => { setEditingProject(p); setAddingProject(false); }}
                        onDelete={deleteProject}
                      />
                    )
                  ))}
                </div>
              ) : (
                !addingProject && (
                  <div
                    onClick={editing ? () => setAddingProject(true) : undefined}
                    style={{
                      border: "2px dashed rgba(255,255,255,0.1)", borderRadius: 20,
                      padding: "60px 32px", textAlign: "center",
                      cursor: editing ? "pointer" : "default",
                      transition: "border-color 0.2s, background 0.2s",
                      animation: "fadeUp 0.4s ease",
                    }}
                    onMouseEnter={e => { if (editing) { e.currentTarget.style.borderColor = `${VOLT}55`; e.currentTarget.style.background = "rgba(204,253,1,0.02)"; } }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.background = "transparent"; }}
                  >
                    <div style={{ fontSize: 40, marginBottom: 14 }}>🗂️</div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: "#f0f0f5", marginBottom: 6 }}>
                      {editing ? "Add your first project" : "No projects yet"}
                    </div>
                    <div style={{ fontSize: 13, color: "#8b8fa3" }}>
                      {editing ? "Click to add a project to your portfolio" : "Projects will appear here once added"}
                    </div>
                    {editing && (
                      <div style={{
                        display: "inline-flex", alignItems: "center", gap: 5,
                        marginTop: 16, padding: "8px 16px", borderRadius: 10,
                        background: "rgba(204,253,1,0.08)", border: `1px solid ${VOLT}33`,
                        color: VOLT, fontSize: 12, fontWeight: 700,
                      }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                        </svg>
                        Add Project
                      </div>
                    )}
                  </div>
                )
              )}

              {/* Add project form */}
              {editing && addingProject && (
                <AddProjectForm
                  onSave={addProject}
                  onCancel={() => setAddingProject(false)}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Global styles ── */}
      <style>{`
        @keyframes profileOverlayIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes profileContentIn {
          from { opacity: 0; transform: scale(0.97) translateY(12px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        .profile-grid {
          grid-template-columns: clamp(280px, 38%, 340px) 1fr;
        }
        @media (max-width: 680px) {
          .profile-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </>
  );
}
