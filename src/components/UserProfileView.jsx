import { useState, useRef } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { EditProfileDialog } from "./EditProfileDialog";
import { ProjectDialog } from "./ProjectDialog";

// ── Constants ─────────────────────────────────────────────────────────────────
const VOLT = "#ccfd01";

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

// ── Helpers ───────────────────────────────────────────────────────────────────
function getInitials(name) {
  if (!name) return "?";
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

function getRoleColor(businessType) {
  return ROLE_COLORS[businessType] || ROLE_COLORS.default;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Avatar({ profile, size = 112 }) {
  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      {profile?.avatar_url ? (
        <img
          src={profile.avatar_url}
          alt={profile?.full_name || "Avatar"}
          style={{
            width: size, height: size, borderRadius: "50%",
            objectFit: "cover",
            border: "4px solid #0a0a0a",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          }}
        />
      ) : (
        <div style={{
          width: size, height: size, borderRadius: "50%",
          background: VOLT,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: size * 0.35, fontWeight: 600, color: "#000",
          border: "4px solid #0a0a0a",
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        }}>
          {getInitials(profile?.full_name)}
        </div>
      )}
    </div>
  );
}

function RoleBadge({ businessType }) {
  const color = getRoleColor(businessType);
  const label = ROLE_LABELS[businessType] || "Creative";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "6px 12px", borderRadius: 999,
      background: color, color: "#000",
      fontSize: 12, fontWeight: 600,
    }}>
      <BriefcaseIcon /> {label}
    </span>
  );
}

function LocationBadge({ location }) {
  if (!location) return null;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "6px 12px", borderRadius: 999,
      background: "rgba(255,255,255,0.05)",
      border: "1px solid rgba(255,255,255,0.1)",
      color: "rgba(255,255,255,0.5)", fontSize: 12,
    }}>
      <MapPinIcon /> {location}
    </span>
  );
}

function SocialIconButton({ platform, url }) {
  const icons = {
    instagram: <InstagramIcon />,
    youtube: <YouTubeIcon />,
    vimeo: <VimeoIcon />,
    x: <XIcon />,
    linkedin: <LinkedInIcon />,
    website: <GlobeIcon />,
    email: <MailIcon />,
  };

  const getUrl = () => {
    if (!url) return "#";
    if (url.startsWith("http")) return url;
    if (platform === "email") return `mailto:${url}`;
    if (platform === "website" || platform === "linkedin") return `https://${url}`;
    return `https://${platform}.com/${url.replace(/^@/, "")}`;
  };

  return (
    <a
      href={getUrl()}
      target="_blank"
      rel="noopener noreferrer"
      title={platform}
      style={{
        padding: 10, borderRadius: 10,
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.08)",
        color: "rgba(255,255,255,0.5)",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 0.2s",
      }}
      onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "#fff"; }}
      onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "rgba(255,255,255,0.5)"; }}
    >
      {icons[platform] || <GlobeIcon />}
    </a>
  );
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
            <PlayIcon />
          </div>
        </div>
      )}
      
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: 16 }}>
        <h3 style={{ fontSize: 15, fontWeight: 500, color: "#fff", margin: 0 }}>{project.title}</h3>
        {project.views && <p style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 4, margin: 0 }}>{project.views} views</p>}
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
            <EditIcon /> Edit
          </button>
          <button onClick={() => onDelete(project.id)} style={{
            display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 10,
            border: "1px solid rgba(255,59,48,0.25)", background: "rgba(255,59,48,0.1)",
            color: "#FF453A", fontSize: 13, fontWeight: 600, cursor: "pointer",
          }}>
            <TrashIcon />
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function UserProfileView({ signOut }) {
  const { user, profile, refreshProfile } = useAuth();
  const [copiedLink, setCopiedLink] = useState(false);
  
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
    if (!user) return;
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
    if (!user) return;
    const newProjects = (profile?.portfolio_projects || []).filter(p => p.id !== id);
    await supabase.from('profiles').update({ portfolio_projects: newProjects }).eq('id', user.id);
    refreshProfile?.();
  };

  const projects = profile?.portfolio_projects || [];
  const socialLinks = profile?.social_links || {};
  const coverImages = profile?.cover_images || COVER_IMAGES;

  return (
    <div style={{
      width: "100%", minHeight: "100vh", overflowY: "auto",
      background: "#0a0a0a",
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

      {/* ── Cover Banner ── */}
      <div style={{ position: "relative", height: 280, overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, display: "flex" }}>
          {coverImages.slice(0, 3).map((img, i) => (
            <div key={i} style={{ flex: 1, height: "100%" }}>
              <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          ))}
        </div>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, #0a0a0a, rgba(10,10,10,0.2) 50%, transparent)" }} />

        {/* Top-right actions */}
        <div style={{ position: "absolute", top: 16, right: 16, display: "flex", gap: 8, zIndex: 10 }}>
          <button onClick={() => setProfileDialogOpen(true)} style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "10px 16px", borderRadius: 999,
            background: "rgba(255,255,255,0.1)", backdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "rgba(255,255,255,0.9)", fontSize: 14, cursor: "pointer",
          }}>
            <SettingsIcon /> Edit Profile
          </button>
          {signOut && (
            <button onClick={() => signOut()} title="Sign out" style={{
              width: 40, height: 40, borderRadius: 999,
              background: "rgba(255,255,255,0.1)", backdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.1)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "rgba(255,255,255,0.7)", cursor: "pointer",
            }}>
              <LogOutIcon />
            </button>
          )}
        </div>
      </div>

      {/* ── Profile Content ── */}
      <div style={{ position: "relative", maxWidth: 1152, margin: "0 auto", padding: "0 24px", marginTop: -80 }}>
        
        {/* Profile Header */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 24, flexWrap: "wrap" }}>
            
            {/* Avatar */}
            <Avatar profile={profile} size={112} />

            {/* Info */}
            <div style={{ flex: 1, minWidth: 280 }}>
              <h1 style={{ fontSize: 28, fontWeight: 600, color: "#fff", margin: 0 }}>
                {profile?.full_name || profile?.business_name || "Your Name"}
              </h1>

              {/* Badges */}
              <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 8 }}>
                <RoleBadge businessType={profile?.business_type} />
                <LocationBadge location={profile?.location} />
              </div>

              {/* Bio */}
              {profile?.bio && (
                <p style={{ marginTop: 16, fontSize: 15, lineHeight: 1.7, color: "rgba(255,255,255,0.6)", maxWidth: 600, margin: "16px 0 0" }}>
                  {profile.bio}
                </p>
              )}

              {/* Social Icons + Profile URL */}
              <div style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                {SOCIAL_DISPLAY.map(({ key }) => {
                  const url = socialLinks[key];
                  if (!url) return null;
                  return <SocialIconButton key={key} platform={key} url={url} />;
                })}
                
                <button onClick={copyLink} style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "8px 14px", borderRadius: 10,
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: VOLT, fontSize: 13, cursor: "pointer",
                  marginLeft: Object.values(socialLinks).some(v => v) ? 8 : 0,
                }}>
                  <span>{shareableUrl}</span>
                  {copiedLink ? <CheckIcon /> : <CopyIcon />}
                </button>
              </div>

              <p style={{ marginTop: 12, fontSize: 12, color: "rgba(255,255,255,0.3)" }}>
                Tip: Add your profile link to your bio on socials to share your portfolio
              </p>
            </div>
          </div>
        </div>

        {/* ── Portfolio Section ── */}
        <div style={{ paddingBottom: 48 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 600, color: "#fff", margin: 0 }}>Portfolio</h2>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", marginTop: 2, margin: 0 }}>
                {projects.length} {projects.length === 1 ? "project" : "projects"}
              </p>
            </div>
            <button
              onClick={() => { setEditingProject(null); setProjectDialogOpen(true); }}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "10px 16px", borderRadius: 999,
                background: "none", border: `1px solid ${VOLT}`,
                color: VOLT, fontSize: 14, fontWeight: 500, cursor: "pointer",
              }}
            >
              <PlusIcon /> Add Project
            </button>
          </div>

          {projects.length > 0 ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
              {projects.map((project, i) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  index={i}
                  onEdit={(p) => { setEditingProject(p); setProjectDialogOpen(true); }}
                  onDelete={deleteProject}
                />
              ))}
              <button
                onClick={() => { setEditingProject(null); setProjectDialogOpen(true); }}
                style={{
                  aspectRatio: "16/9", borderRadius: 16,
                  border: "2px dashed rgba(255,255,255,0.1)",
                  background: "none",
                  display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center",
                  gap: 12, cursor: "pointer",
                }}
              >
                <div style={{
                  width: 48, height: 48, borderRadius: "50%",
                  background: "rgba(255,255,255,0.05)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <PlusIcon color="rgba(255,255,255,0.4)" />
                </div>
                <span style={{ fontSize: 14, color: "rgba(255,255,255,0.4)" }}>Add project</span>
              </button>
            </div>
          ) : (
            <div
              onClick={() => { setEditingProject(null); setProjectDialogOpen(true); }}
              style={{
                border: "2px dashed rgba(255,255,255,0.1)", borderRadius: 20,
                padding: "80px 32px", textAlign: "center",
                cursor: "pointer", transition: "border-color 0.2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = `${VOLT}44`; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}
            >
              <div style={{ fontSize: 48, marginBottom: 16 }}>
                <FolderIcon />
              </div>
              <div style={{ fontSize: 18, fontWeight: 600, color: "#fff", marginBottom: 8 }}>
                Add your first project
              </div>
              <div style={{ fontSize: 14, color: "rgba(255,255,255,0.5)" }}>
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

// ── Icons ─────────────────────────────────────────────────────────────────────
function SettingsIcon() {
  return <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="3" /><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" /></svg>;
}
function BriefcaseIcon() {
  return <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>;
}
function MapPinIcon() {
  return <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>;
}
function CopyIcon() {
  return <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>;
}
function CheckIcon() {
  return <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth={2}><polyline points="20,6 9,17 4,12" /></svg>;
}
function PlusIcon({ color = "currentColor", size = 14 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>;
}
function PlayIcon() {
  return <svg width={24} height={24} viewBox="0 0 24 24" fill="#fff"><polygon points="5,3 19,12 5,21" /></svg>;
}
function LogOutIcon() {
  return <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>;
}
function EditIcon() {
  return <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>;
}
function TrashIcon() {
  return <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>;
}
function FolderIcon() {
  return <svg width={48} height={48} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth={1.5}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>;
}
function InstagramIcon() {
  return <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><rect x="2" y="2" width="20" height="20" rx="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></svg>;
}
function YouTubeIcon() {
  return <svg width={18} height={18} viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>;
}
function VimeoIcon() {
  return <svg width={18} height={18} viewBox="0 0 24 24" fill="currentColor"><path d="M23.977 6.416c-.105 2.338-1.739 5.543-4.894 9.609-3.268 4.247-6.026 6.37-8.29 6.37-1.409 0-2.578-1.294-3.553-3.881L5.322 11.4C4.603 8.816 3.834 7.522 3.01 7.522c-.179 0-.806.378-1.881 1.132L0 7.197c1.185-1.044 2.351-2.084 3.501-3.128C5.08 2.701 6.266 1.984 7.055 1.91c1.867-.18 3.016 1.1 3.447 3.838.465 2.953.789 4.789.971 5.507.539 2.45 1.131 3.674 1.776 3.674.502 0 1.256-.796 2.265-2.385 1.004-1.589 1.54-2.797 1.612-3.628.144-1.371-.395-2.061-1.614-2.061-.574 0-1.167.121-1.777.391 1.186-3.868 3.434-5.757 6.762-5.637 2.473.06 3.628 1.664 3.493 4.797l-.013.01z" /></svg>;
}
function XIcon() {
  return <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>;
}
function LinkedInIcon() {
  return <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" /><rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" /></svg>;
}
function GlobeIcon() {
  return <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>;
}
function MailIcon() {
  return <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>;
}
