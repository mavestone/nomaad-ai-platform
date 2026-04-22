import { useId, useState, useEffect } from "react";
import { useCharacterLimit } from "../hooks/use-character-limit";
import { useImageUpload } from "../hooks/use-image-upload";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "./ui/dialog";
import { Camera, Check, Link2, Loader2, Mail, MapPin, UserRound, X } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";

export function EditProfileDialog({ open, onOpenChange, profile, onSaveComplete }) {
  const id = useId();
  const { user, updateProfile } = useAuth();

  const maxLength = 200;
  const { value: bio, characterCount, handleChange: handleBioChange } = useCharacterLimit({
    maxLength,
    initialValue: profile?.bio || "",
  });

  const [form, setForm] = useState({
    fullName: profile?.full_name || profile?.business_name || "",
    username: profile?.username || "",
    website: profile?.social_links?.website || "",
    email: profile?.social_links?.email || "",
    location: profile?.location || "",
    availability: profile?.availability || "away",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const { previewUrl, fileObject, fileInputRef, handleThumbnailClick, handleFileChange } = useImageUpload();

  useEffect(() => {
    if (open && profile) {
      setForm({
        fullName: profile.full_name || profile.business_name || "",
        username: profile.username || "",
        website: profile.social_links?.website || "",
        email: profile.social_links?.email || "",
        location: profile.location || "",
        availability: profile.availability || "away",
      });
    }
  }, [open, profile]);

  const handleChange = (field, val) => setForm((prev) => ({ ...prev, [field]: val }));

  const handleSave = async () => {
    if (!user?.id) return;
    setSaving(true);
    setError(null);

    try {
      let avatar_url = profile.avatar_url;

      if (fileObject) {
        const ext = fileObject.name.split(".").pop();
        const path = `${user.id}/avatar-${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(path, fileObject, { upsert: true, contentType: fileObject.type });

        if (!uploadError) {
          const {
            data: { publicUrl },
          } = supabase.storage.from("avatars").getPublicUrl(path);
          avatar_url = publicUrl;
        }
      }

      const updates = {
        full_name: form.fullName.trim() || null,
        bio: bio.trim() || null,
        location: form.location.trim() || null,
        availability: form.availability,
        social_links: {
          ...(profile.social_links || {}),
          website: form.website,
          email: form.email,
        },
        username: form.username.trim().toLowerCase() || null,
        avatar_url,
      };

      if (form.username !== profile.username && form.username) {
        updates.username_changed_at = new Date().toISOString();
      }

      const { error: updateErr } = await updateProfile(updates);

      if (!updateErr) {
        onSaveComplete(updates);
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
  const isUsernameChanged = form.username && form.username !== profile?.username;
  const bioRemaining = maxLength - characterCount;

  const availabilityOptions = [
    { value: "available", label: "Available", color: "#34C759" },
    { value: "busy", label: "Busy", color: "#FF9500" },
    { value: "away", label: "Away", color: "#8e8e93" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        hideCloseButton
        className="p-0 gap-0 sm:max-w-[740px] w-[95vw] rounded-[30px] border border-white/[0.1] bg-[#09090b]/95 shadow-[0_60px_140px_rgba(0,0,0,0.75)] overflow-hidden flex flex-col max-h-[92vh] backdrop-blur-2xl"
      >
        <DialogTitle className="sr-only">Edit profile</DialogTitle>
        <DialogDescription className="sr-only">Update your profile information.</DialogDescription>

        <div className="flex items-center justify-between px-6 py-4 shrink-0 border-b border-white/[0.08] bg-[#0d0d11]/90">
          <button
            onClick={() => onOpenChange(false)}
            className="min-h-11 px-3 rounded-xl text-[15px] text-white/65 hover:text-white hover:bg-white/[0.07] transition-colors font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ccfd01]/70"
          >
            Cancel
          </button>
          <p className="text-[18px] font-semibold text-white tracking-tight">Edit Profile</p>
          <button
            onClick={handleSave}
            disabled={saving}
            className="min-h-11 px-4 rounded-xl text-[15px] font-semibold bg-[#ccfd01] text-black hover:bg-[#daff46] disabled:opacity-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ccfd01]/70 inline-flex items-center gap-2"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : null}
            {saving ? "Saving" : "Save"}
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-5">
          <section className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.08] to-white/[0.02] p-5">
            <div className="flex items-center gap-4">
              <div className="relative group cursor-pointer" onClick={handleThumbnailClick}>
                <div className="w-24 h-24 rounded-full overflow-hidden ring-2 ring-white/20 shadow-[0_20px_45px_rgba(0,0,0,0.55)]">
                  {currentImage ? (
                    <img src={currentImage} className="w-full h-full object-cover" alt="Profile" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[#ccfd01] text-black font-semibold text-[30px]">
                      {initials}
                    </div>
                  )}
                </div>
                <div className="absolute inset-0 rounded-full bg-black/45 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <Camera size={18} className="text-white" />
                </div>
              </div>
              <div className="min-w-0">
                <p className="text-[18px] font-semibold text-white truncate">{form.fullName || "Your Name"}</p>
                <p className="text-[13px] text-white/45 truncate">@{form.username || "username"}</p>
                <button
                  onClick={handleThumbnailClick}
                  className="mt-2 min-h-10 px-3 rounded-lg border border-white/15 text-[13px] text-white/85 hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ccfd01]/70"
                >
                  Change photo
                </button>
              </div>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/*"
            />
          </section>

          {error ? (
            <div className="flex items-center gap-2 text-[13px] text-red-300 bg-red-500/12 border border-red-400/25 px-4 py-3 rounded-2xl">
              <X size={14} />
              {error}
            </div>
          ) : null}

          <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Name" icon={<UserRound size={14} />} htmlFor={`${id}-name`}>
              <input
                id={`${id}-name`}
                value={form.fullName}
                onChange={(e) => handleChange("fullName", e.target.value)}
                placeholder="Your name"
                className="form-input"
              />
            </Field>

            <Field
              label="Username"
              icon={<Check size={14} className={form.username ? "text-[#34C759]" : "text-white/35"} />}
              htmlFor={`${id}-username`}
              hint={isUsernameChanged ? "Will update your public URL." : "Used in profile URL"}
            >
              <input
                id={`${id}-username`}
                value={form.username}
                onChange={(e) => handleChange("username", e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ""))}
                placeholder="username"
                className="form-input"
              />
            </Field>

            <Field label="Location" icon={<MapPin size={14} />} htmlFor={`${id}-location`}>
              <input
                id={`${id}-location`}
                value={form.location}
                onChange={(e) => handleChange("location", e.target.value)}
                placeholder="City, Country"
                className="form-input"
              />
            </Field>

            <Field label="Website" icon={<Link2 size={14} />} htmlFor={`${id}-website`}>
              <input
                id={`${id}-website`}
                value={form.website}
                onChange={(e) => handleChange("website", e.target.value.replace(/^https?:\/\//, ""))}
                placeholder="yourdomain.com"
                className="form-input"
              />
            </Field>

            <div className="sm:col-span-2">
              <Field label="Email" icon={<Mail size={14} />} htmlFor={`${id}-email`}>
                <input
                  id={`${id}-email`}
                  type="email"
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="hello@example.com"
                  className="form-input"
                />
              </Field>
            </div>
          </section>

          <section className="rounded-2xl border border-white/[0.08] bg-[#121215]/70 p-4">
            <p className="text-[12px] uppercase tracking-[0.14em] font-semibold text-white/45 mb-3">Availability</p>
            <div className="grid grid-cols-3 gap-2">
              {availabilityOptions.map((opt) => {
                const selected = form.availability === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleChange("availability", opt.value)}
                    className={`min-h-11 rounded-xl border text-[13px] font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ccfd01]/70 ${
                      selected
                        ? "text-white border-white/25 bg-white/[0.10]"
                        : "text-white/55 border-white/10 bg-black/20 hover:text-white/80 hover:border-white/20"
                    }`}
                  >
                    <span className="inline-flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: opt.color }} />
                      {opt.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-2xl border border-white/[0.08] bg-[#121215]/70 p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[12px] uppercase tracking-[0.14em] font-semibold text-white/45">Bio</p>
              <span className="text-[11px] tabular-nums text-white/35">{bioRemaining}</span>
            </div>
            <label htmlFor={`${id}-bio`} className="sr-only">
              Bio
            </label>
            <textarea
              id={`${id}-bio`}
              value={bio}
              maxLength={maxLength}
              onChange={handleBioChange}
              placeholder="Tell people what you make, who you help, and what sets you apart..."
              rows={5}
              className="form-input min-h-[130px] resize-y leading-relaxed"
            />
          </section>
        </div>

        <style>{`
          .form-input {
            width: 100%;
            min-height: 44px;
            border-radius: 12px;
            border: 1px solid rgba(255, 255, 255, 0.12);
            background: rgba(13, 13, 15, 0.72);
            color: #f5f5f7;
            font-size: 14px;
            padding: 10px 12px;
            outline: none;
            transition: border-color 180ms ease, box-shadow 180ms ease, background-color 180ms ease;
          }
          .form-input::placeholder {
            color: rgba(255, 255, 255, 0.28);
          }
          .form-input:hover {
            border-color: rgba(255, 255, 255, 0.2);
          }
          .form-input:focus-visible {
            border-color: rgba(204, 253, 1, 0.8);
            box-shadow: 0 0 0 3px rgba(204, 253, 1, 0.2);
            background: rgba(16, 16, 18, 0.92);
          }
          @media (max-width: 640px) {
            .form-input {
              font-size: 16px;
            }
          }
        `}</style>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, htmlFor, icon, hint, children }) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#121215]/70 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <label htmlFor={htmlFor} className="inline-flex items-center gap-1.5 text-[12px] text-white/55 uppercase tracking-[0.12em] font-semibold">
          <span className="text-white/45">{icon}</span>
          {label}
        </label>
        {hint ? <span className="text-[11px] text-white/35">{hint}</span> : null}
      </div>
      {children}
    </div>
  );
}
