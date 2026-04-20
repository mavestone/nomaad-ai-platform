import { useId, useState, useEffect } from "react";
import { useCharacterLimit } from "../hooks/use-character-limit";
import { useImageUpload } from "../hooks/use-image-upload";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Check, ImagePlus, X } from "lucide-react";
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
    bookingUrl: profile?.social_links?.bookingUrl || "",
    location: profile?.location || "",
    availability: profile?.availability || "away",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const { previewUrl, fileObject, fileInputRef, handleThumbnailClick, handleFileChange } = useImageUpload();

  // Reset form when opened with a new profile
  useEffect(() => {
      if (open && profile) {
      setForm({
        fullName: profile.full_name || profile.business_name || "",
        username: profile.username || "",
        website: profile.social_links?.website || "",
        email: profile.social_links?.email || "",
        bookingUrl: profile.social_links?.bookingUrl || "",
        location: profile.location || "",
        availability: profile.availability || "away",
      });
      // Need a way to reset bio correctly, but character limit hook initializes once.
    }
  }, [open, profile]);

  const handleChange = (field, val) => setForm(p => ({ ...p, [field]: val }));

  const handleSave = async () => {
    if (!user?.id) return;
    setSaving(true);
    setError(null);

    try {
      let avatar_url = profile.avatar_url;
      
      // Upload new avatar if selected
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
          bookingUrl: form.bookingUrl 
        },
        username: form.username.trim().toLowerCase() || null,
        avatar_url
      };

      if (form.username !== profile.username && form.username) {
        updates.username_changed_at = new Date().toISOString();
      }

      // Optimistic save logic handled via updateProfile
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex flex-col gap-0 overflow-hidden p-0 sm:max-w-lg [&>button:last-child]:top-3.5">
        <DialogHeader className="contents space-y-0 text-left">
          <DialogTitle className="border-b border-white/10 px-6 py-4 text-base text-white">
            Edit profile
          </DialogTitle>
        </DialogHeader>
        <DialogDescription className="sr-only">
          Make changes to your profile here.
        </DialogDescription>
        
        <div className="overflow-y-auto max-h-[60vh]">
          {/* Cover Placeholder Background */}
          <div className="h-28 bg-[#111115] relative overflow-hidden">
             <div className="absolute inset-0 opacity-20 bg-gradient-to-r from-[#ccfd01] to-[#b8e300] blur-3xl"></div>
          </div>
          
          <div className="-mt-10 px-6">
            <div className="relative flex size-20 items-center justify-center overflow-hidden rounded-full border-4 border-[#08080a] bg-neutral-800 shadow-sm shadow-black/10">
              {currentImage ? (
                <img src={currentImage} className="h-full w-full object-cover" alt="Profile" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#ccfd01] to-[#b8e300] text-black font-bold text-2xl">
                  {form.fullName ? form.fullName[0].toUpperCase() : "U"}
                </div>
              )}
              <button
                type="button"
                className="absolute flex size-8 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                onClick={handleThumbnailClick}
                aria-label="Change profile picture"
              >
                <ImagePlus size={16} strokeWidth={2} />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*"
              />
            </div>
          </div>

          <div className="px-6 pb-6 pt-4">
            <div className="space-y-4">
              {error && <div className="text-red-500 text-sm bg-red-500/10 p-3 rounded-lg">{error}</div>}
              
              <div className="space-y-2">
                <Label htmlFor={`${id}-name`}>Full name</Label>
                <Input
                  id={`${id}-name`}
                  placeholder="Your full name"
                  value={form.fullName}
                  onChange={(e) => handleChange("fullName", e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-4 sm:flex-row">
                <div className="flex-1 space-y-2">
                  <Label htmlFor={`${id}-username`}>Username</Label>
                  <div className="relative">
                    <Input
                      id={`${id}-username`}
                      className="peer pe-9"
                      placeholder="Username"
                      value={form.username}
                      onChange={(e) => handleChange("username", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                    />
                    {form.username && (
                      <div className="pointer-events-none absolute inset-y-0 end-0 flex items-center justify-center pe-3 text-white/50">
                        <Check size={16} strokeWidth={2} className="text-[#ccfd01]" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex-1 space-y-2">
                  <Label htmlFor={`${id}-location`}>Location</Label>
                  <Input
                    id={`${id}-location`}
                    placeholder="e.g. London, UK"
                    value={form.location}
                    onChange={(e) => handleChange("location", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`${id}-website`}>Website / Main Link</Label>
                <div className="flex rounded-lg">
                  <span className="-z-10 inline-flex items-center rounded-s-lg border border-r-0 border-white/10 bg-white/5 px-3 text-sm text-white/50">
                    https://
                  </span>
                  <Input
                    id={`${id}-website`}
                    className="-ms-px rounded-s-none"
                    placeholder="yourwebsite.com"
                    value={form.website}
                    onChange={(e) => handleChange("website", e.target.value.replace(/^https?:\/\//, ""))}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row">
                <div className="flex-1 space-y-2">
                  <Label htmlFor={`${id}-email`}>Public Email</Label>
                  <Input
                    id={`${id}-email`}
                    type="email"
                    placeholder="hello@example.com"
                    value={form.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <Label htmlFor={`${id}-bookingUrl`}>Booking Link (e.g. Calendly)</Label>
                  <Input
                    id={`${id}-bookingUrl`}
                    placeholder="cal.com/username"
                    value={form.bookingUrl}
                    onChange={(e) => handleChange("bookingUrl", e.target.value.replace(/^https?:\/\//, ""))}
                  />
                </div>
              </div>

               <div className="space-y-2">
                <Label htmlFor={`${id}-avail`}>Current Availability</Label>
                <div className="flex gap-2">
                  {['available', 'busy', 'away'].map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => handleChange("availability", status)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                        form.availability === status
                          ? "border-[#ccfd01] bg-[#ccfd01]/10 text-[#ccfd01]"
                          : "border-white/10 bg-transparent text-white/50 hover:bg-white/5"
                      }`}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`${id}-bio`}>Biography</Label>
                <Textarea
                  id={`${id}-bio`}
                  placeholder="Write a few sentences about yourself"
                  value={bio}
                  maxLength={maxLength}
                  onChange={handleBioChange}
                />
                <p className="mt-2 text-right text-xs text-white/40">
                  <span className="tabular-nums">{limit - characterCount}</span> characters left
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter className="border-t border-white/10 px-6 py-4">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
