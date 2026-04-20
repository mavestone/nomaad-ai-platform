import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";

// ─── Constants ────────────────────────────────────────────────────────────────

const STAGES = [
  { id: "new",        label: "New",        color: "#FFB340", bg: "rgba(255,179,64,0.1)",  border: "rgba(255,179,64,0.2)"  },
  { id: "contacted",  label: "Contacted", color: "#5AC8FA", bg: "rgba(90,200,250,0.1)",  border: "rgba(90,200,250,0.2)"  },
  { id: "qualified", label: "Qualified",color: "#BF5AF2", bg: "rgba(191,90,242,0.1)",  border: "rgba(191,90,242,0.2)"  },
  { id: "proposal",  label: "Proposal", color: "#ccfd01", bg: "rgba(204,253,1,0.08)",  border: "rgba(204,253,1,0.2)"   },
  { id: "negotiation",label: "Negotiation",color: "#FF6259", bg: "rgba(255,98,89,0.1)",  border: "rgba(255,98,89,0.2)"   },
  { id: "won",       label: "Won",      color: "#30D158", bg: "rgba(48,209,88,0.08)",  border: "rgba(48,209,88,0.2)"   },
  { id: "lost",      label: "Lost",     color: "#8b8fa3", bg: "rgba(139,143,163,0.1)",  border: "rgba(139,143,163,0.2)"   },
];

const VOLT = "#ccfd01";
const FF = "-apple-system,'SF Pro Display','SF Pro Text','Helvetica Neue',system-ui,sans-serif";

function stageInfo(id) { return STAGES.find(s => s.id === id) || STAGES[0]; }

function initials(name) {
  if (!name) return "?";
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

function formatVal(n) {
  if (!n) return "—";
  return "£" + Number(n).toLocaleString("en-GB");
}

function timeAgo(iso) {
  const d = new Date(iso);
  const diff = Date.now() - d;
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days}d ago`;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ name, size = 36, dark }) {
  const colors = ["#ccfd01", "#5AC8FA", "#FFB340", "#BF5AF2", "#FF6259", "#30D158"];
  const color = colors[(name?.charCodeAt(0) || 0) % colors.length];
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.3,
      background: `${color}22`, border: `1px solid ${color}44`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.35, fontWeight: 700, color,
      flexShrink: 0, letterSpacing: "-0.02em",
    }}>
      {initials(name)}
    </div>
  );
}

// ─── Stage Badge ──────────────────────────────────────────────────────────────

function StageBadge({ stage, small }) {
  const s = stageInfo(stage);
  return (
    <span style={{
      padding: small ? "2px 8px" : "3px 10px",
      borderRadius: 100, fontSize: small ? 10 : 11,
      fontWeight: 700, letterSpacing: "0.04em",
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      whiteSpace: "nowrap",
    }}>
      {s.label}
    </span>
  );
}

// ─── Deal Won Modal ───────────────────────────────────────────────────────────

function DealWonModal({ client, onCreateProject, onSkip, t, dark }) {
  const [projectName, setProjectName] = useState(`${client.company || client.name} — Project`);
  const [dueDate, setDueDate] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    setCreating(true);
    await onCreateProject(projectName, dueDate);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9000,
      background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        style={{
          width: "100%", maxWidth: 440,
          background: dark ? "rgba(18,18,22,0.98)" : "rgba(255,255,255,0.98)",
          border: `1px solid ${dark ? "rgba(204,253,1,0.2)" : "rgba(0,0,0,0.1)"}`,
          borderRadius: 24, padding: "32px 28px",
          boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
          fontFamily: FF, position: "relative", overflow: "hidden",
        }}
      >
        {/* Top accent */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 2,
          background: `linear-gradient(90deg, transparent, ${VOLT}, transparent)`,
        }} />

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>🎉</div>
          <h3 style={{ fontSize: 22, fontWeight: 800, color: t.text, margin: "0 0 6px", letterSpacing: "-0.02em" }}>
            Deal won!
          </h3>
          <p style={{ fontSize: 13, color: t.sub, margin: 0 }}>
            <strong style={{ color: t.text }}>{client.name}</strong> is now an active client.
            Want to kick off a project?
          </p>
        </div>

        {/* Project name input */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: t.sub, letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
            Project name
          </label>
          <input
            value={projectName}
            onChange={e => setProjectName(e.target.value)}
            autoFocus
            style={{
              width: "100%", padding: "11px 14px", borderRadius: 12,
              background: t.input, border: `1px solid ${t.inputBorder}`,
              color: t.text, fontSize: 14, fontFamily: FF, outline: "none",
              boxSizing: "border-box",
            }}
            onFocus={e => e.target.style.borderColor = "rgba(204,253,1,0.4)"}
            onBlur={e => e.target.style.borderColor = t.inputBorder}
          />
        </div>
        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: t.sub, letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
            Deadline (optional)
          </label>
          <input
            type="date"
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
            style={{
              width: "100%", padding: "11px 14px", borderRadius: 12,
              background: t.input, border: `1px solid ${t.inputBorder}`,
              color: t.text, fontSize: 14, fontFamily: FF, outline: "none",
              boxSizing: "border-box", colorScheme: dark ? "dark" : "light",
            }}
          />
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onSkip}
            style={{
              flex: 1, padding: "12px", borderRadius: 12,
              background: t.input, border: `1px solid ${t.inputBorder}`,
              color: t.sub, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: FF,
            }}
          >Skip for now</button>
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={handleCreate}
            disabled={creating || !projectName.trim()}
            style={{
              flex: 2, padding: "12px", borderRadius: 12,
              background: creating || !projectName.trim() ? t.input : `linear-gradient(135deg, ${VOLT}, #b8e300)`,
              color: creating || !projectName.trim() ? t.sub : "#0a0a0a",
              border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: FF,
              boxShadow: creating ? "none" : "0 4px 20px rgba(204,253,1,0.2)",
            }}
          >
            {creating ? "Creating…" : "Create Project →"}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Client Card (Kanban) ─────────────────────────────────────────────────────

function ClientCard({ client, onClick, onDragStart, t, dark }) {
  const s = stageInfo(client.stage);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      draggable
      onDragStart={e => onDragStart(e, client.id)}
      onClick={onClick}
      whileHover={{ y: -1 }}
      style={{
        padding: "14px 14px",
        background: t.card, border: `1px solid ${t.cardBorder}`,
        borderRadius: 14, cursor: "pointer",
        boxShadow: t.cardShadow, backdropFilter: "blur(16px)",
        transition: "box-shadow 0.2s",
      }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = dark ? "0 4px 24px rgba(0,0,0,0.3)" : "0 4px 24px rgba(0,0,0,0.08)"}
      onMouseLeave={e => e.currentTarget.style.boxShadow = t.cardShadow}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <Avatar name={client.name} size={34} dark={dark} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: t.text, marginBottom: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {client.name}
          </div>
          {client.company && (
            <div style={{ fontSize: 11, color: t.sub, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {client.company}
            </div>
          )}
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: client.value > 0 ? s.color : t.muted }}>
          {formatVal(client.value)}
        </span>
        <span style={{ fontSize: 10, color: t.muted }}>{timeAgo(client.created_at)}</span>
      </div>
    </motion.div>
  );
}

// ─── Client Record (full detail panel) ───────────────────────────────────────

function ClientRecord({ client, onClose, onUpdate, t, dark }) {
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({ name: client.name, company: client.company || "", email: client.email || "", phone: client.phone || "", value: client.value || 0, notes: client.notes || "" });
  const [saving, setSaving] = useState(false);
  const [projects, setProjects] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [addingProject, setAddingProject] = useState(false);
  const [newProject, setNewProject] = useState({ name: "", due_date: "" });
  const [addingInvoice, setAddingInvoice] = useState(false);
  const [newInvoice, setNewInvoice] = useState({ amount: "", due_date: "" });
  const s = stageInfo(client.stage);

  useEffect(() => {
    loadClientData();
  }, [client.id]);

  async function loadClientData() {
    setLoadingData(true);
    try {
      const [{ data: proj }, { data: inv }] = await Promise.all([
        supabase.from("projects").select("*").eq("client_id", client.id).order("created_at", { ascending: false }),
        supabase.from("invoices").select("*").eq("client_id", client.id).order("created_at", { ascending: false }),
      ]);
      setProjects(proj || []);
      setInvoices(inv || []);
    } catch (err) {
      console.error("loadClientData:", err.message);
    } finally {
      setLoadingData(false);
    }
  }

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data, error } = await supabase.from("prospects")
        .update({ name: editData.name, company: editData.company, email: editData.email, value: parseFloat(editData.value) || 0, notes: editData.notes, updated_at: new Date().toISOString() })
        .eq("id", client.id).select().single();
      if (error) throw error;
      onUpdate(data);
      setEditing(false);
    } catch (err) {
      alert("Save failed: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateProject = async () => {
    if (!newProject.name.trim()) return;
    try {
      const { data, error } = await supabase.from("projects").insert({
        user_id: user.id, 
        title: newProject.name, 
        client_id: client.id,
        client_name: client.company || client.name,
        due_date: newProject.due_date || null, 
        status: "planning",
      }).select().single();
      if (error) throw error;
      setProjects(p => [data, ...p]);
      setNewProject({ name: "", due_date: "" });
      setAddingProject(false);
    } catch (err) { alert("Error: " + err.message); }
  };

  const handleCreateInvoice = async () => {
    const amt = parseFloat(newInvoice.amount);
    if (!amt) return;
    try {
      const { data, error } = await supabase.from("invoices").insert({
        user_id: user.id, client_id: client.id,
        client_name: client.company || client.name,
        amount: amt, status: "draft",
        due_date: newInvoice.due_date || null,
      }).select().single();
      if (error) throw error;
      setInvoices(i => [data, ...i]);
      setNewInvoice({ amount: "", due_date: "" });
      setAddingInvoice(false);
    } catch (err) { alert("Error: " + err.message); }
  };

  const inputStyle = {
    width: "100%", padding: "10px 13px", borderRadius: 10,
    background: t.input, border: `1px solid ${t.inputBorder}`,
    color: t.text, fontSize: 13, fontFamily: FF, outline: "none",
    boxSizing: "border-box", transition: "border-color 0.2s",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", fontFamily: FF }}>
      {/* Header */}
      <div style={{
        padding: "20px 24px 16px", borderBottom: `1px solid ${t.cardBorder}`,
        display: "flex", alignItems: "flex-start", gap: 16, flexShrink: 0,
      }}>
        <button onClick={onClose} style={{
          width: 30, height: 30, borderRadius: "50%", border: "none",
          background: t.input, color: t.sub, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0, fontSize: 16, marginTop: 2,
        }}>←</button>
        <Avatar name={client.name} size={44} dark={dark} />
        <div style={{ flex: 1, minWidth: 0 }}>
          {editing ? (
            <input value={editData.name} onChange={e => setEditData(p => ({ ...p, name: e.target.value }))}
              style={{ ...inputStyle, fontSize: 18, fontWeight: 700, marginBottom: 6 }} />
          ) : (
            <div style={{ fontSize: 18, fontWeight: 700, color: t.text, letterSpacing: "-0.02em" }}>{client.name}</div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
            <StageBadge stage={client.stage} small />
            {client.value > 0 && (
              <span style={{ fontSize: 12, fontWeight: 700, color: s.color }}>{formatVal(client.value)}</span>
            )}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          {editing ? (
            <>
              <button onClick={() => setEditing(false)} style={{ padding: "7px 14px", borderRadius: 10, border: `1px solid ${t.inputBorder}`, background: t.input, color: t.sub, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: FF }}>Cancel</button>
              <motion.button whileHover={{ scale: 1.02 }} onClick={handleSave} disabled={saving}
                style={{ padding: "7px 14px", borderRadius: 10, border: "none", background: `linear-gradient(135deg,${VOLT},#b8e300)`, color: "#0a0a0a", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: FF }}>
                {saving ? "Saving…" : "Save"}
              </motion.button>
            </>
          ) : (
            <button onClick={() => setEditing(true)} style={{ padding: "7px 14px", borderRadius: 10, border: `1px solid ${t.inputBorder}`, background: t.input, color: t.sub, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: FF }}>Edit</button>
          )}
        </div>
      </div>

      {/* Stage timeline */}
      <div style={{ padding: "14px 24px", borderBottom: `1px solid ${t.cardBorder}`, flexShrink: 0 }}>
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          {STAGES.filter(st => st.id !== "lost").map((st, i, arr) => {
            const stIdx = STAGES.findIndex(x => x.id === client.stage);
            const thisIdx = STAGES.findIndex(x => x.id === st.id);
            const isPast = thisIdx < stIdx;
            const isCurrent = st.id === client.stage;
            return (
              <div key={st.id} style={{ display: "flex", alignItems: "center", flex: 1 }}>
                <div style={{
                  flex: 1, height: 4, borderRadius: 4,
                  background: isPast || isCurrent ? st.color : (dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)"),
                  opacity: isCurrent ? 1 : isPast ? 0.6 : 1,
                  transition: "all 0.4s ease",
                }} />
                {i < arr.length - 1 && <div style={{ width: 3 }} />}
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
          {STAGES.filter(st => st.id !== "lost").map(st => {
            const isCurrent = st.id === client.stage;
            return (
              <span key={st.id} style={{ fontSize: 9, fontWeight: isCurrent ? 700 : 400, color: isCurrent ? st.color : t.muted, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                {st.label}
              </span>
            );
          })}
        </div>
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>

        {/* Contact info */}
        <Section label="Contact" t={t}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[
              { label: "Company", key: "company", placeholder: "Company name" },
              { label: "Email", key: "email", placeholder: "email@example.com" },
              { label: "Phone", key: "phone", placeholder: "+44 7700 000000" },
              { label: "Deal value", key: "value", placeholder: "0", type: "number" },
            ].map(f => (
              <div key={f.key}>
                <div style={{ fontSize: 10, fontWeight: 600, color: t.muted, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 5 }}>{f.label}</div>
                {editing ? (
                  <input
                    type={f.type || "text"}
                    value={editData[f.key]}
                    onChange={e => setEditData(p => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = "rgba(204,253,1,0.4)"}
                    onBlur={e => e.target.style.borderColor = t.inputBorder}
                  />
                ) : (
                  <div style={{ fontSize: 13, color: editData[f.key] ? t.text : t.muted }}>
                    {f.key === "value" ? formatVal(editData.value) : (editData[f.key] || "—")}
                  </div>
                )}
              </div>
            ))}
          </div>
          {/* Notes */}
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: t.muted, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 5 }}>Notes</div>
            {editing ? (
              <textarea
                value={editData.notes}
                onChange={e => setEditData(p => ({ ...p, notes: e.target.value }))}
                placeholder="Any notes about this client…"
                rows={3}
                style={{ ...inputStyle, resize: "vertical", lineHeight: 1.5 }}
              />
            ) : (
              <div style={{ fontSize: 13, color: editData.notes ? t.text : t.muted, lineHeight: 1.6 }}>
                {editData.notes || "No notes yet. Click Edit to add."}
              </div>
            )}
          </div>
        </Section>

        {/* Projects */}
        <Section
          label="Projects"
          t={t}
          action={
            <button onClick={() => setAddingProject(p => !p)} style={{
              padding: "4px 10px", borderRadius: 8, border: `1px solid ${t.inputBorder}`,
              background: "transparent", color: t.sub, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: FF,
            }}>+ New</button>
          }
        >
          <AnimatePresence>
            {addingProject && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                style={{ overflow: "hidden", marginBottom: 10 }}>
                <div style={{ display: "flex", gap: 8, padding: "12px", borderRadius: 12, background: t.input, border: `1px solid ${t.inputBorder}`, flexWrap: "wrap" }}>
                  <input value={newProject.name} onChange={e => setNewProject(p => ({ ...p, name: e.target.value }))} placeholder="Project name"
                    autoFocus style={{ ...inputStyle, flex: 1, minWidth: 140 }}
                    onFocus={e => e.target.style.borderColor = "rgba(204,253,1,0.4)"}
                    onBlur={e => e.target.style.borderColor = t.inputBorder} />
                  <input type="date" value={newProject.due_date} onChange={e => setNewProject(p => ({ ...p, due_date: e.target.value }))}
                    style={{ ...inputStyle, width: 140, colorScheme: dark ? "dark" : "light" }} />
                  <div style={{ display: "flex", gap: 6, width: "100%" }}>
                    <button onClick={() => setAddingProject(false)} style={{ flex: 1, padding: "8px", borderRadius: 8, border: `1px solid ${t.inputBorder}`, background: "transparent", color: t.sub, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: FF }}>Cancel</button>
                    <motion.button whileHover={{ scale: 1.02 }} onClick={handleCreateProject}
                      style={{ flex: 2, padding: "8px", borderRadius: 8, border: "none", background: `linear-gradient(135deg,${VOLT},#b8e300)`, color: "#0a0a0a", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: FF }}>
                      Create Project
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {loadingData ? (
            <SkeletonRows count={2} t={t} />
          ) : projects.length === 0 ? (
            <EmptyState
              icon="▤"
              text={client.stage === "active" ? "No project yet — start one to track the work." : "Projects will appear here once the deal is active."}
              action={client.stage === "active" ? { label: "Start a project →", onClick: () => setAddingProject(true) } : null}
              t={t}
            />
          ) : (
            projects.map(p => <ProjectRow key={p.id} project={p} t={t} dark={dark} />)
          )}
        </Section>

        {/* Invoices */}
        <Section
          label="Invoices"
          t={t}
          action={
            <button onClick={() => setAddingInvoice(p => !p)} style={{
              padding: "4px 10px", borderRadius: 8, border: `1px solid ${t.inputBorder}`,
              background: "transparent", color: t.sub, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: FF,
            }}>+ New</button>
          }
        >
          <AnimatePresence>
            {addingInvoice && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                style={{ overflow: "hidden", marginBottom: 10 }}>
                <div style={{ display: "flex", gap: 8, padding: "12px", borderRadius: 12, background: t.input, border: `1px solid ${t.inputBorder}`, flexWrap: "wrap" }}>
                  <input type="number" value={newInvoice.amount} onChange={e => setNewInvoice(p => ({ ...p, amount: e.target.value }))}
                    placeholder="Amount (£)" autoFocus style={{ ...inputStyle, flex: 1, minWidth: 120 }}
                    onFocus={e => e.target.style.borderColor = "rgba(204,253,1,0.4)"}
                    onBlur={e => e.target.style.borderColor = t.inputBorder} />
                  <input type="date" value={newInvoice.due_date} onChange={e => setNewInvoice(p => ({ ...p, due_date: e.target.value }))}
                    style={{ ...inputStyle, width: 140, colorScheme: dark ? "dark" : "light" }} />
                  <div style={{ display: "flex", gap: 6, width: "100%" }}>
                    <button onClick={() => setAddingInvoice(false)} style={{ flex: 1, padding: "8px", borderRadius: 8, border: `1px solid ${t.inputBorder}`, background: "transparent", color: t.sub, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: FF }}>Cancel</button>
                    <motion.button whileHover={{ scale: 1.02 }} onClick={handleCreateInvoice}
                      style={{ flex: 2, padding: "8px", borderRadius: 8, border: "none", background: `linear-gradient(135deg,${VOLT},#b8e300)`, color: "#0a0a0a", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: FF }}>
                      Create Invoice
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {loadingData ? (
            <SkeletonRows count={2} t={t} />
          ) : invoices.length === 0 ? (
            <EmptyState icon="◈" text="No invoices yet." t={t} />
          ) : (
            invoices.map(inv => <InvoiceRow key={inv.id} invoice={inv} t={t} dark={dark} />)
          )}
        </Section>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Section({ label, children, action, t }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase" }}>{label}</span>
        {action}
      </div>
      {children}
    </div>
  );
}

function ProjectRow({ project, t, dark }) {
  const statusColors = { planning: "#5AC8FA", active: "#ccfd01", review: "#FFB340", completed: "#30D158", archived: "#8b8fa3" };
  const c = statusColors[project.status] || "#8b8fa3";
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "12px 14px", borderRadius: 12, marginBottom: 6,
      background: t.card, border: `1px solid ${t.cardBorder}`,
    }}>
      <div style={{ width: 3, height: 32, borderRadius: 2, background: c, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: t.text, marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{project.name}</div>
        <div style={{ fontSize: 11, color: t.muted }}>
          {project.due_date ? `Due ${new Date(project.due_date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}` : "No deadline"}
        </div>
      </div>
      <span style={{ fontSize: 10, fontWeight: 700, color: c, background: `${c}18`, border: `1px solid ${c}30`, padding: "2px 8px", borderRadius: 100, letterSpacing: "0.04em", textTransform: "uppercase" }}>
        {project.status}
      </span>
    </div>
  );
}

function InvoiceRow({ invoice, t, dark }) {
  const statusColors = { draft: "#8b8fa3", pending: "#FFB340", paid: "#30D158", overdue: "#FF6259" };
  const c = statusColors[invoice.status] || "#8b8fa3";
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "12px 14px", borderRadius: 12, marginBottom: 6,
      background: t.card, border: `1px solid ${t.cardBorder}`,
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: t.text }}>£{Number(invoice.amount).toLocaleString("en-GB")}</div>
        <div style={{ fontSize: 11, color: t.muted }}>
          {invoice.due_date ? `Due ${new Date(invoice.due_date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}` : "No due date"}
        </div>
      </div>
      <span style={{ fontSize: 10, fontWeight: 700, color: c, background: `${c}18`, border: `1px solid ${c}30`, padding: "2px 8px", borderRadius: 100, letterSpacing: "0.04em", textTransform: "uppercase" }}>
        {invoice.status}
      </span>
    </div>
  );
}

function EmptyState({ icon, text, action, t }) {
  return (
    <div style={{ padding: "20px 0", textAlign: "center" }}>
      <div style={{ fontSize: 22, marginBottom: 8, opacity: 0.4 }}>{icon}</div>
      <div style={{ fontSize: 12, color: t.muted, lineHeight: 1.6, marginBottom: action ? 12 : 0 }}>{text}</div>
      {action && (
        <button onClick={action.onClick} style={{ background: "none", border: "none", color: VOLT, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: FF }}>
          {action.label}
        </button>
      )}
    </div>
  );
}

function SkeletonRows({ count, t }) {
  return Array.from({ length: count }).map((_, i) => (
    <div key={i} style={{ height: 58, borderRadius: 12, marginBottom: 6, background: t.input, animation: "shimmer 1.5s ease infinite", backgroundSize: "200% 100%", backgroundImage: `linear-gradient(90deg, ${t.input} 25%, rgba(255,255,255,0.06) 50%, ${t.input} 75%)` }} />
  ));
}

// ─── Add Client Modal ─────────────────────────────────────────────────────────

function AddClientModal({ onClose, onAdd, t, dark }) {
  const [form, setForm] = useState({ name: "", company: "", email: "", phone: "", value: "", stage: "lead" });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const inputStyle = {
    width: "100%", padding: "10px 13px", borderRadius: 10,
    background: t.input, border: `1px solid ${t.inputBorder}`,
    color: t.text, fontSize: 13, fontFamily: FF, outline: "none",
    boxSizing: "border-box", transition: "border-color 0.2s",
  };
  const fo = e => e.target.style.borderColor = "rgba(204,253,1,0.4)";
  const fb = e => e.target.style.borderColor = t.inputBorder;

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    await onAdd(form);
    setSaving(false);
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 8000, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ opacity: 0, scale: 0.94, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        style={{ width: "100%", maxWidth: 440, background: dark ? "rgba(14,14,18,0.98)" : "rgba(255,255,255,0.98)", border: `1px solid ${t.cardBorder}`, borderRadius: 22, padding: "28px 24px", boxShadow: "0 20px 60px rgba(0,0,0,0.5)", fontFamily: FF }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h3 style={{ fontSize: 17, fontWeight: 700, color: t.text, margin: 0 }}>Add client</h3>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: "50%", border: "none", background: t.input, color: t.sub, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
            {[
              { label: "Name *", key: "name", placeholder: "Full name", span: 2 },
              { label: "Company", key: "company", placeholder: "Company" },
              { label: "Deal value", key: "value", placeholder: "£0", type: "number" },
              { label: "Email", key: "email", placeholder: "email@example.com" },
              { label: "Phone", key: "phone", placeholder: "+44 7700 000000" },
            ].map(f => (
              <div key={f.key} style={{ gridColumn: f.span === 2 ? "span 2" : undefined }}>
                <label style={{ fontSize: 10, fontWeight: 600, color: t.muted, letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: 5 }}>{f.label}</label>
                <input type={f.type || "text"} value={form[f.key]} onChange={e => set(f.key, e.target.value)} placeholder={f.placeholder} style={inputStyle} onFocus={fo} onBlur={fb} />
              </div>
            ))}
            <div style={{ gridColumn: "span 2" }}>
              <label style={{ fontSize: 10, fontWeight: 600, color: t.muted, letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: 5 }}>Stage</label>
              <select value={form.stage} onChange={e => set("stage", e.target.value)}
                style={{ ...inputStyle, cursor: "pointer", colorScheme: dark ? "dark" : "light" }}>
                {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
          </div>
          <motion.button type="submit" disabled={saving || !form.name.trim()} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            style={{
              width: "100%", padding: "12px", borderRadius: 12, border: "none",
              background: saving || !form.name.trim() ? t.input : `linear-gradient(135deg,${VOLT},#b8e300)`,
              color: saving || !form.name.trim() ? t.sub : "#0a0a0a",
              fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: FF,
              boxShadow: saving ? "none" : "0 4px 20px rgba(204,253,1,0.2)",
            }}>
            {saving ? "Adding…" : "Add client →"}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}

// ─── Main ClientsView ─────────────────────────────────────────────────────────

export default function ClientsView({ t, dark, mobile, compact }) {
  const { user } = useAuth();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [draggingId, setDraggingId] = useState(null);
  const [dragOverStage, setDragOverStage] = useState(null);
  const [wonModal, setWonModal] = useState(null); // client that just got moved to active
  const ease = "all 0.3s cubic-bezier(.4,0,.2,1)";

  useEffect(() => {
    fetchClients();
  }, [user]);

  async function fetchClients() {
    if (!user) { setLoading(false); return; }
    try {
      const { data, error } = await supabase
        .from("prospects")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setClients(data || []);
    } catch (err) {
      console.error("fetchClients:", err.message);
    } finally {
      setLoading(false);
    }
  }

  const handleAddClient = async (form) => {
    try {
      console.log("Adding client:", form);
      const { data, error } = await supabase.from("prospects").insert({
        user_id: user.id,
        name: form.name.trim(),
        email: form.email?.trim() || null,
        company: form.company?.trim() || null,
        value: parseFloat(form.value) || 0,
        stage: "new",
      }).select().single();
      if (error) {
        console.error("Add client error:", error);
        alert("Could not add client: " + error.message);
        return;
      }
      if (data) {
        setClients(prev => [data, ...prev]);
        setShowAddModal(false);
      }
    } catch (err) {
      console.error("handleAddClient:", err);
      alert("Could not add client. Please try again.");
    }
  };

  // Drag & drop
  const handleDragStart = (e, id) => { setDraggingId(id); e.dataTransfer.effectAllowed = "move"; };
  const handleDragOver = (e, stage) => { e.preventDefault(); setDragOverStage(stage); };
  const handleDrop = async (e, newStage) => {
    e.preventDefault();
    setDragOverStage(null);
    if (!draggingId) return;
    const client = clients.find(c => c.id === draggingId);
    if (!client || client.stage === newStage) { setDraggingId(null); return; }
    const prev = client.stage;
    // Optimistic update
    setClients(p => p.map(c => c.id === draggingId ? { ...c, stage: newStage } : c));
    if (selectedClient?.id === draggingId) setSelectedClient(p => ({ ...p, stage: newStage }));
    setDraggingId(null);
    // Show deal won modal
    if (newStage === "active" && prev !== "active") {
      setWonModal({ ...client, stage: newStage });
    }
    const { error } = await supabase.from("prospects").update({ stage: newStage }).eq("id", draggingId);
    if (error) {
      setClients(p => p.map(c => c.id === draggingId ? { ...c, stage: prev } : c));
      alert("Could not update stage.");
    }
  };

  const handleCreateProjectFromWon = async (name, dueDate) => {
    if (!wonModal || !name.trim()) return;
    try {
      await supabase.from("projects").insert({
        user_id: user.id, 
        title: name, 
        client_id: wonModal.id,
        client_name: wonModal.company || wonModal.name,
        due_date: dueDate || null, 
        status: "planning",
      });
    } catch (err) { console.error(err.message); }
    setWonModal(null);
  };

  const handleClientUpdate = (updated) => {
    setClients(p => p.map(c => c.id === updated.id ? updated : c));
    setSelectedClient(updated);
  };

  // Layout: if a client is selected, show split view
  const showRecord = !!selectedClient;

  // Clients per stage for the pipeline
  const byStage = (stageId) => clients.filter(c => c.stage === stageId);

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", fontFamily: FF }}>
      {/* Top bar */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 0 16px", flexShrink: 0, gap: 12,
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: t.text, letterSpacing: "-0.02em" }}>
            Clients
          </h2>
          <p style={{ margin: "3px 0 0", fontSize: 12, color: t.sub }}>
            {loading ? "Loading…" : `${clients.length} total · ${byStage("active").length} active`}
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          onClick={() => setShowAddModal(true)}
          style={{
            padding: "9px 18px", borderRadius: 12, border: "none",
            background: `linear-gradient(135deg,${VOLT},#b8e300)`,
            color: "#0a0a0a", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: FF,
            boxShadow: "0 3px 16px rgba(204,253,1,0.2)",
          }}
        >+ Add client</motion.button>
      </div>

      {/* Split view: pipeline + record */}
      <div style={{ flex: 1, display: "flex", gap: 14, minHeight: 0, overflow: "hidden" }}>

        {/* Pipeline board */}
        <div style={{
          flex: showRecord && !mobile ? "0 0 auto" : 1,
          width: showRecord && !mobile ? (compact ? 260 : 320) : "auto",
          overflowX: showRecord ? "hidden" : "auto",
          overflowY: "hidden",
          display: "flex",
          flexDirection: showRecord ? "column" : "row",
          gap: 10,
          transition: ease,
        }}>
          {STAGES.map(stage => {
            const stageClients = byStage(stage.id);
            const isOver = dragOverStage === stage.id;
            return (
              <div
                key={stage.id}
                onDragOver={e => handleDragOver(e, stage.id)}
                onDrop={e => handleDrop(e, stage.id)}
                onDragLeave={() => setDragOverStage(null)}
                style={{
                  flex: showRecord ? "0 0 auto" : 1,
                  minWidth: showRecord ? "auto" : 200,
                  background: isOver
                    ? `${stage.color}08`
                    : (dark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)"),
                  border: `1px solid ${isOver ? stage.color + "30" : t.cardBorder}`,
                  borderRadius: 16, padding: "12px 10px",
                  display: showRecord ? "flex" : "flex",
                  flexDirection: "column",
                  gap: 6, transition: ease,
                  overflowY: "auto",
                  height: showRecord ? "auto" : "100%",
                  maxHeight: "100%",
                }}
              >
                {/* Column header */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "2px 4px 8px", flexShrink: 0 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: stage.color }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: stage.color, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                    {stage.label}
                  </span>
                  <span style={{ fontSize: 10, color: t.muted, marginLeft: "auto", background: dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)", borderRadius: 100, padding: "1px 7px", fontWeight: 600 }}>
                    {stageClients.length}
                  </span>
                </div>

                {loading ? (
                  Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} style={{ height: 80, borderRadius: 12, background: t.input, animation: "shimmer 1.5s ease infinite" }} />
                  ))
                ) : stageClients.length === 0 ? (
                  <div style={{
                    flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
                    color: t.muted, fontSize: 11, opacity: 0.6, textAlign: "center", padding: "12px 8px",
                  }}>
                    {isOver ? "Drop here" : "No clients"}
                  </div>
                ) : (
                  stageClients.map(client => (
                    <ClientCard
                      key={client.id}
                      client={client}
                      t={t} dark={dark}
                      onClick={() => setSelectedClient(selectedClient?.id === client.id ? null : client)}
                      onDragStart={handleDragStart}
                    />
                  ))
                )}
              </div>
            );
          })}
        </div>

        {/* Client record panel */}
        <AnimatePresence>
          {showRecord && (
            <motion.div
              key={selectedClient.id}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 24 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              style={{
                flex: 1, minWidth: 0,
                background: t.card, border: `1px solid ${t.cardBorder}`,
                borderRadius: 20, backdropFilter: "blur(24px)",
                overflow: "hidden", display: "flex", flexDirection: "column",
              }}
            >
              <ClientRecord
                client={selectedClient}
                onClose={() => setSelectedClient(null)}
                onUpdate={handleClientUpdate}
                t={t} dark={dark}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showAddModal && (
          <AddClientModal onClose={() => setShowAddModal(false)} onAdd={handleAddClient} t={t} dark={dark} />
        )}
        {wonModal && (
          <DealWonModal
            client={wonModal}
            onCreateProject={handleCreateProjectFromWon}
            onSkip={() => setWonModal(null)}
            t={t} dark={dark}
          />
        )}
      </AnimatePresence>

      <style>{`
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
      `}</style>
    </div>
  );
}
