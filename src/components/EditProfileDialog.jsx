import { useId, useState, useEffect } from "react";
import { useCharacterLimit } from "../hooks/use-character-limit";
import { useImageUpload } from "../hooks/use-image-upload";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Check, Camera } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";

export function EditProfileDialog({ open, onOpenChange, profile, onSaveComplete }) {
  const id = useId();
  const { user, updateProfile } = useAuth();
  
  const maxLength = 200;
  const { value: bio, characterCount, handleChange: handleBioChange, maxLength: limit } = useCharacterLimit({
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
        avatar_url
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

  const availabilityOptions = [
    { value: 'available', label: 'Available', color: '#34C759' },
    { value: 'busy', label: 'Busy', color: '#FF9500' },
    { value: 'away', label: 'Away', color: '#8E8E93' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0 sm:max-w-[480px] bg-[#1c1c1e] border-white/[0.08] rounded-2xl shadow-2xl [&>button:last-child]:hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>Edit profile</DialogTitle>
        </DialogHeader>
        <DialogDescription className="sr-only">
          Make changes to your profile here.
        </DialogDescription>
        
        {/* Header with centered avatar */}
        <div className="relative pt-8 pb-6 px-6 flex flex-col items-center border-b border-white/[0.06]">
          {/* Close button */}
          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.1] flex items-center justify-center transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1L13 13M1 13L13 1" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>

          {/* Avatar */}
          <div className="relative group">
            <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-[#1c1c1e] bg-[#2c2c2e]">
              {currentImage ? (
                <img src={currentImage} className="w-full h-full object-cover" alt="Profile" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-[#ccfd01] text-black font-semibold text-3xl">
                  {form.fullName ? form.fullName[0].toUpperCase() : "?"}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={handleThumbnailClick}
              className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
              aria-label="Change profile picture"
            >
              <Camera size={24} className="text-white" />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/*"
            />
          </div>
          
          <p className="mt-3 text-[13px] text-white/40">Tap to change photo</p>
        </div>

        {/* Form content */}
        <div className="overflow-y-auto max-h-[55vh] px-6 py-5">
          {error && (
            <div className="mb-5 text-[13px] text-red-400 bg-red-500/10 px-4 py-3 rounded-xl">
              {error}
            </div>
          )}
          
          {/* Name */}
          <div className="space-y-1.5 mb-5">
            <Label htmlFor={`${id}-name`} className="text-[13px] text-white/50 font-medium">Name</Label>
            <Input
              id={`${id}-name`}
              placeholder="Your name"
              value={form.fullName}
              onChange={(e) => handleChange("fullName", e.target.value)}
              className="h-12 bg-[#2c2c2e] border-0 rounded-xl text-[15px] placeholder:text-white/25 focus-visible:ring-1 focus-visible:ring-[#ccfd01]/50"
            />
          </div>

          {/* Username & Location row */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="space-y-1.5">
              <Label htmlFor={`${id}-username`} className="text-[13px] text-white/50 font-medium">Username</Label>
              <div className="relative">
                <Input
                  id={`${id}-username`}
                  placeholder="username"
                  value={form.username}
                  onChange={(e) => handleChange("username", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                  className="h-12 bg-[#2c2c2e] border-0 rounded-xl text-[15px] placeholder:text-white/25 pr-10 focus-visible:ring-1 focus-visible:ring-[#ccfd01]/50"
                />
                {form.username && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Check size={16} className="text-[#34C759]" />
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`${id}-location`} className="text-[13px] text-white/50 font-medium">Location</Label>
              <Input
                id={`${id}-location`}
                placeholder="City, Country"
                value={form.location}
                onChange={(e) => handleChange("location", e.target.value)}
                className="h-12 bg-[#2c2c2e] border-0 rounded-xl text-[15px] placeholder:text-white/25 focus-visible:ring-1 focus-visible:ring-[#ccfd01]/50"
              />
            </div>
          </div>

          {/* Website */}
          <div className="space-y-1.5 mb-5">
            <Label htmlFor={`${id}-website`} className="text-[13px] text-white/50 font-medium">Website</Label>
            <Input
              id={`${id}-website`}
              placeholder="yourwebsite.com"
              value={form.website}
              onChange={(e) => handleChange("website", e.target.value.replace(/^https?:\/\//, ""))}
              className="h-12 bg-[#2c2c2e] border-0 rounded-xl text-[15px] placeholder:text-white/25 focus-visible:ring-1 focus-visible:ring-[#ccfd01]/50"
            />
          </div>

          {/* Email */}
          <div className="space-y-1.5 mb-5">
            <Label htmlFor={`${id}-email`} className="text-[13px] text-white/50 font-medium">Public Email</Label>
            <Input
              id={`${id}-email`}
              type="email"
              placeholder="hello@example.com"
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
              className="h-12 bg-[#2c2c2e] border-0 rounded-xl text-[15px] placeholder:text-white/25 focus-visible:ring-1 focus-visible:ring-[#ccfd01]/50"
            />
          </div>

          {/* Availability */}
          <div className="space-y-2 mb-5">
            <Label className="text-[13px] text-white/50 font-medium">Availability</Label>
            <div className="flex gap-2">
              {availabilityOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleChange("availability", opt.value)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-medium transition-all ${
                    form.availability === opt.value
                      ? "bg-white/[0.12] text-white"
                      : "bg-[#2c2c2e] text-white/50 hover:bg-white/[0.08]"
                  }`}
                >
                  <span 
                    className="w-2 h-2 rounded-full" 
                    style={{ backgroundColor: opt.color }}
                  />
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Bio */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor={`${id}-bio`} className="text-[13px] text-white/50 font-medium">Bio</Label>
              <span className="text-[11px] text-white/30 tabular-nums">{limit - characterCount}</span>
            </div>
            <Textarea
              id={`${id}-bio`}
              placeholder="Tell people about yourself..."
              value={bio}
              maxLength={maxLength}
              onChange={handleBioChange}
              className="min-h-[100px] bg-[#2c2c2e] border-0 rounded-xl text-[15px] placeholder:text-white/25 resize-none focus-visible:ring-1 focus-visible:ring-[#ccfd01]/50"
            />
          </div>
        </div>
        
        {/* Footer */}
        <DialogFooter className="border-t border-white/[0.06] px-6 py-4 flex gap-3">
          <Button 
            type="button" 
            variant="ghost" 
            onClick={() => onOpenChange(false)}
            className="flex-1 h-12 rounded-xl bg-[#2c2c2e] hover:bg-white/[0.08] text-white/70 text-[15px] font-medium"
          >
            Cancel
          </Button>
          <Button 
            type="button" 
            onClick={handleSave} 
            disabled={saving}
            className="flex-1 h-12 rounded-xl bg-[#ccfd01] hover:bg-[#d8ff4d] text-black text-[15px] font-semibold disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
