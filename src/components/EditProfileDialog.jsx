import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { Camera, Check, Link2, Loader2, Mail, MapPin, X } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";

const SOCIAL_PLATFORMS = [
  { key: "instagram", label: "Instagram", placeholder: "@username" },
  { key: "linkedin",  label: "LinkedIn",  placeholder: "linkedin.com/in/username" },
  { key: "tiktok",    label: "TikTok",    placeholder: "@username" },
  { key: "x",         label: "X",         placeholder: "@username" },
  { key: "youtube",   label: "YouTube",   placeholder: "@username" },
  { key: "vimeo",     label: "Vimeo",     placeholder: "vimeo.com/username" },
];

function normalizeSocialUrl(value, platform) {
  if (!value || !value.trim()) return "";
  const v = value.trim();
  if (v.startsWith("http")) return v;
  if (platform === "linkedin") return `https://linkedin.com/in/${v.replace(/^\//, "")}`;
  if (platform === "youtube") return `https://youtube.com/${v}`;
  if (platform === "vimeo") return `https://vimeo.com/${v}`;
  if (["instagram", "tiktok", "x"].includes(platform)) {
    return `https://${platform}.com/${v.replace(/^@/, "")}`;
  }
  return `https://${v}`;
}

function SocialIcon({ platform }) {
  const props = { width: 16, height: 16, fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" };
  if (platform === "instagram") return <svg {...props} viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>;
  if (platform === "linkedin") return <svg {...props} viewBox="0 0 24 24"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>;
  if (platform === "tiktok") return <svg {...props} viewBox="0 0 24 24"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/></svg>;
  if (platform === "x") return <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>;
  if (platform === "youtube") return <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>;
  if (platform === "vimeo") return <svg {...props} viewBox="0 0 24 24"><path d="M22 8.1C22 6 20.9 4.9 19.7 4.9c-.7 0-1.3.3-1.8.9-.5.6-.9 1.4-.9 2.5 0 2.3 1.4 3.5 4.1 3.5 1.5 0 2.9-.3 3.9-1.1V12c-1.1.5-2.3.8-3.6.8-2.9 0-4.9-1.6-4.9-4.7 0-1.5.5-2.7 1.7-3.6 1.2-1 2.7-1.4 4.5-1.4 1.7 0 3.1.4 4.1 1.2.9.9 1.4 2 1.4 3.5v5.5c0 .8.1 1.4.3 1.8.2.4.6.8 1.2 1 .6.3 1.4.4 2.3.4 1.3 0 2.4-.4 3.2-1.2.8-.8 1.3-2 1.3-3.5-.2-2.3-1.7-3.7-4.3-4.2z"/></svg>;
  return <GlobeFallback />;
}

function GlobeFallback() {
  return <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>;
}

function useCharacterLimit({ maxLength, initialValue = "" }) {
  const [value, setValue] = useState(initialValue);
  const characterCount = value.length;
  const handleChange = (e) => {
    if (e.target.value.length <= maxLength) setValue(e.target.value);
  };
  return { value, characterCount, handleChange };
}

function useImageUpload() {
  const [previewUrl, setPreviewUrl] = useState(null);
  const [fileObject, setFileObject] = useState(null);
  const fileInputId = useId();

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileObject(file);
    const reader = new FileReader();
    reader.onloadend = () => setPreviewUrl(reader.result);
    reader.readAsDataURL(file);
  };

  return { previewUrl, fileObject, handleFileChange, fileInputId };
}

function FieldGroup({ label, htmlFor, children, hint }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 7 }}>
        <label htmlFor={htmlFor} style={{ fontSize: 12.5, fontWeight: 500, color: "rgba(240,240,245,0.5)", letterSpacing: "0.01em" }}>
          {label}
        </label>
        {hint && <span style={{ fontSize: 11.5, color: "rgba(240,240,245,0.3)" }}>{hint}</span>}
      </div>
      {children}
    </div>
  );
}

export function EditProfileDialog({ open, onOpenChange, profile, onSaveComplete }) {
  const id = useId();
  const { user, updateProfile } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const maxLength = 200;
  const { value: bio, characterCount, handleChange: handleBioChange } = useCharacterLimit({
    maxLength,
    initialValue: profile?.bio || "",
  });

  const [form, setForm] = useState({
    fullName: "",
    username: "",
    website: "",
    email: "",
    location: "",
    instagram: "",
    linkedin: "",
    tiktok: "",
    x: "",
    youtube: "",
    vimeo: "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const { previewUrl, fileObject, fileInputId, handleFileChange } = useImageUpload();

  useEffect(() => {
    if (open && profile) {
      const sl = profile.social_links || {};
      setForm({
        fullName: profile.full_name || profile.business_name || "",
        username: profile.username || "",
        website: sl.website || "",
        email: sl.email || "",
        location: profile.location || "",
        instagram: sl.instagram || "",
        linkedin: sl.linkedin || "",
        tiktok: sl.tiktok || "",
        x: sl.x || sl.twitter || "",
        youtube: sl.youtube || "",
        vimeo: sl.vimeo || "",
      });
    }
  }, [open, profile]);

  const handleChange = (field, val) => setForm((prev) => ({ ...prev, [field]: val }));

  const handleSave = async () => {
    if (!user?.id) return;
    setSaving(true);
    setError(null);

    try {
      let avatar_url = profile?.avatar_url || null;

      if (fileObject) {
        const ext = fileObject.name.split(".").pop();
        const path = `${user.id}/avatar-${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(path, fileObject, { upsert: true, contentType: fileObject.type });

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
          avatar_url = publicUrl;
        }
      }

      const existingSl = profile?.social_links || {};
      const updates = {
        full_name: form.fullName.trim() || null,
        bio: bio.trim() || null,
        location: form.location.trim() || null,
        social_links: {
          website: form.website || null,
          email: form.email || null,
          instagram: form.instagram || null,
          linkedin: form.linkedin || null,
          tiktok: form.tiktok || null,
          x: form.x || null,
          youtube: form.youtube || null,
          vimeo: form.vimeo || null,
        },
        username: form.username.trim().toLowerCase() || null,
        avatar_url,
      };

      if (form.username !== (profile?.username || "") && form.username) {
        updates.username_changed_at = new Date().toISOString();
      }

      const { error: updateErr } = await updateProfile(updates);

      if (!updateErr) {
        onSaveComplete?.(updates);
        onOpenChange(false);
      } else {
        setError(updateErr.message || "Failed to save profile.");
      }
    } catch (err) {
      setError(err.message || "An error occurred.");
    } finally {
      setSaving(false);
    }
  };

  const currentImage = previewUrl || profile?.avatar_url;
  const initials = form.fullName ? form.fullName[0].toUpperCase() : "?";
  const isUsernameChanged = form.username && form.username !== (profile?.username || "");
  const bioRemaining = maxLength - characterCount;

  const overlay = (
    <AnimatePresence>
      {open && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "clamp(16px, 4vw, 40px)" }}>
          <motion.div key="backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} onClick={() => onOpenChange(false)} style={{ position: "absolute", inset: 0, zIndex: 0, background: "rgba(0,0,0,0.45)" }} />
          <motion.div key="modal" initial={{ opacity: 0, scale: 0.96, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 12 }} transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }} style={{ position: "relative", zIndex: 10, width: "100%", maxWidth: 860, maxHeight: "90vh", display: "flex", flexDirection: "column", background: "#0b0b0f", borderRadius: 28, border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 24px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.04) inset", overflow: "hidden", flexShrink: 0 }}>
            <input id={fileInputId} type="file" onChange={handleFileChange} accept="image/*" style={{ display: "none" }} />

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px 17px", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
              <button onClick={() => onOpenChange(false)} style={{ background: "none", border: "none", color: "rgba(240,240,245,0.45)", fontSize: 14, fontWeight: 500, cursor: "pointer", padding: "6px 8px", borderRadius: 8, transition: "color 0.15s", minHeight: 32, minWidth: 60, textAlign: "left" }} onMouseEnter={(e) => e.currentTarget.style.color = "#f0f0f5"} onMouseLeave={(e) => e.currentTarget.style.color = "rgba(240,240,245,0.45)"}>Cancel</button>
              <span style={{ fontSize: 16, fontWeight: 600, color: "#f0f0f5", letterSpacing: "-0.01em" }}>Edit Profile</span>
              <button onClick={handleSave} disabled={saving} style={{ background: saving ? "rgba(204,253,1,0.1)" : "linear-gradient(135deg, #ccfd01, #b8e300)", color: saving ? "rgba(204,253,1,0.5)" : "#0a0a0a", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", padding: "7px 18px", minHeight: 32, display: "inline-flex", alignItems: "center", gap: 6, transition: "all 0.2s ease", boxShadow: saving ? "none" : "0 2px 12px rgba(204,253,1,0.25)", minWidth: 60, justifyContent: "center" }} onMouseEnter={(e) => { if (!saving) e.currentTarget.style.boxShadow = "0 4px 20px rgba(204,253,1,0.35)"; }} onMouseLeave={(e) => { if (!saving) e.currentTarget.style.boxShadow = "0 2px 12px rgba(204,253,1,0.25)"; }}>
                {saving ? <><Loader2 size={13} style={{ animation: "spin 0.8s linear infinite" }} />Saving</> : "Save"}
              </button>
            </div>

            <div style={{ overflowY: "auto", flex: 1, padding: "32px 40px", display: "flex", flexDirection: "column", gap: 32 }}>
              {error && (
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderRadius: 12, background: "rgba(255,98,89,0.08)", border: "1px solid rgba(255,98,89,0.2)", fontSize: 13, color: "#FF6259" }}>
                  <X size={14} />{error}
                </div>
              )}

              <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                <div onClick={() => document.getElementById(fileInputId)?.click()} style={{ position: "relative", cursor: "pointer", flexShrink: 0 }}>
                  <div style={{ width: 96, height: 96, borderRadius: "50%", overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,0.4)", border: "3px solid rgba(255,255,255,0.08)", background: currentImage ? "transparent" : "#ccfd01", display: "flex", alignItems: "center", justifyContent: "center", transition: "box-shadow 0.2s" }}>
                    {currentImage ? (
                      <img src={currentImage} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <span style={{ fontSize: 36, fontWeight: 700, color: "#0a0a0a" }}>{initials}</span>
                    )}
                  </div>
                  <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, transition: "opacity 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.opacity = 1} onMouseLeave={(e) => e.currentTarget.style.opacity = 0}>
                    <Camera size={22} color="#fff" />
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h2 style={{ fontSize: 20, fontWeight: 600, color: "#f0f0f5", margin: "0 0 4px", letterSpacing: "-0.02em" }}>{form.fullName || "Your Name"}</h2>
                  <p style={{ fontSize: 13.5, color: "rgba(240,240,245,0.4)", margin: "0 0 14px", fontFamily: "monospace" }}>@{form.username || "username"}</p>
                  <button type="button" onClick={() => document.getElementById(fileInputId)?.click()} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "7px 14px", borderRadius: 9, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "rgba(240,240,245,0.6)", fontSize: 12.5, fontWeight: 500, cursor: "pointer", transition: "all 0.15s" }} onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "#f0f0f5"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "rgba(240,240,245,0.6)"; }}>
                    <Camera size={13} />Change photo
                  </button>
                </div>
              </div>

              <div style={{ height: 1, background: "rgba(255,255,255,0.05)" }} />

              <div>
                <h3 style={{ fontSize: 12, fontWeight: 600, color: "rgba(240,240,245,0.35)", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 20px" }}>Personal Details</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <FieldGroup label="Name" htmlFor={`${id}-name`}>
                    <input id={`${id}-name`} value={form.fullName} onChange={(e) => handleChange("fullName", e.target.value)} placeholder="Your name" className="ep-input" />
                  </FieldGroup>
                  <FieldGroup label="Username" htmlFor={`${id}-username`} hint={isUsernameChanged ? "URL will update" : null}>
                    <div style={{ position: "relative" }}>
                      <input id={`${id}-username`} value={form.username} onChange={(e) => handleChange("username", e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ""))} placeholder="username" className="ep-input ep-input-icon" />
                      <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}><Check size={13} color={form.username ? "rgba(52,199,89,0.9)" : "rgba(255,255,255,0.2)"} /></span>
                    </div>
                  </FieldGroup>
                  <FieldGroup label="Location" htmlFor={`${id}-location`}>
                    <div style={{ position: "relative" }}>
                      <input id={`${id}-location`} value={form.location} onChange={(e) => handleChange("location", e.target.value)} placeholder="City, Country" className="ep-input ep-input-icon" />
                      <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}><MapPin size={13} color="rgba(255,255,255,0.25)" /></span>
                    </div>
                  </FieldGroup>
                  <FieldGroup label="Website" htmlFor={`${id}-website`}>
                    <div style={{ position: "relative" }}>
                      <input id={`${id}-website`} value={form.website} onChange={(e) => handleChange("website", e.target.value.replace(/^https?:\/\//, ""))} placeholder="yourdomain.com" className="ep-input ep-input-icon" />
                      <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}><Link2 size={13} color="rgba(255,255,255,0.25)" /></span>
                    </div>
                  </FieldGroup>
                </div>
                <div style={{ marginTop: 16 }}>
                  <FieldGroup label="Email" htmlFor={`${id}-email`}>
                    <div style={{ position: "relative" }}>
                      <input id={`${id}-email`} type="email" value={form.email} onChange={(e) => handleChange("email", e.target.value)} placeholder="hello@example.com" className="ep-input ep-input-icon" />
                      <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}><Mail size={13} color="rgba(255,255,255,0.25)" /></span>
                    </div>
                  </FieldGroup>
                </div>
              </div>

              <div style={{ height: 1, background: "rgba(255,255,255,0.05)" }} />

              <div>
                <h3 style={{ fontSize: 12, fontWeight: 600, color: "rgba(240,240,245,0.35)", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 20px" }}>Social Links</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  {SOCIAL_PLATFORMS.map((p) => (
                    <div key={p.key} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ color: "rgba(240,240,245,0.35)", flexShrink: 0 }}><SocialIcon platform={p.key} /></span>
                      <input
                        value={form[p.key] || ""}
                        onChange={(e) => handleChange(p.key, e.target.value)}
                        placeholder={p.placeholder}
                        className="ep-input ep-input-social"
                        style={{ flex: 1 }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ height: 1, background: "rgba(255,255,255,0.05)" }} />

              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <h3 style={{ fontSize: 12, fontWeight: 600, color: "rgba(240,240,245,0.35)", letterSpacing: "0.1em", textTransform: "uppercase", margin: 0 }}>Bio</h3>
                  <span style={{ fontSize: 11.5, color: "rgba(240,240,245,0.25)", fontVariantNumeric: "tabular-nums" }}>{bioRemaining} remaining</span>
                </div>
                <textarea id={`${id}-bio`} value={bio} maxLength={maxLength} onChange={handleBioChange} placeholder="Tell people what you make, who you help, and what sets you apart..." rows={5} className="ep-input ep-textarea" />
              </div>
            </div>

            <style>{`
              @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
              .ep-input { width: 100%; min-height: 44px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.03); color: #f0f0f5; font-size: 14px; padding: 0 12px; outline: none; transition: border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease; font-family: -apple-system, 'SF Pro Display', system-ui, sans-serif; }
              .ep-input.ep-input-icon { padding-left: 36px; }
              .ep-input.ep-input-social { padding-left: 10px; font-size: 13px; min-height: 40px; }
              .ep-input::placeholder { color: rgba(240,240,245,0.25); }
              .ep-input:hover { border-color: rgba(255,255,255,0.18); background: rgba(255,255,255,0.05); }
              .ep-input:focus-visible { border-color: rgba(204,253,1,0.7); box-shadow: 0 0 0 3px rgba(204,253,1,0.12); background: rgba(255,255,255,0.05); }
              .ep-textarea { min-height: 130px; padding: 12px; resize: vertical; line-height: 1.6; }
              @media (max-width: 640px) { .ep-input { font-size: 16px; } }
            `}</style>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  if (!mounted) return null;
  return createPortal(overlay, document.body);
}