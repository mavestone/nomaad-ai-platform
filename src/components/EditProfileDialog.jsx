import { useId, useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Camera, Check, Link2, Loader2, Mail, MapPin, UserRound, X } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";

const VOLT = "#ccfd01";
const VOLT_DIM = "#b8e300";

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
  const fileInputRef = { current: null };
  const fileInputId = useId();

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileObject(file);
    const reader = new FileReader();
    reader.onloadend = () => setPreviewUrl(reader.result);
    reader.readAsDataURL(file);
  };

  const handleThumbnailClick = () => {
    document.getElementById(fileInputId)?.click();
  };

  useEffect(() => {
    fileInputRef.current = document.getElementById(fileInputId);
  }, []);

  return { previewUrl, fileObject, fileInputRef, handleThumbnailClick, handleFileChange, fileInputId, handleFileChange };
}

function SegmentedControl({ options, value, onChange }) {
  return (
    <div style={{
      display: "inline-flex",
      padding: 3,
      borderRadius: 10,
      background: "rgba(255,255,255,0.05)",
      border: "1px solid rgba(255,255,255,0.08)",
      gap: 2,
    }}>
      {options.map((opt) => {
        const selected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            style={{
              padding: "7px 16px",
              borderRadius: 7,
              border: "none",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 500,
              transition: "all 0.2s ease",
              background: selected ? "rgba(255,255,255,0.12)" : "transparent",
              color: selected ? "#f0f0f5" : "rgba(240,240,245,0.45)",
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              boxShadow: selected ? "0 1px 4px rgba(0,0,0,0.3)" : "none",
            }}
          >
            <span style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: opt.color,
              flexShrink: 0,
              boxShadow: selected ? `0 0 5px ${opt.color}` : "none",
            }} />
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function FieldGroup({ label, htmlFor, children, hint }) {
  return (
    <div>
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 7,
      }}>
        <label
          htmlFor={htmlFor}
          style={{
            fontSize: 12.5,
            fontWeight: 500,
            color: "rgba(240,240,245,0.5)",
            letterSpacing: "0.01em",
          }}
        >
          {label}
        </label>
        {hint && (
          <span style={{ fontSize: 11.5, color: "rgba(240,240,245,0.3)" }}>{hint}</span>
        )}
      </div>
      {children}
    </div>
  );
}

export function EditProfileDialog({ open, onOpenChange, profile, onSaveComplete }) {
  const id = useId();
  const { user, updateProfile } = useAuth();

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
    availability: "away",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const { previewUrl, fileObject, fileInputId, handleFileChange } = useImageUpload();

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
  const isUsernameChanged = form.username && form.username !== profile?.username;
  const bioRemaining = maxLength - characterCount;

  const availabilityOptions = [
    { value: "available", label: "Available", color: "#34C759" },
    { value: "busy", label: "Busy", color: "#FF9500" },
    { value: "away", label: "Away", color: "#8b8fa3" },
  ];

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => onOpenChange(false)}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 50,
              background: "rgba(0,0,0,0.65)",
              backdropFilter: "blur(6px)",
              WebkitBackdropFilter: "blur(6px)",
            }}
          />
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 51,
              width: "95vw",
              maxWidth: 860,
              maxHeight: "92vh",
              display: "flex",
              flexDirection: "column",
              background: "rgba(12,12,14,0.96)",
              borderRadius: 28,
              border: "1px solid rgba(255,255,255,0.09)",
              boxShadow: "0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.03) inset",
              overflow: "hidden",
            }}
            onKeyDown={(e) => e.key === "Escape" && onOpenChange(false)}
          >
            <input
              id={fileInputId}
              type="file"
              onChange={handleFileChange}
              className="hidden"
              accept="image/*"
            />

            {/* Header */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "18px 24px 17px",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              flexShrink: 0,
            }}>
              <button
                onClick={() => onOpenChange(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "rgba(240,240,245,0.45)",
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: "pointer",
                  padding: "6px 8px",
                  borderRadius: 8,
                  transition: "color 0.15s",
                  minHeight: 32,
                  minWidth: 60,
                  textAlign: "left",
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = "#f0f0f5"}
                onMouseLeave={(e) => e.currentTarget.style.color = "rgba(240,240,245,0.45)"}
              >
                Cancel
              </button>

              <span style={{
                fontSize: 16,
                fontWeight: 600,
                color: "#f0f0f5",
                letterSpacing: "-0.01em",
              }}>
                Edit Profile
              </span>

              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  background: saving
                    ? "rgba(204,253,1,0.1)"
                    : "linear-gradient(135deg, #ccfd01, #b8e300)",
                  color: saving ? "rgba(204,253,1,0.5)" : "#0a0a0a",
                  border: "none",
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: saving ? "not-allowed" : "pointer",
                  padding: "7px 18px",
                  minHeight: 32,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  transition: "all 0.2s ease",
                  boxShadow: saving ? "none" : "0 2px 12px rgba(204,253,1,0.25)",
                  minWidth: 60,
                  justifyContent: "center",
                }}
                onMouseEnter={(e) => { if (!saving) e.currentTarget.style.boxShadow = "0 4px 20px rgba(204,253,1,0.35)"; }}
                onMouseLeave={(e) => { if (!saving) e.currentTarget.style.boxShadow = "0 2px 12px rgba(204,253,1,0.25)"; }}
              >
                {saving ? (
                  <>
                    <Loader2 size={13} style={{ animation: "spin 0.8s linear infinite" }} />
                    Saving
                  </>
                ) : "Save"}
              </button>
            </div>

            {/* Scrollable content */}
            <div style={{
              overflowY: "auto",
              flex: 1,
              padding: "32px 40px",
              display: "flex",
              flexDirection: "column",
              gap: 32,
            }}>
              {/* Error */}
              {error && (
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "12px 16px",
                  borderRadius: 12,
                  background: "rgba(255,98,89,0.08)",
                  border: "1px solid rgba(255,98,89,0.2)",
                  fontSize: 13,
                  color: "#FF6259",
                }}>
                  <X size={14} />
                  {error}
                </div>
              )}

              {/* Profile identity block */}
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 24,
              }}>
                <div
                  onClick={() => document.getElementById(fileInputId)?.click()}
                  style={{ position: "relative", cursor: "pointer", flexShrink: 0 }}
                >
                  <div style={{
                    width: 96,
                    height: 96,
                    borderRadius: "50%",
                    overflow: "hidden",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                    border: "3px solid rgba(255,255,255,0.08)",
                    background: currentImage ? "transparent" : "#ccfd01",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "box-shadow 0.2s",
                  }}>
                    {currentImage ? (
                      <img
                        src={currentImage}
                        alt="Profile"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <span style={{ fontSize: 36, fontWeight: 700, color: "#0a0a0a" }}>
                        {initials}
                      </span>
                    )}
                  </div>
                  <div style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: "50%",
                    background: "rgba(0,0,0,0.4)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: 0,
                    transition: "opacity 0.2s",
                  }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = 0}
                  >
                    <Camera size={22} color="#fff" />
                  </div>
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <h2 style={{
                    fontSize: 20,
                    fontWeight: 600,
                    color: "#f0f0f5",
                    margin: "0 0 4px",
                    letterSpacing: "-0.02em",
                  }}>
                    {form.fullName || "Your Name"}
                  </h2>
                  <p style={{
                    fontSize: 13.5,
                    color: "rgba(240,240,245,0.4)",
                    margin: "0 0 14px",
                    fontFamily: "monospace",
                  }}>
                    @{form.username || "username"}
                  </p>
                  <button
                    type="button"
                    onClick={() => document.getElementById(fileInputId)?.click()}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 7,
                      padding: "7px 14px",
                      borderRadius: 9,
                      border: "1px solid rgba(255,255,255,0.1)",
                      background: "rgba(255,255,255,0.04)",
                      color: "rgba(240,240,245,0.6)",
                      fontSize: 12.5,
                      fontWeight: 500,
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                      e.currentTarget.style.color = "#f0f0f5";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                      e.currentTarget.style.color = "rgba(240,240,245,0.6)";
                    }}
                  >
                    <Camera size={13} />
                    Change photo
                  </button>
                </div>
              </div>

              {/* Divider */}
              <div style={{ height: 1, background: "rgba(255,255,255,0.05)" }} />

              {/* Personal details */}
              <div>
                <h3 style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "rgba(240,240,245,0.35)",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  margin: "0 0 20px",
                }}>
                  Personal Details
                </h3>

                <div style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 16,
                }}>
                  <FieldGroup label="Name" htmlFor={`${id}-name`}>
                    <input
                      id={`${id}-name`}
                      value={form.fullName}
                      onChange={(e) => handleChange("fullName", e.target.value)}
                      placeholder="Your name"
                      className="ep-input"
                    />
                  </FieldGroup>

                  <FieldGroup
                    label="Username"
                    htmlFor={`${id}-username`}
                    hint={isUsernameChanged ? "URL will update" : null}
                  >
                    <div style={{ position: "relative" }}>
                      <input
                        id={`${id}-username`}
                        value={form.username}
                        onChange={(e) =>
                          handleChange(
                            "username",
                            e.target.value
                              .toLowerCase()
                              .replace(/[^a-z0-9-_]/g, "")
                          )
                        }
                        placeholder="username"
                        className="ep-input ep-input-with-icon"
                      />
                      <span style={{
                        position: "absolute",
                        left: 12,
                        top: "50%",
                        transform: "translateY(-50%)",
                        pointerEvents: "none",
                      }}>
                        <Check
                          size={13}
                          color={
                            form.username
                              ? "rgba(52,199,89,0.9)"
                              : "rgba(255,255,255,0.2)"
                          }
                        />
                      </span>
                    </div>
                  </FieldGroup>

                  <FieldGroup label="Location" htmlFor={`${id}-location`}>
                    <div style={{ position: "relative" }}>
                      <input
                        id={`${id}-location`}
                        value={form.location}
                        onChange={(e) => handleChange("location", e.target.value)}
                        placeholder="City, Country"
                        className="ep-input ep-input-with-icon"
                      />
                      <span style={{
                        position: "absolute",
                        left: 12,
                        top: "50%",
                        transform: "translateY(-50%)",
                        pointerEvents: "none",
                      }}>
                        <MapPin size={13} color="rgba(255,255,255,0.25)" />
                      </span>
                    </div>
                  </FieldGroup>

                  <FieldGroup label="Website" htmlFor={`${id}-website`}>
                    <div style={{ position: "relative" }}>
                      <input
                        id={`${id}-website`}
                        value={form.website}
                        onChange={(e) =>
                          handleChange(
                            "website",
                            e.target.value.replace(/^https?:\/\//, "")
                          )
                        }
                        placeholder="yourdomain.com"
                        className="ep-input ep-input-with-icon"
                      />
                      <span style={{
                        position: "absolute",
                        left: 12,
                        top: "50%",
                        transform: "translateY(-50%)",
                        pointerEvents: "none",
                      }}>
                        <Link2 size={13} color="rgba(255,255,255,0.25)" />
                      </span>
                    </div>
                  </FieldGroup>
                </div>

                <div style={{ marginTop: 16 }}>
                  <FieldGroup label="Email" htmlFor={`${id}-email`}>
                    <div style={{ position: "relative" }}>
                      <input
                        id={`${id}-email`}
                        type="email"
                        value={form.email}
                        onChange={(e) => handleChange("email", e.target.value)}
                        placeholder="hello@example.com"
                        className="ep-input ep-input-with-icon"
                      />
                      <span style={{
                        position: "absolute",
                        left: 12,
                        top: "50%",
                        transform: "translateY(-50%)",
                        pointerEvents: "none",
                      }}>
                        <Mail size={13} color="rgba(255,255,255,0.25)" />
                      </span>
                    </div>
                  </FieldGroup>
                </div>
              </div>

              {/* Divider */}
              <div style={{ height: 1, background: "rgba(255,255,255,0.05)" }} />

              {/* Availability */}
              <div>
                <h3 style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "rgba(240,240,245,0.35)",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  margin: "0 0 16px",
                }}>
                  Availability
                </h3>
                <SegmentedControl
                  options={availabilityOptions}
                  value={form.availability}
                  onChange={(val) => handleChange("availability", val)}
                />
              </div>

              {/* Divider */}
              <div style={{ height: 1, background: "rgba(255,255,255,0.05)" }} />

              {/* Bio */}
              <div>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 10,
                }}>
                  <h3 style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "rgba(240,240,245,0.35)",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    margin: 0,
                  }}>
                    Bio
                  </h3>
                  <span style={{
                    fontSize: 11.5,
                    color: "rgba(240,240,245,0.25)",
                    fontVariantNumeric: "tabular-nums",
                  }}>
                    {bioRemaining} remaining
                  </span>
                </div>
                <textarea
                  id={`${id}-bio`}
                  value={bio}
                  maxLength={maxLength}
                  onChange={handleBioChange}
                  placeholder="Tell people what you make, who you help, and what sets you apart..."
                  rows={5}
                  className="ep-input ep-textarea"
                />
              </div>
            </div>

            <style>{`
              @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }
              .ep-input {
                width: 100%;
                min-height: 44px;
                border-radius: 12px;
                border: 1px solid rgba(255, 255, 255, 0.1);
                background: rgba(255, 255, 255, 0.03);
                color: #f0f0f5;
                font-size: 14px;
                padding: 0 12px;
                outline: none;
                transition: border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
                font-family: -apple-system, 'SF Pro Display', system-ui, sans-serif;
              }
              .ep-input.ep-input-with-icon {
                padding-left: 36px;
              }
              .ep-input::placeholder {
                color: rgba(240, 240, 245, 0.25);
              }
              .ep-input:hover {
                border-color: rgba(255, 255, 255, 0.18);
                background: rgba(255, 255, 255, 0.05);
              }
              .ep-input:focus-visible {
                border-color: rgba(204, 253, 1, 0.7);
                box-shadow: 0 0 0 3px rgba(204, 253, 1, 0.12);
                background: rgba(255, 255, 255, 0.05);
              }
              .ep-textarea {
                min-height: 130px;
                padding: 12px;
                resize: vertical;
                line-height: 1.6;
              }
              @media (max-width: 640px) {
                .ep-input {
                  font-size: 16px;
                }
                [data-radix-dialog-content] {
                  padding: 20px 20px !important;
                }
              }
            `}</style>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}