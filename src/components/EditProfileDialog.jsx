import { useId, useState, useEffect } from "react";
import { useCharacterLimit } from "../hooks/use-character-limit";
import { useImageUpload } from "../hooks/use-image-upload";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "./ui/dialog";
import { Check, Camera, X } from "lucide-react";
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

  const handleChange = (field, val) => setForm(p => ({ ...p, [field]: val }));

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
          const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
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

  const availabilityOptions = [
    { value: "available", label: "Available", color: "#34C759" },
    { value: "busy", label: "Busy", color: "#FF9500" },
    { value: "away", label: "Away", color: "#636366" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        hideCloseButton
        className="p-0 gap-0 sm:max-w-[430px] w-[92vw] rounded-2xl border-0 bg-[#111113] shadow-[0_32px_80px_rgba(0,0,0,0.7)] overflow-hidden flex flex-col max-h-[90vh]"
      >
        <DialogTitle className="sr-only">Edit profile</DialogTitle>
        <DialogDescription className="sr-only">Update your profile information.</DialogDescription>

        {/* Top bar */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 shrink-0">
          <button
            onClick={() => onOpenChange(false)}
            className="text-[15px] text-white/40 hover:text-white/70 transition-colors font-normal"
          >
            Cancel
          </button>
          <span className="text-[15px] font-semibold text-white tracking-tight">Edit Profile</span>
          <button
            onClick={handleSave}
            disabled={saving}
            className="text-[15px] font-semibold text-[#ccfd01] hover:text-[#d8ff4d] disabled:opacity-40 transition-colors"
          >
            {saving ? "Saving" : "Done"}
          </button>
        </div>

        {/* Avatar */}
        <div className="flex flex-col items-center pb-6 shrink-0">
          <div className="relative group cursor-pointer" onClick={handleThumbnailClick}>
            <div className="w-20 h-20 rounded-full overflow-hidden">
              {currentImage ? (
                <img src={currentImage} className="w-full h-full object-cover" alt="Profile" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-[#ccfd01] text-black font-bold text-2xl">
                  {initials}
                </div>
              )}
            </div>
            <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <Camera size={20} className="text-white" />
            </div>
          </div>
          <button
            onClick={handleThumbnailClick}
            className="mt-2 text-[13px] font-medium text-[#ccfd01] hover:text-[#d8ff4d] transition-colors"
          >
            Change Photo
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/*"
          />
        </div>

        {/* Scrollable form */}
        <div className="overflow-y-auto flex-1 px-4 pb-6 space-y-3">

          {error && (
            <div className="flex items-center gap-2 text-[13px] text-red-400 bg-red-500/10 px-4 py-3 rounded-xl">
              <X size={14} />
              {error}
            </div>
          )}

          {/* Name */}
          <FormGroup>
            <FormRow>
              <label htmlFor={`${id}-name`} className="text-[15px] text-white w-24 shrink-0">Name</label>
              <input
                id={`${id}-name`}
                value={form.fullName}
                onChange={(e) => handleChange("fullName", e.target.value)}
                placeholder="Your name"
                className="flex-1 bg-transparent text-[15px] text-white placeholder:text-white/20 outline-none text-right"
              />
            </FormRow>
            <Divider />
            <FormRow>
              <label htmlFor={`${id}-username`} className="text-[15px] text-white w-24 shrink-0">Username</label>
              <div className="flex items-center gap-2 flex-1 justify-end">
                <input
                  id={`${id}-username`}
                  value={form.username}
                  onChange={(e) => handleChange("username", e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ""))}
                  placeholder="username"
                  className="flex-1 bg-transparent text-[15px] text-white placeholder:text-white/20 outline-none text-right"
                />
                {form.username && <Check size={15} className="text-[#34C759] shrink-0" />}
              </div>
            </FormRow>
          </FormGroup>

          {/* Location & Website */}
          <FormGroup>
            <FormRow>
              <label htmlFor={`${id}-location`} className="text-[15px] text-white w-24 shrink-0">Location</label>
              <input
                id={`${id}-location`}
                value={form.location}
                onChange={(e) => handleChange("location", e.target.value)}
                placeholder="City, Country"
                className="flex-1 bg-transparent text-[15px] text-white placeholder:text-white/20 outline-none text-right"
              />
            </FormRow>
            <Divider />
            <FormRow>
              <label htmlFor={`${id}-website`} className="text-[15px] text-white w-24 shrink-0">Website</label>
              <input
                id={`${id}-website`}
                value={form.website}
                onChange={(e) => handleChange("website", e.target.value.replace(/^https?:\/\//, ""))}
                placeholder="yoursite.com"
                className="flex-1 bg-transparent text-[15px] text-white placeholder:text-white/20 outline-none text-right"
              />
            </FormRow>
            <Divider />
            <FormRow>
              <label htmlFor={`${id}-email`} className="text-[15px] text-white w-24 shrink-0">Email</label>
              <input
                id={`${id}-email`}
                type="email"
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="hello@example.com"
                className="flex-1 bg-transparent text-[15px] text-white placeholder:text-white/20 outline-none text-right"
              />
            </FormRow>
          </FormGroup>

          {/* Availability */}
          <FormGroup>
            <div className="px-4 py-3">
              <p className="text-[13px] text-white/40 mb-3 uppercase tracking-wider font-medium">Availability</p>
              <div className="flex gap-2">
                {availabilityOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleChange("availability", opt.value)}
                    style={form.availability === opt.value ? { borderColor: opt.color + "60", backgroundColor: opt.color + "18" } : {}}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[13px] font-medium transition-all border ${
                      form.availability === opt.value
                        ? "text-white border-current"
                        : "bg-transparent border-white/10 text-white/40 hover:text-white/60 hover:border-white/20"
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: opt.color }} />
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </FormGroup>

          {/* Bio */}
          <FormGroup>
            <div className="px-4 pt-3 pb-1">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[13px] text-white/40 uppercase tracking-wider font-medium">Bio</p>
                <span className="text-[11px] text-white/25 tabular-nums">{maxLength - characterCount}</span>
              </div>
              <textarea
                id={`${id}-bio`}
                value={bio}
                maxLength={maxLength}
                onChange={handleBioChange}
                placeholder="Tell people about yourself..."
                rows={4}
                className="w-full bg-transparent text-[15px] text-white placeholder:text-white/20 outline-none resize-none leading-relaxed pb-3"
              />
            </div>
          </FormGroup>

        </div>
      </DialogContent>
    </Dialog>
  );
}

function FormGroup({ children }) {
  return (
    <div className="bg-[#1c1c1e] rounded-2xl overflow-hidden border border-white/[0.06]">
      {children}
    </div>
  );
}

function FormRow({ children }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5 min-h-[52px]">
      {children}
    </div>
  );
}

function Divider() {
  return <div className="h-px bg-white/[0.06] ml-4" />;
}
