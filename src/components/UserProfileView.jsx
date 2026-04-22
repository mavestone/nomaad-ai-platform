import { useState, useRef } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { EditProfileDialog } from "./EditProfileDialog";
import { ProjectDialog } from "./ProjectDialog";

const VOLT = "#ccfd01";
const VOLTD = "#b8e300";

const ROLE_COLORS = {
  freelancer: VOLT, agency: "#5AC8FA", consultant: "#FFB340",
  creative: "#AF52DE", developer: "#64D2FF", default: "#FF6259",
};

const ROLE_LABELS = {
  freelancer: "Freelancer", agency: "Agency", consultant: "Consultant",
  creative: "Creative", developer: "Developer", other: "Other",
};

const SOCIAL_DISPLAY = [
  { key: "instagram", label: "Instagram" },
  { key: "linkedin",  label: "LinkedIn" },
  { key: "tiktok",    label: "TikTok" },
  { key: "x",         label: "X" },
  { key: "youtube",   label: "YouTube" },
  { key: "vimeo",     label: "Vimeo" },
  { key: "website",   label: "Website" },
  { key: "email",     label: "Email" },
];

const COVER_IMAGES = [
  "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?w=600&h=400&fit=crop",
];

function getInitials(name) {
  if (!name) return "?";
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

function getRoleColor(businessType) {
  return ROLE_COLORS[businessType] || ROLE_COLORS.default;
}

function SocialIcon({ platform }) {
  const p = { width: 16, height: 16, fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" };
  if (platform === "instagram") return <svg {...p} viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>;
  if (platform === "linkedin") return <svg {...p} viewBox="0 0 24 24"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>;
  if (platform === "tiktok") return <svg {...p} viewBox="0 0 24 24"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/></svg>;
  if (platform === "x") return <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>;
  if (platform === "youtube") return <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>;
  if (platform === "vimeo") return <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor"><path d="M22.396 7.164c-.093 2.026-1.507 4.799-4.245 8.318C15.16 19.24 13.18 21 11.18 21c-1.214 0-2.25-1.12-3.108-3.36-.622-2.08-1.274-4.16-1.959-6.24-.749-2.22-1.553-3.36-2.414-3.36-.156 0-.7.327-1.634.98L1 7.732c1.022-.903 2.028-1.805 3.018-2.707 1.371-1.17 2.404-1.79 3.098-1.858 1.61-.156 2.596.944 2.957 3.3.385 2.52.665 4.08.84 4.68.515 2.08.998 3.12 1.448 3.12.406 0 1.012-.64 1.813-1.91.801-1.27 1.224-2.24 1.268-2.907.094-1.22-.354-1.837-1.346-1.837-.485 0-.99.11-1.513.33.998-3.28 2.902-4.896 5.716-4.843 2.068.048 3.045 1.37 2.928 3.96z"/></svg>;
  if (platform === "website") return <svg {...p} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>;
  if (platform === "email") return <svg {...p} viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>;
  return null;
}

function ProjectCard({ project, index, onEdit, onDelete }) {
  const [hovered, setHovered] = useState(false);
  const coverUrl = project.cover_url || `https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=400&h=300&fit=crop`;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative", aspectRatio: "16/9",
        borderRadius: 16, overflow: "hidden", cursor: "pointer",
        animation: `fadeUp 0.4s ease ${index * 0.06}s backwards`,
      }}
    >
      <img src={coverUrl} alt={project.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.8), transparent 60%)" }} />

      {project.media_type === "video" && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width={24} height={24} viewBox="0 0 24 24" fill="#fff"><polygon points="5,3 19,12 5,21"/></svg>
          </div>
        </div>
      )}

      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: 16 }}>
        <h3 style={{ fontSize: 15, fontWeight: 500, color: "#fff", margin: 0 }}>{project.title}</h3>
        {project.views && <p style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 4, margin: 0 }}>{project.views} views</p>}
      </div>

      {hovered && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(8,8,10,0.75)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
          <button onClick={() => onEdit(project)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.08)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>Edit
          </button>
          <button onClick={() => onDelete(project.id)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 10, border: "1px solid rgba(255,59,48,0.25)", background: "rgba(255,59,48,0.1)", color: "#FF453A", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
          </button>
        </div>
      )}
    </div>
  );
}

export default function UserProfileView({ signOut }) {
  const { user, profile, refreshProfile } = useAuth();
  const [copiedLink, setCopiedLink] = useState(false);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const copyTimeoutRef = useRef();

  const shareableUrl = profile?.username ? `${profile.username}.nomaad.ai` : `nomaad.ai/p/${profile?.id?.slice(0, 8) || "unknown"}`;

  const copyLink = () => {
    navigator.clipboard.writeText(`https://${shareableUrl}`).catch(() => {});
    setCopiedLink(true);
    clearTimeout(copyTimeoutRef.current);
    copyTimeoutRef.current = setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleProfileSave = () => refreshProfile?.();

  const handleProjectSave = async (projectData) => {
    if (!user) return;
    const newProjects = [...(profile?.portfolio_projects || [])];
    const idx = newProjects.findIndex(p => p.id === projectData.id);
    if (idx >= 0) newProjects[idx] = projectData;
    else newProjects.push(projectData);
    await supabase.from('profiles').update({ portfolio_projects: newProjects }).eq('id', user.id);
    refreshProfile?.();
  };

  const deleteProject = async (id) => {
    if (!user) return;
    const newProjects = (profile?.portfolio_projects || []).filter(p => p.id !== id);
    await supabase.from('profiles').update({ portfolio_projects: newProjects }).eq('id', user.id);
    refreshProfile?.();
  };

  const projects = profile?.portfolio_projects || [];
  const socialLinks = profile?.social_links || {};
  const coverImages = profile?.cover_images || COVER_IMAGES;

  const roleColor = getRoleColor(profile?.business_type);
  const roleLabel = ROLE_LABELS[profile?.business_type] || "Creative";

  return (
    <div style={{ width: "100%", minHeight: "100vh", background: "#0a0a0a", fontFamily: "-apple-system,'SF Pro Display',system-ui,sans-serif", WebkitFontSmoothing: "antialiased", color: "#f0f0f5" }}>

      {profileDialogOpen && <EditProfileDialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen} profile={profile} onSaveComplete={handleProfileSave} />}
      {projectDialogOpen && <ProjectDialog open={projectDialogOpen} onOpenChange={setProjectDialogOpen} existingProject={editingProject} onSave={handleProjectSave} />}

      {/* Cover Banner */}
      <div style={{ position: "relative", height: 260, overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, display: "flex" }}>
          {coverImages.slice(0, 3).map((img, i) => (
            <div key={i} style={{ flex: 1, height: "100%" }}>
              <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          ))}
        </div>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, #0a0a0a, rgba(10,10,10,0.15) 50%, transparent)" }} />

        <div style={{ position: "absolute", top: 16, right: 16, display: "flex", gap: 8, zIndex: 10 }}>
          <button onClick={() => setProfileDialogOpen(true)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", borderRadius: 999, background: "rgba(255,255,255,0.1)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.9)", fontSize: 14, cursor: "pointer" }}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>
            Edit Profile
          </button>
          {signOut && (
            <button onClick={() => signOut()} title="Sign out" style={{ width: 40, height: 40, borderRadius: 999, background: "rgba(255,255,255,0.1)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.7)", cursor: "pointer" }}>
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </button>
          )}
        </div>
      </div>

      {/* Profile Content */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 32px 64px" }}>

        {/* Identity block */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 28, marginTop: -56 }}>
          {/* Avatar */}
          <div style={{ flexShrink: 0 }}>
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt={profile?.full_name || "Avatar"} style={{ width: 112, height: 112, borderRadius: "50%", objectFit: "cover", border: "4px solid #0a0a0a", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }} />
            ) : (
              <div style={{ width: 112, height: 112, borderRadius: "50%", background: `linear-gradient(135deg, ${VOLT}, ${VOLTD})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, fontWeight: 700, color: "#0a0a0a", border: "4px solid #0a0a0a", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}>
                {getInitials(profile?.full_name)}
              </div>
            )}
          </div>

          {/* Info column */}
          <div style={{ flex: 1, paddingTop: 8, minWidth: 0 }}>
            <h1 style={{ fontSize: 26, fontWeight: 600, color: "#fff", margin: "0 0 6px", letterSpacing: "-0.02em", lineHeight: 1.2 }}>{profile?.full_name || profile?.business_name || "Your Name"}</h1>

            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
              <span style={{ fontSize: 14, fontWeight: 500, color: VOLT, fontFamily: "monospace" }}>@{profile?.username || "username"}</span>
              <span style={{ width: 4, height: 4, borderRadius: "50%", background: "rgba(255,255,255,0.2)" }} />
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 999, background: roleColor, color: "#000", fontSize: 11, fontWeight: 600 }}>
                <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                {roleLabel}
              </span>
              {profile?.location && (
                <>
                  <span style={{ width: 4, height: 4, borderRadius: "50%", background: "rgba(255,255,255,0.2)" }} />
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, color: "rgba(240,240,245,0.45)" }}>
                    <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    {profile.location}
                  </span>
                </>
              )}
            </div>

            {profile?.bio && (
              <p style={{ fontSize: 14, lineHeight: 1.7, color: "rgba(240,240,245,0.55)", maxWidth: 560, margin: "0 0 20px" }}>
                {profile.bio}
              </p>
            )}

            {/* Social links row */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              {SOCIAL_DISPLAY.map(({ key }) => {
                const url = socialLinks[key];
                if (!url) return null;
                const getUrl = () => {
                  if (url.startsWith("http")) return url;
                  if (key === "email") return `mailto:${url}`;
                  if (key === "website" || key === "linkedin") return `https://${url}`;
                  return `https://${key}.com/${url.replace(/^@/, "")}`;
                };
                return (
                  <a key={key} href={getUrl()} target="_blank" rel="noopener noreferrer" title={key} style={{ padding: 8, borderRadius: 9, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(240,240,245,0.45)", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.09)"; e.currentTarget.style.color = "#fff"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "rgba(240,240,245,0.45)"; }}
                  >
                    <SocialIcon platform={key} />
                  </a>
                );
              })}
            </div>

            {/* Shareable link */}
            <button onClick={copyLink} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 9, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(204,253,1,0.2)", color: VOLT, fontSize: 12, cursor: "pointer", marginTop: 12, transition: "all 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(204,253,1,0.08)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
            >
              <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
              {copiedLink ? shareableUrl + " (Copied!)" : shareableUrl}
            </button>
          </div>
        </div>

        {/* Portfolio */}
        <div style={{ marginTop: 56 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 600, color: "#fff", margin: 0 }}>Portfolio</h2>
              <p style={{ fontSize: 13, color: "rgba(240,240,245,0.4)", marginTop: 4, margin: 0 }}>
                {projects.length} {projects.length === 1 ? "project" : "projects"}
              </p>
            </div>
            <button onClick={() => { setEditingProject(null); setProjectDialogOpen(true); }} style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 18px", borderRadius: 999, background: "none", border: `1px solid ${VOLT}`, color: VOLT, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add Project
            </button>
          </div>

          {projects.length > 0 ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
              {projects.map((project, i) => (
                <ProjectCard key={project.id} project={project} index={i} onEdit={(p) => { setEditingProject(p); setProjectDialogOpen(true); }} onDelete={deleteProject} />
              ))}
              <button onClick={() => { setEditingProject(null); setProjectDialogOpen(true); }} style={{ aspectRatio: "16/9", borderRadius: 16, border: "2px dashed rgba(255,255,255,0.08)", background: "none", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, cursor: "pointer" }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth={2}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                </div>
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.3)" }}>Add project</span>
              </button>
            </div>
          ) : (
            <div onClick={() => { setEditingProject(null); setProjectDialogOpen(true); }} style={{ border: "2px dashed rgba(255,255,255,0.06)", borderRadius: 20, padding: "80px 32px", textAlign: "center", cursor: "pointer" }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: "rgba(255,255,255,0.03)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={1.5}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
              </div>
              <div style={{ fontSize: 18, fontWeight: 600, color: "#fff", marginBottom: 8 }}>Add your first project</div>
              <div style={{ fontSize: 14, color: "rgba(240,240,245,0.4)" }}>Showcase your work to clients and collaborators</div>
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