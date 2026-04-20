import { useState, useRef, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { EditProfileDialog } from "./EditProfileDialog";
import { ProjectDialog } from "./ProjectDialog";

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

function SocialLinks({ links }) {
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
            href={s.key === "website" ? `https://${val.replace(/^https?:\/\//,"")}` : s.key === "linkedin" ? `https://${val.replace(/^https?:\/\//,"")}` : `https://${s.key}.com/${val.replace(/^@/,"")}`}
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

function ProjectCard({ project, index, onEdit, onDelete }) {
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
        {project.media_type && project.media_type !== "Image" && (
           <div style={{ position: "absolute", top: 10, right: 10, zIndex: 10, padding: "4px 8px", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", borderRadius: 8, fontSize: 10, fontWeight: 700, color: "#fff" }}>
             {project.media_type}
           </div>
        )}
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
      {hovered && (
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

// ── Main Component ────────────────────────────────────────────────────────────
export default function UserProfileView({ t, dark, onClose, signOut }) {
  const { user, profile, refreshProfile } = useAuth();
  const [copiedLink, setCopiedLink]       = useState(false);
  
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  const copyTimeoutRef = useRef();

  const shareableUrl = profile?.username
    ? `${profile.username}.nomaad.ai`
    : `nomaad.ai/p/${profile?.id?.slice(0, 8) || "unknown"}`;

  const copyLink = () => {
    navigator.clipboard.writeText(`https://${shareableUrl}`).catch(() => {});
    setCopiedLink(true);
    clearTimeout(copyTimeoutRef.current);
    copyTimeoutRef.current = setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleProfileSave = () => {
    refreshProfile?.();
  };

  const handleProjectSave = async (projectData) => {
     if(!user) return;
     const newProjects = [...(profile?.portfolio_projects || [])];
     const idx = newProjects.findIndex(p => p.id === projectData.id);
     
     if (idx >= 0) {
       newProjects[idx] = projectData;
     } else {
       newProjects.push(projectData);
     }
     
     await supabase.from('profiles').update({ portfolio_projects: newProjects }).eq('id', user.id);
     refreshProfile?.();
  };

  const deleteProject = async (id) => {
     if(!user) return;
     const newProjects = (profile?.portfolio_projects || []).filter(p => p.id !== id);
     await supabase.from('profiles').update({ portfolio_projects: newProjects }).eq('id', user.id);
     refreshProfile?.();
  };

  const projects = profile?.portfolio_projects || [];
  const socialLinks = profile?.social_links || {};

  return (
    <div style={{
      width: "100%", height: "100%", overflowY: "auto",
      background: "#08080a",
      fontFamily: "-apple-system,'SF Pro Display',system-ui,sans-serif",
      WebkitFontSmoothing: "antialiased", color: "#f0f0f5",
    }}>

      {profileDialogOpen && (
         <EditProfileDialog 
            open={profileDialogOpen} 
            onOpenChange={setProfileDialogOpen} 
            profile={profile}
            onSaveComplete={handleProfileSave}
         />
      )}

      {projectDialogOpen && (
         <ProjectDialog
           open={projectDialogOpen}
           onOpenChange={setProjectDialogOpen}
           existingProject={editingProject}
           onSave={handleProjectSave}
         />
      )}

      {/* ── Banner ── */}
      <div style={{ position: "relative", width: "100%", height: 180, overflow: "hidden", flexShrink: 0 }}>
        <div style={{ display: "flex", width: "100%", height: "100%" }}>
          {UNSPLASH_IDS.slice(0, 5).map(id => (
            <img key={id} src={`https://images.unsplash.com/photo-${id}?w=500&q=75`} alt=""
              style={{ flex: 1, height: "100%", objectFit: "cover" }} />
          ))}
        </div>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(8,8,10,0.1) 30%, rgba(8,8,10,0.65) 100%)", pointerEvents: "none" }} />

        {/* Top-right actions */}
        <div style={{ position: "absolute", top: 14, right: 16, display: "flex", gap: 8, alignItems: "center", zIndex: 10 }}>
            <button type="button" onClick={() => setProfileDialogOpen(true)} style={{
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
        </div>
      </div>

      {/* ── Hero info ── */}
      <div style={{ padding: "0 28px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ marginTop: -44, marginBottom: 14 }}>
          <Avatar profile={profile} size={96} />
        </div>

        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#f0f0f5", letterSpacing: -0.5, margin: "0 0 8px", lineHeight: 1.15 }}>
          {profile?.full_name || profile?.business_name || "Your Name"}
        </h1>

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
          <RoleBadge businessType={profile?.business_type} />
          {(() => {
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

        {profile?.bio && (
          <p style={{ fontSize: 14, color: "rgba(240,240,245,0.6)", lineHeight: 1.7, margin: "0 0 12px", maxWidth: 560 }}>
            {profile.bio}
          </p>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          {profile?.location && (
            <span style={{ fontSize: 13, color: "#8b8fa3", display: "flex", alignItems: "center", gap: 5 }}>
              <span>📍</span>{profile.location}
            </span>
          )}

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
          </div>

          {/* Social links */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(139,143,163,0.6)", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 10 }}>
              Links
            </div>
            <SocialLinks links={socialLinks} />
          </div>

          {signOut && (
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
          <div style={{ display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: "#f0f0f5", letterSpacing: -0.3, margin: 0 }}>Portfolio</h2>
              <div style={{ fontSize: 12, color: "#8b8fa3", marginTop: 3 }}>
                {projects.length} {projects.length === 1 ? "project" : "projects"}
              </div>
            </div>
            <button
              onClick={() => { setEditingProject(null); setProjectDialogOpen(true); }}
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
          </div>

          {projects.length > 0 ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
              {projects.map((project, i) => (
                <ProjectCard
                  key={project.id} project={project} index={i}
                  onEdit={(p) => { setEditingProject(p); setProjectDialogOpen(true); }}
                  onDelete={deleteProject}
                />
              ))}
            </div>
          ) : (
            <div
              onClick={() => { setEditingProject(null); setProjectDialogOpen(true); }}
              style={{
                border: "2px dashed rgba(255,255,255,0.09)", borderRadius: 20,
                padding: "60px 32px", textAlign: "center",
                cursor: "pointer", transition: "border-color 0.2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = `${VOLT}44`; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)"; }}
            >
              <div style={{ fontSize: 40, marginBottom: 14 }}>🗂️</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: "#f0f0f5", marginBottom: 6 }}>
                Add your first project
              </div>
              <div style={{ fontSize: 13, color: "#8b8fa3" }}>
                Click to add a project to your portfolio
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
