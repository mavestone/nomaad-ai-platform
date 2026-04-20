import { useId, useState, useEffect } from "react";
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
import { useImageUpload } from "../hooks/use-image-upload";
import { ImagePlus, X } from "lucide-react";
import { supabase } from "../lib/supabase";

const MEDIA_TYPES = ["Image", "YouTube", "Vimeo"];
const PROJECT_CATS = ["Photo", "Video", "Design", "Development", "Branding", "Motion", "Other"];

export function ProjectDialog({ open, onOpenChange, existingProject, onSave }) {
  const id = useId();
  const [saving, setSaving] = useState(false);
  
  const [form, setForm] = useState({
    title: "",
    category: "Design",
    year: new Date().getFullYear().toString(),
    mediaType: "Image",
    mediaUrl: "",
  });

  const { previewUrl, fileObject, fileInputRef, handleThumbnailClick, handleFileChange, handleRemove } = useImageUpload();

  useEffect(() => {
    if (open) {
      if (existingProject) {
        setForm({
          title: existingProject.title || "",
          category: existingProject.category || "Design",
          year: existingProject.year?.toString() || new Date().getFullYear().toString(),
          mediaType: existingProject.media_type || "Image",
          mediaUrl: existingProject.media_url || existingProject.cover_url || "",
        });
        if (existingProject.cover_url && existingProject.media_type === "Image") {
           // We can't set the preview hook state easily from props alone without rewriting it,
           // but the UI will render mediaUrl if previewUrl isn't present
        }
      } else {
        setForm({
          title: "",
          category: "Design",
          year: new Date().getFullYear().toString(),
          mediaType: "Image",
          mediaUrl: "",
        });
        handleRemove();
      }
    }
  }, [open, existingProject]);

  const handleChange = (field, val) => setForm(p => ({ ...p, [field]: val }));

  const handleSaveAction = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    
    try {
      let finalCoverUrl = existingProject?.cover_url || form.mediaUrl;

      // Unauthenticated media upload since Project forms usually store in 'projects_media' or 'avatars'
      // If user uploaded an image
      if (fileObject && form.mediaType === "Image") {
         const { data: { session } } = await supabase.auth.getSession();
         const user = session?.user;
         if (user) {
           const ext = fileObject.name.split(".").pop();
           const path = `${user.id}/project-${Date.now()}.${ext}`;
           const { error } = await supabase.storage.from("avatars").upload(path, fileObject, { upsert: true });
           if (!error) {
              const { data } = supabase.storage.from("avatars").getPublicUrl(path);
              finalCoverUrl = data.publicUrl;
           }
         }
      }

      const projData = {
        id: existingProject?.id || Date.now().toString(),
        title: form.title.trim(),
        category: form.category,
        year: parseInt(form.year) || new Date().getFullYear(),
        media_type: form.mediaType,
        media_url: form.mediaUrl,
        cover_url: finalCoverUrl
      };

      onSave(projData);
      onOpenChange(false);
    } catch(err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const currentImage = previewUrl || (form.mediaType === "Image" ? form.mediaUrl : null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{existingProject ? "Edit Project" : "Add Project"}</DialogTitle>
          <DialogDescription>
            Showcase your best work to potential clients.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor={`${id}-title`}>Project Title</Label>
            <Input id={`${id}-title`} value={form.title} onChange={e => handleChange("title", e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
               <Label htmlFor={`${id}-cat`}>Category</Label>
               <select 
                 id={`${id}-cat`} 
                 value={form.category} 
                 onChange={e => handleChange("category", e.target.value)}
                 className="flex h-9 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:ring-1 focus:ring-[#ccfd01] outline-none"
               >
                 {PROJECT_CATS.map(c => <option key={c} value={c} className="bg-[#111115]">{c}</option>)}
               </select>
             </div>
             <div className="space-y-2">
               <Label htmlFor={`${id}-year`}>Year</Label>
               <Input id={`${id}-year`} type="number" value={form.year} onChange={e => handleChange("year", e.target.value)} />
             </div>
          </div>

          <div className="space-y-2">
             <Label>Media Type</Label>
             <div className="flex gap-2">
               {MEDIA_TYPES.map(type => (
                 <button
                   key={type} type="button"
                   onClick={() => handleChange("mediaType", type)}
                   className={`flex-1 text-xs font-semibold py-1.5 rounded-lg border transition-colors ${
                     form.mediaType === type ? "border-[#ccfd01] bg-[#ccfd01]/10 text-[#ccfd01]" : "border-white/10 bg-white/5 text-white/50"
                   }`}
                 >
                   {type}
                 </button>
               ))}
             </div>
          </div>

          {form.mediaType !== "Image" && (
            <div className="space-y-2">
              <Label htmlFor={`${id}-vid`}>{form.mediaType} URL</Label>
              <Input 
                id={`${id}-vid`} 
                placeholder={`https://${form.mediaType.toLowerCase()}.com/...`} 
                value={form.mediaUrl} 
                onChange={e => handleChange("mediaUrl", e.target.value)} 
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>{form.mediaType === "Image" ? "Project Image" : "Video Thumbnail (Optional)"}</Label>
            <div 
              onClick={handleThumbnailClick}
              className="relative flex h-32 w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed border-white/20 bg-white/5 hover:bg-white/10 transition-colors"
            >
              {currentImage ? (
                <img src={currentImage} className="h-full w-full object-cover" alt="Preview" />
              ) : (
                <div className="flex flex-col items-center text-white/40">
                  <ImagePlus size={24} className="mb-2" />
                  <span className="text-xs font-bold">Click to upload</span>
                </div>
              )}
            </div>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
          </div>

        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSaveAction} disabled={saving || !form.title}>
            {saving ? "Saving..." : "Save Project"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
