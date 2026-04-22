import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { Camera, Check, Link2, Loader2, Mail, MapPin, X } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";

const SOCIAL_PLATFORMS = [
  { key: "instagram", label: "Instagram" },
  { key: "linkedin",  label: "LinkedIn" },
  { key: "tiktok",    label: "TikTok" },
  { key: "x",         label: "X" },
  { key: "youtube",   label: "YouTube" },
  { key: "vimeo",     label: "Vimeo" },
];

function SocialIcon({ platform }) {
  const p = { width: 14, height: 14, fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" };
  if (platform === "instagram") return <svg {...p} viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>;
  if (platform === "linkedin") return <svg {...p} viewBox="0 0 24 24"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>;
  if (platform === "tiktok") return <svg {...p} viewBox="0 0 24 24"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/></svg>;
  if (platform === "x") return <svg width={14} height={14} viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>;
  if (platform === "youtube") return <svg width={14} height={14} viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>;
  if (platform === "vimeo") return <svg width={14} height={14} viewBox="0 0 24 24" fill="currentColor"><path d="M22.396 7.164c-.093 2.026-1.507 4.799-4.245 8.318C15.16 19.24 13.18 21 11.18 21c-1.214 0-2.25-1.12-3.108-3.36-.622-2.08-1.274-4.16-1.959-6.24-.749-2.22-1.553-3.36-2.414-3.36-.156 0-.7.327-1.634.98L1 7.732c1.022-.903 2.028-1.805 3.018-2.707 1.371-1.17 2.404-1.79 3.098-1.858 1.61-.156 2.596.944 2.957 3.3.385 2.52.665 4.08.84 4.68.515 2.08.998 3.12 1.448 3.12.406 0 1.012-.64 1.813-1.91.801-1.27 1.224-2.24 1.268-2.907.094-1.22-.354-1.837-1.346-1.837-.485 0-.99.11-1.513.33.998-3.28 2.902-4.896 5.716-4.843 2.068.048 3.045 1.37 2.928 3.96z"/></svg>;
  return null;
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

function FieldRow({ label, htmlFor, children, hint }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <label htmlFor={htmlFor} style={{ fontSize: 13, fontWeight: 500, color: "rgba(240,240,245,0.45)", width: 76, flexShrink: 0 }}>
        {label}
      </label>
      <div style={{ flex: 1, position: "relative" }}>{children}</div>
      {hint && <span style={{ fontSize: 11, color: "rgba(240,240,245,0.25)", flexShrink: 0 }}>{hint}</span>}
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
  const { value: bio, characterCount, handleChange: handleBioChange } = useCharacterLimit({ maxLength, initialValue: profile?.bio || "" });

  const [form, setForm] = useState({
    fullName: "", username: "", website: "", email: "", location: "",
    instagram: "", linkedin: "", tiktok: "", x: "", youtube: "", vimeo: "",
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
        const { error: uploadError } = await supabase.storage.from("avatars").upload(path, fileObject, { upsert: true, contentType: fileObject.type });
        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
          avatar_url = publicUrl;
        }
      }
      const updates = {
        full_name: form.fullName.trim() || null,
        bio: bio.trim() || null,
        location: form.location.trim() || null,
        social_links: {
          website: form.website || null, email: form.email || null,
          instagram: form.instagram || null, linkedin: form.linkedin || null,
          tiktok: form.tiktok || null, x: form.x || null,
          youtube: form.youtube || null, vimeo: form.vimeo || null,
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

            <div style={{ overflowY: "auto", flex: 1, padding: "24px 40px", display: "flex", flexDirection: "column", gap: 24 }}>
              {error && (
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderRadius: 12, background: "rgba(255,98,89,0.08)", border: "1px solid rgba(255,98,89,0.2)", fontSize: 13, color: "#FF6259" }}>
                  <X size={14} />{error}
                </div>
              )}

              <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                <div onClick={() => document.getElementById(fileInputId)?.click()} style={{ position: "relative", cursor: "pointer", flexShrink: 0 }}>
                  <div style={{ width: 80, height: 80, borderRadius: "50%", overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.4)", border: "2px solid rgba(255,255,255,0.08)", background: currentImage ? "transparent" : "#ccfd01", display: "flex", alignItems: "center", justifyContent: "center", transition: "box-shadow 0.2s" }}>
                    {currentImage ? (
                      <img src={currentImage} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <span style={{ fontSize: 30, fontWeight: 700, color: "#0a0a0a" }}>{initials}</span>
                    )}
                  </div>
                  <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, transition: "opacity 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.opacity = 1} onMouseLeave={(e) => e.currentTarget.style.opacity = 0}>
                    <Camera size={18} color="#fff" />
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h2 style={{ fontSize: 18, fontWeight: 600, color: "#f0f0f5", margin: "0 0 4px", letterSpacing: "-0.02em" }}>{form.fullName || "Your Name"}</h2>
                  <p style={{ fontSize: 13, color: "rgba(240,240,245,0.4)", margin: "0 0 12px", fontFamily: "monospace" }}>@{form.username || "username"}</p>
                  <button type="button" onClick={() => document.getElementById(fileInputId)?.click()} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "rgba(240,240,245,0.6)", fontSize: 12, fontWeight: 500, cursor: "pointer", transition: "all 0.15s" }} onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "#f0f0f5"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "rgba(240,240,245,0.6)"; }}>
                    <Camera size={12} />Change photo
                  </button>
                </div>
              </div>

              <div style={{ height: 1, background: "rgba(255,255,255,0.05)" }} />

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <FieldRow label="Name" htmlFor={`${id}-name`}>
                    <input id={`${id}-name`} value={form.fullName} onChange={(e) => handleChange("fullName", e.target.value)} placeholder="Your name" className="sl-input" />
                  </FieldRow>
                  <FieldRow label="Username" htmlFor={`${id}-username`} hint={isUsernameChanged ? "URL updates" : null}>
                    <input id={`${id}-username`} value={form.username} onChange={(e) => handleChange("username", e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ""))} placeholder="username" className="sl-input" />
                  </FieldRow>
                  <FieldRow label="Location" htmlFor={`${id}-location`}>
                    <input id={`${id}-location`} value={form.location} onChange={(e) => handleChange("location", e.target.value)} placeholder="City, Country" className="sl-input" />
                  </FieldRow>
                  <FieldRow label="Website" htmlFor={`${id}-website`}>
                    <input id={`${id}-website`} value={form.website} onChange={(e) => handleChange("website", e.target.value.replace(/^https?:\/\//, ""))} placeholder="yourdomain.com" className="sl-input" />
                  </FieldRow>
                  <FieldRow label="Email" htmlFor={`${id}-email`}>
                    <input id={`${id}-email`} type="email" value={form.email} onChange={(e) => handleChange("email", e.target.value)} placeholder="hello@example.com" className="sl-input" />
                  </FieldRow>
                </div>
              </div>

              <div style={{ height: 1, background: "rgba(255,255,255,0.05)" }} />

              <div>
                <h3 style={{ fontSize: 11, fontWeight: 600, color: "rgba(240,240,245,0.35)", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 14px" }}>Social Links</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {SOCIAL_PLATFORMS.map((p) => (
                    <div key={p.key} style={{ display: "flex", alignItems: "center", gap: 12, padding: "7px 0" }}>
                      <span style={{ color: "rgba(240,240,245,0.35)", width: 76, flexShrink: 0, fontSize: 13, fontWeight: 500 }}>{p.label}</span>
                      <div style={{ position: "relative", flex: 1 }}>
                        <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "rgba(255,255,255,0.2)" }}><SocialIcon platform={p.key} /></span>
                        <input
                          value={form[p.key] || ""}
                          onChange={(e) => handleChange(p.key, e.target.value)}
                          placeholder={p.label === "X" ? "@username" : p.label === "LinkedIn" ? "username" : p.label === "YouTube" ? "@username" : p.label === "Vimeo" ? "username" : "@username"}
                          className="sl-input sl-input-icon"
                          style={{ paddingLeft: 32 }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ height: 1, background: "rgba(255,255,255,0.05)" }} />

              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <h3 style={{ fontSize: 11, fontWeight: 600, color: "rgba(240,240,245,0.35)", letterSpacing: "0.1em", textTransform: "uppercase", margin: 0 }}>Bio</h3>
                  <span style={{ fontSize: 11, color: "rgba(240,240,245,0.2)", fontVariantNumeric: "tabular-nums" }}>{bioRemaining}</span>
                </div>
                <textarea id={`${id}-bio`} value={bio} maxLength={maxLength} onChange={handleBioChange} placeholder="Tell people what you make, who you help, and what sets you apart..." rows={4} className="sl-input sl-textarea" />
              </div>
            </div>

            <style>{`
              @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
              .sl-input { width: 100%; min-height: 38px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.03); color: #f0f0f5; font-size: 13px; padding: 0 10px; outline: none; transition: border-color 0.18s ease, background 0.18s ease; font-family: -apple-system, 'SF Pro Display', system-ui, sans-serif; }
              .sl-input.sl-input-icon { padding-left: 32px; }
              .sl-input::placeholder { color: rgba(240,240,245,0.2); }
              .sl-input:hover { border-color: rgba(255,255,255,0.15); background: rgba(255,255,255,0.05); }
              .sl-input:focus-visible { border-color: rgba(204,253,1,0.6); background: rgba(255,255,255,0.05); }
              .sl-textarea { min-height: 100px; padding: 10px; resize: vertical; line-height: 1.6; }
              @media (max-width: 640px) { .sl-input { font-size: 16px; } }
            `}</style>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  if (!mounted) return null;
  return createPortal(overlay, document.body);
}