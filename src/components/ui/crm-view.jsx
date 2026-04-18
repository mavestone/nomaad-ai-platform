import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { X, Plus } from "lucide-react";

const STAGES = ["new", "contacted", "proposal", "negotiation", "won"];
const STAGE_LABELS = { new: "New", contacted: "Contacted", proposal: "Proposal", negotiation: "Negotiation", won: "Won" };

const TAG_COLORS = ["#ccfd01", "#5AC8FA", "#FF6259", "#FFB340", "#BF5AF2", "#30D158"];

export default function CRMView({ t, dark, mobile, compact, IC, pal }) {
  const { user } = useAuth();
  const [view, setView] = useState("table");
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", company: "", email: "", value: "", stage: "new" });

  // Profile panel state
  const [selectedClient, setSelectedClient] = useState(null);
  const [editData, setEditData] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [noteInput, setNoteInput] = useState("");
  const [notes, setNotes] = useState({}); // keyed by contact id
  const [tags, setTags] = useState({});   // keyed by contact id
  const [tagInput, setTagInput] = useState("");
  const [showTagInput, setShowTagInput] = useState(false);

  // Drag & Drop state
  const [draggingId, setDraggingId] = useState(null);
  const [dragOverStage, setDragOverStage] = useState(null);

  const ease = "all 0.45s cubic-bezier(.4,0,.2,1)";
  const card = (ex = {}) => ({
    background: t.card, border: `1px solid ${t.cardBorder}`, borderRadius: 20,
    boxShadow: t.cardShadow, transition: ease, backdropFilter: "blur(24px) saturate(1.6)", ...ex
  });

  const hexToRgb = (hex) => {
    if (!hex) return "255,255,255";
    let c = hex.substring(1).split("");
    if (c.length === 3) { c = [c[0], c[0], c[1], c[1], c[2], c[2]]; }
    c = "0x" + c.join("");
    return [(c >> 16) & 255, (c >> 8) & 255, c & 255].join(",");
  };

  const stageColor = (stage) => {
    switch (stage) {
      case "new": return pal.amber.base;
      case "contacted": return pal.coral.base;
      case "proposal": return pal.teal.base;
      case "negotiation": return pal.volt.base;
      case "won": return pal.volt.base;
      default: return t.muted;
    }
  };

  const getStageStyles = (stage) => {
    const c = stageColor(stage);
    return {
      background: dark ? `rgba(${hexToRgb(c)}, 0.1)` : `rgba(${hexToRgb(c)}, 0.15)`,
      color: c,
      border: `1px solid rgba(${hexToRgb(c)}, 0.2)`,
    };
  };

  useEffect(() => {
    if (user) fetchProspects();
  }, [user]);

  async function fetchProspects() {
    const { data } = await supabase.from("prospects").select("*").order("created_at", { ascending: false });
    if (data) {
      setContacts(data.map(formatContact));
    }
    setLoading(false);
  }

  function formatContact(d) {
    return {
      id: d.id, name: d.name, email: d.email || "", company: d.company, stage: d.stage,
      rawValue: parseFloat(d.value) || 0,
      value: `$${(parseFloat(d.value) || 0).toLocaleString()}`,
      lastContact: "recently",
      avatar: d.name ? d.name.charAt(0).toUpperCase() : "?",
      color: stageColor(d.stage),
      created_at: d.created_at,
    };
  }

  const handleCreateLead = async (e) => {
    e.preventDefault();
    if (!user) return;
    const { name, company, email, value, stage } = formData;
    const { data, error } = await supabase.from("prospects").insert([{
      user_id: user.id, name, company, email,
      value: parseFloat(value) || 0, stage, status: "active",
    }]).select().single();
    if (error) {
      console.error("Add lead error:", error.message);
      // Surface error to user
      alert(`Could not add contact: ${error.message}`);
      return;
    }
    if (data) {
      setContacts(prev => [formatContact(data), ...prev]);
    }
    setModalOpen(false);
    setFormData({ name: "", company: "", email: "", value: "", stage: "new" });
  };

  // ─── Drag & Drop ──────────────────────────────────────────────────────────
  const handleDragStart = (e, contactId) => {
    setDraggingId(contactId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", contactId);
  };

  const handleDragOver = (e, stage) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverStage(stage);
  };

  const handleDragLeave = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverStage(null);
    }
  };

  const handleDrop = async (e, newStage) => {
    e.preventDefault();
    setDragOverStage(null);
    setDraggingId(null);

    const contactId = e.dataTransfer.getData("text/plain");
    const contact = contacts.find(c => c.id === contactId);
    if (!contact || contact.stage === newStage) return;

    // Optimistic update
    setContacts(prev => prev.map(c =>
      c.id === contactId ? { ...c, stage: newStage, color: stageColor(newStage) } : c
    ));
    if (selectedClient?.id === contactId) {
      setSelectedClient(prev => ({ ...prev, stage: newStage, color: stageColor(newStage) }));
      setEditData(prev => ({ ...prev, stage: newStage }));
    }

    // Persist to Supabase
    const { error } = await supabase.from("prospects").update({ stage: newStage }).eq("id", contactId);
    if (error) {
      // Rollback on failure
      setContacts(prev => prev.map(c =>
        c.id === contactId ? { ...c, stage: contact.stage, color: stageColor(contact.stage) } : c
      ));
    }
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDragOverStage(null);
  };

  // ─── Profile Panel ────────────────────────────────────────────────────────
  const openProfile = (contact) => {
    setSelectedClient(contact);
    setEditData({ name: contact.name, email: contact.email, company: contact.company, rawValue: contact.rawValue, stage: contact.stage });
    setNoteInput("");
    setShowTagInput(false);
    setTagInput("");
  };

  const closeProfile = () => {
    setSelectedClient(null);
    setEditData(null);
  };

  const handleSaveProfile = async () => {
    if (!selectedClient || !editData) return;
    setIsSaving(true);

    const updated = {
      name: editData.name, email: editData.email,
      company: editData.company, value: editData.rawValue, stage: editData.stage,
    };

    const { error } = await supabase.from("prospects").update(updated).eq("id", selectedClient.id);

    if (!error) {
      const newContact = { ...selectedClient, ...updated, rawValue: editData.rawValue, value: `$${(editData.rawValue || 0).toLocaleString()}`, color: stageColor(editData.stage) };
      setContacts(prev => prev.map(c => c.id === selectedClient.id ? newContact : c));
      setSelectedClient(newContact);
    }
    setIsSaving(false);
  };

  const handleAddNote = () => {
    if (!noteInput.trim() || !selectedClient) return;
    const entry = { text: noteInput.trim(), ts: new Date().toISOString() };
    setNotes(prev => ({ ...prev, [selectedClient.id]: [entry, ...(prev[selectedClient.id] || [])] }));
    setNoteInput("");
  };

  const handleAddTag = (color) => {
    if (!tagInput.trim() || !selectedClient) return;
    const entry = { text: tagInput.trim(), color };
    setTags(prev => {
      const existing = prev[selectedClient.id] || [];
      if (existing.find(t => t.text.toLowerCase() === entry.text.toLowerCase())) return prev;
      return { ...prev, [selectedClient.id]: [...existing, entry] };
    });
    setTagInput("");
    setShowTagInput(false);
  };

  const handleRemoveTag = (contactId, tagText) => {
    setTags(prev => ({ ...prev, [contactId]: (prev[contactId] || []).filter(t => t.text !== tagText) }));
  };

  const getActivityTimeline = (contact) => {
    const items = [];
    if (contact.created_at) {
      items.push({ icon: "✦", label: "Added to pipeline", ts: contact.created_at, color: pal.volt.base });
    }
    if (contact.stage !== "new") {
      items.push({ icon: "→", label: `Moved to ${STAGE_LABELS[contact.stage]}`, ts: new Date(Date.now() - 3600000).toISOString(), color: stageColor(contact.stage) });
    }
    items.push({ icon: "✉", label: "First message sent", ts: new Date(Date.now() - 7200000).toISOString(), color: pal.teal.base });
    return items;
  };

  const formatTs = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) + " · " + d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: mobile ? "4px 2px 0" : "8px 4px 0", flexShrink: 0, gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: compact ? 12 : 24, flex: 1, minWidth: 0, marginLeft: mobile ? 48 : 0 }}>
          <h1 style={{ fontSize: mobile ? 22 : 28, fontWeight: 700, letterSpacing: -0.6, flexShrink: 0 }}>CRM Pipeline</h1>

          <div style={{ display: "flex", background: t.input, borderRadius: 12, border: `1px solid ${t.inputBorder}`, padding: 3, flexShrink: 0 }}>
            {[{ id: "table", label: "List", ic: IC.grid }, { id: "board", label: "Board", ic: IC.chart }].map((v) => (
              <button key={v.id} onClick={() => setView(v.id)} style={{
                display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 9, fontSize: 13, fontWeight: view === v.id ? 600 : 500,
                color: view === v.id ? t.accentText : t.sub, background: view === v.id ? t.accentGrad : "transparent",
                boxShadow: view === v.id ? t.accentGlow : "none", border: "none", cursor: "pointer", transition: ease,
              }}>
                <div style={{ width: 14, height: 14 }}>{v.ic}</div>
                {!mobile && <span>{v.label}</span>}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          {!compact && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 14px", height: 38, borderRadius: 20, background: t.card, border: `1px solid ${t.cardBorder}`, color: t.sub, backdropFilter: "blur(20px)" }}>
              {IC.search}<input placeholder="Search deals..." style={{ border: "none", background: "transparent", color: t.text, fontSize: 13, outline: "none", width: 120 }} />
            </div>
          )}
          <button onClick={() => setModalOpen(true)} style={{ height: 38, padding: "0 16px", borderRadius: 20, border: "none", background: t.text, color: t.shell, fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6, cursor: "pointer", boxShadow: "0 4px 14px rgba(0,0,0,0.15)" }}>
            <span style={{ fontSize: 16 }}>+</span> New
          </button>
        </div>
      </header>

      {/* Main CRM Content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, position: "relative", animation: "fadeUp 0.4s ease backwards", paddingBottom: 12 }}>

        {view === "table" ? (
          <div style={{ ...card({ padding: 0 }), flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", marginTop: 12 }}>
            <div style={{ display: "flex", alignItems: "center", padding: "16px 20px", borderBottom: `1px solid ${t.divider}`, fontSize: 12, fontWeight: 600, color: t.muted, letterSpacing: 0.5, textTransform: "uppercase" }}>
              <div style={{ flex: 2, minWidth: 150 }}>Contact</div>
              <div style={{ flex: 1.5, minWidth: 120 }}>Company</div>
              <div style={{ flex: 1, minWidth: 100 }}>Stage</div>
              <div style={{ flex: 1, minWidth: 100 }}>Deal Value</div>
              <div style={{ flex: 1, minWidth: 100 }}>Last Act.</div>
              <div style={{ width: 40, textAlign: "right" }}></div>
            </div>

            <div style={{ flex: 1, overflowY: "auto" }}>
              {loading && [0,1,2,3,4].map(i => (
                <div key={i} style={{ display:"flex", alignItems:"center", padding:"16px 20px", borderBottom:`1px solid ${t.divider}`, gap:12 }}>
                  <div style={{ width:36,height:36,borderRadius:"50%",background:`linear-gradient(90deg,${t.cardBorder} 25%,${t.divider} 50%,${t.cardBorder} 75%)`,backgroundSize:"200% 100%",animation:"skeletonShimmer 1.6s ease infinite",flexShrink:0 }}/>
                  <div style={{ flex:2, display:"flex",flexDirection:"column",gap:6 }}>
                    <div style={{ height:13,borderRadius:6,background:`linear-gradient(90deg,${t.cardBorder} 25%,${t.divider} 50%,${t.cardBorder} 75%)`,backgroundSize:"200% 100%",animation:"skeletonShimmer 1.6s ease infinite",width:"55%" }}/>
                    <div style={{ height:10,borderRadius:6,background:`linear-gradient(90deg,${t.cardBorder} 25%,${t.divider} 50%,${t.cardBorder} 75%)`,backgroundSize:"200% 100%",animation:"skeletonShimmer 1.6s ease infinite",width:"35%" }}/>
                  </div>
                  <div style={{ flex:1.5, height:13,borderRadius:6,background:`linear-gradient(90deg,${t.cardBorder} 25%,${t.divider} 50%,${t.cardBorder} 75%)`,backgroundSize:"200% 100%",animation:"skeletonShimmer 1.6s ease infinite",width:"60%" }}/>
                  <div style={{ flex:1, height:24,borderRadius:20,background:`linear-gradient(90deg,${t.cardBorder} 25%,${t.divider} 50%,${t.cardBorder} 75%)`,backgroundSize:"200% 100%",animation:"skeletonShimmer 1.6s ease infinite",width:"80%" }}/>
                  <div style={{ flex:1, height:13,borderRadius:6,background:`linear-gradient(90deg,${t.cardBorder} 25%,${t.divider} 50%,${t.cardBorder} 75%)`,backgroundSize:"200% 100%",animation:"skeletonShimmer 1.6s ease infinite",width:"50%" }}/>
                </div>
              ))}
              {!loading && contacts.length === 0 && <div style={{ padding: 20, textAlign: "center", color: t.muted }}>No prospects yet. Add one!</div>}
              {contacts.map((c, i) => (
                <div
                  key={c.id}
                  onClick={() => openProfile(c)}
                  style={{ display: "flex", alignItems: "center", padding: "16px 20px", borderBottom: i < contacts.length - 1 ? `1px solid ${t.divider}` : "none", transition: ease, cursor: "pointer", background: selectedClient?.id === c.id ? (dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)") : "transparent" }}
                  onMouseEnter={e => e.currentTarget.style.background = dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)"}
                  onMouseLeave={e => e.currentTarget.style.background = selectedClient?.id === c.id ? (dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)") : "transparent"}
                >
                  <div style={{ flex: 2, minWidth: 150, display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: `linear-gradient(135deg, ${c.color}, ${c.color}aa)`, display: "flex", alignItems: "center", justifyContent: "center", color: dark ? "#000" : "#fff", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                      {c.avatar}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: t.text }}>{c.name}</div>
                      <div style={{ fontSize: 12, color: t.sub }}>{c.email}</div>
                    </div>
                  </div>
                  <div style={{ flex: 1.5, minWidth: 120, fontSize: 14, color: t.text }}>{c.company}</div>
                  <div style={{ flex: 1, minWidth: 100 }}>
                    <span style={{ fontSize: 11, padding: "4px 10px", borderRadius: 20, fontWeight: 600, ...getStageStyles(c.stage) }}>{STAGE_LABELS[c.stage]}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 100, fontSize: 14, fontWeight: 600, color: t.text, fontVariantNumeric: "tabular-nums" }}>{c.value}</div>
                  <div style={{ flex: 1, minWidth: 100, fontSize: 13, color: t.sub }}>{c.lastContact}</div>
                  <div style={{ width: 40, textAlign: "right", color: t.muted }}>{IC.dots}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, display: "flex", gap: 16, overflowX: "auto", overflowY: "hidden", marginTop: 12, paddingRight: 4, paddingBottom: 10 }}>
            {STAGES.map(stage => {
              const stageDeals = contacts.filter(c => c.stage === stage);
              const isDragTarget = dragOverStage === stage;
              const colColor = stageColor(stage);

              return (
                <div
                  key={stage}
                  onDragOver={e => handleDragOver(e, stage)}
                  onDragLeave={handleDragLeave}
                  onDrop={e => handleDrop(e, stage)}
                  style={{ width: 300, flexShrink: 0, display: "flex", flexDirection: "column", gap: 12 }}
                >
                  {/* Column Header */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", borderRadius: 14, border: `1px solid ${isDragTarget ? `rgba(${hexToRgb(colColor)}, 0.4)` : "transparent"}`, background: isDragTarget ? `rgba(${hexToRgb(colColor)}, 0.06)` : "transparent", transition: ease }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: "50%", background: colColor }} />
                      <h3 style={{ fontSize: 14, fontWeight: 600, color: t.text }}>{STAGE_LABELS[stage]}</h3>
                      <span style={{ fontSize: 11, background: t.input, border: `1px solid ${t.inputBorder}`, borderRadius: 10, padding: "2px 8px", color: t.sub }}>{stageDeals.length}</span>
                    </div>
                    <button style={{ background: "none", border: "none", color: t.sub, cursor: "pointer" }}>{IC.dots}</button>
                  </div>

                  {/* Drop Zone */}
                  <div
                    style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10, paddingBottom: 20, minHeight: 120, borderRadius: 16, padding: isDragTarget ? "8px" : "0", border: isDragTarget ? `2px dashed rgba(${hexToRgb(colColor)}, 0.3)` : "2px dashed transparent", transition: ease }}
                  >
                    {stageDeals.map(c => (
                      <div
                        key={c.id}
                        draggable
                        onDragStart={e => handleDragStart(e, c.id)}
                        onDragEnd={handleDragEnd}
                        onClick={() => openProfile(c)}
                        style={{
                          ...card({ padding: "16px" }),
                          cursor: draggingId === c.id ? "grabbing" : "grab",
                          opacity: draggingId === c.id ? 0.4 : 1,
                          transform: draggingId === c.id ? "scale(0.97)" : "scale(1)",
                          animation: "fadeUp 0.3s ease backwards",
                          outline: selectedClient?.id === c.id ? `2px solid rgba(${hexToRgb(colColor)}, 0.5)` : "none",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                          <span style={{ fontSize: 11, fontWeight: 600, color: colColor, background: `rgba(${hexToRgb(colColor)}, 0.1)`, padding: "4px 8px", borderRadius: 8 }}>{c.company}</span>
                          <span style={{ color: t.muted }}>{IC.dots}</span>
                        </div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: t.text, marginBottom: 4, fontVariantNumeric: "tabular-nums" }}>{c.value}</div>
                        <div style={{ fontSize: 13, color: t.sub, marginBottom: 14 }}>{c.name}</div>
                        {/* Tags preview */}
                        {(tags[c.id] || []).length > 0 && (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 12 }}>
                            {(tags[c.id] || []).slice(0, 3).map(tag => (
                              <span key={tag.text} style={{ fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 8, background: `rgba(${hexToRgb(tag.color)}, 0.15)`, color: tag.color, border: `1px solid rgba(${hexToRgb(tag.color)}, 0.25)` }}>{tag.text}</span>
                            ))}
                          </div>
                        )}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: `1px solid ${t.divider}`, paddingTop: 10 }}>
                          <div style={{ width: 26, height: 26, borderRadius: "50%", background: `linear-gradient(135deg, ${c.color}, ${c.color}aa)`, display: "flex", alignItems: "center", justifyContent: "center", color: dark ? "#000" : "#fff", fontWeight: 700, fontSize: 11 }}>
                            {c.avatar}
                          </div>
                          <div style={{ fontSize: 11, color: t.muted, display: "flex", alignItems: "center", gap: 4 }}>
                            {IC.help} {c.lastContact}
                          </div>
                        </div>
                      </div>
                    ))}

                    <button onClick={() => setModalOpen(true)} style={{ padding: "12px", borderRadius: 16, border: `1px dashed ${t.cardBorder}`, background: "transparent", color: t.sub, fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer", transition: ease, marginTop: stageDeals.length > 0 ? 0 : 4 }}>
                      <span>+</span> Add Deal
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── New Deal Modal ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", background: dark ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0.3)", backdropFilter: "blur(6px)" }}
            onClick={e => { if (e.target === e.currentTarget) setModalOpen(false); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              style={{ background: t.card, padding: 24, borderRadius: 20, width: 360, boxShadow: t.cardShadow, border: `1px solid ${t.cardBorder}`, backdropFilter: "blur(32px)" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: t.text }}>New Pipeline Deal</h3>
                <button onClick={() => setModalOpen(false)} style={{ background: "none", border: "none", color: t.sub, cursor: "pointer" }}><X size={18} /></button>
              </div>
              <form onSubmit={handleCreateLead} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, color: t.sub, marginBottom: 4 }}>Contact Name</label>
                  <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} style={{ width: "100%", padding: "10px", borderRadius: 10, border: `1px solid ${t.inputBorder}`, background: t.input, color: t.text, outline: "none", fontSize: 14, boxSizing: "border-box" }} />
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: "block", fontSize: 12, color: t.sub, marginBottom: 4 }}>Company</label>
                    <input required value={formData.company} onChange={e => setFormData({ ...formData, company: e.target.value })} style={{ width: "100%", padding: "10px", borderRadius: 10, border: `1px solid ${t.inputBorder}`, background: t.input, color: t.text, outline: "none", fontSize: 14, boxSizing: "border-box" }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: "block", fontSize: 12, color: t.sub, marginBottom: 4 }}>Deal Value ($)</label>
                    <input required type="number" value={formData.value} onChange={e => setFormData({ ...formData, value: e.target.value })} style={{ width: "100%", padding: "10px", borderRadius: 10, border: `1px solid ${t.inputBorder}`, background: t.input, color: t.text, outline: "none", fontSize: 14, boxSizing: "border-box" }} />
                  </div>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, color: t.sub, marginBottom: 4 }}>Email</label>
                  <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} style={{ width: "100%", padding: "10px", borderRadius: 10, border: `1px solid ${t.inputBorder}`, background: t.input, color: t.text, outline: "none", fontSize: 14, boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, color: t.sub, marginBottom: 4 }}>Initial Stage</label>
                  <select value={formData.stage} onChange={e => setFormData({ ...formData, stage: e.target.value })} style={{ width: "100%", padding: "10px", borderRadius: 10, border: `1px solid ${t.inputBorder}`, background: t.input, color: t.text, appearance: "none", cursor: "pointer", fontSize: 14, boxSizing: "border-box" }}>
                    {STAGES.map(s => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}
                  </select>
                </div>
                <button type="submit" style={{ marginTop: 10, padding: "12px", borderRadius: 12, border: "none", background: t.accentGrad, color: t.accentText, fontWeight: 700, cursor: "pointer", boxShadow: t.accentGlow, fontSize: 14 }}>
                  Add Deal
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Client Profile Slide-out Panel ───────────────────────────────── */}
      <AnimatePresence>
        {selectedClient && editData && (
          <>
            {/* Backdrop (subtle, non-blocking) */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={closeProfile}
              style={{ position: "fixed", inset: 0, zIndex: 150, background: "transparent" }}
            />

            <motion.div
              initial={{ x: "100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0 }}
              transition={{ type: "spring", stiffness: 350, damping: 32 }}
              style={{
                position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 160,
                width: mobile ? "100vw" : 420,
                background: dark ? "rgba(12,12,16,0.96)" : "rgba(248,247,244,0.97)",
                backdropFilter: "blur(40px) saturate(1.8)",
                borderLeft: `1px solid ${t.cardBorder}`,
                boxShadow: dark ? "-24px 0 80px rgba(0,0,0,0.5)" : "-24px 0 80px rgba(0,0,0,0.08)",
                display: "flex", flexDirection: "column",
                overflowY: "auto",
              }}
              onClick={e => e.stopPropagation()}
            >
              {/* Panel Header */}
              <div style={{ padding: "20px 24px 16px", borderBottom: `1px solid ${t.divider}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: "50%", background: `linear-gradient(135deg, ${selectedClient.color}, ${selectedClient.color}99)`, display: "flex", alignItems: "center", justifyContent: "center", color: dark ? "#000" : "#fff", fontWeight: 800, fontSize: 18, flexShrink: 0 }}>
                    {selectedClient.avatar}
                  </div>
                  <div>
                    <div style={{ fontSize: 17, fontWeight: 700, color: t.text, lineHeight: 1.2 }}>{selectedClient.name}</div>
                    <div style={{ fontSize: 12, color: t.sub, marginTop: 2 }}>{selectedClient.company}</div>
                  </div>
                </div>
                <button onClick={closeProfile} style={{ background: dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)", border: "none", borderRadius: 10, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: t.sub }}>
                  <X size={16} />
                </button>
              </div>

              <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 24 }}>

                {/* ── Contact Details ── */}
                <section>
                  <div style={{ fontSize: 11, fontWeight: 700, color: t.muted, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 12 }}>Contact Details</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {[
                      { label: "Name", key: "name", type: "text" },
                      { label: "Email", key: "email", type: "email" },
                      { label: "Company", key: "company", type: "text" },
                      { label: "Deal Value ($)", key: "rawValue", type: "number" },
                    ].map(field => (
                      <div key={field.key}>
                        <label style={{ display: "block", fontSize: 11, color: t.sub, marginBottom: 4, fontWeight: 500 }}>{field.label}</label>
                        <input
                          type={field.type}
                          value={editData[field.key]}
                          onChange={e => setEditData(prev => ({ ...prev, [field.key]: field.type === "number" ? parseFloat(e.target.value) || 0 : e.target.value }))}
                          style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: `1px solid ${t.inputBorder}`, background: t.input, color: t.text, fontSize: 13, outline: "none", boxSizing: "border-box", transition: ease }}
                        />
                      </div>
                    ))}

                    {/* Stage selector */}
                    <div>
                      <label style={{ display: "block", fontSize: 11, color: t.sub, marginBottom: 4, fontWeight: 500 }}>Stage</label>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {STAGES.map(s => {
                          const sc = stageColor(s);
                          const active = editData.stage === s;
                          return (
                            <button
                              key={s}
                              onClick={() => setEditData(prev => ({ ...prev, stage: s }))}
                              style={{
                                padding: "5px 12px", borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: "pointer", border: `1px solid ${active ? sc : t.inputBorder}`,
                                background: active ? `rgba(${hexToRgb(sc)}, 0.15)` : "transparent",
                                color: active ? sc : t.sub, transition: ease,
                              }}
                            >
                              {STAGE_LABELS[s]}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    style={{ marginTop: 14, width: "100%", padding: "10px", borderRadius: 12, border: "none", background: isSaving ? t.input : t.accentGrad, color: isSaving ? t.muted : t.accentText, fontWeight: 700, cursor: isSaving ? "wait" : "pointer", fontSize: 13, boxShadow: isSaving ? "none" : t.accentGlow, transition: ease }}
                  >
                    {isSaving ? "Saving…" : "Save Changes"}
                  </button>
                </section>

                {/* ── Tags ── */}
                <section>
                  <div style={{ fontSize: 11, fontWeight: 700, color: t.muted, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>Tags</span>
                    <button
                      onClick={() => setShowTagInput(v => !v)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: t.sub, display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600 }}
                    >
                      <Plus size={12} /> Add
                    </button>
                  </div>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {(tags[selectedClient.id] || []).map(tag => (
                      <span
                        key={tag.text}
                        style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 20, background: `rgba(${hexToRgb(tag.color)}, 0.12)`, color: tag.color, border: `1px solid rgba(${hexToRgb(tag.color)}, 0.25)`, cursor: "default" }}
                      >
                        {tag.text}
                        <X size={10} style={{ cursor: "pointer", opacity: 0.7 }} onClick={() => handleRemoveTag(selectedClient.id, tag.text)} />
                      </span>
                    ))}
                    {(tags[selectedClient.id] || []).length === 0 && !showTagInput && (
                      <span style={{ fontSize: 12, color: t.muted, fontStyle: "italic" }}>No tags yet</span>
                    )}
                  </div>

                  <AnimatePresence>
                    {showTagInput && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                        style={{ marginTop: 10, overflow: "hidden" }}
                      >
                        <input
                          autoFocus
                          value={tagInput}
                          onChange={e => setTagInput(e.target.value)}
                          placeholder="Tag name…"
                          onKeyDown={e => e.key === "Enter" && handleAddTag(TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)])}
                          style={{ width: "100%", padding: "8px 12px", borderRadius: 10, border: `1px solid ${t.inputBorder}`, background: t.input, color: t.text, fontSize: 12, outline: "none", boxSizing: "border-box" }}
                        />
                        <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                          {TAG_COLORS.map(c => (
                            <button
                              key={c}
                              onClick={() => handleAddTag(c)}
                              style={{ width: 20, height: 20, borderRadius: "50%", background: c, border: "none", cursor: "pointer", flexShrink: 0 }}
                            />
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </section>

                {/* ── Activity Timeline ── */}
                <section>
                  <div style={{ fontSize: 11, fontWeight: 700, color: t.muted, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 14 }}>Activity Timeline</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                    {getActivityTimeline(selectedClient).map((item, i, arr) => (
                      <div key={i} style={{ display: "flex", gap: 12, position: "relative" }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                          <div style={{ width: 28, height: 28, borderRadius: "50%", background: `rgba(${hexToRgb(item.color)}, 0.12)`, border: `1px solid rgba(${hexToRgb(item.color)}, 0.25)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: item.color, flexShrink: 0 }}>
                            {item.icon}
                          </div>
                          {i < arr.length - 1 && <div style={{ width: 1, flex: 1, minHeight: 20, background: t.divider, margin: "4px 0" }} />}
                        </div>
                        <div style={{ paddingBottom: i < arr.length - 1 ? 16 : 0, paddingTop: 4 }}>
                          <div style={{ fontSize: 13, color: t.text, fontWeight: 500, lineHeight: 1.3 }}>{item.label}</div>
                          <div style={{ fontSize: 11, color: t.muted, marginTop: 2 }}>{formatTs(item.ts)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* ── Notes ── */}
                <section>
                  <div style={{ fontSize: 11, fontWeight: 700, color: t.muted, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 12 }}>Notes</div>

                  <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                    <textarea
                      value={noteInput}
                      onChange={e => setNoteInput(e.target.value)}
                      placeholder="Add a note…"
                      rows={3}
                      style={{ flex: 1, padding: "10px 12px", borderRadius: 12, border: `1px solid ${t.inputBorder}`, background: t.input, color: t.text, fontSize: 13, outline: "none", resize: "none", fontFamily: "inherit", lineHeight: 1.5 }}
                    />
                  </div>
                  <button
                    onClick={handleAddNote}
                    disabled={!noteInput.trim()}
                    style={{ width: "100%", padding: "9px", borderRadius: 10, border: `1px solid ${t.inputBorder}`, background: noteInput.trim() ? (dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)") : "transparent", color: noteInput.trim() ? t.text : t.muted, fontSize: 13, fontWeight: 600, cursor: noteInput.trim() ? "pointer" : "default", transition: ease }}
                  >
                    Add Note
                  </button>

                  {(notes[selectedClient.id] || []).length > 0 && (
                    <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
                      {(notes[selectedClient.id] || []).map((note, i) => (
                        <div key={i} style={{ padding: "12px 14px", borderRadius: 12, background: t.input, border: `1px solid ${t.inputBorder}` }}>
                          <div style={{ fontSize: 13, color: t.text, lineHeight: 1.5, marginBottom: 6 }}>{note.text}</div>
                          <div style={{ fontSize: 11, color: t.muted }}>{formatTs(note.ts)}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
