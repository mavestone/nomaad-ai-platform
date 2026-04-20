import * as React from "react"
import { EditProfileModal, type ProfileData } from "./EditProfileModal"
import {
  InstagramIcon,
  TikTokIcon,
  LinkedInIcon,
  YouTubeIcon,
  VimeoIcon,
  SubstackIcon,
  XIcon,
  WhatsAppIcon,
  EmailIcon,
  VOLT,
  type SocialLinks,
} from "./SocialIcons"

const portfolioItems = [
  { id: 1, title: "Commercial Reel 2024", thumbnail: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=400&h=300&fit=crop", type: "video", views: "12.4K" },
  { id: 2, title: "Brand Campaign - Nike", thumbnail: "https://images.unsplash.com/photo-1536240478700-b869070f9279?w=400&h=300&fit=crop", type: "video", views: "8.2K" },
  { id: 3, title: "Documentary Short", thumbnail: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400&h=300&fit=crop", type: "video", views: "5.1K" },
]

const availabilityColors = { available: "#10b981", busy: "#ef4444", away: "#f59e0b" }

const socialIconMap: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  instagram: InstagramIcon,
  tiktok: TikTokIcon,
  linkedin: LinkedInIcon,
  youtube: YouTubeIcon,
  vimeo: VimeoIcon,
  substack: SubstackIcon,
  x: XIcon,
  whatsapp: WhatsAppIcon,
  email: EmailIcon,
}

export function ProfilePage({ isOwner = true, initialProfile }: { isOwner?: boolean; initialProfile?: ProfileData }) {
  const [editOpen, setEditOpen] = React.useState(false)
  const [copied, setCopied] = React.useState(false)

  const [profile, setProfile] = React.useState<ProfileData>(
    initialProfile || {
      fullName: "Liam",
      username: "liamcinema",
      location: "London, UK",
      email: "hello@liamcinema.com",
      availability: "away",
      bio: "Cinematographer & Director specializing in narrative films and commercial content. Available for worldwide projects.",
      role: "Freelancer",
      coverImages: [
        "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?w=600&h=400&fit=crop",
      ],
      socialLinks: { instagram: "instagram.com/liamcinema", youtube: "youtube.com/@liamcinema", vimeo: "vimeo.com/liamcinema" } as SocialLinks,
    }
  )

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(`${profile.username}.nomaad.ai`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <main style={{ minHeight: "100vh", backgroundColor: "#0a0a0a", fontFamily: "-apple-system,'SF Pro Display',system-ui,sans-serif" }}>
      {/* Header Banner */}
      <div style={{ position: "relative", height: 280, overflow: "hidden" }}>
        {/* Cover Images */}
        <div style={{ position: "absolute", inset: 0, display: "flex" }}>
          <div style={{ position: "relative", width: "33.33%", height: "100%" }}>
            <img src={profile.coverImages?.[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(10,10,10,0.6), transparent)" }} />
          </div>
          <div style={{ flex: 1, display: "flex" }}>
            {profile.coverImages?.slice(1).map((img, i) => (
              <div key={i} style={{ flex: 1, height: "100%" }}>
                <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            ))}
          </div>
        </div>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, #0a0a0a, rgba(10,10,10,0.2), transparent)" }} />

        {/* Actions */}
        {isOwner && (
          <div style={{ position: "absolute", top: 16, right: 16, display: "flex", gap: 8 }}>
            <button onClick={() => setEditOpen(true)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", borderRadius: 999, background: "rgba(255,255,255,0.1)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.9)", fontSize: 14, cursor: "pointer" }}>
              <SettingsIcon /> Edit Profile
            </button>
          </div>
        )}
      </div>

      {/* Profile Content */}
      <div style={{ position: "relative", maxWidth: 1152, margin: "0 auto", padding: "0 24px", marginTop: -80 }}>
        <div style={{ marginBottom: 48 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 24, flexWrap: "wrap" }}>
            {/* Avatar */}
            <div style={{ position: "relative", flexShrink: 0 }}>
              <div style={{ width: 112, height: 112, borderRadius: "50%", backgroundColor: VOLT, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, fontWeight: 600, color: "#000", boxShadow: "0 8px 32px rgba(0,0,0,0.4)", border: "4px solid #0a0a0a", overflow: "hidden" }}>
                {profile.avatarUrl ? <img src={profile.avatarUrl} alt={profile.fullName} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : profile.fullName.charAt(0)}
              </div>
              <div style={{ position: "absolute", bottom: 4, right: 4, width: 20, height: 20, borderRadius: "50%", backgroundColor: availabilityColors[profile.availability], border: "4px solid #0a0a0a" }} />
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 280 }}>
              <h1 style={{ fontSize: 28, fontWeight: 600, color: "#fff" }}>{profile.fullName}</h1>

              {/* Badges */}
              <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 8 }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 999, backgroundColor: VOLT, color: "#000", fontSize: 12, fontWeight: 600 }}>
                  <BriefcaseIcon /> {profile.role}
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 999, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)", fontSize: 12 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: availabilityColors[profile.availability] }} />
                  {profile.availability.charAt(0).toUpperCase() + profile.availability.slice(1)}
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 999, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", fontSize: 12 }}>
                  <MapPinIcon /> {profile.location}
                </span>
              </div>

              {/* Bio */}
              <p style={{ marginTop: 16, fontSize: 15, lineHeight: 1.7, color: "rgba(255,255,255,0.6)", maxWidth: 600 }}>{profile.bio}</p>

              {/* Social Icons */}
              {profile.socialLinks && Object.keys(profile.socialLinks).length > 0 && (
                <div style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 8 }}>
                  {Object.entries(profile.socialLinks).map(([platform, url]) => {
                    const Icon = socialIconMap[platform]
                    if (!Icon || !url) return null
                    return (
                      <a key={platform} href={url.startsWith("http") ? url : `https://${url}`} target="_blank" rel="noopener noreferrer" style={{ padding: 10, borderRadius: 10, background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.5)", display: "flex" }} title={platform}>
                        <Icon size={18} />
                      </a>
                    )
                  })}
                  <button onClick={handleCopyUrl} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "none", color: VOLT, fontSize: 13, cursor: "pointer", marginLeft: 8 }}>
                    <span>{profile.username}.nomaad.ai</span>
                    {copied ? <CheckIcon /> : <CopyIcon />}
                  </button>
                </div>
              )}
              <p style={{ marginTop: 12, fontSize: 12, color: "rgba(255,255,255,0.3)" }}>Tip: Add your profile link to your bio on socials to share your portfolio</p>
            </div>
          </div>
        </div>

        {/* Portfolio */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 600, color: "#fff" }}>Portfolio</h2>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>{portfolioItems.length} projects</p>
            </div>
            {isOwner && (
              <button style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", borderRadius: 999, background: "none", border: `1px solid ${VOLT}`, color: VOLT, fontSize: 14, cursor: "pointer" }}>
                <PlusIcon /> Add Project
              </button>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
            {portfolioItems.map((item) => (
              <div key={item.id} style={{ position: "relative", aspectRatio: "16/9", borderRadius: 16, overflow: "hidden", cursor: "pointer" }}>
                <img src={item.thumbnail} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.8), transparent 60%)" }} />
                {item.type === "video" && (
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <PlayIcon />
                    </div>
                  </div>
                )}
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: 16 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 500, color: "#fff" }}>{item.title}</h3>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 4 }}>{item.views} views</p>
                </div>
              </div>
            ))}
            {isOwner && (
              <button style={{ aspectRatio: "16/9", borderRadius: 16, border: "2px dashed rgba(255,255,255,0.1)", background: "none", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, cursor: "pointer" }}>
                <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <PlusIcon color="rgba(255,255,255,0.4)" />
                </div>
                <span style={{ fontSize: 14, color: "rgba(255,255,255,0.4)" }}>Add project</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <EditProfileModal open={editOpen} onClose={() => setEditOpen(false)} initialData={profile} onSave={(data) => setProfile((prev) => ({ ...prev, ...data }))} />
    </main>
  )
}

// Icons
function SettingsIcon() {
  return <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="3" /><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" /></svg>
}
function BriefcaseIcon() {
  return <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>
}
function MapPinIcon() {
  return <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
}
function CopyIcon() {
  return <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
}
function CheckIcon() {
  return <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth={2}><polyline points="20,6 9,17 4,12" /></svg>
}
function PlusIcon({ color = "currentColor", size = 16 }: { color?: string; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
}
function PlayIcon() {
  return <svg width={24} height={24} viewBox="0 0 24 24" fill="#fff" stroke="#fff" strokeWidth={2}><polygon points="5,3 19,12 5,21" /></svg>
}