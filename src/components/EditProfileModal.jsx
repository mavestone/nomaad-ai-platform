import * as React from "react"
import { socialPlatforms, VOLT, type SocialLinks, type SocialPlatform } from "./SocialIcons"

export interface ProfileData {
  fullName: string
  username: string
  location: string
  email: string
  availability: "available" | "busy" | "away"
  bio: string
  avatarUrl?: string
  role?: string
  coverImages?: string[]
  socialLinks?: SocialLinks
}

interface EditProfileModalProps {
  open: boolean
  onClose: () => void
  initialData?: ProfileData
  onSave?: (data: ProfileData) => void
}

const defaultData: ProfileData = {
  fullName: "Liam",
  username: "liamcinema",
  location: "London, UK",
  email: "",
  availability: "away",
  bio: "",
  socialLinks: {},
}

export function EditProfileModal({
  open,
  onClose,
  initialData = defaultData,
  onSave,
}: EditProfileModalProps) {
  const [formData, setFormData] = React.useState<ProfileData>(initialData)
  const [usernameValid, setUsernameValid] = React.useState(true)
  const [showAddSocial, setShowAddSocial] = React.useState(false)

  React.useEffect(() => {
    if (open) {
      setFormData(initialData)
      setShowAddSocial(false)
    }
  }, [open, initialData])

  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [open])

  const handleChange = (field: keyof ProfileData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (field === "username") {
      setUsernameValid(value.length >= 3)
    }
  }

  const handleSocialChange = (platform: SocialPlatform, value: string) => {
    setFormData((prev) => ({
      ...prev,
      socialLinks: { ...prev.socialLinks, [platform]: value }
    }))
  }

  const handleRemoveSocial = (platform: SocialPlatform) => {
    setFormData((prev) => {
      const newLinks = { ...prev.socialLinks }
      delete newLinks[platform]
      return { ...prev, socialLinks: newLinks }
    })
  }

  const handleAddSocial = (platform: SocialPlatform) => {
    setFormData((prev) => ({
      ...prev,
      socialLinks: { ...prev.socialLinks, [platform]: "" }
    }))
    setShowAddSocial(false)
  }

  const handleSave = () => {
    if (usernameValid && onSave) {
      onSave(formData)
    }
    onClose()
  }

  const addedPlatforms = Object.keys(formData.socialLinks || {}) as SocialPlatform[]
  const availablePlatforms = socialPlatforms.filter(p => !addedPlatforms.includes(p.key))

  if (!open) return null

  return (
    <div style={{
      position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 16,
    }} onClick={onClose}>
      <div style={{
        backgroundColor: "#141414", borderRadius: 20, width: "100%", maxWidth: 520, maxHeight: "90vh",
        overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.6)",
      }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", fontSize: 15, cursor: "pointer", padding: "8px 12px", borderRadius: 8 }}>
            Cancel
          </button>
          <span style={{ fontSize: 15, fontWeight: 600, color: "#fff" }}>Edit Profile</span>
          <button onClick={handleSave} style={{ background: "none", border: "none", color: VOLT, fontSize: 15, fontWeight: 600, cursor: "pointer", padding: "8px 12px", borderRadius: 8 }}>
            Save
          </button>
        </div>

        {/* Content */}
        <div style={{ maxHeight: "calc(90vh - 65px)", overflowY: "auto", padding: "0 20px 20px" }}>
          {/* Avatar */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "32px 0", background: "rgba(255,255,255,0.02)", borderRadius: 16, margin: "20px 0" }}>
            <div style={{ width: 112, height: 112, borderRadius: "50%", background: VOLT, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, fontWeight: 600, color: "#000", overflow: "hidden" }}>
              {formData.avatarUrl ? <img src={formData.avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : formData.fullName.charAt(0)}
            </div>
            <button style={{ marginTop: 12, background: "none", border: "none", color: VOLT, fontSize: 14, fontWeight: 500, cursor: "pointer" }}>Change photo</button>
          </div>

          {/* Form Fields */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <InputRow label="Full name" value={formData.fullName} onChange={(v) => handleChange("fullName", v)} />
            <InputRow label="Username" value={formData.username} onChange={(v) => handleChange("username", v)} suffix=".nomaad.ai" error={!usernameValid ? "Must be 3+ characters" : undefined} />
            <InputRow label="Location" value={formData.location} onChange={(v) => handleChange("location", v)} placeholder="City, Country" />
            <InputRow label="Email" value={formData.email} onChange={(v) => handleChange("email", v)} placeholder="hello@example.com" />
            <InputRow label="Bio" value={formData.bio} onChange={(v) => handleChange("bio", v)} multiline />
          </div>

          {/* Availability */}
          <div style={{ marginTop: 24 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.6)", display: "block", marginBottom: 8 }}>Availability</label>
            <div style={{ display: "flex", gap: 8 }}>
              {(["available", "busy", "away"] as const).map((av) => (
                <button key={av} onClick={() => setFormData(p => ({ ...p, availability: av }))} style={{
                  flex: 1, padding: "10px 16px", borderRadius: 10, border: "none", fontSize: 14, fontWeight: 500, cursor: "pointer",
                  background: formData.availability === av ? (av === "available" ? "#10b981" : av === "busy" ? "#ef4444" : "#f59e0b") : "rgba(255,255,255,0.05)",
                  color: formData.availability === av ? "#fff" : "rgba(255,255,255,0.5)",
                }}>
                  {av.charAt(0).toUpperCase() + av.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Social Links */}
          <div style={{ marginTop: 24 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.6)" }}>Social Links</label>
              <button onClick={() => setShowAddSocial(true)} style={{ background: "none", border: "none", color: VOLT, fontSize: 13, fontWeight: 500, cursor: "pointer" }}>+ Add</button>
            </div>
            {addedPlatforms.map((platform) => (
              <InputRow key={platform} label={platform} value={formData.socialLinks?.[platform] || ""} onChange={(v) => handleSocialChange(platform, v)} onRemove={() => handleRemoveSocial(platform)} placeholder={socialPlatforms.find(p => p.key === platform)?.placeholder} />
            ))}
            {showAddSocial && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                {availablePlatforms.map((p) => (
                  <button key={p.key} onClick={() => handleAddSocial(p.key)} style={{ padding: "8px 16px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)", color: "#fff", fontSize: 13, cursor: "pointer" }}>
                    {p.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function InputRow({ label, value, onChange, placeholder, suffix, error, multiline, onRemove }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; suffix?: string; error?: string; multiline?: boolean; onRemove?: () => void }) {
  return (
    <div>
      <label style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.6)", display: "block", marginBottom: 6 }}>{label}</label>
      <div style={{ position: "relative" }}>
        {multiline ? (
          <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={{
            width: "100%", padding: "12px 14px", borderRadius: 12, border: `1px solid ${error ? "#ef4444" : "rgba(255,255,255,0.1)"}`, background: "rgba(255,255,255,0.03)", color: "#fff", fontSize: 14, fontFamily: "inherit", resize: "vertical", minHeight: 80, boxSizing: "border-box",
          }} />
        ) : (
          <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={{
            width: "100%", padding: "12px 14px", borderRadius: 12, border: `1px solid ${error ? "#ef4444" : "rgba(255,255,255,0.1)"}`, background: "rgba(255,255,255,0.03)", color: "#fff", fontSize: 14, boxSizing: "border-box",
          }} />
        )}
        {suffix && <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "rgba(255,255,255,0.4)" }}>{suffix}</span>}
        {onRemove && <button onClick={onRemove} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 18 }}>×</button>}
      </div>
      {error && <span style={{ fontSize: 12, color: "#ef4444", marginTop: 4, display: "block" }}>{error}</span>
    </div>
  )
}